import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(req.url);
  const submission_id = searchParams.get('submission_id');

  if (!submission_id) {
    return NextResponse.json({ error: 'Missing submission_id' }, { status: 400 });
  }

  // Fetch all comments for the submission, ordered by created_at
  const { data, error } = await supabase
    .from('comments')
    .select('*, users:author_id (email)')
    .eq('submission_id', submission_id)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { submission_id, content, parent_id } = body;
  
  // Validate required fields
  if (!submission_id || !content) {
    return NextResponse.json({ error: 'Missing required fields: submission_id and content are required' }, { status: 400 });
  }

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Insert the comment 
  const { data, error } = await supabase
    .from('comments')
    .insert({
      submission_id,
      parent_id: parent_id || null,
      author_id: user.id,
      author_role: 'user',
      content,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Fetch submission and user email for notification
  const { data: submissionData } = await supabase
    .from('submissions')
    .select('id, week_number, year, user_id')
    .eq('id', submission_id)
    .single();

  if (submissionData && submissionData.user_id !== user.id) {
    const { data: originalUser } = await supabase
      .from('users')
      .select('email')
      .eq('id', submissionData.user_id)
      .single();

    if (originalUser && originalUser.email) {
      const week = submissionData.week_number;
      const year = submissionData.year;
      const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/history?week=${week}&year=${year}`;
      const subject = '🌟 New Feedback on Your Weekly Pulse Submission!';
      const html = `
        <div style="font-family: sans-serif;">
          <h2 style="color: #2563eb;">You've got a new comment! 🎉</h2>
          <p style="font-size: 1.1em;">Here's what they said:</p>
          <blockquote style="border-left: 4px solid #2563eb; margin: 1em 0; padding: 0.5em 1em; background: #f0f4ff; color: #222;">
            ${content}
          </blockquote>
          <p style="margin-top: 1.5em;">Keep up the great work! Every bit of feedback is a step forward. 🚀</p>
          <p>
            <a href="${link}" style="display: inline-block; background: #2563eb; color: #fff; padding: 0.75em 1.5em; border-radius: 6px; text-decoration: none; font-weight: bold;">View Conversation</a>
          </p>
          <p style="margin-top: 2em; color: #888; font-size: 0.95em;">You're making progress every week. Let's keep the momentum going!</p>
        </div>
      `;
      // Send email (fire and forget)
      sendEmail({ to: originalUser.email, subject, html });
    }
  }

  return NextResponse.json({ comment: data });
} 