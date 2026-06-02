import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface Submission {
  user_id: string;
}

interface WeekInfo {
  year: number;
  week_number: number;
  start_date: string;
  end_date: string;
  submission_start: string;
  submission_end: string;
  late_submission_end: string;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get year and week from query params, default to current
    const { searchParams } = new URL(request.url);
    const targetYear = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const targetWeek = parseInt(searchParams.get('week') || '1');

    console.log('Fetching missing submissions for:', { targetYear, targetWeek });

    // First get the week info
    const { data: weekData, error: weekError } = await supabase
      .from('weeks')
      .select('*')
      .eq('year', targetYear)
      .eq('week_number', targetWeek)
      .single<WeekInfo>();

    if (weekError) {
      console.error('Error fetching week info:', weekError);
      return NextResponse.json(
        { error: 'Invalid week' },
        { status: 400 }
      );
    }

    // Get all users first
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .returns<User[]>();

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Get submissions for this week
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('user_id')
      .eq('year', targetYear)
      .eq('week_number', targetWeek)
      .returns<Submission[]>();

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Create sets for efficient lookup
    const submittedUserIds = new Set(submissions?.map(s => s.user_id) || []);

    // Filter users who haven't submitted
    const missingUsers = users?.filter(user => !submittedUserIds.has(user.id));

    console.log('Missing users count:', missingUsers?.length);

    return NextResponse.json({
      success: true,
      data: {
        week: weekData,
        missing_users: missingUsers
      }
    });
  } catch (error) {
    console.error('Error in missing submissions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 