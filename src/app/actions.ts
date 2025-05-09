'use server';

import { createClient } from '@/utils/supabase/server';

export async function getActiveProjects() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (error) throw new Error(error.message);
  return data;
}

export async function getPreviousWeekPrimaryProject(
  userId: string,
  currentWeekNumber: number,
  currentYear: number
): Promise<string | null> {
  if (!userId || !currentWeekNumber || !currentYear) {
    console.warn('getPreviousWeekPrimaryProject: Missing required parameters');
    return null;
  }

  let previousWeekNumber = currentWeekNumber - 1;
  let previousYear = currentYear;

  if (previousWeekNumber === 0) {
    // Rollover to the last week of the previous year (assuming 52 weeks)
    // A more accurate week calculation might be needed if you support ISO weeks or other systems
    previousWeekNumber = 52; 
    previousYear = currentYear - 1;
  }
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('submissions')
      .select('primary_project_name')
      .eq('user_id', userId)
      .eq('week_number', previousWeekNumber)
      .eq('year', previousYear)
      .order('submitted_at', { ascending: false }) // Get the latest if multiple for some reason
      .limit(1)
      .maybeSingle(); // Returns single object or null, doesn't error if not found

    if (error) {
      console.error('Error fetching previous week submission:', error.message);
      return null;
    }

    return data ? data.primary_project_name : null;
  } catch (err) {
    console.error('Unexpected error in getPreviousWeekPrimaryProject:', err);
    return null;
  }
} 