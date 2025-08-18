import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  // Get task ID from params
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  // Get request body
  const { billable } = await request.json();
  if (typeof billable !== 'boolean') {
    return NextResponse.json({ error: 'Billable field must be a boolean' }, { status: 400 });
  }

  // Update the task's billable field
  const { data: updatedTask, error } = await supabase
    .from('daily_tasks')
    .update({ billable })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating daily task billable field:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    message: 'Task billable status updated successfully',
    task: updatedTask 
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  
  // Get the authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  // Get task ID from params
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
  }

  // Get the task's current billable status
  const { data: task, error } = await supabase
    .from('daily_tasks')
    .select('id, billable')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching daily task billable status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task });
} 