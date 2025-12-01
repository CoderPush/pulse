import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getHREmail } from "@/utils/companyDomain";

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
    const { status } = await request.json();

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
        
        // Get the manager email from the user's profile
        const { data: userProfile } = await supabase
            .from("users")
            .select("manager_email")
            .eq("id", report.user_id)
            .single();

        const managerEmail = userProfile?.manager_email?.trim();

        // Build list of email recipients
        const recipients: string[] = [];
        if (employeeEmail) {
            recipients.push(employeeEmail);
        }
        if (managerEmail) {
            recipients.push(managerEmail);
        }
        // Send to HR for both approved and rejected statuses
        if (status === "approved" || status === "rejected") {
            recipients.push(getHREmail());
        }

        if (recipients.length === 0) {
            console.log("No recipients found for email notification");
            return NextResponse.json({ report: data });
        }

        let htmlBody = `<p>${message}</p>`;

        // Add link to view report and comments
        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/time-approval/${id}`;
        htmlBody += `<p><a href="${link}">View Report and Comments</a></p>`;

        // Send emails sequentially with delay to respect rate limits (2 requests/second)
        // Add 600ms delay between emails to stay under the limit
        // Use async IIFE to avoid blocking the response
        (async () => {
            for (let i = 0; i < recipients.length; i++) {
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 600));
                }
                const recipient = recipients[i];
                try {
                    await sendEmail({
                        to: recipient,
                        subject: message,
                        html: htmlBody
                    });
                    console.log(`Email sent to ${recipient}`);
                } catch (err) {
                    console.error(`Failed to send email to ${recipient}:`, err);
                }
            }
            console.log(`Emails for status ${status} processed`);
        })();
    }

    return NextResponse.json({ report: data });
}
