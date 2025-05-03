import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// These are the default questions that we'll version over time
const DEFAULT_QUESTIONS = [
  {
    id: 'primary-project',
    title: 'What project did you spend most time on?',
    description: 'Select your primary project for this week',
    type: 'text',
    required: true,
    version: 1,
    category: 'project'
  },
  {
    id: 'primary-hours',
    title: 'How many hours did you work on it?',
    description: 'Enter the number of hours spent on your primary project',
    type: 'number',
    required: true,
    version: 1,
    category: 'hours'
  },
  {
    id: 'manager',
    title: "Who's your manager right now?",
    description: 'Select your current manager',
    type: 'text',
    required: true,
    version: 1,
    category: 'manager'
  },
  {
    id: 'additional-projects',
    title: 'Did you work on any other projects?',
    description: 'Add any additional projects and hours',
    type: 'text',
    required: false,
    version: 1,
    category: 'project'
  },
  {
    id: 'changes-next-week',
    title: 'Any changes next week?',
    description: 'Mention further milestones/deadlines if applicable',
    type: 'textarea',
    required: false,
    version: 1,
    category: 'feedback'
  },
  {
    id: 'other-feedback',
    title: 'Anything else to share?',
    description: 'Wanting more/fewer challenges? Using more/less AI?',
    type: 'textarea',
    required: false,
    version: 1,
    category: 'feedback'
  },
  {
    id: 'hours-impact',
    title: 'How has reporting the hours each week affected you?',
    description: 'Share your experience with weekly hour reporting',
    type: 'textarea',
    required: true,
    version: 1,
    category: 'impact'
  }
];

// Week 18 specific questions (example of versioning)
const WEEK_18_QUESTIONS = DEFAULT_QUESTIONS.map(q => {
  if (q.id === 'hours-impact') {
    return {
      ...q,
      title: 'How do you feel about the current hour reporting process?',
      description: 'Has it helped with time management? Any suggestions for improvement?',
      version: 2
    };
  }
  return q;
});

export async function GET(
  request: Request,
  context: { params: Promise<{ week: string }> }
) {
  try {
    const params = await context.params;
    const weekNumber = Number.parseInt(params.week, 10);
    if (Number.isNaN(weekNumber) || weekNumber <= 0) {
      return NextResponse.json({ error: 'Invalid week parameter' }, { status: 400 });
    }
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

    // Get week data
    const { data: weekData, error: weekError } = await supabase
      .from('weeks')
      .select('*')
      .eq('week_number', weekNumber)
      .eq('year', new Date().getFullYear())
      .single();

    if (weekError) throw weekError;

    // Get submission statistics
    const { count: totalSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('year', weekData.year)
      .eq('week_number', weekData.week_number);

    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', false);

    // Determine which question set to use based on week number
    const questions = weekNumber === 18 ? WEEK_18_QUESTIONS : DEFAULT_QUESTIONS;

    return NextResponse.json({
      ...weekData,
      total_submissions: totalSubmissions ?? 0,
      completion_rate: totalUsers && totalSubmissions ? totalSubmissions / totalUsers : 0,
      questions
    });
  } catch (error) {
    console.error('Error in /api/admin/pulses/[week]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 