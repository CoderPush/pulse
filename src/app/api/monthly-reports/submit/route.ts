import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { month } = await request.json();

  if (!month) {
    return new NextResponse(JSON.stringify({ error: "Month is required" }), {
      status: 400,
    });
  }

  // Get user details
  const { data: userData } = await supabase
    .from("users")
    .select("name, email")
    .eq("id", user.id)
    .single();

  // Calculate start and end of the month
  const startDate = new Date(month);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

  // Fetch daily tasks for the month to calculate hours
  const { data: tasks, error: tasksError } = await supabase
    .from("daily_tasks")
    .select("hours, billable")
    .eq("user_id", user.id)
    .gte("task_date", startDate.toISOString().slice(0, 10))
    .lte("task_date", endDate.toISOString().slice(0, 10));

  if (tasksError) {
    console.error("Error fetching tasks:", tasksError);
    return new NextResponse(JSON.stringify({ error: tasksError.message }), {
      status: 500,
    });
  }

  const totalHours = tasks.reduce((sum, task) => sum + (Number(task.hours) || 0), 0);
  const billableHours = tasks
    .filter((task) => task.billable)
    .reduce((sum, task) => sum + (Number(task.hours) || 0), 0);

  // Upsert monthly report
  const { data, error } = await supabase
    .from("monthly_reports")
    .upsert(
      {
        user_id: user.id,
        month: startDate.toISOString().slice(0, 10), // Store as YYYY-MM-01
        status: "submitted",
        total_hours: totalHours,
        billable_hours: billableHours,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "user_id, month" }
    )
    .select()
    .single();

  if (error) {
    console.error("Error submitting monthly report:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  // Send email notifications asynchronously (non-blocking)
  sendNotificationEmails(supabase, userData, startDate, totalHours, billableHours).catch(err => {
    console.error("Error sending notification emails:", err);
    // Errors are logged but don't affect the response
  });

  return NextResponse.json({ report: data });
}

// Async function to send notification emails (non-blocking)
async function sendNotificationEmails(
  supabase: any,
  userData: { name: string; email: string } | null,
  startDate: Date,
  totalHours: number,
  billableHours: number
) {
  const { data: admins } = await supabase
    .from("users")
    .select("email, name")
    .eq("is_admin", true)
    .eq("is_active", true);

  if (!admins || admins.length === 0) {
    console.log("No active admins found to send notifications");
    return;
  }

  const monthName = startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const engineerName = userData?.name || userData?.email || "Unknown User";

  const subject = `Time Log Submitted: ${engineerName} - ${monthName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Time Log Submission</h2>
      <p><strong>${engineerName}</strong> submitted ${monthName} time log for review.</p>
      
      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Total Hours:</strong> ${totalHours.toFixed(1)}h</p>
        <p style="margin: 5px 0;"><strong>Billable Hours:</strong> ${billableHours.toFixed(1)}h</p>
        <p style="margin: 5px 0;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p>Please review and approve the time log in the admin panel.</p>
      
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/time-approval" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Review Time Log
      </a>
    </div>
  `;

  // Send emails to all admins in parallel
  const emailPromises = admins.map((admin: { email: string; name: string }) =>
    sendEmail({
      to: admin.email,
      subject,
      html,
    })
      .then(() => console.log(`Email sent to admin: ${admin.email}`))
      .catch(err => console.error(`Failed to send email to ${admin.email}:`, err))
  );

  await Promise.allSettled(emailPromises);
}
