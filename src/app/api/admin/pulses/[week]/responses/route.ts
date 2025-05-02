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
    const questions = {
      primary_project: {
        responses: submissions.map(s => ({
          user: s.users,
          response: s.primary_project_name,
          hours: s.primary_project_hours,
          submitted_at: s.submitted_at,
          is_late: s.is_late
        }))
      },
      additional_projects: {
        responses: submissions.map(s => ({
          user: s.users,
          response: s.additional_projects,
          submitted_at: s.submitted_at,
          is_late: s.is_late
        }))
      },
      manager: {
        responses: submissions.map(s => ({
          user: s.users,
          response: s.manager,
          submitted_at: s.submitted_at,
          is_late: s.is_late
        }))
      },
      feedback: {
        responses: submissions.map(s => ({
          user: s.users,
          response: s.feedback,
          submitted_at: s.submitted_at,
          is_late: s.is_late
        })).filter(r => r.response)
      },
      changes_next_week: {
        responses: submissions.map(s => ({
          user: s.users,
          response: s.changes_next_week,
          submitted_at: s.submitted_at,
          is_late: s.is_late
        })).filter(r => r.response)
      },
      milestones: {
        responses: submissions.map(s => ({
          user: s.users,
          response: s.milestones,
          submitted_at: s.submitted_at,
          is_late: s.is_late
        })).filter(r => r.response)
      },
      other_feedback: {
        responses: submissions.map(s => ({
          user: s.users,
          response: s.other_feedback,
          submitted_at: s.submitted_at,
          is_late: s.is_late
        })).filter(r => r.response)
      },
      hours_reporting_impact: {
        responses: submissions.map(s => ({
          user: s.users,
          response: s.hours_reporting_impact,
          submitted_at: s.submitted_at,
          is_late: s.is_late
        })).filter(r => r.response)
      }
    };

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