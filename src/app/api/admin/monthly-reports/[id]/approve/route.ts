import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
        });
    }

    const { id } = await params;
    const { status, comments } = await request.json();

    if (!["approved", "rejected", "submitted", "draft"].includes(status)) {
        return new NextResponse(JSON.stringify({ error: "Invalid status" }), {
            status: 400,
        });
    }

    // Get the report to find the month and user
    const { data: report } = await supabase
        .from("monthly_reports")
        .select("month, user_id")
        .eq("id", id)
        .single();

    if (!report) {
        return new NextResponse(JSON.stringify({ error: "Report not found" }), {
            status: 404,
        });
    }

    // Recalculate hours from actual tasks
    const startDate = new Date(report.month);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const { data: tasks } = await supabase
        .from("daily_tasks")
        .select("hours, billable")
        .eq("user_id", report.user_id)
        .gte("task_date", startDate.toISOString().slice(0, 10))
        .lte("task_date", endDate.toISOString().slice(0, 10));

    const totalHours = tasks?.reduce((sum, task) => sum + (Number(task.hours) || 0), 0) || 0;
    const billableHours = tasks?.filter((task) => task.billable)
        .reduce((sum, task) => sum + (Number(task.hours) || 0), 0) || 0;

    const { data, error } = await supabase
        .from("monthly_reports")
        .update({
            status,
            comments,
            total_hours: totalHours,
            billable_hours: billableHours,
            approved_by: user.id,
            approved_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(`
            *,
            user:users!monthly_reports_user_id_fkey (
                email,
                name
            )
        `)
        .single();

    if (error) {
        console.error("Error updating monthly report:", error);
        return new NextResponse(JSON.stringify({ error: error.message }), {
            status: 500,
        });
    }

    if (["approved", "rejected", "draft"].includes(status) && data) {
        const reportDate = new Date(data.month);
        const monthYear = reportDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        let message = "";
        if (status === "approved") {
            message = `Your ${monthYear} time log has been approved.`;
        } else if (status === "rejected") {
            message = `Your ${monthYear} time log has been rejected.`;
        } else if (status === "draft") {
            message = `Your ${monthYear} time log has been reopened.`;
        }

        const employeeEmail = (data as { user?: { email: string } })?.user?.email;
        const emailPromises = [];

        let htmlBody = `<p>${message}</p>`;
        if (comments) {
            htmlBody += `<p><strong>Comments:</strong> ${comments}</p>`;
        }

        if (employeeEmail) {
            emailPromises.push(sendEmail({
                to: employeeEmail,
                subject: message,
                html: htmlBody
            }));
        }

        if (status === "approved") {
            emailPromises.push(sendEmail({
                to: "hr@coderpush.com",
                subject: message,
                html: htmlBody
            }));
        }

        // Send emails asynchronously without blocking the response
        Promise.allSettled(emailPromises).then((results) => {
            console.log(`Emails for status ${status} processed:`, results.map(r => r.status));
        });
    }

    return NextResponse.json({ report: data });
}
