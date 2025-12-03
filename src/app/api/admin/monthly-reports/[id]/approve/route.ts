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

        // Query employee information directly from users table
        const { data: employeeData } = await supabase
            .from("users")
            .select("email, name, manager_email")
            .eq("id", report.user_id)
            .single();

        const employeeEmail = employeeData?.email;
        const employeeName = employeeData?.name || employeeEmail || "Unknown Employee";
        const managerEmail = employeeData?.manager_email?.trim();

        // Query approver information
        const { data: approverData } = await supabase
            .from("users")
            .select("email, name")
            .eq("id", user.id)
            .single();

        const approverName = approverData?.name || approverData?.email || "Admin";
        const approvedAt = new Date(data.approved_at || new Date().toISOString());
        const approvedAtFormatted = approvedAt.toLocaleString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

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

        // Build subject line
        let subject = "";
        if (status === "approved") {
            subject = `Monthly Report Approved: ${employeeName} - ${monthYear}`;
        } else if (status === "rejected") {
            subject = `Monthly Report Rejected: ${employeeName} - ${monthYear}`;
        } else if (status === "draft") {
            subject = `Monthly Report Reopened: ${employeeName} - ${monthYear}`;
        }

        // Build detailed email body
        let statusMessage = "";
        if (status === "approved") {
            statusMessage = `Your ${monthYear} time log has been approved.`;
        } else if (status === "rejected") {
            statusMessage = `Your ${monthYear} time log has been rejected.`;
        } else if (status === "draft") {
            statusMessage = `Your ${monthYear} time log has been reopened.`;
        }

        const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/time-approval/${id}`;
        
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Monthly Report ${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Reopened"}</h2>
                <p style="font-size: 1.1em;">${statusMessage}</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Employee:</strong> ${employeeName}</p>
                    <p style="margin: 5px 0;"><strong>Report Period:</strong> ${monthYear}</p>
                    <p style="margin: 5px 0;"><strong>Total Hours:</strong> ${totalHours.toFixed(1)}h</p>
                    <p style="margin: 5px 0;"><strong>Billable Hours:</strong> ${billableHours.toFixed(1)}h</p>
                    <p style="margin: 5px 0;"><strong>Approved By:</strong> ${approverName}</p>
                    <p style="margin: 5px 0;"><strong>Approved At:</strong> ${approvedAtFormatted}</p>
                </div>
                
            </div>
        `;

        // Send single email with all recipients
        (async () => {
            try {
                await sendEmail({
                    to: recipients,
                    subject: subject,
                    html: htmlBody
                });
                console.log(`Email sent to recipients: ${recipients.join(', ')}`);
            } catch (err) {
                console.error(`Failed to send email:`, err);
            }
        })();
    }

    return NextResponse.json({ report: data });
}
