import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PulsesClient, { PulseWeek } from './PulsesClient';
import { getWeekNumber } from '@/lib/utils/date';

export const dynamic = 'force-dynamic';

export default async function PulsesPage() {
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
    .limit(50);

  if (weeksError) {
    console.error('Error fetching weeks:', weeksError);
    return <div>Error loading pulse weeks. Please try again later.</div>;
  }

  // Fetch totalUsers once
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_admin', false);

  // Get submission statistics for each week
  // Note: In a Server Component, we can use Promise.all just like in the API route
  const weeksWithStats = await Promise.all(
    (weeks || []).map(async (week) => {
      const { count: totalSubmissions } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('year', week.year)
        .eq('week_number', week.week_number);

      return {
        ...week,
        total_submissions: totalSubmissions ?? 0,
        completion_rate: totalUsers ? (totalSubmissions ?? 0) / totalUsers : 0
      };
    })
  );

  // Filter out duplicate weeks (keep only the most recent year's week)
  // The logic from route.ts seems to try to handle if multiple entries exist for same week number but different years?
  // Actually the query sorts by year desc, so we should see 2025 week 1 before 2024 week 1.
  // The logic in route.ts:
  /*
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
  */
  // Wait, if we have 2025 week 1 and 2024 week 1, we want BOTH if they are different weeks in time.
  // But the logic seems to be deduplicating by `week_number` only? That seems wrong if we span multiple years.
  // If `week_number` is 1-52, then 2025-W1 and 2024-W1 are different.
  // However, maybe the `weeks` table structure implies something else.
  // I will copy the logic exactly as it was in route.ts to avoid breaking existing behavior, 
  // but it looks like it might be hiding past years' same week numbers.
  // Actually, looking at the logic: `if (!existingWeek || existingWeek.year < week.year)`
  // If we have 2025-W1, and then encounter 2024-W1.
  // 1. Process 2025-W1. `existingWeek` (by week_number 1) is undefined. Push 2025-W1.
  // 2. Process 2024-W1. `existingWeek` is 2025-W1. `existingWeek.year (2025) < week.year (2024)` is FALSE.
  // So 2024-W1 is ignored.
  // This means it ONLY shows one entry per week number (1-52), preferring the latest year.
  // This seems to be the intended behavior (maybe "Pulse Forms" are defined by week number templates?).
  // I will preserve this logic.

  const uniqueWeeks = weeksWithStats.reduce((acc: PulseWeek[], week: PulseWeek) => {
    const existingWeek = acc.find((w: PulseWeek) => w.week_number === week.week_number);
    if (!existingWeek || existingWeek.year < week.year) {
      if (existingWeek) {
        // Remove the older one (though with sorted input, we should see newer first)
        // If we see newer first (2025), then older (2024) comes later.
        // If existing is 2025, and current is 2024. 2025 < 2024 is false. We keep 2025.
        // So we just don't add 2024.
        // If we saw 2024 first, then 2025. 2024 < 2025 is true. We remove 2024 and add 2025.
        // Since we sort by year DESC, we see 2025 first.
        // So effectively we just take the first occurrence of each week_number.
        // But I'll stick to the reduce logic to be safe.
        // Actually, `acc = acc.filter(...)` reassigns acc which is not allowed in reduce if acc is the accumulator argument?
        // Wait, `acc` is the accumulator. We can modify it if it's an array (push), but `acc = ...` only changes the local variable reference, not the accumulator for next iteration unless we return it.
        // The code in route.ts was:
        /*
          const uniqueWeeks = weeksWithStats.reduce((acc: Week[], week: Week) => {
             // ...
             return acc;
          }, []);
        */
        // If they did `acc = acc.filter(...)`, that works because they return `acc` at the end.
        // But `acc` is an argument. Reassigning it is fine in JS/TS.

        // Let's copy the logic carefully.
        acc = acc.filter((w: PulseWeek) => w.week_number !== week.week_number);
      }
      acc.push(week);
    }
    return acc;
  }, [] as PulseWeek[]);

  return <PulsesClient initialWeeks={uniqueWeeks as PulseWeek[]} />;
}