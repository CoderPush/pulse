import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getHREmail } from "@/utils/companyDomain";

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

  // Fetch daily tasks for the month to calculate hours and generate CSV
  const { data: tasks, error: tasksError } = await supabase
    .from("daily_tasks")
    .select("task_date, project, hours, billable, description, link")
    .eq("user_id", user.id)
    .gte("task_date", startDate.toISOString().slice(0, 10))
    .lte("task_date", endDate.toISOString().slice(0, 10))
    .order("task_date", { ascending: true });

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
  sendNotificationEmails(supabase, userData, user.id, startDate, totalHours, billableHours, tasks || []).catch(err => {
    console.error("Error sending notification emails:", err);
    // Errors are logged but don't affect the response
  });

  return NextResponse.json({ report: data });
}

// Helper function to format date as DD-MM-YYYY
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper function to escape CSV field (handles commas, quotes, newlines)
function escapeCSVField(field: string): string {
  if (!field) return '';
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

// Helper function to generate CSV from daily tasks with Option 2 format
function generateTasksCSV(
  tasks: Array<{ task_date: string; project: string | null; hours: number | null; billable: boolean | null; description: string | null; link: string | null }>,
  userName: string,
  monthName: string,
  totalHours: number,
  billableHours: number
): string {
  // Build metadata section
  const metadataSection = [
    '=== REPORT INFORMATION ===',
    `Employee Name,${escapeCSVField(userName)}`,
    `Report Month,${escapeCSVField(monthName)}`,
    `Total Hours,${totalHours.toFixed(2)}`,
    `Billable Hours,${billableHours.toFixed(2)}`,
    '', // Empty row to separate sections
    '=== TASK DETAILS ===',
  ];

  // Build task details section
  const headers = ['Date', 'Project', 'Hours', 'Billable', 'Description', 'Link'];
  const rows = tasks.map(task => {
    const date = formatDate(task.task_date);
    const project = escapeCSVField(task.project || '');
    const hours = task.hours ? task.hours.toFixed(2) : '0.00';
    const billable = task.billable ? 'Yes' : 'No';
    const description = escapeCSVField(task.description || '');
    const link = escapeCSVField(task.link || '');
    return [date, project, hours, billable, description, link];
  });

  const csvContent = [...metadataSection, headers, ...rows]
    .map(row => Array.isArray(row) ? row.join(',') : row)
    .join('\n');

  return csvContent;
}

// Async function to send notification emails (non-blocking)
async function sendNotificationEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userData: { name: string; email: string } | null,
  userId: string,
  startDate: Date,
  totalHours: number,
  billableHours: number,
  tasks: Array<{ task_date: string; project: string | null; hours: number | null; billable: boolean | null; description: string | null; link: string | null }>
) {
  // Get the manager email from the user's profile
  const { data: userProfile } = await supabase
    .from("users")
    .select("manager_email")
    .eq("id", userId)
    .single();

  const managerEmail = userProfile?.manager_email?.trim();
  const userEmail = userData?.email;

  if (!userEmail) {
    console.log("No user email found, skipping email notification");
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
      ${tasks.length > 0 ? '<p>A detailed task log CSV file is attached to this email.</p>' : ''}
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/time-approval" 
         style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
        Review Time Log
      </a>
    </div>
  `;

  // Generate CSV attachment if tasks exist
  const monthStr = String(startDate.getMonth() + 1).padStart(2, '0');
  const yearStr = String(startDate.getFullYear());
  const userNameSlug = (userData?.name || 'user').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const attachments = tasks.length > 0 ? [{
    filename: `${yearStr}-${monthStr}-${userNameSlug}-tasks.csv`,
    content: Buffer.from(generateTasksCSV(tasks, engineerName, monthName, totalHours, billableHours), 'utf-8'),
    contentType: 'text/csv',
  }] : undefined;

  // Build list of email recipients
  const recipients: string[] = [userEmail];
  if (managerEmail) {
    recipients.push(managerEmail);
  }
  recipients.push(getHREmail());

  // Send single email with all recipients
  sendEmail({
    to: recipients,
    subject,
    html,
    attachments,
  })
    .then(() => console.log(`Email sent to recipients: ${recipients.join(', ')}`))
    .catch(err => console.error(`Failed to send email to recipients:`, err));
}
