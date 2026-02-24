import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useToast } from "@/components/ui/use-toast";
import { getActiveProjects } from '@/app/actions';
import { parseNaturalLine, getProjectSuggestions, ParsedTask } from './parseNaturalLine';
import { ChevronDown, ChevronRight, Clock, Zap, Link as LinkIcon, Hash, Calendar, DollarSign } from 'lucide-react';

interface RecentEntry {
  project: string;
  hours: number;
  description: string;
}

const RECENT_ENTRIES_KEY = 'pulse_recent_daily_tasks';
const MAX_RECENT_ENTRIES = 3;

function getRecentEntriesFromStorage(): RecentEntry[] {
  try {
    const data = localStorage.getItem(RECENT_ENTRIES_KEY);
    if (data) return JSON.parse(data);
  } catch { }
  return [];
}

function saveRecentEntriesToStorage(entries: RecentEntry[]): void {
  try {
    localStorage.setItem(RECENT_ENTRIES_KEY, JSON.stringify(entries.slice(0, MAX_RECENT_ENTRIES)));
  } catch { }
}

export default function DailyPulseAIAssistant({ onParse }: { onParse: (tasks: any[]) => void }) {
  const { toast } = useToast();
  
  // Quick input state (new single-line natural language)
  const [quickInput, setQuickInput] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);
  
  // Quick input autocomplete
  const [quickSuggestions, setQuickSuggestions] = useState<string[]>([]);
  const [showQuickSuggest, setShowQuickSuggest] = useState(false);
  const [quickSelectedIndex, setQuickSelectedIndex] = useState(0);
  
  // Recent entries
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  
  // Legacy input state (multi-line)
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // For legacy project auto-suggest
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active projects from database
  const [activeProjects, setActiveProjects] = useState<string[]>([]);

  // Track if projects have been fetched to prevent duplicate calls
  const hasFetchedProjectsRef = useRef(false);

  // Fetch active projects on mount
  useEffect(() => {
    if (hasFetchedProjectsRef.current) return;

    hasFetchedProjectsRef.current = true;
    getActiveProjects()
      .then(projects => setActiveProjects(projects.map(p => p.name)))
      .catch(err => {
        console.error('Failed to fetch active projects:', err);
        hasFetchedProjectsRef.current = false;
      });
  }, []);

  // Load recent entries from localStorage on mount
  useEffect(() => {
    setRecentEntries(getRecentEntriesFromStorage());
  }, []);

  // Global keyboard shortcut: press N to focus input (when not already in an input/textarea)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'n' &&
        !e.metaKey && !e.ctrlKey && !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement) &&
        !(e.target as HTMLElement)?.isContentEditable
      ) {
        e.preventDefault();
        quickInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Helper: get projects from localStorage
  function getProjectsFromStorage(): string[] {
    try {
      const data = localStorage.getItem("pulse_projects");
      if (data) return JSON.parse(data);
    } catch { }
    return [];
  }

  // Helper: get all available projects for suggestions (active + localStorage)
  const allProjects = useMemo(() => {
    const storageProjects = getProjectsFromStorage();
    return Array.from(new Set([...activeProjects, ...storageProjects]));
  }, [activeProjects]);

  // Live parse preview for quick input
  const parsedPreview: ParsedTask = useMemo(() => {
    return parseNaturalLine(quickInput, allProjects);
  }, [quickInput, allProjects]);

  // Update autocomplete suggestions as user types in quick input
  const updateQuickSuggestions = useCallback((value: string) => {
    const suggestions = getProjectSuggestions(value, allProjects, 5);
    setQuickSuggestions(suggestions);
    setShowQuickSuggest(suggestions.length > 0 && value.trim().length > 0);
    setQuickSelectedIndex(0);
  }, [allProjects]);

  // Add entry to recent list
  const addToRecentEntries = useCallback((entry: RecentEntry) => {
    if (!entry.project || entry.project === 'Unknown') return;
    
    setRecentEntries(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(e => 
        !(e.project === entry.project && e.description === entry.description && e.hours === entry.hours)
      );
      const updated = [entry, ...filtered].slice(0, MAX_RECENT_ENTRIES);
      saveRecentEntriesToStorage(updated);
      return updated;
    });
  }, []);

  // Handle quick input submission (Enter key)
  const handleQuickSubmit = useCallback(async () => {
    const parsed = parseNaturalLine(quickInput, allProjects);
    
    // Validate mandatory fields
    const errors: string[] = [];
    
    if (parsed.hours <= 0) {
      errors.push("hours (e.g., 2h)");
    }
    
    if (!parsed.date) {
      errors.push("date");
    }
    
    if (errors.length > 0) {
      toast({
        title: "Missing required fields",
        description: `Please add: ${errors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    // Set project to "Other" if no match found
    const project = parsed.project === 'Unknown' ? 'Other' : parsed.project;

    setQuickSubmitting(true);
    setError("");

    try {
      const task = {
        date: parsed.date,
        project: project,
        bucket: parsed.tags,
        hours: parsed.hours,
        description: parsed.description,
        link: parsed.link,
        billable: parsed.billable,
      };

      await onParse([task]);

      // Add to recent entries
      addToRecentEntries({
        project: project,
        hours: parsed.hours,
        description: parsed.description,
      });

      toast({
        title: "Task logged!",
        description: `${parsed.hours}h ${project !== 'Other' ? `- ${project}` : ''} ${parsed.description}`.trim(),
        variant: "default",
      });

      setQuickInput("");
      setShowQuickSuggest(false);

      // Re-focus input for next entry
      setTimeout(() => quickInputRef.current?.focus(), 0);
    } catch (e) {
      setError("Failed to log task. Please try again.");
    } finally {
      setQuickSubmitting(false);
    }
  }, [quickInput, allProjects, onParse, addToRecentEntries, toast]);

  // Handle clicking a recent entry chip
  const handleRecentEntryClick = useCallback(async (entry: RecentEntry) => {
    setQuickSubmitting(true);
    setError("");

    try {
      const today = new Date().toISOString().slice(0, 10);
      const task = {
        date: today,
        project: entry.project,
        bucket: [],
        hours: entry.hours,
        description: entry.description,
      };

      await onParse([task]);

      // Move to top of recent entries
      addToRecentEntries(entry);

      toast({
        title: "Task logged!",
        description: `${entry.hours}h - ${entry.project}: ${entry.description}`.slice(0, 60),
        variant: "default",
      });
    } catch (e) {
      setError("Failed to log task. Please try again.");
    } finally {
      setQuickSubmitting(false);
    }
  }, [onParse, addToRecentEntries, toast]);

  // Insert project name into quick input - preserves original text and prepends project
  const insertProjectIntoQuickInput = useCallback((projectName: string) => {
    // Start with original input and extract special parts
    let remaining = quickInput;
    const parts: string[] = [];
    
    // Extract and store hours
    const hoursMatch = remaining.match(/(\d+(?:\.\d+)?)\s*h\b|\bh\s*(\d+(?:\.\d+)?)/i);
    if (hoursMatch) {
      parts.push(hoursMatch[0].trim());
      remaining = remaining.replace(hoursMatch[0], ' ');
    }
    
    // Extract and store link
    const linkMatch = remaining.match(/(https?:\/\/\S+)/);
    let link = '';
    if (linkMatch) {
      link = linkMatch[1];
      remaining = remaining.replace(linkMatch[0], ' ');
    }
    
    // Extract and store billable markers (both billable and non-billable)
    const nonBillableMatch = remaining.match(/!\$(?=\s|$)|!billable\b|\bnonbillable\b/i);
    const billableMatch = remaining.match(/\$billable\b|\$(?=\s|$)|\bbillable\b/i);
    let billableMarker = ''; // empty means default (billable)
    if (nonBillableMatch) {
      billableMarker = '!$';
      remaining = remaining.replace(nonBillableMatch[0], ' ');
    } else if (billableMatch) {
      // Explicit billable marker (optional since default is billable)
      remaining = remaining.replace(billableMatch[0], ' ');
    }
    
    // Extract and store date keyword
    const dateMatch = remaining.match(/\b@?(today|ytd|tmr)\b|@(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/i);
    let dateStr = '';
    if (dateMatch) {
      dateStr = dateMatch[0];
      remaining = remaining.replace(dateMatch[0], ' ');
    }
    
    // Extract and store tags
    const tagMatches = [...remaining.matchAll(/#(\w+)/g)];
    const tags = tagMatches.map(m => `#${m[1]}`);
    remaining = remaining.replace(/#\w+/g, ' ');
    
    // Clean up remaining text (this is the description + any project words)
    remaining = remaining.replace(/\s+/g, ' ').trim();
    
    // Add the selected project
    parts.push(projectName);
    
    // Add remaining text as description
    if (remaining) {
      parts.push(remaining);
    }
    
    // Add tags
    parts.push(...tags);
    
    // Add non-billable marker if present
    if (billableMarker) {
      parts.push(billableMarker);
    }
    
    // Add date
    if (dateStr) {
      parts.push(dateStr);
    }
    
    // Add link
    if (link) {
      parts.push(link);
    }
    
    const newInput = parts.join(' ');
    setQuickInput(newInput);
    setShowQuickSuggest(false);
    
    setTimeout(() => {
      quickInputRef.current?.focus();
    }, 0);
  }, [quickInput]);

  // Helper: extract and validate project name from line (first word only) - for legacy
  function extractProjectName(line: string): string {
    const projectMatch = line.match(/\+(\S+)/);
    if (!projectMatch) return "Unknown";

    const rawProject = projectMatch[1].trim();
    if (!rawProject) return "Unknown";

    if (activeProjects.length === 0) return rawProject;

    if (activeProjects.includes(rawProject)) {
      return rawProject;
    }

    const exactMatch = activeProjects.find(p => p.toLowerCase() === rawProject.toLowerCase());
    if (exactMatch) {
      return exactMatch;
    }

    const partialMatch = activeProjects.find(p =>
      p.toLowerCase().includes(rawProject.toLowerCase()) ||
      rawProject.toLowerCase().includes(p.toLowerCase())
    );
    if (partialMatch) {
      return partialMatch;
    }

    return "Unknown";
  }

  async function handleParse() {
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/parse-daily-tasks", {
        method: "POST",
        body: JSON.stringify({
          text: input,
          activeProjects: activeProjects
        }),
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to parse tasks");
      const { tasks } = await res.json();

      onParse(tasks);

      toast({
        title: "AI Parsing Successful!",
        description: `Successfully parsed ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
        variant: "default",
      });
      setInput("");
    } catch (e) {
      setError("Could not parse tasks. Please check your input or try again.");
    } finally {
      setParsing(false);
    }
  }

  function handleManualAdd() {
    setError("");
    try {
      const today = new Date();
      const tmr = new Date(today);
      tmr.setDate(today.getDate() + 1);
      const ytd = new Date(today);
      ytd.setDate(today.getDate() - 1);
      const dateShortcuts: Record<string, string> = {
        "today": today.toISOString().slice(0, 10),
        "tmr": tmr.toISOString().slice(0, 10),
        "ytd": ytd.toISOString().slice(0, 10)
      };

      const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      const tasks = lines.map(line => {
        const project = extractProjectName(line);
        let date;
        const dateMatch = line.match(/@(\d{4}-\d{2}-\d{2}|today|tmr|ytd|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/);
        if (dateMatch) {
          const val = dateMatch[1];
          if (dateShortcuts[val]) {
            date = dateShortcuts[val];
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            date = val;
          } else {
            const separator = val.includes("-") ? "-" : "/";
            const parts = val.split(separator).map(p => parseInt(p, 10));

            if (parts.length >= 2 && parts.length <= 3) {
              const [d, m, rawYear] = parts;
              let y = rawYear;
              if (parts.length === 2) {
                y = today.getFullYear();
              } else if (y < 100) {
                y += 2000;
              }

              const parsed = new Date(y, m - 1, d);
              if (
                parsed.getFullYear() === y &&
                parsed.getMonth() === m - 1 &&
                parsed.getDate() === d
              ) {
                const pad = (n: number) => String(n).padStart(2, '0');
                date = `${y}-${pad(m)}-${pad(d)}`;
              }
            }
          }
        }

        const tagMatches = [...line.matchAll(/#(\w+)/g)].map(m => m[1]);
        const timeMatch = line.match(/(\d+(?:\.\d+)?)[ ]*h|h[ ]*(\d+(?:\.\d+)?)/i);
        let hours = undefined;
        if (timeMatch) {
          hours = timeMatch[1] || timeMatch[2];
          hours = parseFloat(hours);
        }
        const linkMatch = line.match(/(https?:\/\/\S+)/);
        const link = linkMatch ? linkMatch[0] : undefined;

        let desc = line;
        const projectMatch = line.match(/\+(\S+)/);
        if (projectMatch) {
          desc = desc.replace(projectMatch[0], "");
        }
        desc = desc.replace(/@(\d{4}-\d{2}-\d{2}|today|tmr|ytd|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/, "");
        desc = desc.replace(/#(\w+)/g, "");
        desc = desc.replace(/(\d+(?:\.\d+)?)[ ]*h|h[ ]*(\d+(?:\.\d+)?)/i, "");
        desc = desc.replace(/(https?:\/\/\S+)/, "");
        desc = desc.replace(/\s+/g, " ").trim();

        return {
          project,
          date: date || today.toISOString().slice(0, 10),
          bucket: tagMatches,
          hours,
          description: desc,
          link,
        };
      });

      const newProjects = Array.from(
        new Set(
          tasks
            .map(t => t.project)
            .filter(Boolean)
            .filter(p => p !== "Unknown")
            .concat(getProjectsFromStorage())
        )
      );
      localStorage.setItem("pulse_projects", JSON.stringify(newProjects));

      onParse(tasks);

      toast({
        title: "Tasks Added Successfully!",
        description: `Successfully added ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`,
        variant: "default",
      });
      setInput("");
    } catch (e) {
      setError("Manual add failed. Please check your input.");
    }
  }

  // Validation: hours is mandatory
  const hasValidQuickInput = parsedPreview.hours > 0;

  return (
    <div className="mb-4 space-y-3">
      {/* Quick Log Section - Primary */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow flex flex-row gap-6">
        <div className="flex-1 basis-2/3 flex flex-col gap-2 items-stretch min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              <h2 className="font-bold text-lg text-green-800">Quick Log</h2>
            </div>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-3 flex-wrap mb-2">
            <span><span className="font-mono bg-green-100 px-1.5 py-0.5 rounded text-green-800">2h</span> hours</span>
            <span><span className="font-mono bg-purple-100 px-1.5 py-0.5 rounded text-purple-800">Project</span> auto-matched</span>
            <span><span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">today</span> / <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">@dd/MM</span> date</span>
            <span><span className="font-mono bg-orange-100 px-1.5 py-0.5 rounded text-orange-800">#tag</span> bucket</span>
            <span><span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">https://...</span> link</span>
          </div>
        
          {/* Single-line quick input with Enter hint */}
        <div className="relative">
          <input
            ref={quickInputRef}
            type="text"
            className="w-full border-2 border-green-300 rounded-lg pl-4 pr-36 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition bg-white"
            value={quickInput}
            onChange={e => {
              setQuickInput(e.target.value);
              updateQuickSuggestions(e.target.value);
            }}
            onKeyDown={e => {
              // Handle Enter key - always submit (Tab to select project)
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                setShowQuickSuggest(false);
                if (hasValidQuickInput && !quickSubmitting) {
                  handleQuickSubmit();
                }
              } else if (showQuickSuggest && quickSuggestions.length > 0) {
                // Handle autocomplete navigation
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setQuickSelectedIndex(i => (i + 1) % quickSuggestions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setQuickSelectedIndex(i => (i - 1 + quickSuggestions.length) % quickSuggestions.length);
                } else if (e.key === "Tab") {
                  e.preventDefault();
                  insertProjectIntoQuickInput(quickSuggestions[quickSelectedIndex]);
                } else if (e.key === "Escape") {
                  setShowQuickSuggest(false);
                }
              }
            }}
            onBlur={() => setTimeout(() => setShowQuickSuggest(false), 150)}
            onFocus={() => updateQuickSuggestions(quickInput)}
            placeholder="2h Client Portal fixed login bug today #feature https://github.com/..."
            disabled={quickSubmitting}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs text-gray-400 pointer-events-none">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-medium">N</kbd>
              <span>focus</span>
            </span>
            <span className="text-gray-300">·</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-medium">↵</kbd>
              <span>log</span>
            </span>
          </span>
        </div>

        {/* Live parse preview */}
        {quickInput.trim() && (
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="text-gray-500">Preview:</span>
            <div className="flex items-center gap-2 flex-wrap">
              {parsedPreview.hours > 0 ? (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-medium">
                  <Clock className="w-3 h-3" />
                  {parsedPreview.hours}h
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-2 py-1 rounded-md font-medium">
                  <Clock className="w-3 h-3" />
                  hours?
                </span>
              )}
              <span className={`inline-flex items-center px-2 py-1 rounded-md font-medium ${
                parsedPreview.project !== 'Unknown' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {parsedPreview.project !== 'Unknown' ? parsedPreview.project : 'Other'}
              </span>
              {parsedPreview.date && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md font-medium">
                  <Calendar className="w-3 h-3" />
                  {parsedPreview.date === new Date().toISOString().slice(0, 10) 
                    ? 'today' 
                    : parsedPreview.date}
                </span>
              )}
              {parsedPreview.tags.length > 0 && parsedPreview.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-1 rounded-md font-medium">
                  <Hash className="w-3 h-3" />
                  {tag}
                </span>
              ))}
              {parsedPreview.billable ? (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium">
                  <DollarSign className="w-3 h-3" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium line-through">
                  <DollarSign className="w-3 h-3" />
                </span>
              )}
              {parsedPreview.link && (
                <span className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 px-2 py-1 rounded-md font-medium max-w-[200px] truncate">
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{parsedPreview.link.replace(/^https?:\/\//, '')}</span>
                </span>
              )}
              {parsedPreview.description && (
                <span className="text-gray-700">
                  {parsedPreview.description}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Project autocomplete dropdown - below preview */}
        {showQuickSuggest && quickSuggestions.length > 0 && (
          <div className="mt-2 bg-white border border-green-300 rounded-lg shadow-lg overflow-hidden">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 flex items-center justify-between">
              <span>Projects matching your input</span>
              <span className="flex items-center gap-3">
                <span><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↵</kbd> log it</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">Tab</kbd> pick project</span>
                <span><kbd className="px-1.5 py-0.5 bg-white border rounded text-xs">↑↓</kbd> navigate</span>
              </span>
            </div>
            <ul className="max-h-48 overflow-auto">
              {quickSuggestions.map((project, i) => (
                <li
                  key={project}
                  className={`px-4 py-2.5 cursor-pointer flex items-center justify-between ${
                    i === quickSelectedIndex 
                      ? "bg-green-100 text-green-800" 
                      : "hover:bg-green-50"
                  }`}
                  onMouseDown={e => {
                    e.preventDefault();
                    insertProjectIntoQuickInput(project);
                  }}
                >
                  <span className={i === quickSelectedIndex ? "font-semibold" : ""}>{project}</span>
                  {parsedPreview.project === project && (
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">matched</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent entries chips */}
        {recentEntries.length > 0 && (
          <div className="mt-4 pt-3 border-t border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-green-700 font-medium">Recent:</span>
              <span className="text-xs text-gray-500">click to repeat for today</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentEntries.map((entry, idx) => (
                <button
                  key={`${entry.project}-${entry.description}-${idx}`}
                  onClick={() => handleRecentEntryClick(entry)}
                  disabled={quickSubmitting}
                  className="inline-flex items-center gap-2 bg-white border border-green-300 hover:border-green-400 hover:bg-green-50 px-3 py-1.5 rounded-full text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Click to log again with today's date"
                >
                  <span className="text-blue-600 font-medium">{entry.hours}h</span>
                  <span className="text-purple-600">{entry.project}</span>
                  <span className="text-gray-600 max-w-[150px] truncate">{entry.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

          {error && <div className="text-red-600 text-sm font-medium mt-2">{error}</div>}
        </div>

        {/* Right column: hide on mobile, show on md+ */}
        <div className="basis-1/3 flex-col min-w-[180px] max-w-[260px] hidden md:flex">
          <div className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 text-xs shadow-sm">
            <div className="font-semibold text-sm mb-1">Quick Log Syntax</div>
            <div className="space-y-1.5 mb-2">
              <div className="flex items-start gap-1.5">
                <span className="font-mono bg-blue-100 text-blue-800 px-1 rounded text-[10px] shrink-0">2h</span>
                <span>Hours (required)</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-mono bg-gray-200 text-gray-700 px-1 rounded text-[10px] shrink-0">!$</span>
                <span>Mark non-billable (default: billable)</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-mono bg-gray-200 text-gray-700 px-1 rounded text-[10px] shrink-0">today</span>
                <span>Date (ytd, tmr, @dd/MM)</span>
              </div>
            </div>
            <div className="font-semibold text-sm mb-1 pt-2 border-t border-yellow-200">Activity Buckets</div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-1.5">
                <span className="font-mono bg-green-100 text-green-800 px-1 rounded text-[10px] shrink-0">#feature</span>
                <span>New features</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-mono bg-orange-100 text-orange-800 px-1 rounded text-[10px] shrink-0">#debt</span>
                <span>Bugs, refactoring</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-mono bg-gray-200 text-gray-700 px-1 rounded text-[10px] shrink-0">#toil</span>
                <span>Routine ops</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Options - Collapsible */}
      <div className="rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 shadow">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-purple-100/50 transition rounded-2xl"
        >
          <div className="flex items-center gap-2">
            {showAdvanced ? <ChevronDown className="w-5 h-5 text-purple-600" /> : <ChevronRight className="w-5 h-5 text-purple-600" />}
            <span className="font-semibold text-purple-800">AI Parse</span>
            <span className="text-purple-600 text-sm">Paste multi-line text for automatic extraction</span>
          </div>
        </button>

        {showAdvanced && (
          <div className="px-6 pb-6">
            <div className="text-purple-700 text-sm mb-3">
              Paste or type natural text describing your tasks — the AI will automatically extract project, hours, and description.
            </div>
            <textarea
              ref={textareaRef}
              className="w-full border border-purple-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              rows={4}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Yesterday I spent 3 hours on the Alpha project fixing bugs, then 2 hours in meetings for Beta redesign..."
            />
            <div className="flex flex-row justify-end items-center gap-2 mt-3">
              <button
                className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm px-5 py-2.5 rounded-md shadow-sm transition disabled:opacity-60"
                onClick={handleParse}
                disabled={parsing}
                style={{ minWidth: 120 }}
              >
                {parsing ? "Parsing..." : "AI Parse"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
