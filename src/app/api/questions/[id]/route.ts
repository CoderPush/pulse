import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;
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

    const updates = await request.json();
    // Fetch the latest version for this question's parent_id
    const { data: current } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();
    if (!current) return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    const { data: latest } = await supabase
      .from('questions')
      .select('*')
      .eq('parent_id', current.parent_id)
      .order('version', { ascending: false })
      .limit(1)
      .single();
    const newVersion = (latest?.version || 1) + 1;
    // Insert new version
    const { data: newQuestion, error: insertError } = await supabase
      .from('questions')
      .insert({
        parent_id: current.parent_id,
        version: newVersion,
        title: updates.title,
        description: updates.description,
        type: updates.type,
        required: updates.required,
        category: updates.category,
        display_order: updates.display_order,
      })
      .select()
      .single();
    if (insertError) throw insertError;
    return NextResponse.json({ question: newQuestion });
  } catch (error) {
    console.error('Error in PUT /api/questions/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 