import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AdminUsersClient, { User } from './AdminUsersClient';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
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

  // Fetch all users
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    // In a real app, you might want to render an error component
    return <div>Error loading users. Please try again later.</div>;
  }

  return <AdminUsersClient initialUsers={(users as User[]) || []} />;
}