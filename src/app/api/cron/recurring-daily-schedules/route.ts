// Supports a 'now' query parameter for manual testing:
// Example: /api/cron/recurring-daily-schedules?now=2024-06-09T12:00:00Z
// If provided, the route will simulate running as if the current date is 'now'.

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import {
  getNextWeekDates,
  buildPeriodCandidates,
  buildAssignments,
  PeriodCandidate
} from './recurringDailyUtils';

export const maxDuration = 300; // 5 minutes

type CronJobError = { scheduleId: string | number; date: Date; error: string };

export async function GET(request: Request) {
  // Authenticate using CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Support ?now=YYYY-MM-DDTHH:mm:ssZ for manual testing
  const url = new URL(request.url);
  const testDate = url.searchParams.get('now');
  const baseDate = testDate ? new Date(testDate) : new Date();
  const nextWeekDates = getNextWeekDates(baseDate);

  const supabase = await createClient();

  // 1. Fetch all active recurring schedules
  const { data: dailySchedules, error: schedulesError } = await supabase
    .from('recurring_schedules')
    .select('id, template_id, days_of_week, reminder_time, user_ids, start_date, end_date')
    .or('end_date.is.null,end_date.gte.' + nextWeekDates[0].toISOString().slice(0, 10))
    .lte('start_date', nextWeekDates[nextWeekDates.length - 1].toISOString().slice(0, 10));
  if (schedulesError) {
    return NextResponse.json({ error: 'Failed to fetch recurring schedules' }, { status: 500 });
  }

  let createdPeriods = 0;
  let createdAssignments = 0;
  const errors: CronJobError[] = [];


  // Build period candidates
  const periodCandidates: PeriodCandidate[] = buildPeriodCandidates(dailySchedules, nextWeekDates);

  // 3. Bulk fetch existing periods
  if (periodCandidates.length === 0) {
    return NextResponse.json({ createdPeriods, createdAssignments, errors });
  }
  const orFilters = periodCandidates.map(
    (p) => `and(template_id.eq.${p.template_id},start_date.eq.${p.start_date})`
  ).join(',');

  let existingPeriods: { template_id: string; start_date: string; id: string }[] = [];
  if (orFilters.length > 0) {
    const { data: existing, error: existingError } = await supabase
      .from('submission_periods')
      .select('id, template_id, start_date')
      .or(orFilters);
    if (existingError) {
      errors.push({ scheduleId: 'bulk', date: new Date(), error: existingError.message });
    } else if (existing) {
      existingPeriods = existing;
    }
  }

  // 4. Determine which periods are missing
  const existingSet = new Set(existingPeriods.map(p => `${p.template_id}|${p.start_date.slice(0, 10)}`));
  const periodsToInsert = periodCandidates.filter(
    p => !existingSet.has(`${p.template_id}|${p.start_date}`)
  );

  // 5. Bulk insert missing periods
  let insertedPeriods: { id: string; template_id: string; start_date: string }[] = [];
  if (periodsToInsert.length > 0) {
    const { data: inserted, error: insertError } = await supabase
      .from('submission_periods')
      .insert(periodsToInsert.map(p => ({
        template_id: p.template_id,
        period_type: 'daily',
        start_date: p.start_date,
        end_date: p.end_date,
        reminder_time: p.reminder_time,
      })))
      .select('id, template_id, start_date');
    if (insertError) {
      errors.push({ scheduleId: 'bulk', date: new Date(), error: insertError.message });
    } else if (inserted) {
      insertedPeriods = inserted;
      createdPeriods += inserted.length;
    }
  }

  // 6. Build a map of (template_id, start_date) -> period_id
  const periodIdMap = new Map<string, string>();
  for (const p of [...existingPeriods, ...insertedPeriods]) {
    periodIdMap.set(`${p.template_id}|${p.start_date.slice(0, 10)}`, p.id);
  }

  // 7. Build all user assignments that SHOULD exist
  const desiredAssignments = buildAssignments(periodCandidates, periodIdMap);

  // 8. Fetch existing user assignments for all relevant periods
  const allPeriodIds = Array.from(periodIdMap.values());
  let existingAssignments: { submission_period_id: string; user_id: string }[] = [];
  if (allPeriodIds.length > 0) {
    const { data: assignments, error: fetchAssignmentsError } = await supabase
      .from('submission_period_users')
      .select('submission_period_id, user_id')
      .in('submission_period_id', allPeriodIds);
    if (fetchAssignmentsError) {
      errors.push({ scheduleId: 'bulk', date: new Date(), error: fetchAssignmentsError.message });
    } else if (assignments) {
      existingAssignments = assignments;
    }
  }

  // 9. Determine which assignments are missing
  const existingAssignmentsSet = new Set(
    existingAssignments.map(a => `${a.submission_period_id}|${a.user_id}`)
  );
  const assignmentsToInsert = desiredAssignments.filter(
    a => !existingAssignmentsSet.has(`${a.submission_period_id}|${a.user_id}`)
  );

  // 10. Bulk insert all missing assignments
  if (assignmentsToInsert.length > 0) {
    const { error: assignError } = await supabase
      .from('submission_period_users')
      .insert(assignmentsToInsert);
    if (assignError) {
      errors.push({ scheduleId: 'bulk', date: new Date(), error: assignError.message });
    } else {
      createdAssignments += assignmentsToInsert.length;
    }
  }

  return NextResponse.json({ createdPeriods, createdAssignments, errors });
} 