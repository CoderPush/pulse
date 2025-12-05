"use client";
import React, { useState } from "react";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import { Trash2, Edit2, Check, X, Download } from "lucide-react";
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
import type { Task } from "../page";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function getWeek(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

function getMonth(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

interface DashboardSummaryProps {
  tasks: Task[];
  filterType: 'week' | 'month';
  filterValue: string;
  onTaskUpdate: (task: Task) => void;
  onTaskDelete: (taskId: string) => void;
  monthStatus?: string; // Optional status passed from parent
}

export default function DashboardSummary({
  tasks,
  filterType,
  filterValue,
  onTaskUpdate,
  onTaskDelete,
  monthStatus
}: DashboardSummaryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});

  // Determine if month is locked (approved or submitted)
  const isMonthLocked = monthStatus === 'approved' || monthStatus === 'submitted';

  // Filter tasks
  const filtered = tasks.filter(t => {
    if (!t.task_date) return false;
    if (filterType === 'week' && filterValue) {
      return getWeek(t.task_date) === filterValue;
    }
    if (filterType === 'month' && filterValue) {
      return getMonth(t.task_date) === filterValue;
    }
    return true;
  });

  // Summary calculations
  const totalHours = filtered.reduce((sum, t) => sum + (t.hours || 0), 0);
  const billableHours = filtered.reduce((sum, t) => sum + (t.billable ? (t.hours || 0) : 0), 0);

  // Distribution
  const byProject: Record<string, number> = {};
  const byBucket: Record<string, number> = {};
  filtered.forEach(t => {
    const h = t.hours || 0;
    if (t.project) byProject[t.project] = (byProject[t.project] || 0) + h;
    if (t.bucket) byBucket[t.bucket] = (byBucket[t.bucket] || 0) + h;
  });

  // Chart data
  const projectChartData = {
    labels: Object.keys(byProject),
    datasets: [{
      label: 'Hours',
      data: Object.values(byProject),
      backgroundColor: '#60a5fa',
      borderColor: '#2563eb',
      borderWidth: 1,
    }],
  };

  const bucketChartData = {
    labels: Object.keys(byBucket),
    datasets: [{
      label: 'Hours',
      data: Object.values(byBucket),
      backgroundColor: '#fde68a',
      borderColor: '#f59e42',
      borderWidth: 1,
    }],
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditForm(task);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = () => {
    if (editingId && editForm) {
      onTaskUpdate(editForm as Task);
      setEditingId(null);
      setEditForm({});
    }
  };

  // Helper function to escape CSV field (handles commas, quotes, newlines)
  const escapeCSVField = (field: string | null | undefined): string => {
    if (!field) return '';
    const str = String(field);
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      return;
    }

    // CSV headers
    const csvHeaders = ['Date', 'Project', 'Bucket', 'Hours', 'Billable', 'Description', 'Link'];
    
    // Convert tasks to CSV rows
    const csvRows = filtered.map(task => [
      task.task_date || '',
      escapeCSVField(task.project),
      escapeCSVField(task.bucket),
      task.hours || 0,
      task.billable ? 'Yes' : 'No',
      escapeCSVField(task.description),
      escapeCSVField(task.link),
    ]);

    // Combine headers and rows
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');

    // Generate filename based on filter
    let filename = 'tasks';
    if (filterValue) {
      filename += `-${filterValue}`;
    }
    filename += '.csv';

    // Create blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Compact Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-xs text-gray-500 uppercase font-semibold">Total Hours</div>
          <div className="text-xl font-bold text-blue-700">{totalHours.toFixed(1)}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-xs text-gray-500 uppercase font-semibold">Billable Hours</div>
          <div className="text-xl font-bold text-green-700">{billableHours.toFixed(1)}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-xs text-gray-500 uppercase font-semibold">Projects</div>
          <div className="text-xl font-bold text-yellow-700">{Object.keys(byProject).length}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 flex flex-col justify-center">
          <div className="text-xs text-gray-500 uppercase font-semibold">Buckets</div>
          <div className="text-xl font-bold text-purple-700">{Object.keys(byBucket).length}</div>
        </div>
      </div>

      {/* Compact Charts (Collapsible or Small) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48">
          <h3 className="text-sm font-semibold mb-2 text-gray-600">Project Distribution</h3>
          <div className="h-full w-full">
            <Bar data={projectChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="h-48">
          <h3 className="text-sm font-semibold mb-2 text-gray-600">Bucket Distribution</h3>
          <div className="h-full w-full">
            <Bar data={bucketChartData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
          </div>
        </div>
      </div>

      {/* Task Table */}
      <div>
        {isMonthLocked && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              This month&apos;s report has been submitted or approved. Tasks cannot be edited or deleted.
            </span>
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Log Entries</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[150px]">Project</TableHead>
                <TableHead className="w-[120px]">Bucket</TableHead>
                <TableHead className="w-[80px]">Hours</TableHead>
                <TableHead className="w-[80px] text-center">Billable</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No tasks found for this period.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((task) => (
                  <TableRow key={task.id}>
                    {editingId === task.id ? (
                      <>
                        <TableCell>
                          <Input
                            type="date"
                            value={editForm.task_date}
                            onChange={e => setEditForm({ ...editForm, task_date: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editForm.project}
                            onChange={e => setEditForm({ ...editForm, project: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editForm.bucket}
                            onChange={e => setEditForm({ ...editForm, bucket: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={editForm.hours}
                            onChange={e => setEditForm({ ...editForm, hours: parseFloat(e.target.value) })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={editForm.billable}
                            onCheckedChange={c => setEditForm({ ...editForm, billable: c as boolean })}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={editForm.description}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEdit}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={cancelEdit}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{task.task_date}</TableCell>
                        <TableCell className="font-medium">{task.project}</TableCell>
                        <TableCell className="text-gray-500">{task.bucket}</TableCell>
                        <TableCell>{task.hours}</TableCell>
                        <TableCell className="text-center">
                          {task.billable ? (
                            <Check className="h-4 w-4 mx-auto text-green-500" />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-md truncate" title={task.description}>
                          {task.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => startEdit(task)}
                              disabled={isMonthLocked}
                              title={isMonthLocked ? "Cannot edit - month is submitted or approved" : "Edit task"}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={() => onTaskDelete(task.id)}
                              disabled={isMonthLocked}
                              title={isMonthLocked ? "Cannot delete - month is submitted or approved" : "Delete task"}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
