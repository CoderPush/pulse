import { Edit2, Trash2, Check, X, Link as LinkIcon, DollarSign } from "lucide-react";
import React, { useState } from "react";
import { Task } from "../page";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}) => {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  const handleDelete = async (taskId: string) => {
    const originalTasks = tasks;
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));

    try {
      const res = await fetch(`/api/daily-tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        setTasks(originalTasks);
        toast({
          title: "Delete failed",
          description: "Failed to delete task. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Task deleted",
          description: "The task has been deleted successfully.",
        });
      }
    } catch (error) {
      setTasks(originalTasks);
      console.error("Error deleting task:", error);
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm({ ...task });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    const originalTasks = tasks;
    const updatedTask = editForm as Task;
    
    setTasks(prevTasks => prevTasks.map(t => t.id === editingId ? updatedTask : t));

    try {
      const res = await fetch(`/api/daily-tasks/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask),
      });
      
      if (!res.ok) {
        setTasks(originalTasks);
        toast({
          title: "Update failed",
          description: "Failed to update task. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Task updated",
          description: "The task has been updated successfully.",
        });
        setEditingId(null);
        setEditForm({});
      }
    } catch (error) {
      setTasks(originalTasks);
      console.error("Error updating task:", error);
    }
  };

  // Sort tasks by date descending
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.task_date) return 1;
    if (!b.task_date) return -1;
    return new Date(b.task_date).getTime() - new Date(a.task_date).getTime();
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-500">
        No tasks logged yet. Use the Quick Log above to add your first task.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[80px]">Date</TableHead>
            <TableHead className="w-[50px]">Hours</TableHead>
            <TableHead className="w-[40px] text-center" title="Billable">$</TableHead>
            <TableHead className="w-[120px]">Project</TableHead>
            <TableHead className="w-[80px]">Bucket</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]">Link</TableHead>
            <TableHead className="w-[70px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.map((task) => (
            <TableRow key={task.id} className="hover:bg-gray-50">
              {editingId === task.id ? (
                <>
                  <TableCell className="p-1">
                    <Input
                      type="date"
                      value={editForm.task_date || ''}
                      onChange={e => setEditForm({ ...editForm, task_date: e.target.value })}
                      className="h-8 min-w-[130px]"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      type="number"
                      step="0.5"
                      value={editForm.hours || ''}
                      onChange={e => setEditForm({ ...editForm, hours: parseFloat(e.target.value) || 0 })}
                      className="h-8 w-16"
                    />
                  </TableCell>
                  <TableCell className="p-1 text-center">
                    <Checkbox
                      checked={editForm.billable || false}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, billable: !!checked })}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={editForm.project || ''}
                      onChange={e => setEditForm({ ...editForm, project: e.target.value })}
                      className="h-8 min-w-[120px]"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={editForm.bucket || ''}
                      onChange={e => setEditForm({ ...editForm, bucket: e.target.value })}
                      className="h-8 min-w-[80px]"
                      placeholder="#tag"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={editForm.description || ''}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="h-8 min-w-[200px]"
                    />
                  </TableCell>
                  <TableCell className="p-1">
                    <Input
                      value={editForm.link || ''}
                      onChange={e => setEditForm({ ...editForm, link: e.target.value })}
                      className="h-8 min-w-[150px]"
                      placeholder="https://..."
                    />
                  </TableCell>
                  <TableCell className="text-right p-1">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={saveEdit}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={cancelEdit}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="text-gray-600 text-sm">
                    {formatDate(task.task_date)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center justify-center bg-blue-100 text-blue-700 font-semibold text-xs px-2 py-0.5 rounded-full">
                      {task.hours || 0}h
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {task.billable ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-600 rounded-full" title="Billable">
                        <DollarSign className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-gray-900 text-sm">
                    {task.project || <span className="text-gray-400 italic">Unknown</span>}
                  </TableCell>
                  <TableCell className="text-gray-500 text-xs">
                    {task.bucket || '-'}
                  </TableCell>
                  <TableCell className="text-gray-700 text-sm max-w-xs truncate" title={task.description}>
                    {task.description || <span className="text-gray-400 italic">No description</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {task.link ? (
                      <a
                        href={task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 max-w-[80px] truncate"
                        title={task.link}
                      >
                        <LinkIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{task.link.replace(/^https?:\/\//, '').slice(0, 15)}</span>
                      </a>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEdit(task)}
                        title="Edit task"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(task.id)}
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaskSummaryList;
