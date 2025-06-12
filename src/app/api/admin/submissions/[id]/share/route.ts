import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email';
import { escapeHTML } from '@/lib/utils';
import { getCompanyDomain } from '@/utils/companyDomain';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!userData?.is_admin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { user_id } = await req.json();
  if (!user_id)
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  // Fetch the submission to get the owner and details
  const { data: submission } = await supabase
    .from('submissions')
    .select(`
      *,
      users:user_id (
        email,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (submission?.user_id === user_id) {
    return NextResponse.json({ success: false, message: 'No need to share with the original submitter; they already have access.' }, { status: 200 });
  }

  // Prevent duplicate shares
  const { data: existing } = await supabase
    .from('submission_shares')
    .select('id')
    .eq('submission_id', id)
    .eq('shared_with_id', user_id)
    .single();
  if (existing)
    return NextResponse.json({ error: 'Already shared' }, { status: 409 });

  // Check if the user_id exists in the users table and get their email
  const { data: targetUser, error: userLookupError } = await supabase
    .from('users')
    .select('id, email')
    .eq('id', user_id)
    .single();
  if (userLookupError || !targetUser) {
    return NextResponse.json({ error: 'User does not exist' }, { status: 404 });
  }
  // In production, only allow sharing with company domain emails
  const companyDomain = getCompanyDomain();
  if (
    process.env.NODE_ENV === 'production' &&
    (!targetUser.email || !targetUser.email.endsWith(`@${companyDomain}`))
  ) {
    return NextResponse.json({ error: `Can only share with @${companyDomain} emails in production` }, { status: 403 });
  }

  const { error } = await supabase
    .from('submission_shares')
    .insert({
      submission_id: id,
      shared_with_id: user_id,
      shared_by_id: user.id,
    });
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch the shared user's email and name
  const { data: sharedUser } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', user_id)
    .single();

  // Prepare submission details for the email
  const submissionLink = `${process.env.NEXT_PUBLIC_APP_URL}/submissions/${id}`;
  const submitter = escapeHTML(submission?.users?.email || 'Unknown user');
  const week = submission?.week_number ? `Week ${escapeHTML(String(submission.week_number))}` : '';
  const status = submission?.status ? `<li style="margin-bottom:12px;"><b>Status:</b> ${escapeHTML(submission.status)}</li>` : '';
  const late = submission?.is_late ? `<li style="margin-bottom:12px;"><b>Late:</b> Yes</li>` : '';
  const project = submission?.primary_project_name ? `<li style="margin-bottom:12px;"><b>Primary Project:</b> ${escapeHTML(submission.primary_project_name)} (${escapeHTML(String(submission.primary_project_hours ?? 0))}h)</li>` : '';
  const additionalProjects = submission?.additional_projects && submission.additional_projects.length > 0
    ? `<li style="margin-bottom:12px;"><b>Additional Projects:</b><ul>${submission.additional_projects.map((p: { name: string; hours: number }) => `<li style="margin-bottom:12px;">${escapeHTML(p.name)} (${escapeHTML(String(p.hours))}h)</li>`).join('')}</ul></li>`
    : '';
  const submittedAt = submission?.submitted_at ? `<li style="margin-bottom:12px;"><b>Submitted At:</b> ${escapeHTML(new Date(submission.submitted_at).toLocaleString())}</li>` : '';
  const manager = submission?.manager ? `<li style="margin-bottom:12px;"><b>Manager:</b> ${escapeHTML(submission.manager)}</li>` : '';
  const formTime = submission?.form_completion_time ? `<li style="margin-bottom:12px;"><b>Time to complete:</b> ${escapeHTML(String(submission.form_completion_time))} min</li>` : '';
  const feedback = submission?.feedback ? `<li style="margin-bottom:12px;"><b>Feedback:</b> ${escapeHTML(submission.feedback)}</li>` : '';
  const changes = submission?.changes_next_week ? `<li style="margin-bottom:12px;"><b>Changes Next Week:</b> ${escapeHTML(submission.changes_next_week)}</li>` : '';
  const milestones = submission?.milestones ? `<li style="margin-bottom:12px;"><b>Milestones:</b> ${escapeHTML(submission.milestones)}</li>` : '';
  const otherFeedback = submission?.other_feedback ? `<li style="margin-bottom:12px;"><b>Other Feedback:</b> ${escapeHTML(submission.other_feedback)}</li>` : '';
  const hoursImpact = submission?.hours_reporting_impact ? `<li style="margin-bottom:12px;"><b>Hours Reporting Impact:</b> ${escapeHTML(submission.hours_reporting_impact)}</li>` : '';

  if (process.env.NEXT_PUBLIC_ENABLE_EMAILS === 'true' && sharedUser?.email) {
    await sendEmail({
      to: sharedUser.email,
      subject: 'A weekly pulse has been shared with you',
      html: `
        <div style="background:#f6f8fa;padding:32px 0;">
          <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.06);padding:40px 24px 32px 24px;font-family:system-ui,sans-serif;">
            <div style="text-align:center;margin-bottom:32px;">
              <h2 style="color:#2563eb;font-size:1.5rem;font-weight:800;margin:16px 0 0;">Weekly Pulse Shared With You</h2>
            </div>
            <p style="font-size:1.1rem;color:#334155;margin-bottom:20px;">
              Hello${sharedUser.name ? ` ${escapeHTML(sharedUser.name)}` : ''},
            </p>
            <p style="color:#64748b;margin-bottom:28px;">
              An admin has shared a weekly pulse with you. Here are the details:
            </p>
            <ul style="background:#f1f5f9;border-radius:12px;padding:24px 28px;margin-bottom:32px;list-style:none;">
              <li style="margin-bottom:12px;"><b>Submitted by:</b> ${submitter}</li>
              <li style="margin-bottom:12px;"><b>${week}</b></li>
              ${status}
              ${late}
              ${project}
              ${additionalProjects}
              ${submittedAt}
              ${manager}
              ${formTime}
              ${feedback}
              ${changes}
              ${milestones}
              ${otherFeedback}
              ${hoursImpact}
            </ul>
            <div style="text-align:center;margin-bottom:32px;">
              <a href="${submissionLink}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:1.1rem;box-shadow:0 1px 4px rgba(37,99,235,0.08);transition:background 0.2s;">
                View Pulse
              </a>
            </div>
            <p style="color:#94a3b8;font-size:0.95rem;text-align:center;margin-bottom:0;">
              If you have any questions, please contact your admin.
            </p>
          </div>
        </div>
      `
    });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();
  if (!userData?.is_admin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const user_id = searchParams.get('user_id');
  if (!user_id)
    return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

  const { error } = await supabase
    .from('submission_shares')
    .delete()
    .eq('submission_id', id)
    .eq('shared_with_id', user_id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
} 