/**
 * Client-side natural language parser for daily task logging.
 * Parses a single line like "2h Alpha Redesign fixed login bug #feature https://github.com/..." into:
 * - hours: 2
 * - project: "Alpha Redesign" (fuzzy matched)
 * - description: "fixed login bug"
 * - tags: ["feature"]
 * - link: "https://github.com/..."
 */

export interface ParsedTask {
  hours: number;
  project: string;
  description: string;
  tags: string[];
  link: string;
  date: string;
  billable: boolean;
}

/**
 * Extract duration from text. Supports formats like:
 * - "2h", "2.5h", "2 h"
 * - "h2", "h2.5", "h 2"
 * - "30m" -> 0.5h, "90m" -> 1.5h
 */
function extractDuration(text: string): { hours: number; remaining: string } {
  let hours = 0;
  let remaining = text;

  // Match hours: "2h", "2.5h", "2 h" or "h2", "h2.5", "h 2"
  const hoursMatch = remaining.match(/(\d+(?:\.\d+)?)\s*h\b|\bh\s*(\d+(?:\.\d+)?)/i);
  if (hoursMatch) {
    hours = parseFloat(hoursMatch[1] || hoursMatch[2]);
    remaining = remaining.replace(hoursMatch[0], ' ').trim();
  }

  // Match minutes: "30m", "45 m" -> convert to hours
  const minutesMatch = remaining.match(/(\d+)\s*m\b/i);
  if (minutesMatch) {
    hours += parseInt(minutesMatch[1], 10) / 60;
    remaining = remaining.replace(minutesMatch[0], ' ').trim();
  }

  // Round to 2 decimal places
  hours = Math.round(hours * 100) / 100;

  return { hours, remaining };
}

/**
 * Extract tags from text. Tags are prefixed with #
 * e.g., "#bug #feature" -> ["bug", "feature"]
 */
function extractTags(text: string): { tags: string[]; remaining: string } {
  const tagMatches = [...text.matchAll(/#(\w+)/g)];
  const tags = tagMatches.map(m => m[1]);
  
  // Remove tags from text
  const remaining = text.replace(/#\w+/g, ' ').replace(/\s+/g, ' ').trim();
  
  return { tags, remaining };
}

/**
 * Extract URL link from text.
 * e.g., "https://github.com/org/repo/issues/123" 
 */
function extractLink(text: string): { link: string; remaining: string } {
  const linkMatch = text.match(/(https?:\/\/\S+)/);
  const link = linkMatch ? linkMatch[1] : '';
  
  // Remove link from text
  const remaining = linkMatch 
    ? text.replace(linkMatch[0], ' ').replace(/\s+/g, ' ').trim()
    : text;
  
  return { link, remaining };
}

/**
 * Extract billable indicator from text.
 * Default is billable (true). Use "!$" or "nonbillable" to mark as non-billable.
 * Use "$" or "billable" to explicitly mark as billable (redundant but supported).
 */
function extractBillable(text: string): { billable: boolean; remaining: string } {
  // Check for non-billable markers first: !$, !billable, nonbillable
  const nonBillableMatch = text.match(/!\$(?=\s|$)|!billable\b|\bnonbillable\b/i);
  
  if (nonBillableMatch) {
    const remaining = text.replace(nonBillableMatch[0], ' ').replace(/\s+/g, ' ').trim();
    return { billable: false, remaining };
  }
  
  // Check for explicit billable markers (optional, since default is true): $, $billable, billable
  const billableMatch = text.match(/\$billable\b|\$(?=\s|$)|\bbillable\b/i);
  
  if (billableMatch) {
    const remaining = text.replace(billableMatch[0], ' ').replace(/\s+/g, ' ').trim();
    return { billable: true, remaining };
  }
  
  // Default: billable is true
  return { billable: true, remaining: text };
}

/**
 * Extract date from text. Supports formats:
 * - "today", "@today" -> today's date
 * - "ytd", "@ytd" -> yesterday
 * - "tmr", "@tmr" -> tomorrow  
 * - "@dd/MM", "@dd-MM" -> specific date (current year)
 * - "@dd/MM/yyyy", "@dd-MM-yyyy" -> full date
 * - "@yyyy-MM-dd" -> ISO format
 */
function extractDate(text: string): { date: string; remaining: string } {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  
  const tmr = new Date(today);
  tmr.setDate(today.getDate() + 1);
  const tmrStr = tmr.toISOString().slice(0, 10);
  
  const ytd = new Date(today);
  ytd.setDate(today.getDate() - 1);
  const ytdStr = ytd.toISOString().slice(0, 10);

  // Check for word shortcuts: today, ytd, tmr (with or without @)
  const shortcutMatch = text.match(/\b@?(today|ytd|tmr)\b/i);
  if (shortcutMatch) {
    const keyword = shortcutMatch[1].toLowerCase();
    const dateMap: Record<string, string> = { today: todayStr, ytd: ytdStr, tmr: tmrStr };
    const date = dateMap[keyword] || todayStr;
    const remaining = text.replace(shortcutMatch[0], ' ').replace(/\s+/g, ' ').trim();
    return { date, remaining };
  }

  // Check for @date patterns
  const dateMatch = text.match(/@(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/);
  if (dateMatch) {
    const val = dateMatch[1];
    let date = todayStr;
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      // ISO format
      date = val;
    } else {
      // dd/MM or dd-MM or dd/MM/yyyy format
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
        if (parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d) {
          const pad = (n: number) => String(n).padStart(2, '0');
          date = `${y}-${pad(m)}-${pad(d)}`;
        }
      }
    }
    
    const remaining = text.replace(dateMatch[0], ' ').replace(/\s+/g, ' ').trim();
    return { date, remaining };
  }

  // No date found, default to today
  return { date: todayStr, remaining: text };
}

/**
 * Normalize text for comparison: lowercase and remove extra whitespace
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Split text into words for matching
 */
function getWords(text: string): string[] {
  return normalizeText(text).split(/\s+/).filter(w => w.length > 0);
}

/**
 * Score a project name against the remaining text using word overlap.
 * Higher score = more words match.
 * Bonus for exact phrase match.
 */
function scoreProject(projectName: string, remainingText: string): number {
  const projectWords = getWords(projectName);
  const textWords = getWords(remainingText);
  const normalizedRemaining = normalizeText(remainingText);
  const normalizedProject = normalizeText(projectName);

  // Exact phrase match bonus (project name appears as substring)
  const exactPhraseBonus = normalizedRemaining.includes(normalizedProject) ? 10 : 0;

  // Count how many project words appear in the text
  const wordOverlapScore = projectWords.filter(pw => 
    textWords.some(tw => tw === pw || tw.includes(pw) || pw.includes(tw))
  ).length;

  return wordOverlapScore + exactPhraseBonus;
}

/**
 * Find the best matching project from the list using fuzzy word overlap.
 * Returns the project name and the score.
 */
function findBestProject(
  projectNames: string[],
  remainingText: string
): { project: string; score: number } {
  if (projectNames.length === 0) {
    return { project: 'Unknown', score: 0 };
  }

  let bestProject = 'Unknown';
  let bestScore = 0;

  for (const projectName of projectNames) {
    const score = scoreProject(projectName, remainingText);
    // Tie-break: prefer longer project names (more specific)
    if (score > bestScore || (score === bestScore && projectName.length > bestProject.length)) {
      bestScore = score;
      bestProject = projectName;
    }
  }

  // Only return a match if we have at least some overlap
  if (bestScore === 0) {
    return { project: 'Unknown', score: 0 };
  }

  return { project: bestProject, score: bestScore };
}

/**
 * Strip project words from the remaining text to form the description.
 * Removes each project word once from the text.
 */
function stripProjectWords(remainingText: string, projectName: string): string {
  if (projectName === 'Unknown') {
    return remainingText.trim();
  }

  const projectWords = getWords(projectName);
  const words = remainingText.split(/\s+/);

  // Remove each project word once (first occurrence)
  for (const pw of projectWords) {
    const pwLower = pw.toLowerCase();
    const idx = words.findIndex(w => w.toLowerCase() === pwLower);
    if (idx !== -1) {
      words.splice(idx, 1);
    }
  }

  return words.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parse a natural language line into a task object.
 * 
 * @param line - The input line, e.g. "2h Alpha Redesign fixed login bug #feature $ https://github.com/..."
 * @param projectNames - List of valid project names to match against
 * @returns ParsedTask with hours, project, description, tags, link, date, and billable
 */
export function parseNaturalLine(line: string, projectNames: string[]): ParsedTask {
  const trimmed = line.trim();
  const today = new Date().toISOString().slice(0, 10);
  
  if (!trimmed) {
    return { hours: 0, project: 'Unknown', description: '', tags: [], link: '', date: today, billable: false };
  }

  // Step 1: Extract link first (URLs can contain special chars)
  const { link, remaining: afterLink } = extractLink(trimmed);

  // Step 2: Extract billable indicator
  const { billable, remaining: afterBillable } = extractBillable(afterLink);

  // Step 3: Extract date
  const { date, remaining: afterDate } = extractDate(afterBillable);

  // Step 4: Extract tags
  const { tags, remaining: afterTags } = extractTags(afterDate);

  // Step 5: Extract duration
  const { hours, remaining: afterDuration } = extractDuration(afterTags);

  // Step 6: Find best matching project
  const { project } = findBestProject(projectNames, afterDuration);

  // Step 7: Strip project words from remaining text to get description
  const description = stripProjectWords(afterDuration, project);

  return { hours, project, description, tags, link, date, billable };
}

/**
 * Get project suggestions for autocomplete based on input text.
 * Returns projects that have word overlap with the input, sorted by score.
 */
export function getProjectSuggestions(
  input: string,
  projectNames: string[],
  maxResults: number = 5
): string[] {
  if (!input.trim() || projectNames.length === 0) {
    return [];
  }

  // Extract link, billable, date, tags, and duration first so we match against the remaining text
  const { remaining: afterLink } = extractLink(input);
  const { remaining: afterBillable } = extractBillable(afterLink);
  const { remaining: afterDate } = extractDate(afterBillable);
  const { remaining: afterTags } = extractTags(afterDate);
  const { remaining } = extractDuration(afterTags);
  
  if (!remaining.trim()) {
    return [];
  }

  // Score all projects and sort by score descending
  const scored = projectNames
    .map(name => ({ name, score: scoreProject(name, remaining) }))
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score || b.name.length - a.name.length);

  return scored.slice(0, maxResults).map(p => p.name);
}
