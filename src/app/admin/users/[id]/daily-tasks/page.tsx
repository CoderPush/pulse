'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';

type AdminDailyTask = {
  id: string;
  user_id: string;
  task_date: string;
  project: string;
  bucket: string;
  hours: number;
  description: string;
  link?: string;
};

type TaskSummary = {
  totalHours: number;
  totalTasks: number;
  byProject: Record<string, number>;
  byBucket: Record<string, number>;
};

export default function AdminUserDailyTasksPage() {
  const params = useParams();
  const userId = params?.id as string;
  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [filterMode, setFilterMode] = useState<'month' | 'week'>('month');
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [weekFilter, setWeekFilter] = useState('');
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState<AdminDailyTask[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<TaskSummary>({
    totalHours: 0,
    totalTasks: 0,
    byProject: {},
    byBucket: {}
  });

  // Fetch user info
  useEffect(() => {
    fetch(`/api/admin/users?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) setUser(data.data[0]);
      });
  }, [userId]);

  // Fetch tasks for this user
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('user', userId);
    if (filterMode === 'month' && monthFilter) params.append('month', monthFilter);
    if (filterMode === 'week' && weekFilter) params.append('week', weekFilter);
    params.append('page', String(page));
    fetch(`/api/admin/daily-tasks?${params}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {
        setTasks([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [userId, filterMode, monthFilter, weekFilter, page]);

  // Fetch summary data separately (no pagination)
  useEffect(() => {
    const params = new URLSearchParams();
    params.append('user', userId);
    if (filterMode === 'month' && monthFilter) params.append('month', monthFilter);
    if (filterMode === 'week' && weekFilter) params.append('week', weekFilter);
    
    fetch(`/api/admin/daily-tasks/summary?${params}`)
      .then(res => res.json())
      .then(data => {
        setSummary(data.summary || {
          totalHours: 0,
          totalTasks: 0,
          byProject: {},
          byBucket: {}
        });
      })
      .catch(() => {
        setSummary({
          totalHours: 0,
          totalTasks: 0,
          byProject: {},
          byBucket: {}
        });
      });
  }, [userId, filterMode, monthFilter, weekFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  return (
    <div className="mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2">User Daily Tasks</h1>
      {user && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="font-semibold">{user.email}</div>
          {user.name && <div className="text-gray-600">{user.name}</div>}
        </div>
      )}
      
      {/* Overview Section */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-blue-900">Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Total Hours</div>
            <div className="text-2xl font-bold text-blue-600">{summary.totalHours}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Total Tasks</div>
            <div className="text-2xl font-bold text-green-600">{summary.totalTasks}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Projects</div>
            <div className="text-2xl font-bold text-purple-600">{Object.keys(summary.byProject).length}</div>
          </div>
        </div>
        
        {/* Project Distribution */}
        {Object.keys(summary.byProject).length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2 text-blue-900">Hours by Project</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.byProject).map(([project, hours]) => (
                <span key={project} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                  {project}: {hours}h
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Filter by:</label>
          <select
            value={filterMode}
            onChange={e => {
              setFilterMode(e.target.value as 'month' | 'week');
              setPage(1); // Reset to first page when changing filter
            }}
            className="border rounded px-2 py-2 h-10"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
          </select>
        </div>
        {filterMode === 'month' ? (
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <input
              type="month"
              value={monthFilter}
              onChange={e => {
                setMonthFilter(e.target.value);
                setPage(1); // Reset to first page when changing filter
              }}
              className="w-36 border rounded px-2 py-2 h-10"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Week</label>
            <input
              type="week"
              value={weekFilter}
              onChange={e => {
                setWeekFilter(e.target.value);
                setPage(1); // Reset to first page when changing filter
              }}
              className="w-36 border rounded px-2 py-2 h-10"
            />
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/12">Date</TableHead>
              <TableHead className="w-1/12">Project</TableHead>
              <TableHead className="w-1/12">Bucket</TableHead>
              <TableHead className="w-1/12">Hours</TableHead>
              <TableHead className="w-3/12">Description</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
            ) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-gray-400">No tasks found</TableCell></TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.task_date}</TableCell>
                  <TableCell>{task.project}</TableCell>
                  <TableCell>{task.bucket}</TableCell>
                  <TableCell>{task.hours}</TableCell>
                  <TableCell>{task.description}</TableCell>
                  <TableCell>
                    {task.link && (
                      <a href={task.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{task.link}</a>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* shadcn Pagination */}
      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={e => {
                  e.preventDefault();
                  if (page > 1) handlePageChange(page - 1);
                }}
                className={page === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  href="#"
                  isActive={page === i + 1}
                  onClick={e => {
                    e.preventDefault();
                    handlePageChange(i + 1);
                  }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={e => {
                  e.preventDefault();
                  if (page < totalPages) handlePageChange(page + 1);
                }}
                className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
} 