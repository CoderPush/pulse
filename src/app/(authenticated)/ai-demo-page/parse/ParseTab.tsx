import DailyPulseAIAssistant from "./DailyPulseAIAssistant";
import TaskSummaryList from "./TaskSummaryList";
import TaskEditForm from "./TaskEditForm";
import type { Question } from '@/types/followup';
import React from "react";

interface ParseTabProps {
  demoQuestions: Question[];
  forms: Array<{ form: Record<string, string>, questions: Question[] }>;
  setForms: React.Dispatch<React.SetStateAction<Array<{ form: Record<string, string>, questions: Question[] }>>>;
  editIdx: number | null;
  setEditIdx: React.Dispatch<React.SetStateAction<number | null>>;
  expandedDates: Record<string, boolean>;
  setExpandedDates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  saveTasks: (tasks: Array<{ form: Record<string, string>, questions: Question[] }>) => void;
  isGroupEmpty: (tasks: Array<{ form: Record<string, string> }>) => boolean;
}

const ParseTab: React.FC<ParseTabProps> = ({
  demoQuestions,
  forms,
  setForms,
  editIdx,
  setEditIdx,
  expandedDates,
  setExpandedDates,
  saveTasks,
  isGroupEmpty,
}) => {
  // Group tasks by date, attach _idx for edit, and sort dates descending
  const groupedByDate: Record<string, Array<{ form: Record<string, string>, questions: Question[], _idx: number }>> = {};
  forms.forEach((f, idx) => {
    const date = f.form.date || "Unknown";
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push({ ...f, _idx: idx });
  });
  // Sort groupedByDate keys (dates) descending
  const sortedGroupedByDateEntries = Object.entries(groupedByDate).sort(([a], [b]) => {
    // Try to parse as date, fallback to string compare
    const aDate = new Date(a);
    const bDate = new Date(b);
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return bDate.getTime() - aDate.getTime();
    }
    return b.localeCompare(a);
  });

  return (
    <>
      <DailyPulseAIAssistant
        onParse={(parsedTasks: Array<Record<string, any>>) => {
          setForms(prevForms => {
            const newForms = [
              ...prevForms,
              ...parsedTasks.map((task: any) => {
                const form: Record<string, string> = {};
                demoQuestions.forEach(q => {
                  if (q.id === "date") {
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
            ];
            saveTasks(newForms);
            return newForms;
          });
          setEditIdx(null);
        }}
      />
      <div className="mt-8 w-full">
        {sortedGroupedByDateEntries.map(([date, items]) => (
          <div key={date}>
            <TaskSummaryList
              groupedByDate={{ [date]: items }}
              expandedDates={expandedDates}
              setExpandedDates={setExpandedDates}
              editIdx={editIdx}
              setEditIdx={setEditIdx}
              setForms={setForms}
              saveTasks={saveTasks}
              isGroupEmpty={isGroupEmpty}
              forms={forms}
            />
          </div>
        ))}
        {/* Edit form sidebar overlays on top, only show if editing */}
        {editIdx !== null && (
          <div className="fixed right-0 top-0 h-full z-30 bg-white border-l border-gray-200 shadow-xl flex flex-col transition-transform duration-300 w-full md:w-[380px] max-w-md" style={{ minWidth: 320 }}>
            {/* Sidebar header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="font-bold text-lg text-gray-800">Edit Task</div>
              <button
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
                onClick={() => setEditIdx(null)}
                aria-label="Close sidebar"
              >
                &times;
              </button>
            </div>
            {/* Sidebar content: TaskEditForm */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TaskEditForm
                editIdx={editIdx}
                forms={forms}
                setForms={setForms}
                saveTasks={saveTasks}
                setEditIdx={setEditIdx}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ParseTab;
