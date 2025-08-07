'use client';

import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

type TaskSummary = {
  totalHours: number;
  totalTasks: number;
  byProject: Record<string, number>;
  byBucket: Record<string, number>;
};

interface UserOverviewProps {
  user: User;
  filterMode: 'month' | 'week';
  monthFilter: string;
  weekFilter: string;
}

export default function UserOverview({ user, filterMode, monthFilter, weekFilter }: UserOverviewProps) {
  const [summary, setSummary] = useState<TaskSummary>({
    totalHours: 0,
    totalTasks: 0,
    byProject: {},
    byBucket: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('user', user.id);
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
      })
      .finally(() => setLoading(false));
  }, [user.id, filterMode, monthFilter, weekFilter]);

  if (loading) {
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-blue-200 rounded mb-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded border">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
            <div className="bg-white p-3 rounded border">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h2 className="text-lg font-semibold mb-3 text-blue-900">
        Overview for {user.email}
        {user.name && <span className="text-sm font-normal text-blue-700"> ({user.name})</span>}
      </h2>
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
  );
} 