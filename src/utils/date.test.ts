import { getWeekNumber, formatWeekNumber } from './date';
import { describe, it, expect } from 'vitest';

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