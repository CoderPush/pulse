import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getWeekNumber } from '@/utils/date';

interface Week {
  year: number;
  week_number: number;
  total_submissions: number;
  completion_rate: number;
}

export async function GET() {
  try {
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

    // Get current year and week
    const currentYear = new Date().getFullYear();
    const currentWeek = getWeekNumber();

    // Get all weeks up to current week, without duplicates
    const { data: weeks, error: weeksError } = await supabase
      .from('weeks')
      .select('*')
      .or(`year.lt.${currentYear},and(year.eq.${currentYear},week_number.lte.${currentWeek})`)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(50); // Limit to avoid loading too many weeks

    if (weeksError) throw weeksError;

    // Get submission statistics for each week
    const weeksWithStats = await Promise.all(
      weeks.map(async (week) => {
        const { count: totalSubmissions } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('year', week.year)
          .eq('week_number', week.week_number);

        const { count: totalUsers } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('is_admin', false);

        return {
          ...week,
          total_submissions: totalSubmissions ?? 0,
          completion_rate: totalUsers && totalSubmissions ? totalSubmissions / totalUsers : 0
        };
      })
    );

    // Filter out duplicate weeks (keep only the most recent year's week)
    const uniqueWeeks = weeksWithStats.reduce((acc: Week[], week: Week) => {
      const existingWeek = acc.find((w: Week) => w.week_number === week.week_number);
      if (!existingWeek || existingWeek.year < week.year) {
        if (existingWeek) {
          acc = acc.filter((w: Week) => w.week_number !== week.week_number);
        }
        acc.push(week);
      }
      return acc;
    }, [] as Week[]);

    return NextResponse.json({ weeks: uniqueWeeks });
  } catch (error) {
    console.error('Error in /api/admin/pulses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 