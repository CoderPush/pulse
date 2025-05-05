import { describe, it, expect, vi } from 'vitest';
import { getMostRecentThursdayWeek } from '../time';

// Mock the getWeekNumber function to return predictable results
vi.mock('@/utils/date', () => ({
  getWeekNumber: (date: Date) => {
    // Simple mock for testing purposes, adjust as needed for real getWeekNumber logic
    // This example uses ISO week date logic where week starts on Monday
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
}));

describe('getMostRecentThursdayWeek', () => {

  it('should return the current week if today is Thursday or later', () => {
    // Thursday, Jan 4, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-04'));
    expect(getMostRecentThursdayWeek()).toBe(1);

    // Friday, Jan 5, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-05'));
    expect(getMostRecentThursdayWeek()).toBe(1);

    // Saturday, Jan 6, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-06'));
    expect(getMostRecentThursdayWeek()).toBe(1);

    // Sunday, Jan 7, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-07'));
    expect(getMostRecentThursdayWeek()).toBe(1);

    // Clean up mocks
    vi.useRealTimers();
  });

  it('should return the previous week if today is before Thursday', () => {
    // Monday, Jan 8, 2024 (Week 2)
    vi.setSystemTime(new Date('2024-01-08'));
    // Last Thursday was Jan 4 (Week 1)
    expect(getMostRecentThursdayWeek()).toBe(1);

    // Tuesday, Jan 9, 2024 (Week 2)
    vi.setSystemTime(new Date('2024-01-09'));
    // Last Thursday was Jan 4 (Week 1)
    expect(getMostRecentThursdayWeek()).toBe(1);

    // Wednesday, Jan 10, 2024 (Week 2)
    vi.setSystemTime(new Date('2024-01-10'));
    // Last Thursday was Jan 4 (Week 1)
    expect(getMostRecentThursdayWeek()).toBe(1);

    // Clean up mocks
    vi.useRealTimers();
  });

  it('should handle year boundaries correctly', () => {
    // Monday, Jan 1, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-01'));
    // Last Thursday was Dec 28, 2023 (Week 52)
    expect(getMostRecentThursdayWeek()).toBe(52);

    // Tuesday, Jan 2, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-02'));
    // Last Thursday was Dec 28, 2023 (Week 52)
    expect(getMostRecentThursdayWeek()).toBe(52);

    // Wednesday, Jan 3, 2024 (Week 1)
    vi.setSystemTime(new Date('2024-01-03'));
    // Last Thursday was Dec 28, 2023 (Week 52)
    expect(getMostRecentThursdayWeek()).toBe(52);

    // Clean up mocks
    vi.useRealTimers();
  });
}); 