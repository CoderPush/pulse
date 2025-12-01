import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const { data: tasks, error } = await supabase
    .from("daily_tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("task_date", { ascending: false });

  if (error) {
    console.error("Error fetching daily tasks:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return NextResponse.json({ tasks });
}

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

  const tasks = await request.json();

  type Task = {
    task_date: string;
    project: string;
    bucket: string;
    hours: number;
    description: string;
    link?: string;
    billable?: boolean;
  };

  // Check if any of the tasks belong to an approved month
  const uniqueMonths = [...new Set(tasks.map((task: Task) => task.task_date.substring(0, 7)))];

  for (const month of uniqueMonths) {
    const { data: report } = await supabase
      .from("monthly_reports")
      .select("status")
      .eq("user_id", user.id)
      .eq("month", `${month}-01`)
      .single();

    if (report && (report.status === "approved" || report.status === "submitted")) {
      return new NextResponse(
        JSON.stringify({ error: `Cannot add tasks for ${month}. This month's report has been submitted or approved.` }),
        { status: 403 }
      );
    }
  }

  const tasksWithUserId = tasks.map((task: Task) => ({
    ...task,
    user_id: user.id,
  }));

  const { data, error } = await supabase
    .from("daily_tasks")
    .insert(tasksWithUserId)
    .select();

  if (error) {
    console.error("Error inserting daily tasks:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return NextResponse.json({ tasks: data });
} 