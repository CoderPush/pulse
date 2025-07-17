'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from '@/components/ui/pagination';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

export default function AdminDailyTasksPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterMode, setFilterMode] = useState<'month' | 'week'>('month');
  const [monthFilter, setMonthFilter] = useState('');
  const [weekFilter, setWeekFilter] = useState('');
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);

  // Fetch user list on mount
  useEffect(() => {
    fetch('/api/admin/users?limit=1000')
      .then(res => res.json())
      .then(data => setUserList(data.data || []));
  }, []);

  // Fetch tasks from backend
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedUser) params.append('user', selectedUser.id);
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
  }, [selectedUser, filterMode, monthFilter, weekFilter, page]);

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  return (
    <div className="mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Daily Tasks (Admin)</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">User</label>
          <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-56 h-10 border rounded px-2 py-2 text-left bg-white"
                type="button"
              >
                {selectedUser ? (
                  <span>{selectedUser.email}{selectedUser.name ? ` (${selectedUser.name})` : ''}</span>
                ) : (
                  <span className="text-gray-400">Select user...</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0">
              <Command>
                <CommandInput placeholder="Search user..." />
                <CommandList>
                  {userList.map(user => (
                    <CommandItem
                      key={user.id}
                      onSelect={() => {
                        setSelectedUser(user);
                        setUserPopoverOpen(false);
                        setPage(1);
                      }}
                    >
                      {user.email} {user.name && `(${user.name})`}
                    </CommandItem>
                  ))}
                  {userList.length === 0 && (
                    <CommandItem disabled>No users found</CommandItem>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {selectedUser && (
            <button
              className="ml-2 text-xs text-gray-500 hover:text-red-600 underline"
              onClick={() => setSelectedUser(null)}
              type="button"
            >
              Clear
            </button>
          )}
        </div>
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
              <TableHead>User</TableHead>
              <TableHead className="w-1/12">Date</TableHead>
              <TableHead className="w-1/12">Project</TableHead>
              <TableHead className="w-1/12">Bucket</TableHead>
              <TableHead className="w-1/12">Hours</TableHead>
              <TableHead className="w-1/12">Description</TableHead>
              <TableHead>Link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
            ) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-gray-400">No tasks found</TableCell></TableRow>
            ) : (
              tasks.map((task: any) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <Link href={`/admin/users/${task.user_id}/daily-tasks`} className="text-blue-600 hover:underline">
                      {task.user_email || task.user_name || task.user_id}
                    </Link>
                  </TableCell>
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