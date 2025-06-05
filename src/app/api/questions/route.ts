import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // Use the new RPC to get only the latest version of each question
    const { data: questions, error: questionsError } = await supabase.rpc('get_active_latest_questions');
    if (questionsError) throw questionsError;

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in /api/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 