"use client";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
// Update the import path if the file exists elsewhere, for example:
import DailyPulseAIAssistant from "./DailyPulseAIAssistant";
import DailyPulseFormInner from "./DailyPulseFormInner";
import type { Question } from '@/types/followup';

// Dummy questions for demo; replace with real questions from your backend
const demoQuestions: Question[] = [
  { id: "date", title: "Date", type: "date", required: true },
  { id: "project", title: "Project", type: "text", required: true },
  { id: "bucket", title: "Bucket/Type", type: "text", required: false },
  { id: "hours", title: "Hours", type: "text", required: true },
  { id: "description", title: "Task Description", type: "textarea", required: true },
];

export default function AiDemoPage() {
  const [forms, setForms] = useState<Array<{ form: Record<string, string>, questions: Question[] }>>([
    { form: {}, questions: demoQuestions }
  ]);
  const [editIdx, setEditIdx] = useState<number | null>(null);


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


  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">AI Daily Pulse Assistant Demo</h1>
      <DailyPulseAIAssistant
        onParse={parsedTasks => {
          setForms(prevForms => [
            ...prevForms,
            ...parsedTasks.map(task => {
              const form: Record<string, string> = {};
              demoQuestions.forEach(q => {
                if (q.id === "date") {
                  // Parse task.date (YYYY-MM-DD) to ISO string, fallback to today
                  if (task.date) {
                    const d = new Date(task.date);
                    if (!isNaN(d.getTime())) {
                      form[q.id] = d.toISOString().slice(0, 10);
                    } else {
                      form[q.id] = new Date().toISOString().slice(0, 10);
                    }
                  } else {
                    form[q.id] = new Date().toISOString().slice(0, 10);
                  }
                }
                if (q.id === "project") form[q.id] = task.project;
                if (q.id === "bucket") form[q.id] = task.bucket;
                if (q.id === "hours") form[q.id] = task.hours ? String(task.hours) : "";
                if (q.id === "description") form[q.id] = task.description;
              });
              return { form, questions: demoQuestions };
            })
          ]);
          setEditIdx(null);
        }}
      />

      <div className="flex flex-col md:flex-row gap-8 mt-8">
        {/* Summary Section */}
        <div className="md:w-1/2 w-full">
          {Object.entries(groupedByDate)
            .filter(([date, tasks]) => {
              if (date !== "Unknown") return true;
              // Hide Unknown group if all its tasks are empty
              return tasks && tasks.length > 0 && !isGroupEmpty(tasks);
            })
            .sort(([dateA], [dateB]) => {
              // Put "Unknown" at the end, otherwise sort dates descending
              if (dateA === "Unknown") return 1;
              if (dateB === "Unknown") return -1;
              // Compare as ISO date strings (desc)
              return dateA < dateB ? 1 : dateA > dateB ? -1 : 0;
            })
            .map(([date, tasks]) => {
              const totalHours = tasks.reduce((sum, f) => {
                const h = parseFloat(f.form.hours || "0");
                return sum + (isNaN(h) ? 0 : h);
              }, 0);
              return (
                <div key={date} className="bg-white rounded-2xl border border-gray-200 shadow p-5 mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="w-5 h-5 text-gray-700" />
                    <span className="font-semibold text-lg text-gray-900">{date} ({totalHours}h)</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {tasks.map((f: any) => (
                      <div
                        key={f._idx}
                        className={`bg-gray-50 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 group hover:shadow cursor-pointer transition ${editIdx === f._idx ? "ring-2 ring-blue-200" : ""}`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <span className="inline-block bg-blue-100 text-blue-700 font-bold text-sm px-3 py-1 rounded-full">
                              {f.form.hours || "-"}h
                            </span>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="font-semibold text-base text-gray-900 truncate">
                              {f.form.description || <span className="italic text-gray-400">No description</span>}
                            </div>
                            <div className="text-gray-500 text-sm flex flex-wrap gap-2 mt-1">
                              <span>{f.form.project || <span className="italic">No project</span>}</span>
                              {f.form.bucket && <span className="text-gray-400">• {f.form.bucket}</span>}
                            </div>
                          </div>
                        </div>
                        <button
                          className="ml-auto text-xs text-blue-700 font-semibold hover:underline px-2 py-1 rounded"
                          onClick={() => setEditIdx(f._idx)}
                        >Edit</button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Edit Form Section */}
        <div className="md:w-1/2 w-full">
          {editIdx !== null && forms[editIdx] && (
            <div className="mb-8">
              <DailyPulseFormInner
                form={forms[editIdx].form}
                questions={forms[editIdx].questions}
                submitting={false}
                submitError={null}
                onChange={e => {
                  const { name, value } = e.target;
                  setForms(prev => prev.map((ff, i) => i === editIdx ? { ...ff, form: { ...ff.form, [name]: value } } : ff));
                }}
                onSubmit={e => {
                  e.preventDefault();
                  setEditIdx(null);
                }}
                submitLabel="Save"
              />
              <button
                className="mt-2 text-sm text-gray-500 hover:underline"
                onClick={() => setEditIdx(null)}
              >Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
