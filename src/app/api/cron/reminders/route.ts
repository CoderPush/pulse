import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getMostRecentThursdayWeek } from '@/lib/utils/date';

export async function GET(request: Request) {
  // Authenticate using CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = await createClient();
  const week = getMostRecentThursdayWeek();
  const year = new Date().getFullYear();

  // Find users who have NOT submitted for this week
  // 1. Get all user IDs
  const { data: allUsers, error: usersError } = await supabase
    .from('users')
    .select('id, email, name');
  if (usersError || !allUsers) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }

  // 2. Get all user IDs who HAVE submitted for this week
  const { data: submitted, error: submittedError } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('week_number', week)
    .eq('year', year);
  if (submittedError) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
  const submittedIds = new Set((submitted || []).map(s => s.user_id));

  // 3. Filter users who have NOT submitted
  const usersToRemind = allUsers.filter(u => !submittedIds.has(u.id));
  if (!usersToRemind.length) {
    return NextResponse.json({ message: 'No users need reminders' });
  }

  // 4. Call the existing reminder API
  const remindRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/submissions/remind`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    },
    body: JSON.stringify({
      userIds: usersToRemind.map(u => u.id),
      week,
      year
    })
  });

  // Handle non-JSON error responses
  let remindJson;
  const contentType = remindRes.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    remindJson = await remindRes.json();
  } else {
    const text = await remindRes.text();
    return NextResponse.json({ error: text, status: remindRes.status }, { status: remindRes.status });
  }
  return NextResponse.json(remindJson);
} 