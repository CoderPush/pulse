import { useState, useEffect, useRef } from "react";

export default function DailyPulseAIAssistant({ onParse }: { onParse: (tasks: any[]) => void }) {
  const [input, setInput] = useState("");
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");

  // For project auto-suggest
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // No need to save projects from props anymore

  // Helper: get projects from localStorage
  function getProjectsFromStorage(): string[] {
    try {
      const data = localStorage.getItem("pulse_projects");
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  }

  async function handleParse() {
    setParsing(true);
    setError("");
    try {
      const res = await fetch("/api/parse-daily-tasks", {
        method: "POST",
        body: JSON.stringify({ text: input }),
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Failed to parse tasks");
      const { tasks } = await res.json();
      onParse(tasks);
    } catch (e) {
      setError("Could not parse tasks. Please check your input or try again.");
    } finally {
      setParsing(false);
    }
  }

  // Manual parse for client-side add
  function handleManualAdd() {
    setError("");
    try {
      // Predefined date shortcuts
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
        // +project-name
        const projectMatch = line.match(/\+(\S+)/);
        const project = projectMatch ? projectMatch[1] : undefined;
        // @date or @today/@tmr/@ytd or @dd/MM, @dd-MM, @dd/MM/yyyy, @dd-MM-yyyy
        let date;
        const dateMatch = line.match(/@(\d{4}-\d{2}-\d{2}|today|tmr|ytd|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/);
        if (dateMatch) {
          const val = dateMatch[1];
          if (dateShortcuts[val]) {
            date = dateShortcuts[val]; // from custom shortcut map
          } else if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
            date = val; // already ISO format
          } else {
            // Handle dd/MM, dd-MM, dd/MM/yyyy, dd-MM-yyyy, dd/MM/yy, dd-MM-yy
            const today = new Date(); // Ensure 'today' is defined
            const separator = val.includes("-") ? "-" : "/";
            const parts = val.split(separator).map(p => parseInt(p, 10));

            if (parts.length >= 2 && parts.length <= 3) {
              const [d, m, rawYear] = parts;
              let y = rawYear;
              if (parts.length === 2) {
                y = today.getFullYear(); // use current year if not provided
              } else if (y < 100) {
                y += 2000; // convert 2-digit year to 20xx
              }

              const parsed = new Date(y, m - 1, d);
              // Confirm parsed date is valid
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

        // #tags (can be multiple)
        const tagMatches = [...line.matchAll(/#(\w+)/g)].map(m => m[1]);
        // time: 2.5h or h2.5
        const timeMatch = line.match(/(\d+(?:\.\d+)?)[ ]*h|h[ ]*(\d+(?:\.\d+)?)/i);
        let hours = undefined;
        if (timeMatch) {
          hours = timeMatch[1] || timeMatch[2];
          hours = parseFloat(hours);
        }
        // Remove all matched tokens for description
        const desc = line
          .replace(/\+(\S+)/, "")
          .replace(/@(\d{4}-\d{2}-\d{2}|today|tmr|ytd|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/, "")
          .replace(/#(\w+)/g, "")
          .replace(/(\d+(?:\.\d+)?)[ ]*h|h[ ]*(\d+(?:\.\d+)?)/i, "")
          .replace(/\s+/g, " ")
          .trim();
        return {
          project,
          date: date || today.toISOString().slice(0, 10),
          bucket: tagMatches,
          hours,
          description: desc
        };
      });

      // Save unique projects to localStorage
      const newProjects = Array.from(
        new Set(
          tasks
            .map(t => t.project)
            .filter(Boolean)
            .concat(getProjectsFromStorage())
        )
      );
      localStorage.setItem("pulse_projects", JSON.stringify(newProjects));

      onParse(tasks);
      setInput("");
    } catch (e) {
      setError("Manual add failed. Please check your input.");
    }
  }

  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200 shadow flex flex-row gap-6">
      <div className="flex-1 basis-2/3 flex flex-col gap-2 items-stretch min-w-0">
        <div className="font-extrabold text-2xl text-purple-800 mb-1 flex items-center gap-2">
          <span role="img" aria-label="sparkles">✨</span> AI Assistant
        </div>
        <div className="text-purple-700 text-sm mb-2">
          <div className="font-semibold mb-1">Guidelines</div>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <span className="font-mono bg-purple-50 px-1 rounded">Manual adding: +project-name @date #tag hours Description. Examples:</span>
            </li>
            <ul className="ml-8">
              <li className="list-none text-purple-900">
                <span className="font-mono">+project-alpha @15/07 #bugfix 2.5h Fixed login bug</span>
              </li>
              <li className="list-none text-purple-900">
                <span className="font-mono">+project-beta #feature h2 Code review for new feature</span>
              </li>
            </ul>
            <li>
              <span className="font-mono bg-purple-50 px-1 rounded">@today</span>, <span className="font-mono bg-purple-50 px-1 rounded">@tmr</span>, <span className="font-mono bg-purple-50 px-1 rounded">@ytd</span> for date shortcuts
            </li>
            <li>
              <span className="font-mono bg-purple-50 px-1 rounded">Cmd/Ctrl + Enter</span> to add manually
            </li>
            <li>
              <span className="font-mono bg-purple-50 px-1 rounded">AI can parse the pasted free text logs</span>
            </li>
          </ul>
        </div>
        <div className="relative">
          {/* ...existing code for textarea and suggestions... */}
          <textarea
            ref={textareaRef}
            className="w-full border border-purple-300 rounded-lg p-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
            rows={3}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Detect if user is typing + and show suggestions
              const cursor = e.target.selectionStart;
              const before = e.target.value.slice(0, cursor);
              const plusMatch = /\+(\w*)$/.exec(before);
              if (plusMatch) {
                const typed = plusMatch[1].toLowerCase();
                const allProjects = getProjectsFromStorage();
                const filtered = allProjects.filter(p => p.toLowerCase().includes(typed));
                setSuggestions(filtered.slice(0, 8));
                setShowSuggest(true);
                setSelectedIndex(0);
              } else {
                setShowSuggest(false);
              }
            }}
            placeholder={'+project-name @15/07 #bugfix 2.5h Description...'}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                handleManualAdd();
              }
              // Handle suggestion navigation
              if (showSuggest && suggestions.length > 0) {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedIndex(i => (i + 1) % suggestions.length);
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length);
                } else if (e.key === "Tab" || e.key === "Enter") {
                  // Complete with selected suggestion
                  e.preventDefault();
                  const cursor = textareaRef.current?.selectionStart ?? 0;
                  const before = input.slice(0, cursor);
                  const after = input.slice(cursor);
                  const plusMatch = /\+(\w*)$/.exec(before);
                  if (plusMatch) {
                    const start = plusMatch.index;
                    const newText =
                      before.slice(0, start) +
                      "+" + suggestions[selectedIndex] +
                      " " +
                      after;
                    setInput(newText);
                    setShowSuggest(false);
                    // Move cursor after inserted project
                    setTimeout(() => {
                      if (textareaRef.current) {
                        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + suggestions[selectedIndex].length + 2;
                        textareaRef.current.focus();
                      }
                    }, 0);
                  }
                } else if (e.key === "Escape") {
                  setShowSuggest(false);
                }
              }
            }}
            onBlur={() => setTimeout(() => setShowSuggest(false), 100)}
          />
          {showSuggest && suggestions.length > 0 && (
            <ul className="absolute left-0 top-full mt-1 z-10 bg-white border border-purple-300 rounded-lg shadow w-full max-h-48 overflow-auto">
              {suggestions.map((s, i) => (
                <li
                  key={s}
                  className={`px-4 py-2 cursor-pointer ${i === selectedIndex ? "bg-purple-100 text-purple-800 font-bold" : "hover:bg-purple-50"}`}
                  onMouseDown={e => {
                    e.preventDefault();
                    // Complete with clicked suggestion
                    const cursor = textareaRef.current?.selectionStart ?? 0;
                    const before = input.slice(0, cursor);
                    const after = input.slice(cursor);
                    const plusMatch = /\+(\w*)$/.exec(before);
                    if (plusMatch) {
                      const start = plusMatch.index;
                      const newText =
                        before.slice(0, start) +
                        "+" + s +
                        " " +
                        after;
                      setInput(newText);
                      setShowSuggest(false);
                      setTimeout(() => {
                        if (textareaRef.current) {
                          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + s.length + 2;
                          textareaRef.current.focus();
                        }
                      }, 0);
                    }
                  }}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-row justify-end items-center gap-2 mt-1">
          <button
            className="bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm px-4 py-2 rounded-md shadow-sm transition disabled:opacity-60"
            onClick={handleParse}
            disabled={parsing}
            style={{ minWidth: 100 }}
          >
            {parsing ? "Parsing..." : "AI Parse"}
          </button>
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold text-sm px-4 py-2 rounded-md shadow-sm transition disabled:opacity-60"
            onClick={handleManualAdd}
            disabled={parsing}
            style={{ minWidth: 100 }}
            title="Shortcut: Cmd/Ctrl + Enter"
          >
            Add Manually
          </button>
        </div>
        {error && <div className="text-red-600 text-base font-semibold mt-2">{error}</div>}
      </div>
      {/* Right column: hide on mobile, show on md+ */}
      <div className="basis-1/3 flex-col min-w-[220px] max-w-xs hidden md:flex">
        <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 text-xs shadow-sm">
          <div className="font-semibold mb-1 mt-2 text-base">Log Time</div>
          <div className="mb-2">Track time spent on each task or group of tasks. It doesn’t need to be precise — estimates are fine.</div>
          <div className="font-semibold mb-1 mt-2 text-base">Use Activity Buckets</div>
          <div className="mb-2">Categorize your time into meaningful activity types (“buckets”) that reflect how you work.</div>
          <div className="mb-2">Suggested buckets:</div>
          <ul className="list-disc list-inside ml-4 mb-2">
            <li className="mb-1">
              <span className="font-mono bg-purple-100 px-1 rounded mr-1">#feature</span>
              <b>Features:</b> Work on new product features — from planning to coding, testing, and rollout.
            </li>
            <li className="mb-1">
              <span className="font-mono bg-purple-100 px-1 rounded mr-1">#debt</span>
              <b>Bugs/Debt:</b> Fixing bugs, refactoring, resolving performance/security issues — anything that improves or repairs existing systems.
            </li>
            <li className="mb-1">
              <span className="font-mono bg-purple-100 px-1 rounded mr-1">#toil</span>
              <b>Toil:</b> Routine, repetitive tasks — deployments, monitoring, or manual processes that don’t directly add new value.
            </li>
          </ul>
          <div className="font-semibold mb-1 mt-2 text-base">Balance Your Work</div>
          <div>
            Aim for a healthy mix across buckets based on team goals.<br />
            Review and adjust the ratio over time to align with desired outcomes.
          </div>
        </div>
      </div>
    </div>
  );
}
