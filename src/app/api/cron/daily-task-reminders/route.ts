import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  // Authenticate using CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // 1. Get all users who want daily reminders
  const { data: usersToRemind, error: usersError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('wants_daily_reminders', true);

  if (usersError || !usersToRemind) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  if (!usersToRemind.length) {
    return NextResponse.json({ message: 'No users to remind' });
  }

  // 2. Call the reminder API for each user with a delay
  const results = [];
  let hasSuccess = false;
  for (const user of usersToRemind) {
    const remindRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/daily-tasks/remind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({ userId: user.id })
    });

    let remindJson;
    const contentType = remindRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      remindJson = await remindRes.json();
    } else {
      const text = await remindRes.text();
      remindJson = { error: text, status: remindRes.status };
    }
    if (remindRes.status === 200) {
      hasSuccess = true;
    }
    results.push({ userId: user.id, response: remindJson, status: remindRes.status });
    await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  }

  return NextResponse.json({ results }, { status: hasSuccess ? 200 : 500 });
} 