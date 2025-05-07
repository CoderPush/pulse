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