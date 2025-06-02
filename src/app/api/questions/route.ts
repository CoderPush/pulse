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

export async function POST(request: Request) {
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

    const body = await request.json();
    const { title, description, type, required, category, display_order, choices } = body;
    if (!title || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Insert with version=1 and parent_id=id (self-referencing)
    const { data: inserted, error: insertError } = await supabase.rpc('insert_first_question', {
      q_title: title,
      q_description: description || '',
      q_type: type,
      q_required: required || false,
      q_category: category || null,
      q_display_order: display_order ?? null,
      q_choices: choices ?? null
    });
    if (insertError) throw insertError;
    return NextResponse.json({ question: inserted });
  } catch (error) {
    console.error('Error in POST /api/questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 