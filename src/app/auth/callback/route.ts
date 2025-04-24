import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to the form page after successful authentication
      return NextResponse.redirect(new URL('/pulse', request.url));
    }
  }

  // If there's an error or no code, redirect to home
  return NextResponse.redirect(new URL('/', request.url));
} 