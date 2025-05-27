import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email';
import { escapeHTML } from '@/lib/utils';

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
  // In production, only allow sharing with @coderpush.com emails
  if (
    process.env.NODE_ENV === 'production' &&
    (!targetUser.email || !targetUser.email.endsWith('@coderpush.com'))
  ) {
    return NextResponse.json({ error: 'Can only share with @coderpush.com emails in production' }, { status: 403 });
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
  const status = submission?.status ? `<li><b>Status:</b> ${escapeHTML(submission.status)}</li>` : '';
  const late = submission?.is_late ? `<li><b>Late:</b> Yes</li>` : '';
  const project = submission?.primary_project_name ? `<li><b>Primary Project:</b> ${escapeHTML(submission.primary_project_name)} (${escapeHTML(String(submission.primary_project_hours ?? 0))}h)</li>` : '';
  const additionalProjects = submission?.additional_projects && submission.additional_projects.length > 0
    ? `<li><b>Additional Projects:</b><ul>${submission.additional_projects.map((p: { name: string; hours: number }) => `<li>${escapeHTML(p.name)} (${escapeHTML(String(p.hours))}h)</li>`).join('')}</ul></li>`
    : '';
  const submittedAt = submission?.submitted_at ? `<li><b>Submitted At:</b> ${escapeHTML(new Date(submission.submitted_at).toLocaleString())}</li>` : '';
  const manager = submission?.manager ? `<li><b>Manager:</b> ${escapeHTML(submission.manager)}</li>` : '';
  const formTime = submission?.form_completion_time ? `<li><b>Time to complete:</b> ${escapeHTML(String(submission.form_completion_time))} min</li>` : '';
  const feedback = submission?.feedback ? `<li><b>Feedback:</b> ${escapeHTML(submission.feedback)}</li>` : '';
  const changes = submission?.changes_next_week ? `<li><b>Changes Next Week:</b> ${escapeHTML(submission.changes_next_week)}</li>` : '';
  const milestones = submission?.milestones ? `<li><b>Milestones:</b> ${escapeHTML(submission.milestones)}</li>` : '';
  const otherFeedback = submission?.other_feedback ? `<li><b>Other Feedback:</b> ${escapeHTML(submission.other_feedback)}</li>` : '';
  const hoursImpact = submission?.hours_reporting_impact ? `<li><b>Hours Reporting Impact:</b> ${escapeHTML(submission.hours_reporting_impact)}</li>` : '';

  if (sharedUser?.email) {
    await sendEmail({
      to: sharedUser.email,
      subject: 'A submission has been shared with you',
      html: `
        <p>Hello${sharedUser.name ? ` ${escapeHTML(sharedUser.name)}` : ''},</p>
        <p>An admin has shared a submission with you. Here are the details:</p>
        <ul>
          <li><b>Submitted by:</b> ${submitter}</li>
          <li><b>${week}</b></li>
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
        <p>Click the link below to view the submission and add more comments if you want:</p>
        <p><a href="${submissionLink}">${submissionLink}</a></p>
        <p>If you have any questions, please contact your admin.</p>
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