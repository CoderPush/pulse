import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

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
  const taskData = await request.json();

  // First, get the task to check its date
  const { data: existingTask } = await supabase
    .from("daily_tasks")
    .select("task_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existingTask) {
    return new NextResponse(JSON.stringify({ error: "Task not found" }), {
      status: 404,
    });
  }

  // Check the month of the task (use new date if being updated, otherwise existing)
  const taskMonth = (taskData.task_date || existingTask.task_date).substring(0, 7);

  const { data: report } = await supabase
    .from("monthly_reports")
    .select("status")
    .eq("user_id", user.id)
    .eq("month", `${taskMonth}-01`)
    .single();

  if (report && report.status === "approved") {
    return new NextResponse(
      JSON.stringify({ error: `Cannot update tasks for ${taskMonth}. This month's report has been approved.` }),
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("daily_tasks")
    .update(taskData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating daily task:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return NextResponse.json({ task: data });
}

export async function DELETE(
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

  // First, get the task to check its date
  const { data: existingTask } = await supabase
    .from("daily_tasks")
    .select("task_date")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existingTask) {
    return new NextResponse(JSON.stringify({ error: "Task not found" }), {
      status: 404,
    });
  }

  // Check if the month has an approved report
  const taskMonth = existingTask.task_date.substring(0, 7);

  const { data: report } = await supabase
    .from("monthly_reports")
    .select("status")
    .eq("user_id", user.id)
    .eq("month", `${taskMonth}-01`)
    .single();

  if (report && report.status === "approved") {
    return new NextResponse(
      JSON.stringify({ error: `Cannot delete tasks for ${taskMonth}. This month's report has been approved.` }),
      { status: 403 }
    );
  }

  const { error } = await supabase
    .from("daily_tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting daily task:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new NextResponse(null, { status: 204 });
} 