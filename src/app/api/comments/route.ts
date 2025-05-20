import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const submission_id = searchParams.get('submission_id');

  if (!submission_id) {
    return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
  }

  // Fetch all comments for the submission, ordered by created_at
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('submission_id', submission_id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { submission_id, content, parent_id } = body;
  
  // Validate required fields
  if (!submission_id || !content) {
    return NextResponse.json({ error: 'Missing required fields: submission_id and content are required' }, { status: 400 });
  }

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = userData?.role === 'admin' ? 'admin' : 'user';

  // Insert the comment (users and admins can both post top-level or reply)
  const { data, error } = await supabase
    .from('comments')
    .insert({
      submission_id,
      parent_id: parent_id || null,
      author_id: user.id,
      author_role: role,
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ comment: data });
} 