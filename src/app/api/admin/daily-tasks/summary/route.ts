import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const month = searchParams.get('month');
  const week = searchParams.get('week');
  const project = searchParams.get('project');
  const billable = searchParams.get('billable');

  // Query daily_tasks without pagination for summary
  let query = supabase
    .from('daily_tasks')
    .select('*')
    .order('task_date', { ascending: false });

  if (user) {
    query = query.eq('user_id', user);
  }
  if (month) {
    const [year, monthNum] = month.split('-');
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    query = query.gte('task_date', `${month}-01`).lte('task_date', `${month}-${String(lastDay).padStart(2, '0')}`);
  }
  if (week) {
    const [year, weekNum] = week.split('-W');
    const firstDay = getDateOfISOWeek(Number(weekNum), Number(year));
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    query = query.gte('task_date', firstDay.toISOString().slice(0, 10)).lte('task_date', lastDay.toISOString().slice(0, 10));
  }
  if (project) {
    query = query.eq('project', project);
  }
  if (billable && billable !== 'all') {
    query = query.eq('billable', billable === 'true');
  }

  const { data: tasks, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate summary from all tasks (not paginated)
  const totalHours = tasks?.reduce((sum, task) => sum + (task.hours || 0), 0) || 0;
  const billableHours = tasks?.reduce((sum, task) => sum + (task.billable ? (task.hours || 0) : 0), 0) || 0;
  const totalTasks = tasks?.length || 0;
  
  const byProject: Record<string, number> = {};
  const byBucket: Record<string, number> = {};
  
  tasks?.forEach((task) => {
    if (task.project) {
      byProject[task.project] = (byProject[task.project] || 0) + (task.hours || 0);
    }
    if (task.bucket) {
      byBucket[task.bucket] = (byBucket[task.bucket] || 0) + (task.hours || 0);
    }
  });

  return NextResponse.json({
    summary: {
      totalHours,
      billableHours,
      totalTasks,
      byProject,
      byBucket
    }
  });
}

// Helper: get first day of ISO week
function getDateOfISOWeek(week: number, year: number) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
} 