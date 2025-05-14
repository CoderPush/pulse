import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // Fetch all questions
    const { data: allQuestions, error: questionsError } = await supabase
      .from('questions')
      .select('*');
    if (questionsError) throw questionsError;

    // Group by parent_id and select the highest version for each
    const latestQuestionsMap = new Map();
    for (const q of allQuestions) {
      const existing = latestQuestionsMap.get(q.parent_id);
      if (!existing || q.version > existing.version) {
        latestQuestionsMap.set(q.parent_id, q);
      }
    }
    const questions = Array.from(latestQuestionsMap.values());

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in /api/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 