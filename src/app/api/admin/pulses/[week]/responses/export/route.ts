import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  context: { params: Promise<{ week: string }> }
) {
  try {
    const params = await context.params;
    const weekNumber = Number.parseInt(params.week, 10);
    if (Number.isNaN(weekNumber) || weekNumber <= 0) {
      return NextResponse.json({ error: 'Invalid week parameter' }, { status: 400 });
    }
    const supabase = await createClient();

    // Verify admin status
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data: adminCheck, error: adminError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user?.id)
      .single();

    if (adminError || !adminCheck?.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get all submissions for this week with user information
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        *,
        users:user_id (
          email
        )
      `)
      .eq('week_number', weekNumber)
      .eq('year', new Date().getFullYear())
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Prepare CSV headers (all columns from submissions + user email)
    const headers = [
      'id',
      'user_id',
      'email',
      'year',
      'week_number',
      'primary_project_name',
      'primary_project_hours',
      'additional_projects',
      'manager',
      'feedback',
      'changes_next_week',
      'milestones',
      'other_feedback',
      'hours_reporting_impact',
      'form_completion_time',
      'status',
      'is_late',
      'submitted_at',
      'created_at',
    ];

    // Helper to escape CSV values
    function escapeCSV(val: unknown) {
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return '"' + JSON.stringify(val).replace(/"/g, '""') + '"';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    // Build CSV rows
    const csvRows = [headers.join(',')];
    for (const s of submissions) {
      csvRows.push(headers.map(h => {
        if (h === 'email') return escapeCSV(s.users?.email || '');
        return escapeCSV(s[h]);
      }).join(','));
    }
    const csv = csvRows.join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=\"submissions-week-${weekNumber}.csv\"`,
      },
    });
  } catch (error) {
    console.error('Error in /api/admin/pulses/[week]/responses/export:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 