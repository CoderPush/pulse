import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

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
    const week = searchParams.get('week');
    const status = searchParams.get('status');

    // Build the query
    let query = supabase
      .from('submissions')
      .select(`
        *,
        profiles:user_id (
          email
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (email) {
      query = query.ilike('profiles.email', `%${email}%`);
    }
    if (week && week !== 'all') {
      query = query.eq('week_number', Number(week));
    }
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
      email: submission.profiles?.email,
      week_number: submission.week_number,
      status: submission.is_late ? 'Late' : 'On Time',
      primary_project: {
        name: submission.primary_project_name,
        hours: submission.primary_project_hours
      },
      additional_projects: submission.additional_projects || []
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