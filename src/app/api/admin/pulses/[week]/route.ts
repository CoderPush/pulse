import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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