import { NextRequest, NextResponse } from 'next/server';
import { generateAutoLoginToken } from '@/lib/auth/generateAutoLoginToken';

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  try {
    const token = await generateAutoLoginToken(email);
    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to generate token' }, { status: 500 });
  }
} 