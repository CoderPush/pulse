import {
  setISOWeek,
  startOfISOWeek,
  endOfISOWeek,
  format,
  addDays,
  setHours,
  setMinutes
} from 'date-fns';

/**
 * Get the start and end dates for a given ISO week number
 */
export function getWeekDates(weekNumber: number, year: number = new Date().getFullYear()) {
  // Create a date in the specified year
  const baseDate = new Date(year, 0, 4); // January 4th is always in week 1
  
  // Set it to the desired week
  const targetDate = setISOWeek(baseDate, weekNumber);
  
  // Get start (Monday) and end (Sunday) of the week
  const startDate = startOfISOWeek(targetDate);
  const endDate = endOfISOWeek(targetDate);

  return {
    startDate,
    endDate,
    formattedRange: {
      start: format(startDate, 'MMM d'),
      end: format(endDate, 'MMM d')
    }
  };
}

/**
 * Get the submission window dates for a given week
 */
export function getSubmissionWindow(weekNumber: number, year: number = new Date().getFullYear()) {
  const { startDate } = getWeekDates(weekNumber, year);
  
  // Friday 5 PM
  const submissionStart = setMinutes(setHours(addDays(startDate, 4), 17), 0);
  
  // Monday 2 PM
  const submissionEnd = setMinutes(setHours(addDays(startDate, 7), 14), 0);
  
  // Tuesday 5 PM
  const lateSubmissionEnd = setMinutes(setHours(addDays(startDate, 8), 17), 0);

  return {
    submissionStart,
    submissionEnd,
    lateSubmissionEnd,
    formattedWindows: {
      start: format(submissionStart, 'MMM d, h:mm a'),
      end: format(submissionEnd, 'MMM d, h:mm a'),
      lateEnd: format(lateSubmissionEnd, 'MMM d, h:mm a')
    }
  };
}


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

export function formatWeekNumber(weekNumber: number): string {
  if (weekNumber < 1 || weekNumber > 53) {
    throw new Error('Week number must be between 1 and 53')
  }
  return `Week ${weekNumber.toString().padStart(2, '0')}`
}

/**
 * Calculates the ISO week number for the week containing the most recent Thursday.
 * This is useful for determining the "operational" week number when work weeks
 * are considered locked or defined after Thursday.
 * 
 * @returns The ISO week number (1-53) of the week containing the most recent Thursday.
 */
export function getMostRecentThursdayWeek(): number {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 4 = Thursday
  // Calculate days to subtract to get to the previous Thursday
  // If today is Thu (4), Fri (5), Sat (6), subtract dayOfWeek - 4 (0, 1, 2)
  // If today is Sun (0), Mon (1), Tue (2), Wed (3), subtract dayOfWeek + 3 (3, 4, 5, 6)
  const daysToSubtract = dayOfWeek >= 4 ? dayOfWeek - 4 : dayOfWeek + 3;
  
  // Get the date of the most recent Thursday
  const lastThursday = new Date(now);
  lastThursday.setDate(now.getDate() - daysToSubtract);
  
  // Return the week number for that Thursday
  return getWeekNumber(lastThursday);
} 