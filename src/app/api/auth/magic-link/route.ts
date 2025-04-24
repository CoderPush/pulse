import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        // Prevent automatic user creation
        shouldCreateUser: false,
      },
    });

    if (error) {
      console.error('Error sending magic link:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to send magic link' },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in magic link endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 