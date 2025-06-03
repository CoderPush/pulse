// Shared streak constants and logic
export const START_WEEK = 9;
export const EXCLUDED_WEEKS = [
  { year: 2025, week_number: 16 },
  // Add more exclusions as needed
];

export function isWeekExcluded(year: number, week_number: number) {
  return EXCLUDED_WEEKS.some(w => w.year === year && w.week_number === week_number);
} 