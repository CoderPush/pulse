import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

interface Submission {
  week_number: number;
}

// Project started at week 17
const START_WEEK = 17;

export async function POST(request: Request) {
  try {
    const { userId, currentWeek } = await request.json();
    
    // Get weeks from start week to current week
    const weeks = Array.from(
      { length: Math.min(5, currentWeek - START_WEEK + 1) }, 
      (_, i) => START_WEEK + i
    );

    const supabase = await createClient();
    
    // Fetch all submissions for these weeks in a single query
    const { data: submissions } = await supabase
      .from('submissions')
      .select('week_number')
      .eq('user_id', userId)
      .eq('year', new Date().getFullYear())
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