import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email';

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const report_id = searchParams.get('report_id');

    if (!report_id) {
        return NextResponse.json({ error: 'Missing report_id' }, { status: 400 });
    }

    // Fetch all comments for the report, ordered by created_at
    const { data, error } = await supabase
        .from('monthly_report_comments')
        .select('*, users:author_id (email)')
        .eq('report_id', report_id)
        .order('created_at', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ comments: data });
}

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const body = await req.json();
    const { report_id, content, parent_id } = body;

    // Validate required fields
    if (!report_id || !content) {
        return NextResponse.json({ error: 'Missing required fields: report_id and content are required' }, { status: 400 });
    }

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    const author_role = userData?.is_admin ? 'admin' : 'user';

    // Insert the comment 
    const { data, error } = await supabase
        .from('monthly_report_comments')
        .insert({
            report_id,
            parent_id: parent_id || null,
            author_id: user.id,
            author_role,
            content,
        })
        .select('*, users:author_id (email)')
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Fetch report and user email for notification
    const { data: reportData } = await supabase
        .from('monthly_reports')
        .select('id, month, user_id')
        .eq('id', report_id)
        .single();

    if (reportData) {
        // Determine who to notify
        let notifyEmail = null;
        let subject = '';
        let messageIntro = '';

        if (author_role === 'admin') {
            // Notify the employee
            const { data: employee } = await supabase
                .from('users')
                .select('email')
                .eq('id', reportData.user_id)
                .single();
            notifyEmail = employee?.email;
            subject = 'New Comment on Your Monthly Report';
            messageIntro = 'An admin has commented on your monthly report.';
        } else {
            // Notify HR/Admin (hardcoded for now as per other files)
            notifyEmail = 'hr@coderpush.com';
            subject = 'New Comment on Monthly Report';
            messageIntro = `Employee has commented on their monthly report.`;
        }

        if (notifyEmail) {
            const reportDate = new Date(reportData.month);
            const monthYear = reportDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/time-approval/${report_id}`; // Adjust link for employee view if different

            const html = `
        <div style="font-family: sans-serif;">
          <h2 style="color: #2563eb;">${subject}</h2>
          <p style="font-size: 1.1em;">${messageIntro}</p>
          <p><strong>Report Month:</strong> ${monthYear}</p>
          <blockquote style="border-left: 4px solid #2563eb; margin: 1em 0; padding: 0.5em 1em; background: #f0f4ff; color: #222;">
            ${content}
          </blockquote>
          <p>
            <a href="${link}" style="display: inline-block; background: #2563eb; color: #fff; padding: 0.75em 1.5em; border-radius: 6px; text-decoration: none; font-weight: bold;">View Conversation</a>
          </p>
        </div>
      `;
            // Send email (fire and forget)
            sendEmail({ to: notifyEmail, subject, html });
        }
    }

    return NextResponse.json({ comment: data });
}
