import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { FollowUpQuestion } from '@/types/followup';

export async function GET() {
  try {
    const supabase = await createClient();
    // Fetch the Weekly Pulse template by type
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('id')
      .eq('type', 'weekly')
      .single();
    if (templateError || !template) throw templateError || new Error('Weekly Pulse template not found');

    // Fetch questions for the Weekly Pulse template, ordered by display_order
    const { data, error } = await supabase
      .from('template_questions')
      .select('question_id, questions(*)')
      .eq('template_id', template.id)
      .order('display_order', { ascending: true });
    if (error) throw error;

    // Each row.questions is a FollowUpQuestion, or sometimes an array. Flatten all questions into a single array.
    const questions = (data || []).flatMap((row: { question_id: string; questions: FollowUpQuestion | FollowUpQuestion[] }) =>
      Array.isArray(row.questions) ? row.questions : [row.questions]
    );
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in /api/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 