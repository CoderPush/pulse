import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
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

  const { data, error } = await supabase
    .from('submission_shares')
    .select('shared_with_id, users:shared_with_id (id, name, email)')
    .eq('submission_id', id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const users = (data || [])
    .map(row => row.users)
    .filter(u => Boolean(u));

  return NextResponse.json({ users });
} 