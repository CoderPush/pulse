import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    // TODO: Add robust admin check here. For now, we rely on the fact that this is an admin route
    // and we might want to restrict it further if we had a role system.

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const status = searchParams.get("status");
    const id = searchParams.get("id");

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

    if (id) {
        query = query.eq("id", id);
    }

    if (month) {
        query = query.eq("month", month);
    }

    if (status) {
        query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching monthly reports:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }

    if (!data || data.length === 0) {
        return NextResponse.json({ reports: [] });
    }

    // Optimize: Fetch all tasks for all reports in a single query instead of N+1 queries
    // Collect all unique user_ids and date ranges
    const userIds = [...new Set(data.map((report) => report.user_id))];
    const dateRanges = data.map((report) => {
        const startDate = report.month;
        const endDate = new Date(report.month);
        endDate.setMonth(endDate.getMonth() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];
        return { startDate, endDateStr, user_id: report.user_id, month: report.month };
    });

    // Find the overall date range to optimize the query
    const allStartDates = dateRanges.map((r) => r.startDate);
    const allEndDates = dateRanges.map((r) => r.endDateStr);
    const minDate = allStartDates.sort()[0];
    const maxDate = allEndDates.sort().reverse()[0];

    // Fetch all tasks for all users in the date range in a single query
    const { data: allTasks, error: tasksError } = await supabase
        .from("daily_tasks")
        .select("user_id, task_date, hours, billable")
        .in("user_id", userIds)
        .gte("task_date", minDate)
        .lt("task_date", maxDate);

    if (tasksError) {
        console.error("Error fetching tasks:", tasksError);
        // Fallback to using stored values if task fetch fails
        return NextResponse.json({ reports: data });
    }

    // Group tasks by user_id and month for efficient lookup
    // Create a map of date ranges keyed by user_id for O(1) lookup
    const dateRangesByUser = new Map<string, Array<{ startDate: string; endDateStr: string; month: string }>>();
    dateRanges.forEach((range) => {
        if (!dateRangesByUser.has(range.user_id)) {
            dateRangesByUser.set(range.user_id, []);
        }
        dateRangesByUser.get(range.user_id)!.push(range);
    });

    const tasksByUserAndMonth = new Map<string, Array<{ hours: number; billable: boolean }>>();
    
    (allTasks || []).forEach((task) => {
        // Find which report(s) this task belongs to for this user
        const userRanges = dateRangesByUser.get(task.user_id);
        if (!userRanges) return;

        userRanges.forEach((range) => {
            if (task.task_date >= range.startDate && task.task_date < range.endDateStr) {
                const key = `${task.user_id}_${range.month}`;
                if (!tasksByUserAndMonth.has(key)) {
                    tasksByUserAndMonth.set(key, []);
                }
                tasksByUserAndMonth.get(key)!.push({
                    hours: task.hours || 0,
                    billable: task.billable ?? true,
                });
            }
        });
    });

    // Calculate hours for each report using the pre-grouped tasks
    const reportsWithCalculatedHours = data.map((report) => {
        const key = `${report.user_id}_${report.month}`;
        const tasks = tasksByUserAndMonth.get(key) || [];

        const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
        const billableHours = tasks.reduce((sum, task) => {
            return sum + (task.billable ? task.hours : 0);
        }, 0);

        return {
            ...report,
            total_hours: totalHours,
            billable_hours: billableHours,
        };
    });

    return NextResponse.json({ reports: reportsWithCalculatedHours });
}
