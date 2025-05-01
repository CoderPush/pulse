import {
  startOfWeek,
  endOfWeek,
  getISOWeek,
  getYear,
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
 * Get the current ISO week number
 */
export function getCurrentWeek(): number {
  return getISOWeek(new Date());
}

/**
 * Get the ISO week number for a given date
 */
export function getWeekNumber(date: Date = new Date()): number {
  return getISOWeek(date);
}

/**
 * Check if a given week number is valid for a year
 */
export function isValidWeek(weekNumber: number, year: number = new Date().getFullYear()): boolean {
  if (weekNumber < 1 || weekNumber > 53) return false;
  
  try {
    const date = setISOWeek(new Date(year, 0, 4), weekNumber);
    return getYear(date) === year;
  } catch {
    return false;
  }
} 