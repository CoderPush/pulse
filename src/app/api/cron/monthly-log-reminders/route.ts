import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
    // Authenticate using CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // 1. Calculate Month and Deadline
    const now = new Date();
    // Assuming this runs at the end of the month (e.g., 28th-31st) or very beginning of next.
    // We want to remind for the "current" month if it's late in the month, or "previous" if it's early.
    // However, the prompt implies "End of month" trigger.
    // Let's assume it runs on the last day of the month.

    // Logic: 
    // If today is day > 20, we are reminding for THIS month.
    // If today is day <= 20, we are reminding for LAST month.

    const targetDate = new Date(now);
    if (now.getDate() <= 20) {
        // Go back to last month
        targetDate.setMonth(now.getMonth() - 1);
    }

    const monthName = targetDate.toLocaleString('default', { month: 'long' });

    // Deadline is "Oct 2" (Next Month 2nd)
    const nextMonthDate = new Date(targetDate);
    nextMonthDate.setMonth(targetDate.getMonth() + 1);
    const nextMonthName = nextMonthDate.toLocaleString('default', { month: 'short' }); // "Oct"
    const deadlineDate = `${nextMonthName} 2`;

    // 2. Get all users who want daily reminders (as requested)
    const { data: usersToRemind, error: usersError } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('wants_daily_reminders', true);

    if (usersError || !usersToRemind) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!usersToRemind.length) {
        return NextResponse.json({ message: 'No users to remind' });
    }

    // 3. Call the reminder API for each user with a delay
    const results = [];
    let hasSuccess = false;

    for (const user of usersToRemind) {
        const remindRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/monthly-reports/remind`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            },
            body: JSON.stringify({
                userId: user.id,
                monthName,
                deadlineDate
            })
        });

        let remindJson;
        const contentType = remindRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            remindJson = await remindRes.json();
        } else {
            const text = await remindRes.text();
            remindJson = { error: text, status: remindRes.status };
        }

        if (remindRes.status === 200) {
            hasSuccess = true;
        }

        results.push({ userId: user.id, response: remindJson, status: remindRes.status });

        // 500ms delay to be safe
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    return NextResponse.json({
        meta: {
            targetMonth: monthName,
            deadline: deadlineDate,
            userCount: usersToRemind.length
        },
        results
    }, { status: hasSuccess ? 200 : 500 });
}
