/**
 * Calculates the ISO week number for a given date.
 * This implementation follows the ISO 8601 standard for week numbers:
 * - Week 1 is the week containing the first Thursday of the year
 * - Weeks start on Monday
 * - The first week of the year is the one that contains at least 4 days
 * 
 * @param date - The date to calculate the week number for (defaults to current date)
 * @returns The ISO week number (1-53)
 */
export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
} 