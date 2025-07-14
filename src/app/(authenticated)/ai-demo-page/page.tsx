"use client";
import { useState, useEffect } from "react";
import { DashboardSummary, DashboardFilters } from "./dashboard";
import { DailyPulseAIAssistant, TaskSummaryList, TaskEditForm } from "./parse";
import ParseTab from "./parse/ParseTab";
import ReviewTab from "./review/ReviewTab";
import type { Question } from '@/types/followup';
import DailyPulseTabs from "./DailyPulseTabs";

// Dummy questions for demo; replace with real questions from your backend


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

  const demoQuestions: Question[] = [
    { id: "date", title: "Date", type: "date", required: true },
    { id: "project", title: "Project", type: "text", required: true },
    { id: "bucket", title: "Bucket/Tag", type: "text", required: false },
    { id: "hours", title: "Hours", type: "text", required: true },
    { id: "description", title: "Task Description", type: "textarea", required: true }
  ];

  const [forms, setForms] = useState<Array<{ form: Record<string, string>, questions: Question[] }>>([
    { form: {}, questions: demoQuestions }
  ]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  // Track expanded/collapsed state for each date group
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  // Tabs: "parse", "dashboard", or "review"
  const [tab, setTab] = useState<string>("parse");
  // Dashboard filters
  const [filterType, setFilterType] = useState<'week' | 'month'>("week");
  const [filterValue, setFilterValue] = useState<string>(getCurrentWeek());

  // On mount, load from localStorage if available (client only)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("ai-demo-tasks");
      if (stored) {
        setForms(JSON.parse(stored));
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

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

  // Centralized save method for localStorage and future DB
  function saveTasks(tasks: Array<{ form: Record<string, string>, questions: Question[] }>) {
    try {
      window.localStorage.setItem("ai-demo-tasks", JSON.stringify(tasks));
    } catch (e) {}
    // TODO: Extend here to save to database via API
  }


  return (
    <div className="max-w-5xl mx-auto pb-8">
      <h1 className="text-2xl font-bold mb-2">AI Daily Pulse Assistant</h1>
      <DailyPulseTabs tab={tab} setTab={setTab} />

      {tab === "parse" && (
        <ParseTab
          demoQuestions={demoQuestions}
          forms={forms}
          setForms={setForms}
          editIdx={editIdx}
          setEditIdx={setEditIdx}
          expandedDates={expandedDates}
          setExpandedDates={setExpandedDates}
          saveTasks={saveTasks}
          isGroupEmpty={isGroupEmpty}
        />
      )}

      {tab === "dashboard" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
          <DashboardFilters
            filterType={filterType}
            setFilterType={setFilterType}
            filterValue={filterValue}
            setFilterValue={setFilterValue}
          />
          <DashboardSummary forms={forms} filterType={filterType} filterValue={filterValue} />
        </div>
      )}

      {tab === "review" && (
        <ReviewTab tasks={
          forms
            .filter(f => {
              // Only include tasks from current week and not empty
              const date = f.form.date;
              if (!date) return false;
              // Get ISO week string for the task
              const d = new Date(date);
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
