import { getWeekNumber, formatWeekNumber, getWeekDates, getSubmissionWindow, getMostRecentThursdayWeek } from './date';
import { describe, it, expect, vi } from 'vitest';

describe('getWeekNumber', () => {
  it('should return correct week number for known dates', () => {
    // First week of 2024 (Jan 1-7)
    expect(getWeekNumber(new Date('2024-01-01'))).toBe(1);
    expect(getWeekNumber(new Date('2024-01-07'))).toBe(1);

    // Last week of 2023 (Dec 25-31)
    expect(getWeekNumber(new Date('2023-12-31'))).toBe(52);

    // Edge case: Week 53 in years that have it
    expect(getWeekNumber(new Date('2020-12-31'))).toBe(53);
  });

  it('should handle timezone differences correctly', () => {
    // Test with UTC dates to ensure consistent results
    const utcDate = new Date('2024-01-01T00:00:00Z');
    const localDate = new Date('2024-01-01T00:00:00');
    
    expect(getWeekNumber(utcDate)).toBe(getWeekNumber(localDate));
  });

  it('should default to current date when no argument is provided', () => {
    const currentWeek = getWeekNumber();
    expect(typeof currentWeek).toBe('number');
    expect(currentWeek).toBeGreaterThanOrEqual(1);
    expect(currentWeek).toBeLessThanOrEqual(53);
  });
});

describe('formatWeekNumber', () => {
  it('formats single digit week numbers with leading zero', () => {
    expect(formatWeekNumber(1)).toBe('Week 01');
    expect(formatWeekNumber(9)).toBe('Week 09');
  });

  it('formats double digit week numbers correctly', () => {
    expect(formatWeekNumber(10)).toBe('Week 10');
    expect(formatWeekNumber(52)).toBe('Week 52');
  });

  it('throws error for invalid week numbers', () => {
    expect(() => formatWeekNumber(0)).toThrow('Week number must be between 1 and 53');
    expect(() => formatWeekNumber(54)).toThrow('Week number must be between 1 and 53');
  });
});

describe('getWeekDates', () => {
  it('should return correct start and end dates for a given week and year', () => {
    const { startDate, endDate, formattedRange } = getWeekDates(1, 2024);
    
    // Week 1 2024 is Mon Jan 1st to Sun Jan 7th
    // Use component checks to avoid timezone issues with toISOString()
    expect(startDate.getFullYear()).toBe(2024);
    expect(startDate.getMonth()).toBe(0); // 0 = January
    expect(startDate.getDate()).toBe(1); // Monday
    
    expect(endDate.getFullYear()).toBe(2024);
    expect(endDate.getMonth()).toBe(0); // 0 = January
    expect(endDate.getDate()).toBe(7); // Sunday

    expect(formattedRange).toEqual({ start: 'Jan 1', end: 'Jan 7' });
  });

  it('should handle weeks crossing year boundaries', () => {
    // Week 52 2023 is Mon Dec 25th to Sun Dec 31st
    const { startDate, endDate, formattedRange } = getWeekDates(52, 2023);
    expect(startDate.getFullYear()).toBe(2023);
    expect(startDate.getMonth()).toBe(11); // 11 = December
    expect(startDate.getDate()).toBe(25); // Monday
    
    expect(endDate.getFullYear()).toBe(2023);
    expect(endDate.getMonth()).toBe(11); // 11 = December
    expect(endDate.getDate()).toBe(31); // Sunday
    expect(formattedRange).toEqual({ start: 'Dec 25', end: 'Dec 31' });
  });
  
  it('should default to the current year if not provided', () => {
      const currentYear = new Date().getFullYear();
      const { startDate } = getWeekDates(10); // No year provided
      expect(startDate.getFullYear()).toBe(currentYear);
  });
});

describe('getSubmissionWindow', () => {
  it('should return the correct submission window dates for a given week', () => {
    const { 
      submissionStart, 
      submissionEnd, 
      lateSubmissionEnd, 
    } = getSubmissionWindow(1, 2024); // Week 1 2024: Jan 1 - Jan 7

    // Start date is Jan 1 (Monday)
    // Expected submissionStart: Friday Jan 5th, 5:00 PM
    // Check components instead of ISO string to avoid timezone issues
    expect(submissionStart.getFullYear()).toBe(2024);
    expect(submissionStart.getMonth()).toBe(0); // January
    expect(submissionStart.getDate()).toBe(5); // Friday
    expect(submissionStart.getHours()).toBe(17); // 5 PM
    expect(submissionStart.getMinutes()).toBe(0);

    // Expected submissionEnd: Monday Jan 8th, 2:00 PM
    expect(submissionEnd.getFullYear()).toBe(2024);
    expect(submissionEnd.getMonth()).toBe(0); // January
    expect(submissionEnd.getDate()).toBe(8); // Monday
    expect(submissionEnd.getHours()).toBe(14); // 2 PM
    expect(submissionEnd.getMinutes()).toBe(0);

    // Expected lateSubmissionEnd: Tuesday Jan 9th, 5:00 PM
    expect(lateSubmissionEnd.getFullYear()).toBe(2024);
    expect(lateSubmissionEnd.getMonth()).toBe(0); // January
    expect(lateSubmissionEnd.getDate()).toBe(9); // Tuesday
    expect(lateSubmissionEnd.getHours()).toBe(17); // 5 PM
    expect(lateSubmissionEnd.getMinutes()).toBe(0);

  });
  
  it('should default to the current year if not provided', () => {
      const { submissionStart } = getSubmissionWindow(15); // No year provided
      const currentYear = new Date().getFullYear();
      // Check if one of the dates falls within the expected year
      expect(submissionStart.getFullYear()).toBe(currentYear); 
  });
});

describe('getMostRecentThursdayWeek', () => {
  // Restore real timers after each test in this suite
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the correct week number when today is Thursday or later in the week', () => {
    // Thursday, July 11, 2024 (Week 28)
    vi.setSystemTime(new Date('2024-07-11'));
    expect(getMostRecentThursdayWeek()).toBe(28);

    // Friday, July 12, 2024 (Week 28)
    vi.setSystemTime(new Date('2024-07-12'));
    expect(getMostRecentThursdayWeek()).toBe(28);

    // Saturday, July 13, 2024 (Week 28)
    vi.setSystemTime(new Date('2024-07-13'));
    expect(getMostRecentThursdayWeek()).toBe(28);

    // Sunday, July 14, 2024 (Week 28)
    vi.setSystemTime(new Date('2024-07-14'));
    expect(getMostRecentThursdayWeek()).toBe(28);
  });

  it('should return the previous week number when today is before Thursday', () => {
    // Monday, July 15, 2024 (Week 29)
    vi.setSystemTime(new Date('2024-07-15'));
    // Most recent Thursday was July 11 (Week 28)
    expect(getMostRecentThursdayWeek()).toBe(28);

    // Tuesday, July 16, 2024 (Week 29)
    vi.setSystemTime(new Date('2024-07-16'));
    // Most recent Thursday was July 11 (Week 28)
    expect(getMostRecentThursdayWeek()).toBe(28);

    // Wednesday, July 17, 2024 (Week 29)
    vi.setSystemTime(new Date('2024-07-17'));
    // Most recent Thursday was July 11 (Week 28)
    expect(getMostRecentThursdayWeek()).toBe(28);
  });

  it('should handle year boundaries correctly', () => {
    // Monday, Jan 1, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-01'));
    // Most recent Thursday was Dec 28, 2023 (Week 52)
    expect(getMostRecentThursdayWeek()).toBe(52);

    // Tuesday, Jan 2, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-02'));
    // Most recent Thursday was Dec 28, 2023 (Week 52)
    expect(getMostRecentThursdayWeek()).toBe(52);

    // Wednesday, Jan 3, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-03'));
    // Most recent Thursday was Dec 28, 2023 (Week 52)
    expect(getMostRecentThursdayWeek()).toBe(52);

    // Thursday, Jan 4, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-04'));
    // Most recent Thursday is Jan 4 itself (Week 1)
    expect(getMostRecentThursdayWeek()).toBe(1);
  });
});