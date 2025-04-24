import { NextResponse } from 'next/server';
import { getUserSubmissions } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const submissions = await getUserSubmissions(email);
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error getting submissions:', error);
    return NextResponse.json(
      { error: 'Failed to get submissions' },
      { status: 500 }
    );
  }
} 