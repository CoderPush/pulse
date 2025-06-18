import {
  getNextWeekDates,
  getDayOfWeekStr,
  buildPeriodCandidates,
  buildAssignments,
  RecurringDailySchedule,
  PeriodCandidate
} from './recurringDailyUtils';

import { test, expect, describe } from 'vitest';

describe('recurringDailyUtils', () => {
  test('getNextWeekDates returns 7 dates starting from the next Monday', () => {
    const baseDate = new Date('2024-06-10T12:00:00Z'); // Monday
    const week = getNextWeekDates(baseDate);
    expect(week.length).toBe(7);
    expect(week[0].getUTCDay()).toBe(1); // Monday
  });

  test('getNextWeekDates returns next Monday if today is Sunday', () => {
    const baseDate = new Date('2024-06-09T12:00:00Z'); // Sunday
    const week = getNextWeekDates(baseDate);
    expect(week[0].getUTCDay()).toBe(1); // Monday
  });

  test('getDayOfWeekStr returns correct short weekday', () => {
    const date = new Date('2024-06-10T00:00:00Z'); // Monday
    expect(getDayOfWeekStr(date)).toMatch(/Mon|Monday/);
  });

  test('buildPeriodCandidates builds correct period candidates for daily schedules', () => {
    const schedules: RecurringDailySchedule[] = [
      { id: 1, template_id: 'a', days_of_week: ['Mon', 'Wed'], reminder_time: '09:00', user_ids: ['u1'], start_date: '', end_date: null },
    ];
    const week = [
      new Date('2024-06-10T00:00:00Z'), // Mon
      new Date('2024-06-11T00:00:00Z'), // Tue
      new Date('2024-06-12T00:00:00Z'), // Wed
    ];
    const candidates = buildPeriodCandidates(schedules, week);
    expect(candidates.length).toBe(2);
    expect(candidates[0].start_date).toBe('2024-06-10');
    expect(candidates[1].start_date).toBe('2024-06-12');
  });

  test('buildAssignments builds assignments for all users and periods', () => {
    const periodCandidates: PeriodCandidate[] = [
      { template_id: 'a', start_date: '2024-06-10', end_date: '2024-06-11', reminder_time: '09:00', schedule_id: 1, user_ids: ['u1', 'u2'] },
      { template_id: 'a', start_date: '2024-06-12', end_date: '2024-06-13', reminder_time: '09:00', schedule_id: 1, user_ids: ['u1'] },
    ];
    const periodIdMap = new Map([
      ['a|2024-06-10', 'p1'],
      ['a|2024-06-12', 'p2'],
    ]);
    const assignments = buildAssignments(periodCandidates, periodIdMap);
    expect(assignments).toEqual([
      { submission_period_id: 'p1', user_id: 'u1'},
      { submission_period_id: 'p1', user_id: 'u2'},
      { submission_period_id: 'p2', user_id: 'u1'},
    ]);
  });
}); 