import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = 'email' as const;
  const next = searchParams.get('next') ?? '/';

  if (!token_hash) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash,
  });

  if (error) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
} 