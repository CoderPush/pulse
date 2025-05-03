import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ week: string }> }
) {
  try {
    const params = await context.params;
    const weekNumber = parseInt(params.week);
    const supabase = await createClient();

    // Verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user?.id)
      .single();

    if (adminError || !adminCheck?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all submissions for this week with user information
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        *,
        users:user_id (
          email,
          name
        )
      `)
      .eq('week_number', weekNumber)
      .eq('year', new Date().getFullYear())
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Transform the data to group by question
    const fieldMap = {
      primary_project:     { field: 'primary_project_name',  keepEmpty: true,  includeHours: true },
      additional_projects: { field: 'additional_projects',   keepEmpty: true,  includeHours: false },
      manager:             { field: 'manager',               keepEmpty: true,  includeHours: false },
      feedback:            { field: 'feedback',              keepEmpty: false, includeHours: false },
      changes_next_week:   { field: 'changes_next_week',     keepEmpty: false, includeHours: false },
      milestones:          { field: 'milestones',            keepEmpty: false, includeHours: false },
      other_feedback:      { field: 'other_feedback',        keepEmpty: false, includeHours: false },
      hours_reporting_impact: { field: 'hours_reporting_impact', keepEmpty: false, includeHours: false },
    };

    const questions = Object.fromEntries(
      Object.entries(fieldMap).map(([key, { field, keepEmpty, includeHours }]) => [
        key,
        {
          responses: submissions
            .map((s) => {
              const base = {
                user: s.users,
                response: s[field],
                submitted_at: s.submitted_at,
                is_late: s.is_late,
              };
              return includeHours
                ? { ...base, hours: s.primary_project_hours }
                : base;
            })
            .filter((r) => keepEmpty || r.response),
        },
      ])
    );

    return NextResponse.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Error in /api/admin/pulses/[week]/responses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 