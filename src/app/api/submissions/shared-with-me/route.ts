import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse pagination params
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  // Single join query to get shared submissions and user info
  const { data, error } = await supabase
    .from('submission_shares')
    .select(`
      submission:submissions (
        *,
        users:user_id (
          email,
          name
        )
      )
    `)
    .eq('shared_with_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten the result to just the submissions array
  const submissions = (data || []).map((row) => row.submission);

  return NextResponse.json({ submissions });
}
