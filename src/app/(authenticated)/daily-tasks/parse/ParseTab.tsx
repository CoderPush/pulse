import DailyPulseAIAssistant from "./DailyPulseAIAssistant";
import TaskSummaryList from "./TaskSummaryList";
import TaskEditForm from "./TaskEditForm";
import React, { useState, useRef } from "react";
import { Task } from "../page";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

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
  // Month filter state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Track if a save operation is in progress
  const isProcessing = useRef(false);

  // Filter tasks by selected month
  const filteredTasks = tasks.filter(task =>
    task.task_date && task.task_date.startsWith(selectedMonth)
  );

  const handleParse = async (parsedTasks: any[]) => {
    // Prevent duplicate calls if already processing
    if (isProcessing.current) {
      console.log('Already processing, skipping duplicate call');
      return;
    }

    isProcessing.current = true;
    const today = new Date().toISOString().slice(0, 10);
    const tasksToSave = parsedTasks.map(task => ({
      task_date: task.date || today,
      project: task.project,
      bucket: Array.isArray(task.bucket) ? task.bucket.join(', ') : task.bucket,
      hours: task.hours,
      description: task.description,
      link: task.link,
      billable: task.billable ?? true,
    }));

    try {
      const res = await fetch("/api/daily-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tasksToSave),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save tasks");
      }
      const { tasks: newTasks } = await res.json();
      setTasks(prevTasks => [...prevTasks, ...newTasks]);
      setEditIdx(null);
    } catch (error) {
      console.error("Failed to parse and save tasks:", error);
      alert(error instanceof Error ? error.message : "Failed to save tasks");
    } finally {
      isProcessing.current = false;
    }
  };

  // Format display label for selected month
  const getMonthLabel = () => {
    const [year, month] = selectedMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Navigate to previous/next month
  const navigateMonth = (direction: -1 | 1) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const newDate = new Date(year, month - 1 + direction);
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonth);
  };

  return (
    <>
      <DailyPulseAIAssistant onParse={handleParse} />
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex items-center bg-white border border-gray-200 rounded-md">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 hover:bg-gray-50 rounded-l-md transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-gray-400 absolute left-1.5 pointer-events-none" />
            <input
              id="month-filter"
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="h-7 pl-6 pr-1 text-xs font-medium text-gray-600 bg-transparent border-0 focus:ring-0 outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 hover:bg-gray-50 rounded-r-md transition-colors text-gray-400 hover:text-gray-600"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-xs text-gray-400 hidden sm:inline">
          {getMonthLabel()}
        </span>
        <span className="text-xs text-gray-400">
          · {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="w-full">
        <TaskSummaryList
          tasks={filteredTasks}
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
                tasks={filteredTasks}
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
