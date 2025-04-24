import { NextResponse } from 'next/server';
import { saveSubmission, getSubmissions, getSubmissionsByWeek } from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submission = await saveSubmission({
      ...body,
      status: 'submitted',
    });
    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error saving submission:', error);
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('week');
    
    if (weekNumber) {
      const submissions = await getSubmissionsByWeek(Number(weekNumber));
      return NextResponse.json(submissions);
    }
    
    const submissions = await getSubmissions();
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error getting submissions:', error);
    return NextResponse.json(
      { error: 'Failed to get submissions' },
      { status: 500 }
    );
  }
} 