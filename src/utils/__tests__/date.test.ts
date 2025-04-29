import { getWeekNumber } from '../date';

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