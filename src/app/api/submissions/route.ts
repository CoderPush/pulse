import createClient from '@/utils/supabase/api';
import { NextResponse, NextRequest } from 'next/server';
import { WeeklyPulseFormData } from '@/types/weekly-pulse';

export async function POST(request: Request) {
  try {
    const supabase = createClient(request as NextRequest, new NextResponse());
    const formData: WeeklyPulseFormData = await request.json();

    // Get user ID from form data instead of auth
    const userId = formData.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const currentDate = new Date();

    // Validate required fields
    if (!formData.weekNumber || !formData.primaryProject.name || !formData.primaryProject.hours) {
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

    if (weekError || !week) {
      return NextResponse.json(
        { error: 'Invalid week number' },
        { status: 400 }
      );
    }

    // Check if submission is late
    const isLate = currentDate > new Date(week.submission_end);

    // Calculate form completion time robustly
    let formCompletionTime = null;
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      const diffMs = end.getTime() - start.getTime();
      formCompletionTime = Math.max(1, Math.round(diffMs / 60000));
    } else if (formData.formCompletionTime) {
      formCompletionTime = formData.formCompletionTime;
    }

    // Format data for database
    const submissionData = {
      user_id: userId, // Use userId from form data
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
      form_completion_time: formCompletionTime,
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

    // Auto-share with manager if manager is a coderpush.com email
    try {
      const managerEmail = submission.manager?.trim().toLowerCase();
      if (managerEmail && managerEmail.endsWith('@coderpush.com')) {
        const { data: managerUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', managerEmail)
          .single();
        if (managerUser?.id) {
          await supabase.from('submission_shares').insert({
            submission_id: submission.id,
            shared_with_id: managerUser.id,
            shared_by_id: submission.user_id,
          });
        }
      }
    } catch (e) {
      // Optional: log error, but do not affect main response
      console.error('Optional auto-share failed:', e);
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