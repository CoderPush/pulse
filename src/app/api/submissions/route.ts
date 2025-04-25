import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { WeeklyPulseFormData } from '@/types/weekly-pulse';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('User:', user);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData: WeeklyPulseFormData = await request.json();
    const currentDate = new Date();

    // Validate required fields
    if (!formData.weekNumber || !formData.primaryProject.name || !formData.primaryProject.hours || !formData.manager) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Ensure weekNumber is a number
    const weekNumber = Number(formData.weekNumber);
    if (isNaN(weekNumber)) {
      return NextResponse.json(
        { error: 'Invalid week number format' },
        { status: 400 }
      );
    }

    // Get week from form data
    const { data: week, error: weekError } = await supabase
      .from('weeks')
      .select('*')
      .eq('year', new Date().getFullYear())
      .eq('week_number', weekNumber)
      .single();

    // Debug logging for week query
    console.log('Week query result:', { week, weekError });
    console.log('Week number used in query:', weekNumber);
    console.log('Year used in query:', new Date().getFullYear());
    console.log('==================');

    if (weekError || !week) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      );
    }

    // Check if submission is late
    const isLate = currentDate > new Date(week.submission_end);

    // Format data for database
    const submissionData = {
      user_id: user.id,
      year: week.year,
      week_number: week.week_number,
      primary_project_name: formData.primaryProject.name,
      primary_project_hours: formData.primaryProject.hours,
      additional_projects: formData.additionalProjects.map(proj => ({
        name: proj.project,
        hours: proj.hours
      })),
      manager: formData.manager,
      feedback: formData.feedback || null,
      changes_next_week: formData.changesNextWeek || null,
      milestones: formData.milestones || null,
      other_feedback: formData.otherFeedback || null,
      hours_reporting_impact: formData.hoursReportingImpact || null,
      form_completion_time: formData.formCompletionTime || null,
      status: 'submitted',
      is_late: isLate
    };

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select()
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('Error in submission route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get submissions for the authenticated user
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error in GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 