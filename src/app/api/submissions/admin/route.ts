import { NextResponse } from 'next/server';
import { getSubmissions } from '@/lib/storage';
import { Submission } from '@/types/submission';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email') || '';
    const week = searchParams.get('week');
    const status = searchParams.get('status');

    // Get all submissions
    const submissions = await getSubmissions();

    // Filter submissions
    let filteredSubmissions = submissions;

    // Filter by email (case-insensitive)
    if (email) {
      filteredSubmissions = filteredSubmissions.filter((submission: Submission) => 
        submission.email.toLowerCase().includes(email.toLowerCase())
      );
    }

    // Filter by week
    if (week && week !== 'all') {
      filteredSubmissions = filteredSubmissions.filter((submission: Submission) => 
        submission.week_number.toString() === week
      );
    }

    // Filter by status
    if (status && status !== 'all') {
      filteredSubmissions = filteredSubmissions.filter((submission: Submission) => 
        submission.status === status
      );
    }

    // Sort by week number (descending) and then by email
    filteredSubmissions.sort((a: Submission, b: Submission) => {
      if (b.week_number !== a.week_number) {
        return b.week_number - a.week_number;
      }
      return a.email.localeCompare(b.email);
    });

    return NextResponse.json({ 
      success: true, 
      data: filteredSubmissions 
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
} 