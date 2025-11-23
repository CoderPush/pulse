import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import TimeApprovalClient, { MonthlyReport } from './TimeApprovalClient';

export const dynamic = 'force-dynamic';

export default async function TimeApprovalPage({
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
    // TODO: Add robust admin check here. For now, we rely on the fact that this is an admin route
    // and we might want to restrict it further if we had a role system.
    // Actually, let's do the same check as other admin pages for consistency
    const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!userData?.is_admin) {
        redirect('/');
    }

    const params = await searchParams;
    const monthParam = params.month as string | undefined;

    // Default to current month
    const now = new Date();
    const defaultMonth = monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    let query = supabase
        .from("monthly_reports")
        .select(`
      *,
      user:users!monthly_reports_user_id_fkey (
        email,
        name
      )
    `)
        .order("submitted_at", { ascending: false });

    if (defaultMonth) {
        query = query.eq("month", defaultMonth);
    }

    const { data: reports, error } = await query;

    if (error) {
        console.error("Error fetching monthly reports:", error);
        return <div>Error loading reports. Please try again later.</div>;
    }

    return <TimeApprovalClient initialReports={reports as MonthlyReport[] || []} defaultMonth={defaultMonth} />;
}
