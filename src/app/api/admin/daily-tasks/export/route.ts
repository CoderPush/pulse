import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { normalizeVietnameseString } from '@/lib/utils/string';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  const month = searchParams.get('month');
  const week = searchParams.get('week');
  const project = searchParams.get('project'); // <-- Add this line

  // Query daily_tasks without pagination for CSV export
  let query = supabase
    .from('daily_tasks')
    .select('*, user:users(id, email, name)')
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

  const { data: tasks, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Generate CSV content
  const csvHeaders = ['Date', 'User Email', 'User Name', 'Project', 'Bucket', 'Hours', 'Description', 'Link'];
  const csvRows = tasks?.map(task => [
    task.task_date,
    task.user?.email || '',
    normalizeVietnameseString(task.user?.name || ''),
    normalizeVietnameseString(task.project || ''),
    normalizeVietnameseString(task.bucket || ''),
    task.hours || 0,
    `"${normalizeVietnameseString((task.description || '')).replace(/"/g, '""')}"`, // Escape quotes in description
    task.link || ''
  ]) || [];

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.join(','))
    .join('\n');

  // Generate filename based on filter
  let filename = 'daily-tasks';
  if (user) filename += '-user';
  if (month) filename += `-${month}`;
  if (week) filename += `-${week}`;
  filename += '.csv';

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
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