import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
export async function GET() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Query submission_shares for submissions shared with this user
  const { data: shares, error: sharesError } = await supabase
    .from('submission_shares')
    .select('submission_id')
    .eq('shared_with_id', user.id);

  if (sharesError) {
    return NextResponse.json({ error: sharesError.message }, { status: 500 });
  }

  const submissionIds = shares.map((s) => s.submission_id);

  if (submissionIds.length === 0) {
    return NextResponse.json({ submissions: [] });
  }

  // Fetch submission details and join with users table for email
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select(`
      *,
      users:user_id (
        email,
        name
      )
    `)
    .in('id', submissionIds)
    .order('submitted_at', { ascending: false });

  if (submissionsError) {
    return NextResponse.json({ error: submissionsError.message }, { status: 500 });
  }

  return NextResponse.json({ submissions });
}
