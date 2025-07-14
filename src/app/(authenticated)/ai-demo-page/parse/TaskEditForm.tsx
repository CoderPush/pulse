import React, { useState, useEffect } from "react";
import DailyPulseFormInner from "./DailyPulseFormInner";
import { Task } from "../page";

interface TaskEditFormProps {
  editIdx: number | null;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setEditIdx: (idx: number | null) => void;
}

const TaskEditForm: React.FC<TaskEditFormProps> = ({
  editIdx,
  tasks,
  setTasks,
  setEditIdx,
}) => {
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (editIdx !== null && tasks[editIdx]) {
      setTaskToEdit(tasks[editIdx]);
    } else {
      setTaskToEdit(null);
    }
  }, [editIdx, tasks]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTaskToEdit(prev => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!taskToEdit) return;

    setSubmitting(true);
    setSubmitError(null);

    const taskPayload = {
        ...taskToEdit,
        hours: Number(taskToEdit.hours)
    }

    try {
      const res = await fetch(`/api/daily-tasks/${taskToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskPayload),
      });

      if (!res.ok) throw new Error("Failed to save task");

      const { task: updatedTask } = await res.json();
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === updatedTask.id ? updatedTask : task
        )
      );
      setEditIdx(null);
    } catch (error) {
      console.error("Failed to update task:", error);
      setSubmitError("Failed to save task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (editIdx === null || !taskToEdit) return null;

  return (
    <div className="mb-8">
      <DailyPulseFormInner
        task={taskToEdit}
        submitting={submitting}
        submitError={submitError}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        showCancel={true}
        onCancel={() => setEditIdx(null)}
      />
    </div>
  );
};

export default TaskEditForm;
