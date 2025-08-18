'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

type AdminDailyTask = {
  id: string;
  user_id: string;
  task_date: string;
  project: string;
  bucket: string;
  hours: number;
  description: string;
  link?: string;
  billable: boolean;
};

type TaskSummary = {
  totalHours: number;
  billableHours: number;
  totalTasks: number;
  byProject: Record<string, number>;
  byBucket: Record<string, number>;
};

// BillableToggle component for inline editing
interface BillableToggleProps {
  taskId: string;
  isBillable: boolean;
  onToggle: (value: boolean) => void;
  onUpdate: () => void;
}

const BillableToggle: React.FC<BillableToggleProps> = ({ taskId, isBillable, onToggle, onUpdate }) => {
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
      // Refresh summary data to update overview cards
      onUpdate();
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
  const [projectFilter, setProjectFilter] = useState('all');
  const [billableFilter, setBillableFilter] = useState<'all' | 'true' | 'false'>('all');
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [tasks, setTasks] = useState<AdminDailyTask[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(20); // Default to 20, will be updated from API
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<TaskSummary>({
    totalHours: 0,
    totalTasks: 0,
    billableHours: 0,
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

  // Fetch available projects for this user
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/admin/users/${userId}/projects`)
      .then(res => res.json())
      .then(data => {
        setProjectOptions(data || []);
      });
  }, [userId]);

  // Fetch tasks for this user
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('user', userId);
    if (filterMode === 'month' && monthFilter) params.append('month', monthFilter);
    if (filterMode === 'week' && weekFilter) params.append('week', weekFilter);
    if (projectFilter && projectFilter !== 'all') params.append('project', projectFilter);
    if (billableFilter !== 'all') params.append('billable', billableFilter);
    params.append('page', String(page));
    params.append('pageSize', String(pageSize)); // Add pageSize to params
    fetch(`/api/admin/daily-tasks?${params}`)
      .then(res => res.json())
      .then(data => {
        setTasks(data.tasks || []);
        setTotalPages(data.totalPages || 1);
        setPageSize(data.pageSize || 20); // Update pageSize from API response
      })
      .catch(() => {
        setTasks([]);
        setTotalPages(1);
        setPageSize(20); // Reset to default on error
      })
      .finally(() => setLoading(false));
  }, [userId, filterMode, monthFilter, weekFilter, projectFilter, billableFilter, page, pageSize]);

  // Fetch summary data separately (no pagination)
  const fetchSummary = () => {
    const params = new URLSearchParams();
    params.append('user', userId);
    if (filterMode === 'month' && monthFilter) params.append('month', monthFilter);
    if (filterMode === 'week' && weekFilter) params.append('week', weekFilter);
    if (projectFilter && projectFilter !== 'all') params.append('project', projectFilter);
    if (billableFilter !== 'all') params.append('billable', billableFilter);
    fetch(`/api/admin/daily-tasks/summary?${params}`)
      .then(res => res.json())
      .then(data => {
        setSummary(data.summary || {
          totalHours: 0,
          billableHours: 0,
          totalTasks: 0,
          byProject: {},
          byBucket: {}
        });
      })
      .catch(() => {
        setSummary({
          totalHours: 0,
          billableHours: 0,
          totalTasks: 0,
          byProject: {},
          byBucket: {}
        });
      });
  };

  useEffect(() => {
    fetchSummary();
  }, [userId, filterMode, monthFilter, weekFilter, projectFilter, billableFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    params.append('user', userId);
    if (filterMode === 'month' && monthFilter) params.append('month', monthFilter);
    if (filterMode === 'week' && weekFilter) params.append('week', weekFilter);
    if (projectFilter && projectFilter !== 'all') params.append('project', projectFilter);
    if (billableFilter !== 'all') params.append('billable', billableFilter);
    
    // Create download link
    const url = `/api/admin/daily-tasks/export?${params}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = ''; // Let the server set the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const params = new URLSearchParams();
    params.append('user', userId);
    if (filterMode === 'month' && monthFilter) params.append('month', monthFilter);
    if (filterMode === 'week' && weekFilter) params.append('week', weekFilter);
    if (projectFilter && projectFilter !== 'all') params.append('project', projectFilter);
    if (billableFilter !== 'all') params.append('billable', billableFilter);
    
    // Create download link
    const url = `/api/admin/daily-tasks/export-pdf?${params}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = ''; // Let the server set the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Total Hours</div>
            <div className="text-2xl font-bold text-blue-600">{summary.totalHours}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Billable Hours</div>
            <div className="text-2xl font-bold text-green-600">{summary.billableHours}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Total Tasks</div>
            <div className="text-2xl font-bold text-purple-600">{summary.totalTasks}</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-sm text-gray-500">Projects</div>
            <div className="text-2xl font-bold text-orange-600">{Object.keys(summary.byProject).length}</div>
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
              className="w-56 border rounded px-2 py-2 h-10"
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
              className="w-56 border rounded px-2 py-2 h-10"
            />
          </div>
        )}

        {/* Project filter dropdown */}
        <div>
          <Label htmlFor="project-select" className="block text-sm font-medium mb-1">Project</Label>
          <Select
            value={projectFilter}
            onValueChange={value => {
              setProjectFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger id="project-select" className="w-36">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {projectOptions.map(project => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Billable filter dropdown */}
        <div>
          <label className="block text-sm font-medium mb-1">Billable Status</label>
          <div className="flex items-center gap-2">
            <Select value={billableFilter} onValueChange={(value: 'all' | 'true' | 'false') => {
              setBillableFilter(value);
              setPage(1);
            }}>
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
          <label className="block text-sm font-medium mb-1">&nbsp;</label>
          <button
            onClick={handleExportCSV}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition-colors"
          >
            Export CSV
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">&nbsp;</label>
          <button
            onClick={handleExportPDF}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-md shadow-sm transition-colors"
          >
            Export PDF
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-1/12">Date</TableHead>
              <TableHead className="w-1/12">Project</TableHead>
              <TableHead className="w-1/12">Bucket</TableHead>
              <TableHead className="w-1/12">Hours</TableHead>
              <TableHead className="w-3/12">Description</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-[100px]">Billable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center">Loading...</TableCell></TableRow>
            ) : tasks.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-gray-400">No tasks found</TableCell></TableRow>
            ) : (
              tasks.map((task, index) => {
                // Calculate ordinal number based on current page
                const ordinalNumber = (page - 1) * pageSize + index + 1; // Use pageSize from state
                return (
                  <TableRow key={task.id}>
                    <TableCell className="text-center text-sm text-gray-500">{ordinalNumber}</TableCell>
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
                      }}
                      onUpdate={fetchSummary}
                    />
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {/* Task count display */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-600">
          Showing {tasks.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, summary.totalTasks)} of {summary.totalTasks} tasks
        </div>
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