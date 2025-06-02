import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Admin authentication/authorization check
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: userData, error: userFetchError } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', authUser.id)
    .single();

  if (userFetchError || !userData?.is_admin) {
    if (userFetchError) {
        console.error('Error fetching user admin status:', userFetchError);
    }
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // End admin check

  const { submissions } = await req.json();
  if (!Array.isArray(submissions)) {
    return NextResponse.json({ error: 'Invalid submissions data' }, { status: 400 });
  }

  let successCount = 0;
  let failCount = 0;
  const errors: { row: unknown; error: string }[] = [];

  for (const row of submissions) {
    try {
      // 1. Lookup user by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', row.email)
        .single();
      if (userError || !user) {
        failCount++;
        errors.push({ row, error: 'User not found' });
        continue;
      }
      // 2. Calculate year (current year)
      const year = new Date().getFullYear();
      // 3. Parse additional_projects (semicolon-separated)
      let additional_projects = [];
      if (row.additional_projects) {
        additional_projects = row.additional_projects.split(';').map((item: string) => {
          const [name, hours] = item.split(':');
          return name && hours ? { name: name.trim(), hours: Number(hours) } : null;
        }).filter(Boolean);
      }
      // 4. Prepare insert object
      const insertObj = {
        user_id: user.id,
        year,
        week_number: row.week_number,
        primary_project_name: row.primary_project_name,
        primary_project_hours: row.primary_project_hours,
        additional_projects,
        manager: row.manager || '',
        feedback: row.feedback || '',
        changes_next_week: row.changes_next_week || '',
        hours_reporting_impact: row.hour_reporting_impact || '',
        form_completion_time: row.form_completion_time ? Number(row.form_completion_time) : null,
        status: 'submitted',
        is_late: false,
        submitted_at: row.submitted_at || new Date().toISOString(),
      };
      // 5. Insert into submissions
      const { error: insertError } = await supabase.from('submissions').insert([insertObj]);
      if (insertError) {
        failCount++;
        errors.push({ row, error: insertError.message });
        continue;
      }
      successCount++;
    } catch (err) {
      failCount++;
      errors.push({ row, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return NextResponse.json({ successCount, failCount, errors });
} 