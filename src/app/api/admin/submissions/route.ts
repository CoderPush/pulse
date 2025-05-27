import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getMostRecentThursdayWeek } from '@/lib/utils/date';

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

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    let week = searchParams.get('week');
    const yearStr = searchParams.get('year');

    // derive defaults first
    if (!week || week === 'all') week = String(getMostRecentThursdayWeek());
    const year = yearStr ? Number(yearStr) : new Date().getFullYear();

    // basic sanity checks
    const weekNum = Number(week);
    if (!Number.isInteger(weekNum) || weekNum < 1 || weekNum > 53 || !Number.isInteger(year)) {
      return NextResponse.json({ error: 'Invalid week/year query parameter' }, { status: 400 });
    }

    const status = searchParams.get('status');

    // Build the query
    let query = supabase
      .from('submissions')
      .select(`
        *,
        users:user_id (
          email
        )
      `)
      .order('submitted_at', { ascending: false });

    // Apply filters
    if (email) {
      // First get the user_ids for emails that match the search
      const { data: usersData } = await supabase
        .from('users')
        .select('id')
        .ilike('email', `%${email}%`);

      if (!usersData || usersData.length === 0) {
        // If no users found with matching email, return empty array
        return NextResponse.json({
          success: true,
          data: []
        });
      }

      // Filter submissions by the found user_ids
      const userIds = usersData.map(user => user.id);
      query = query.in('user_id', userIds);
    }
    // Always filter by week and year
    query = query.eq('week_number', weekNum).eq('year', year);
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: submissions, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedSubmissions = submissions.map(submission => ({
      id: submission.id,
      user_id: submission.user_id,
      email: submission.users?.email,
      week_number: submission.week_number,
      status: submission.is_late ? 'Late' : 'On Time',
      submission_at: submission.submitted_at,
      created_at: submission.created_at,
      manager: submission.manager,
      primary_project: {
        name: submission.primary_project_name,
        hours: submission.primary_project_hours
      },
      additional_projects: submission.additional_projects || [],
      feedback: submission.feedback,
      changes_next_week: submission.changes_next_week,
      milestones: submission.milestones,
      other_feedback: submission.other_feedback,
      hours_reporting_impact: submission.hours_reporting_impact,
      form_completion_time: submission.form_completion_time
    }));

    return NextResponse.json({
      success: true,
      data: transformedSubmissions
    });
  } catch (error) {
    console.error('Error in admin submissions route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 