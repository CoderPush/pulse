import { createClient } from '@/utils/supabase/server';
import { onTimeTemplate, lateTemplate1, lateTemplate2, lateTemplate3, getReminderSubject, ReminderType } from '@/utils/email-templates';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('id, is_admin')
    .eq('id', authUser.id)
    .single();

  if (!dbUser?.is_admin) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { userIds, week, year } = await request.json();

  if (!userIds?.length || !week || !year) {
    return new NextResponse('Missing required fields', { status: 400 });
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, email, name')
    .in('id', userIds);

  if (!users?.length) {
    return new NextResponse('No users found', { status: 404 });
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: recentReminders } = await supabase
    .from('reminder_logs')
    .select('user_id')
    .in('user_id', userIds)
    .gte('sent_at', twentyFourHoursAgo.toISOString());

  const recentlyRemindedUserIds = new Set(recentReminders?.map(r => r.user_id) || []);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const results = await Promise.all(
    users.map(async (recipient) => {
      if (recentlyRemindedUserIds.has(recipient.id)) {
        return {
          userId: recipient.id,
          success: false,
          error: 'User was reminded in the last 24 hours'
        };
      }

      const { count: previousReminderCount } = await supabase
        .from('reminder_logs')
        .select('*', { count: 'exact' })
        .eq('user_id', recipient.id)
        .eq('week_number', week)
        .order('sent_at', { ascending: false });

      const count = (previousReminderCount || 0) + 1;
      let template;
      let type: ReminderType;
      switch (count) {
        case 1:
          template = onTimeTemplate;
          type = 'on-time';
          break;
        case 2:
          template = lateTemplate1;
          type = 'late-1';
          break;
        case 3:
          template = lateTemplate2;
          type = 'late-2';
          break;
        default:
          template = lateTemplate3;
          type = 'late-3';
      }

      const submissionLink = `${baseUrl}/?week=${week}&year=${year}`;
      const emailContent = template({ 
        name: recipient.name, 
        week, 
        year,
        link: submissionLink
      });
      const subject = getReminderSubject(type, { userName: recipient.name, weekNumber: week, year });

      try {
        const { success, error } = await sendEmail({
          to: recipient.email,
          subject,
          html: emailContent,
        });

        if (!success) {
          throw new Error(error instanceof Error ? error.message : 'Failed to send email');
        }

        await supabase
          .from('reminder_logs')
          .insert({
            user_id: recipient.id,
            week_number: week,
            sent_by: dbUser.id
          });

        return {
          userId: recipient.id,
          success: true
        };
      } catch (error) {
        console.error('Error sending reminder:', error);
        return {
          userId: recipient.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  return NextResponse.json({ results });
} 