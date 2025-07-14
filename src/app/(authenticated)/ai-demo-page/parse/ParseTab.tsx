import DailyPulseAIAssistant from "./DailyPulseAIAssistant";
import TaskSummaryList from "./TaskSummaryList";
import TaskEditForm from "./TaskEditForm";
import React from "react";
import { Task } from "../page";

interface ParseTabProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  editIdx: number | null;
  setEditIdx: React.Dispatch<React.SetStateAction<number | null>>;
  expandedDates: Record<string, boolean>;
  setExpandedDates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isGroupEmpty: (tasks: Task[]) => boolean;
}

const ParseTab: React.FC<ParseTabProps> = ({
  tasks,
  setTasks,
  editIdx,
  setEditIdx,
  expandedDates,
  setExpandedDates,
  isGroupEmpty,
}) => {
  const handleParse = async (parsedTasks: any[]) => {
    const today = new Date().toISOString().slice(0, 10);
    const tasksToSave = parsedTasks.map(task => ({
        task_date: task.date || today,
        project: task.project,
        bucket: Array.isArray(task.bucket) ? task.bucket.join(', ') : task.bucket,
        hours: task.hours,
        description: task.description,
    }));

    try {
      const res = await fetch("/api/daily-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasksToSave),
      });
      if (!res.ok) throw new Error("Failed to save tasks");
      const { tasks: newTasks } = await res.json();
      setTasks(prevTasks => [...prevTasks, ...newTasks]);
      setEditIdx(null);
    } catch (error) {
      console.error("Failed to parse and save tasks:", error);
    }
  };

  return (
    <>
      <DailyPulseAIAssistant onParse={handleParse} />
      <div className="mt-8 w-full">
        <TaskSummaryList
            tasks={tasks}
            setTasks={setTasks}
            expandedDates={expandedDates}
            setExpandedDates={setExpandedDates}
            editIdx={editIdx}
            setEditIdx={setEditIdx}
            isGroupEmpty={isGroupEmpty}
        />
        {editIdx !== null && (
          <div className="fixed right-0 top-0 h-full z-30 bg-white border-l border-gray-200 shadow-xl flex flex-col transition-transform duration-300 w-full md:w-[380px] max-w-md" style={{ minWidth: 320 }}>
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
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <TaskEditForm
                editIdx={editIdx}
                tasks={tasks}
                setTasks={setTasks}
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
