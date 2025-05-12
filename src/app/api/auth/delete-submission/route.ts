import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const email = req.nextUrl.searchParams.get('email');
  const week = req.nextUrl.searchParams.get('week');
  const year = req.nextUrl.searchParams.get('year') || new Date().getFullYear();

  if (!email || !week) {
    return NextResponse.json({ error: 'Missing email or week' }, { status: 400 });
  }

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }
  const user = users.find(u => u.email === email);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Delete submission for user, week, and year
  const { error: deleteError } = await supabase
    .from('submissions')
    .delete()
    .eq('user_id', user.id)
    .eq('week_number', week)
    .eq('year', year);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 