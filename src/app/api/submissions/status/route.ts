import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { START_WEEK, isWeekExcluded } from '@/utils/streak';

interface Submission {
  week_number: number;
}

export async function POST(request: Request) {
  try {
    const { userId, currentWeek } = await request.json();
    const currentYear = new Date().getFullYear();
    
    // Get weeks from start week to current week, filter out excluded weeks
    const weeks = Array.from(
      { length: currentWeek - START_WEEK + 1 },
      (_, i) => START_WEEK + i
    ).filter(week => !isWeekExcluded(currentYear, week));

    const supabase = await createClient();
    
    // Fetch all submissions for these weeks in a single query
    const { data: submissions } = await supabase
      .from('submissions')
      .select('week_number')
      .eq('user_id', userId)
      .eq('year', currentYear)
      .in('week_number', weeks);

    // Create a map of submitted weeks for quick lookup
    const submittedWeeksMap = new Set(
      (submissions as Submission[] || []).map(sub => sub.week_number)
    );

    // Create submission status array
    const submissionStatus = weeks.map(week => ({
      week,
      submitted: submittedWeeksMap.has(week)
    }));

    return NextResponse.json(submissionStatus);
  } catch (error) {
    console.error('Error in submission status route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submission status' },
      { status: 500 }
    );
  }
} 