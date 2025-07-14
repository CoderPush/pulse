import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import React from "react";
import { Task } from "../page";

interface TaskSummaryListProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  editIdx: number | null;
  setEditIdx: (idx: number | null) => void;
  expandedDates: Record<string, boolean>;
  setExpandedDates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  isGroupEmpty: (tasks: Task[]) => boolean;
}

const TaskSummaryList: React.FC<TaskSummaryListProps> = ({
  tasks,
  setTasks,
  editIdx,
  setEditIdx,
  expandedDates,
  setExpandedDates,
  isGroupEmpty,
}) => {
  const handleDelete = async (taskId: string) => {
    const originalTasks = tasks;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

    try {
      const res = await fetch(`/api/daily-tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        setTasks(originalTasks);
        console.error("Failed to delete task");
      }
    } catch (error) {
      setTasks(originalTasks);
      console.error("Error deleting task:", error);
    }
  };

  const groupedByDate: Record<string, Array<Task & { _idx: number }>> = {};
  tasks.forEach((task, idx) => {
    const date = task.task_date || "Unknown";
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push({ ...task, _idx: idx });
  });

  return (
    <div className="md:w-2/3 w-full">
      {Object.entries(groupedByDate)
        .filter(([date, taskItems]) => {
          if (date !== "Unknown") return true;
          return taskItems && taskItems.length > 0 && !isGroupEmpty(taskItems);
        })
        .map(([date, taskItems]) => {
          const totalHours = taskItems.reduce((sum, task) => {
            const h = Number(task.hours || "0");
            return sum + (isNaN(h) ? 0 : h);
          }, 0);
          const expanded = expandedDates[date] ?? true;
          let displayDate = date;
          if (date !== "Unknown" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
              displayDate = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
            }
          }
          return (
            <div key={date} className="bg-white rounded-2xl border border-gray-200 shadow p-5 mb-8">
              <div className="flex items-center gap-3 mb-4 cursor-pointer select-none group" onClick={() => setExpandedDates(prev => ({ ...prev, [date]: !expanded }))}>
                <div className="flex items-center gap-2">
                  {expanded ? <ChevronDown className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition" /> : <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition" />}
                  <CalendarDays className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                  <span className="font-semibold text-lg text-gray-900">{displayDate}</span>
                  <span className="ml-0 sm:ml-4 inline-flex items-center gap-1 bg-blue-50 text-blue-700 font-semibold px-3 py-1 rounded-full text-sm">
                    {totalHours} <span className="ml-1">hours</span>
                  </span>
                </div>
              </div>
              {expanded && (
                <div className="flex flex-col gap-3">
                  {taskItems.map((task) => (
                    <div
                      key={task._idx}
                      className={`bg-gray-50 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 group hover:shadow cursor-pointer transition ${editIdx === task._idx ? "ring-2 ring-blue-200" : ""}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          <span className="inline-block bg-blue-100 text-blue-700 font-bold text-sm px-3 py-1 rounded-full">
                            {task.hours || "-"}h
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="font-semibold text-base text-gray-900 truncate">
                            {task.description || <span className="italic text-gray-400">No description</span>}
                          </div>
                          <div className="text-gray-500 text-sm flex flex-wrap gap-2 mt-1">
                            <span>{task.project || <span className="italic">No project</span>}</span>
                            {task.bucket && <span className="text-gray-400">• {task.bucket}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="ml-auto flex flex-row gap-2">
                        <button
                          className="text-xs text-blue-700 font-semibold hover:underline px-2 py-1 rounded"
                          onClick={() => setEditIdx(task._idx)}
                        >Edit</button>
                        <button
                          className="text-xs text-red-600 font-semibold hover:underline px-2 py-1 rounded"
                          onClick={() => handleDelete(task.id)}
                          aria-label="Delete task"
                        >Del</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default TaskSummaryList;
