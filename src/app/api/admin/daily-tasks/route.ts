import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const month = searchParams.get('month');
  const week = searchParams.get('week');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  // Query daily_tasks with user info
  let query = supabase
    .from('daily_tasks')
    .select('*, user:users(id, email, name)', { count: 'exact' })
    .order('task_date', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (user) {
    query = query.eq('user_id', user);
  }
  if (month) {
    query = query.gte('task_date', `${month}-01`).lte('task_date', `${month}-31`);
  }
  if (week) {
    const [year, weekNum] = week.split('-W');
    const firstDay = getDateOfISOWeek(Number(weekNum), Number(year));
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    query = query.gte('task_date', firstDay.toISOString().slice(0, 10)).lte('task_date', lastDay.toISOString().slice(0, 10));
  }

  const { data: tasks, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Get total count for pagination
  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return NextResponse.json({
    tasks: (tasks || []).map(t => ({
      ...t,
      user_email: t.user?.email,
      user_name: t.user?.name,
    })),
    totalPages,
    page,
    pageSize,
    totalTasks: count || 0,
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