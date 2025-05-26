import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!userData?.is_admin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { user_id } = await req.json();
  if (!user_id)
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  // Fetch the submission to get the owner
  const { data: submission } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('id', id)
    .single();

  if (submission?.user_id === user_id) {
    return NextResponse.json({ success: false, message: 'No need to share with the original submitter; they already have access.' }, { status: 200 });
  }

  // Prevent duplicate shares
  const { data: existing } = await supabase
    .from('submission_shares')
    .select('id')
    .eq('submission_id', id)
    .eq('shared_with_id', user_id)
    .single();
  if (existing)
    return NextResponse.json({ error: 'Already shared' }, { status: 409 });

  const { error } = await supabase
    .from('submission_shares')
    .insert({
      submission_id: id,
      shared_with_id: user_id,
      shared_by_id: user.id,
    });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!userData?.is_admin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  if (!user_id)
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  const { error } = await supabase
    .from('submission_shares')
    .delete()
    .eq('submission_id', id)
    .eq('shared_with_id', user_id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
} 