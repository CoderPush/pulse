import { createClient } from '@/utils/supabase/server';
import { onTimeTemplate, lateTemplate1, lateTemplate2, lateTemplate3, getReminderSubject, ReminderType } from '@/utils/email-templates';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
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
    .select('user_id, count')
    .in('user_id', userIds)
    .gte('created_at', twentyFourHoursAgo.toISOString());

  const recentlyRemindedUserIds = new Set(recentReminders?.map(r => r.user_id) || []);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const results = await Promise.all(
    users.map(async (user) => {
      if (recentlyRemindedUserIds.has(user.id)) {
        return {
          userId: user.id,
          success: false,
          error: 'User was reminded in the last 24 hours'
        };
      }

      const { data: reminderCount } = await supabase
        .from('reminder_logs')
        .select('count')
        .eq('user_id', user.id)
        .eq('week', week)
        .eq('year', year)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const count = (reminderCount?.count || 0) + 1;
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
        name: user.name, 
        week, 
        year,
        link: submissionLink
      });
      const subject = getReminderSubject(type, { userName: user.name, weekNumber: week, year });

      try {
        const { success, error } = await sendEmail({
          to: user.email,
          subject,
          html: emailContent,
        });

        if (!success) {
          throw new Error(error instanceof Error ? error.message : 'Failed to send email');
        }

        await supabase
          .from('reminder_logs')
          .insert({
            user_id: user.id,
            week,
            year,
            count,
            sent_by: user.id
          });

        return {
          userId: user.id,
          success: true
        };
      } catch (error) {
        console.error('Error sending reminder:', error);
        return {
          userId: user.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    })
  );

  return NextResponse.json({ results });
} 