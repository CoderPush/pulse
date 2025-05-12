'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addProject(formData: FormData) {
  const supabase = await createClient();
  const projectName = formData.get('projectName') as string;

  if (!projectName) {
    return { error: 'Project name is required.' };
  }

  const { error } = await supabase
    .from('projects')
    .insert([{ name: projectName, is_active: true }]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/projects');
  return { success: true };
}

export async function toggleProjectStatus(projectId: string, currentStatus: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('projects')
    .update({ is_active: !currentStatus })
    .eq('id', projectId);

  if (error) {
    return { error: error.message };
  }
  revalidatePath('/admin/projects');
  return { success: true };
}

export async function updateProjectName(projectId: string, newName: string) {
  const supabase = await createClient();
  
  if (!newName.trim()) {
    return { error: 'Project name is required.' };
  }

  const { error } = await supabase
    .from('projects')
    .update({ name: newName })
    .eq('id', projectId);

  if (error) {
    return { error: error.message };
  }
  revalidatePath('/admin/projects');
  return { success: true };
} 