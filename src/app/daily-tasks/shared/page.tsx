import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import DashboardSummary from "@/app/(authenticated)/daily-tasks/dashboard/DashboardSummary";
import { decodeUserId } from "@/lib/utils/string";

interface SharedPageProps {
  searchParams: Promise<{ type?: string; value?: string; token?: string }>;
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default async function SharedDailyTasksPage({ searchParams }: SharedPageProps) {
  const { type, value, token } = await searchParams;

  if (!type || !value || !token) {
    notFound();
  }

  const filterType = type as 'week' | 'month';
  const filterValue = decodeURIComponent(value);
  
  // Decode the user ID from the URL parameter
  let userId: string;
  try {
    userId = decodeUserId(decodeURIComponent(token));
  } catch {
    notFound();
  }

  // Validate that the decoded user ID is a valid UUID
  if (!isValidUUID(userId)) {
    notFound();
  }

  const supabase = await createClient();

  // First, check if the user exists
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", userId)
    .single();

  if (userError || !userData) {
    notFound();
  }

  // Get the tasks for the specified user with the specified filter
  let query = supabase
    .from("daily_tasks")
    .select(`
      *,
      user:users(name, email)
    `)
    .eq("user_id", userId)
    .order("task_date", { ascending: false });

  if (filterType === 'week' && filterValue) {
    const [year, weekNum] = filterValue.split('-W');
    const firstDay = getDateOfISOWeek(Number(weekNum), Number(year));
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    query = query.gte('task_date', firstDay.toISOString().slice(0, 10)).lte('task_date', lastDay.toISOString().slice(0, 10));
  } else if (filterType === 'month' && filterValue) {
    const [year, monthNum] = filterValue.split('-');
    const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
    query = query.gte('task_date', `${filterValue}-01`).lte('task_date', `${filterValue}-${String(lastDay).padStart(2, '0')}`);
  }

  const { data: tasks, error: tasksError } = await query;

  // If no tasks found or error, show not found
  if (tasksError || !tasks || tasks.length === 0) {
    notFound();
  }

  // Convert tasks to the format expected by DashboardSummary
  const forms = tasks.map(task => ({
    form: {
      id: task.id,
      date: task.task_date,
      project: task.project,
      bucket: task.bucket,
      hours: String(task.hours),
      description: task.description,
      link: task.link || '',
    },
    questions: [], // Empty questions array since we don't need them for display
  }));

  const userName = tasks[0]?.user?.name || tasks[0]?.user?.email || 'Unknown User';
  const filterDisplay = filterType === 'week' 
    ? `Week ${filterValue.split('-W')[1]} of ${filterValue.split('-W')[0]}`
    : `${filterValue.split('-')[1]}/${filterValue.split('-')[0]}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Daily Tasks Report
          </h1>
          <p className="text-gray-600 mb-1">
            Shared by: <span className="font-medium">{userName}</span>
          </p>
          <p className="text-gray-600 mb-4">
            Period: <span className="font-medium">{filterDisplay}</span>
          </p>
        </div>

        <DashboardSummary 
          forms={forms}
          filterType={filterType}
          filterValue={filterValue}
          showActions={false}
        />
      </div>
    </div>
  );
}

// Helper function to get date of ISO week
function getDateOfISOWeek(week: number, year: number) {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simple.getDay();
  const ISOweekStart = simple;
  if (dayOfWeek <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
} 