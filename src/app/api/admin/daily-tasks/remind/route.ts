import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getDailyTaskReminderEmail } from '@/lib/email-templates';

export async function POST(request: Request) {
  const supabase = await createClient();
  // Authenticate using CRON_SECRET or an admin session
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If not using CRON_SECRET, check for an admin user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const emailHtml = getDailyTaskReminderEmail({
    userName: user.name || user.email,
    pulseUrl: `${baseUrl}/ai-demo-page`
  });

  const result = await sendEmail({
    to: user.email,
    subject: 'Reminder: Log Your Daily Tasks',
    html: emailHtml,
  });

  if (!result.success) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ message: `Reminder sent to ${user.email}` });
} 