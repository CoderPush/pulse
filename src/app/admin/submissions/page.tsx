import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SubmissionsClient, { WeekOption } from './SubmissionsClient';
import { getMostRecentThursdayWeek, getWeekNumber } from '@/lib/utils/date';
import { WeeklyPulseSubmission } from '@/types/weekly-pulse';

export const dynamic = 'force-dynamic';

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!userData?.is_admin) {
    redirect('/');
  }

  // --- Fetch Weeks (Pulses) ---
  const currentYear = new Date().getFullYear();
  const currentWeek = getWeekNumber();

  // Get all weeks up to current week, without duplicates
  const { data: weeksData, error: weeksError } = await supabase
    .from('weeks')
    .select('*')
    .or(`year.lt.${currentYear},and(year.eq.${currentYear},week_number.lte.${currentWeek})`)
    .order('year', { ascending: false })
    .order('week_number', { ascending: false })
    .limit(50);

  if (weeksError) {
    console.error('Error fetching weeks:', weeksError);
    return <div>Error loading weeks. Please try again later.</div>;
  }

  // Deduplicate weeks (logic from pulses route)
  // We only need basic week info for the dropdown
  interface WeekData {
    week_number: number;
    year: number;
  }

  const uniqueWeeks = (weeksData || []).reduce((acc: WeekData[], week: WeekData) => {
    const existingWeek = acc.find((w) => w.week_number === week.week_number);
    if (!existingWeek || existingWeek.year < week.year) {
      if (existingWeek) {
        acc = acc.filter((w) => w.week_number !== week.week_number);
      }
      acc.push(week);
    }
    return acc;
  }, []);

  const weekOptions: WeekOption[] = uniqueWeeks.map((w: WeekData) => ({
    value: `${w.year}-${w.week_number}`,
    label: `Week ${w.week_number} - ${w.year}`,
    week_number: w.week_number,
    year: w.year,
  }));

  // --- Determine Default Week/Year ---
  const params = await searchParams;
  const weekParam = params.week as string | undefined;
  const yearParam = params.year as string | undefined;
  const emailParam = params.email as string | undefined;

  let selectedWeek: number;
  let selectedYear: number;

  if (weekParam && yearParam) {
    selectedWeek = Number(weekParam);
    selectedYear = Number(yearParam);
  } else {
    // Default logic
    const recentThursdayWeek = getMostRecentThursdayWeek();
    // Check if we have this week in our options
    const found = weekOptions.find(w => w.week_number === recentThursdayWeek && w.year === currentYear);
    if (found) {
      selectedWeek = found.week_number;
      selectedYear = found.year;
    } else if (weekOptions.length > 0) {
      selectedWeek = weekOptions[0].week_number;
      selectedYear = weekOptions[0].year;
    } else {
      selectedWeek = recentThursdayWeek;
      selectedYear = currentYear;
    }
  }

  // --- Fetch Submissions ---
  let query = supabase
    .from('submissions')
    .select(`
      *,
      users:user_id (
        email
      )
    `)
    .order('submitted_at', { ascending: false });

  // Apply filters
  if (emailParam) {
    const { data: usersData } = await supabase
      .from('users')
      .select('id')
      .ilike('email', `%${emailParam}%`);

    if (!usersData || usersData.length === 0) {
      // No users found, return empty
      // We can just set query to return nothing or handle it
      // Let's just return empty array immediately
    } else {
      const userIds = usersData.map(user => user.id);
      query = query.in('user_id', userIds);
    }
  }

  query = query.eq('week_number', selectedWeek).eq('year', selectedYear);

  const { data: submissions, error: submissionsError } = await query;

  let transformedSubmissions: WeeklyPulseSubmission[] = [];

  if (submissionsError) {
    console.error('Error fetching submissions:', submissionsError);
    // Continue with empty submissions
  } else if (submissions) {
    // Transform data
    interface SubmissionData {
      id: string;
      user_id: string;
      users?: { email?: string };
      week_number: number;
      is_late: boolean;
      submitted_at: string;
      created_at: string;
      manager: string | null;
      primary_project_name: string;
      primary_project_hours: number;
      additional_projects: unknown;
      feedback: string | null;
      changes_next_week: string | null;
      milestones: string | null;
      other_feedback: string | null;
      hours_reporting_impact: string | null;
      form_completion_time: number | null;
    }

    transformedSubmissions = submissions.map((submission: SubmissionData) => ({
      id: submission.id,
      user_id: submission.user_id,
      email: submission.users?.email || 'Unknown',
      week_number: submission.week_number,
      status: submission.is_late ? 'Late' : 'On Time',
      submission_at: submission.submitted_at,
      created_at: submission.created_at,
      manager: submission.manager || '',
      primary_project: {
        name: submission.primary_project_name,
        hours: submission.primary_project_hours
      },
      additional_projects: Array.isArray(submission.additional_projects) ? submission.additional_projects : [],
      feedback: submission.feedback || undefined,
      changes_next_week: submission.changes_next_week || undefined,
      milestones: submission.milestones || undefined,
      other_feedback: submission.other_feedback || undefined,
      hours_reporting_impact: submission.hours_reporting_impact || undefined,
      form_completion_time: submission.form_completion_time || undefined
    }));
  }

  return (
    <SubmissionsClient
      initialWeeks={weekOptions}
      initialSubmissions={transformedSubmissions}
      defaultWeek={selectedWeek}
      defaultYear={selectedYear}
    />
  );
}