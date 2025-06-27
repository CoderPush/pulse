// Pure utility functions for recurring daily schedules

export type RecurringDailySchedule = {
  id: string | number;
  template_id: string;
  days_of_week: string[];
  reminder_time: string | null;
  user_ids: string[];
  start_date: string;
  end_date: string | null;
};

export type PeriodCandidate = {
  template_id: string;
  start_date: string;
  end_date: string;
  reminder_time: string | null;
  schedule_id: string | number;
  user_ids: string[];
};

/**
 * Returns an array of Date objects for the next week (Monday-Sunday) starting from the current or next Monday.
 */
export function getNextWeekDates(baseDate: Date = new Date()): Date[] {
  const today = new Date(baseDate);
  // Use UTC day
  const todayDay = today.getUTCDay();
  const nextMonday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const daysUntilMonday = (1 - todayDay + 7) % 7;
  nextMonday.setUTCDate(today.getUTCDate() + daysUntilMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nextMonday);
    d.setUTCDate(nextMonday.getUTCDate() + i);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
}

/**
 * Returns the short weekday string for a given date (e.g., 'Mon').
 */
export function getDayOfWeekStr(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}


/**
 * Builds period candidates for daily schedules and the given week dates.
 * Returns an array of period candidate objects.
 */
export function buildPeriodCandidates(schedules: RecurringDailySchedule[], nextWeekDates: Date[]): PeriodCandidate[] {
  const candidates: PeriodCandidate[] = [];
  for (const schedule of schedules) {
    const daysOfWeek = schedule.days_of_week || [];
    for (const date of nextWeekDates) {
      const dayStr = getDayOfWeekStr(date);
      if (!daysOfWeek.includes(dayStr)) continue;
      const dateStr = date.toISOString().slice(0, 10);
      const endDate = new Date(date);
      endDate.setDate(date.getDate() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);
      candidates.push({
        template_id: schedule.template_id,
        start_date: dateStr,
        end_date: endDateStr,
        reminder_time: schedule.reminder_time,
        schedule_id: schedule.id,
        user_ids: schedule.user_ids || [],
      });
    }
  }
  return candidates;
}

/**
 * Builds all user assignments for all new periods.
 * Returns an array of assignment objects.
 */
export function buildAssignments(
  periodCandidates: PeriodCandidate[],
  periodIdMap: Map<string, string>
) {
  const allAssignments: { submission_period_id: string; user_id: string }[] = [];
  for (const p of periodCandidates) {
    const periodId = periodIdMap.get(`${p.template_id}|${p.start_date}`);
    if (!periodId) continue;
    for (const userId of p.user_ids) {
      allAssignments.push({
        submission_period_id: periodId,
        user_id: userId,
      });
    }
  }
  return allAssignments;
} 