import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    // Auth: Only allow admins
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: adminCheck } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    if (!adminCheck?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Get all latest questions (active and inactive)
    const { data: questions, error: questionsError } = await supabase.rpc('get_latest_questions');
    if (questionsError) throw questionsError;

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error in /api/admin/questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 