'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';

export default function AdminUserDailyTasksPage() {
  const params = useParams();
  const userId = params?.id as string;
  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [filterMode, setFilterMode] = useState<'month' | 'week'>('month');
  const [monthFilter, setMonthFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

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
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Filter by:</label>
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value as 'month' | 'week')}
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
              onChange={e => setMonthFilter(e.target.value)}
              className="w-36 border rounded px-2 py-2 h-10"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1">Week</label>
            <input
              type="week"
              value={weekFilter}
              onChange={e => setWeekFilter(e.target.value)}
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
              tasks.map((task: any) => (
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
              <PaginationLink
                onClick={() => page > 1 && handlePageChange(page - 1)}
                isActive={false}
                className={`cursor-pointer${page === 1 ? ' pointer-events-none opacity-50' : ''}`}
              >
                Previous
              </PaginationLink>
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i + 1}>
                <PaginationLink
                  isActive={page === i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationLink
                onClick={() => page < totalPages && handlePageChange(page + 1)}
                isActive={false}
                className={`cursor-pointer${page === totalPages ? ' pointer-events-none opacity-50' : ''}`}
              >
                Next
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
} 