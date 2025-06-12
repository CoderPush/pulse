import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes

type CronJobError = { scheduleId: string | number; date: Date; error: string };

// Helper: get all days in next week (Monday-Sunday)
function getNextWeekDates() {
  const today = new Date();
  // Find next Monday
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((8 - today.getDay()) % 7 || 7));
  // Build array of 7 days (Mon-Sun)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nextMonday);
    d.setDate(nextMonday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function getDayOfWeekStr(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }); // e.g., 'Mon'
}

export async function GET(request: Request) {
  // Authenticate using CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const nextWeekDates = getNextWeekDates();

  // 1. Fetch all active recurring schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from('recurring_schedules')
    .select('*')
    .or('end_date.is.null,end_date.gte.' + nextWeekDates[0].toISOString().slice(0, 10))
    .lte('start_date', nextWeekDates[nextWeekDates.length - 1].toISOString().slice(0, 10));
  if (schedulesError) {
    return NextResponse.json({ error: 'Failed to fetch recurring schedules' }, { status: 500 });
  }

  let createdPeriods = 0;
  let createdAssignments = 0;
  const errors: CronJobError[] = [];

  for (const schedule of schedules || []) {
    const daysOfWeek = schedule.days_of_week || [];
    for (const date of nextWeekDates) {
      const dayStr = getDayOfWeekStr(date); // e.g., 'Mon'
      if (!daysOfWeek.includes(dayStr)) continue;
      const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      const endDateStr = endDate.toISOString().slice(0, 10);
      // Check if period already exists for this template/date
      const { data: existing, error: existingError } = await supabase
        .from('submission_periods')
        .select('id')
        .eq('template_id', schedule.template_id)
        .eq('start_date', dateStr)
        .maybeSingle();
      if (existingError) {
        errors.push({ scheduleId: schedule.id, date, error: existingError.message });
        continue;
      }
      if (existing) continue; // Already exists
      // Create period
      const { data: period, error: periodError } = await supabase
        .from('submission_periods')
        .insert({
          template_id: schedule.template_id,
          period_type: 'daily',
          start_date: dateStr,
          end_date: endDateStr,
          reminder_time: schedule.reminder_time,
        })
        .select('id')
        .single();
      if (periodError || !period) {
        errors.push({ scheduleId: schedule.id, date, error: periodError?.message });
        continue;
      }
      createdPeriods++;
      // Assign only users in schedule.user_ids to this period
      const userIds: string[] = schedule.user_ids || [];
      const assignments = userIds.map((userId: string) => ({
        submission_period_id: period.id,
        user_id: userId,
        template_id: schedule.template_id,
      }));
      if (assignments.length > 0) {
        const { error: assignError } = await supabase
          .from('submission_period_users')
          .insert(assignments);
        if (assignError) {
          errors.push({ scheduleId: schedule.id, date, error: assignError.message });
        } else {
          createdAssignments += assignments.length;
        }
      }
    }
  }

  return NextResponse.json({ createdPeriods, createdAssignments, errors });
} 