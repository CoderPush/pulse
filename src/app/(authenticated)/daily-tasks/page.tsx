"use client";
import { useState, useEffect, useRef } from "react";
import ParseTab from "./parse/ParseTab";
import ReviewSubmitTab from "./review-submit/ReviewSubmitTab";
import ReviewTab from "./review/ReviewTab";
import type { Question } from '@/types/followup';
import DailyPulseTabs from "./DailyPulseTabs";

// Define the Task type to match our database schema
export interface Task {
  id: string;
  user_id: string;
  task_date: string;
  project: string;
  bucket: string;
  hours: number;
  description: string;
  created_at: string;
  link?: string;
  billable?: boolean;
}

export default function AiDemoPage() {
  // Helper to get current week in yyyy-Wxx format for <input type="week">
  function getCurrentWeek() {
    const now = new Date();
    const year = now.getFullYear();
    // Get ISO week number
    const jan4 = new Date(year, 0, 4);
    const dayOfYear = ((now.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1;
    const week = Math.ceil((dayOfYear + jan4.getDay() - 1) / 7);
    // Pad week to 2 digits
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  // Helper to get current month in yyyy-MM format for <input type="month">
  function getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  }

  const demoQuestions: Question[] = [
    { id: "date", title: "Date", type: "date", required: true },
    { id: "project", title: "Project", type: "text", required: true },
    { id: "bucket", title: "Bucket/Tag", type: "text", required: false },
    { id: "hours", title: "Hours", type: "text", required: true },
    { id: "description", title: "Task Description", type: "textarea", required: true }
  ];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  // Track expanded/collapsed state for each date group
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  // Tabs: "parse", "dashboard", or "review"
  const [tab, setTab] = useState<string>("parse");
  // Dashboard filters - default to month with current month
  const [filterType, setFilterType] = useState<'week' | 'month'>("month");
  const [filterValue, setFilterValue] = useState<string>(getCurrentMonth());

  // Track if tasks have been fetched to prevent duplicate calls
  const hasFetchedRef = useRef(false);

  // On mount, load from the database instead of localStorage
  useEffect(() => {
    // Prevent duplicate fetches (especially in React Strict Mode)
    if (hasFetchedRef.current) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/daily-tasks");
        if (!res.ok) throw new Error("Failed to fetch tasks");
        const { tasks: fetchedTasks } = await res.json();
        setTasks(fetchedTasks || []);
        hasFetchedRef.current = true;
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // This function is kept for now to map tasks to the old 'forms' structure
  // for child components. We will refactor them next.
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
    questions: demoQuestions,
  }));


  // Group tasks by date, attach _idx for edit, and filter out empty/unknown tasks
  const groupedByDate: Record<string, Array<{ form: Record<string, string>, questions: Question[], _idx: number }>> = {};
  forms.forEach((f, idx) => {
    const date = f.form.date || "Unknown";
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push({ ...f, _idx: idx });
  });

  // Helper to check if a task is empty (no description, no project, no hours)
  function isTaskEmpty(f: { form: Record<string, string> }) {
    return !f.form.description && !f.form.project && (!f.form.hours || f.form.hours === "-");
  }

  // Helper to check if a group is empty (all tasks are empty)
  function isGroupEmpty(tasks: Array<{ form: Record<string, string> }>) {
    return tasks.every(isTaskEmpty);
  }

  // Helper for new Task model
  const isTaskEmptyForTask = (task: Task) => {
    return !task.description && !task.project && (!task.hours || task.hours === 0);
  }
  const isGroupEmptyForTasks = (tasks: Task[]) => {
    return tasks.every(isTaskEmptyForTask);
  }


  // The saveTasks function is no longer needed and will be removed from props.
  // Components will be updated to call the API directly.
  function saveTasks(tasksToSave: Array<{ form: Record<string, string>, questions: Question[] }>) {
    // This function is now a no-op and will be removed.
  }


  const handleTaskUpdate = async (updatedTask: Task) => {
    try {
      const res = await fetch(`/api/daily-tasks/${updatedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update task");
      }
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    } catch (e) {
      console.error("Error updating task:", e);
      alert(e instanceof Error ? e.message : "Failed to update task");
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/daily-tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete task");
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (e) {
      console.error("Error deleting task:", e);
      alert(e instanceof Error ? e.message : "Failed to delete task");
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8">
      <h1 className="text-2xl font-bold mb-2">AI Daily Pulse Assistant</h1>
      <DailyPulseTabs tab={tab} setTab={setTab} />

      {tab === "parse" && (
        <ParseTab
          tasks={tasks}
          setTasks={setTasks}
          editIdx={editIdx}
          setEditIdx={setEditIdx}
          expandedDates={expandedDates}
          setExpandedDates={setExpandedDates}
          isGroupEmpty={isGroupEmptyForTasks}
        />
      )}

      {tab === "review-submit" && (
        <ReviewSubmitTab
          tasks={tasks}
          filterType={filterType}
          setFilterType={setFilterType}
          filterValue={filterValue}
          setFilterValue={setFilterValue}
          onTaskUpdate={handleTaskUpdate}
          onTaskDelete={handleTaskDelete}
        />
      )}

      {tab === "review" && (
        <ReviewTab tasks={
          forms
            .filter(f => {
              // Only include tasks from current week and not empty
              const date = f.form.date;
              if (!date) return false;
              // Get ISO week string for the task
              const d = new Date(f.form.date);
              const year = d.getFullYear();
              const jan4 = new Date(year, 0, 4);
              const dayOfYear = ((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1;
              const week = Math.ceil((dayOfYear + jan4.getDay() - 1) / 7);
              const weekStr = `${year}-W${week.toString().padStart(2, '0')}`;
              return weekStr === filterValue && (f.form.description || f.form.project || (f.form.hours && f.form.hours !== "-"));
            })
            .map(f => ({
              date: f.form.date || null,
              project: f.form.project || null,
              bucket: f.form.bucket || null,
              hours: f.form.hours || null,
              description: f.form.description || null,
            }))
        } />
      )}
    </div>
  );
}
