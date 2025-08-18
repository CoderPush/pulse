'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { X, Loader2 } from 'lucide-react';
import UserOverview from './UserOverview';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  name?: string | null;
  wants_daily_reminders?: boolean;
}

// BillableToggle component for inline editing
interface BillableToggleProps {
  taskId: string;
  isBillable: boolean;
  onToggle: (value: boolean) => void;
}

const BillableToggle: React.FC<BillableToggleProps> = ({ taskId, isBillable, onToggle }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (newValue: boolean) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/daily-tasks/${taskId}/billable`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ billable: newValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to update billable status');
      }

      onToggle(newValue);
    } catch (error) {
      console.error('Error updating billable status:', error);
      // Revert the toggle on error
      onToggle(isBillable);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isBillable}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        className="data-[state=checked]:bg-green-600"
      />
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
    </div>
  );
};

type AdminDailyTask = {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  task_date: string;
  project: string;
  bucket: string;
  hours: number;
  description: string;
  link?: string;
  billable: boolean;
};

export default function AdminDailyTasksPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [projectList, setProjectList] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'month' | 'week'>('month');
  const [monthFilter, setMonthFilter] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [weekFilter, setWeekFilter] = useState('');
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState<AdminDailyTask[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0); // Add total tasks count
  const [pageSize, setPageSize] = useState(20); // Default to 20, will be updated from API
  const [loading, setLoading] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [overviewRefreshKey, setOverviewRefreshKey] = useState(0);
  const [billableFilter, setBillableFilter] = useState<'all' | 'true' | 'false'>('all');

  // Fetch user list on mount
  useEffect(() => {
    fetch('/api/admin/users?limit=1000')
      .then(res => res.json())
      .then(data => setUserList(data.data || []));
  }, []);

  useEffect(() => {
    fetch('/api/admin/daily-tasks/projects')
      .then(res => res.json())
      .then(data => setProjectList(data || []));
  }, []);

  // Only show users who want daily reminders
  const filteredUserList = userList.filter(user => user.wants_daily_reminders);

  // Fetch tasks from backend
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedUser) params.append('user', selectedUser.id);
    if (selectedProjects.length > 0) params.append('projects', selectedProjects.join(','));
    if (filterMode === 'month' && monthFilter) params.append('month', monthFilter);
    if (filterMode === 'week' && weekFilter) params.append('week', weekFilter);
    if (billableFilter !== 'all') params.append('billable', billableFilter);
    params.append('page', String(page));
    params.append('limit', String(pageSize)); // Append pageSize
    fetch(`/api/admin/daily-tasks?${params}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || []);
        setTotalPages(data.totalPages || 1);
        setPageSize(data.pageSize || 20); // Update pageSize from API
        setTotalTasks(data.totalTasks || data.tasks?.length || 0); // Get total count
      })
      .catch(() => {
        setTasks([]);
        setTotalPages(1);
        setPageSize(20); // Reset to default on error
        setTotalTasks(0);
      })
      .finally(() => setLoading(false));
  }, [selectedUser, selectedProjects, filterMode, monthFilter, weekFilter, billableFilter, page, pageSize]);

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  // Function to refresh overview when billable status changes
  const refreshOverview = () => {
    setOverviewRefreshKey(prev => prev + 1);
  };

  return (
    <div className="mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Daily Tasks (Admin)</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-start">
        <div>
          <label className="block text-sm font-medium mb-1">User</label>
          <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-96 h-10 border rounded px-2 py-2 text-left bg-white"
                type="button"
              >
                {selectedUser ? (
                  <span>{selectedUser.email}{selectedUser.name ? ` (${selectedUser.name})` : ''}</span>
                ) : (
                  <span className="text-gray-400">Select user...</span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0">
              <Command>
                <CommandInput placeholder="Search user..." />
                <CommandList>
                  {filteredUserList.map(user => (
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
                  {filteredUserList.length === 0 && (
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
          <label className="block text-sm font-medium mb-1">Projects</label>
          <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className="w-96 h-10 border rounded px-3 py-2 text-left bg-white hover:bg-gray-50 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="button"
              >
                <span className="text-sm text-gray-700">
                  {selectedProjects.length > 0
                    ? `${selectedProjects.length} project${selectedProjects.length === 1 ? '' : 's'} selected`
                    : 'Select projects...'}
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search projects..." className="h-9" />
                <CommandList>
                  {projectList.map(project => (
                    <CommandItem
                      key={project}
                      onSelect={() => {
                        setSelectedProjects(prev =>
                          prev.includes(project)
                            ? prev.filter(p => p !== project)
                            : [...prev, project]
                        );
                      }}
                      className="flex items-center space-x-2 px-3 py-2"
                    >
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                        selectedProjects.includes(project) 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300'
                      }`}>
                        {selectedProjects.includes(project) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="flex-1">{project}</span>
                    </CommandItem>
                  ))}
                  {projectList.length === 0 && (
                    <CommandItem disabled className="px-3 py-2 text-gray-500">
                      No projects found
                    </CommandItem>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {selectedProjects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedProjects.map(project => (
                <Badge 
                  key={project} 
                  variant="secondary" 
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors"
                >
                  <span className="text-xs font-medium">{project}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedProjects(prev => prev.filter(p => p !== project));
                    }}
                    className="hover:bg-blue-300 rounded-full p-0.5 transition-colors"
                    aria-label={`Remove ${project}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                type="button"
                onClick={() => setSelectedProjects([])}
                className="text-xs text-gray-500 hover:text-red-600 underline px-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Billable Status</label>
          <div className="flex items-center gap-2">
            <Select value={billableFilter} onValueChange={(value: 'all' | 'true' | 'false') => setBillableFilter(value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="true">Billable</SelectItem>
                <SelectItem value="false">Non-Billable</SelectItem>
              </SelectContent>
            </Select>
            {billableFilter !== 'all' && (
              <button
                onClick={() => setBillableFilter('all')}
                className="text-xs text-gray-500 hover:text-red-600 underline px-1"
              >
                Clear
              </button>
            )}
          </div>
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
              className="w-36 border rounded px-2 py-2 h-10 w-56"
            />
          </div>
        )}
      </div>
      {selectedUser && (
        <UserOverview 
          key={overviewRefreshKey}
          user={selectedUser}
          filterMode={filterMode}
          monthFilter={monthFilter}
          weekFilter={weekFilter}
          billableFilter={billableFilter}
        />
      )}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>User</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              <TableHead className="w-[150px]">Project</TableHead>
              <TableHead className="w-[100px]">Bucket</TableHead>
              <TableHead className="w-[80px]">Hours</TableHead>
              <TableHead className="w-[300px]">Description</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-[100px]">Billable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} className="text-center">Loading...</TableCell></TableRow>
            ) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-gray-400">No tasks found</TableCell></TableRow>
            ) : (
              tasks.map((task, index) => (
                <TableRow key={task.id}>
                  <TableCell>{pageSize * (page - 1) + index + 1}</TableCell>
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
                  <TableCell>
                    <BillableToggle 
                      taskId={task.id} 
                      isBillable={task.billable}
                      onToggle={(newValue) => {
                        setTasks(prevTasks => 
                          prevTasks.map(t => 
                            t.id === task.id ? { ...t, billable: newValue } : t
                          )
                        );
                        // Refresh overview when billable status changes
                        refreshOverview();
                      }}
                    />
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
      {tasks.length > 0 && (
        <div className="text-center text-sm text-gray-600 mt-4">
          Showing {pageSize * (page - 1) + 1} to {Math.min(pageSize * page, totalTasks)} of {totalTasks} tasks
        </div>
      )}
    </div>
  );
} 