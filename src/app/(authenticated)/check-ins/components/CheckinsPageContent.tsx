'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type {
  ProjectCheckinDashboardProject,
  ProjectCheckinHistoryEntry,
  ProjectCheckinMetricDefinition,
} from '@/types/project-checkin';
import MyProjectsDashboard from './MyProjectsDashboard';
import ProjectCheckinHistoryList from './ProjectCheckinHistoryList';

type CheckinsPageContentProps = {
  dashboardProjects: ProjectCheckinDashboardProject[];
  definitions: ProjectCheckinMetricDefinition[];
  historyEntries: ProjectCheckinHistoryEntry[];
};

const tabs = [
  { key: 'my', label: 'My Projects', countKey: 'my' as const },
  { key: 'history', label: 'History', countKey: 'history' as const },
];

export default function CheckinsPageContent({
  dashboardProjects,
  definitions,
  historyEntries,
}: CheckinsPageContentProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'history'>('my');

  return (
    <div className="min-h-screen bg-[#fafaf7]">
      {/* Header — matches prototype dark bar */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-[#1e1e2e] px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 text-base font-extrabold text-white">
            H
          </div>
          <div>
            <div className="font-bold text-[#cdd6f4] text-[15px]">
              Project Health
            </div>
            <div className="text-[11px] text-slate-500">
              Check-ins · Weekly project health
            </div>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="rounded-lg bg-indigo-600 font-semibold text-white hover:bg-indigo-500"
        >
          <Link href="/check-ins/new">
            <Plus className="mr-2 h-4 w-4" />
            New check-in
          </Link>
        </Button>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        {tabs.map((tab) => {
          const count =
            tab.countKey === 'my'
              ? dashboardProjects.length
              : historyEntries.length;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'my' | 'history')}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-4 py-3 text-[13px] font-medium transition-colors',
                isActive
                  ? 'border-indigo-600 text-slate-800 font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-600',
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <main className="mx-auto max-w-[900px] px-5 py-6">
        {activeTab === 'my' && (
          <MyProjectsDashboard
            projects={dashboardProjects}
            definitions={definitions}
          />
        )}
        {activeTab === 'history' && (
          <div>
            <div className="mb-1 text-base font-extrabold text-slate-800">
              Check-in history
            </div>
            <p className="mb-4 text-[13px] text-slate-500">
              Your past project check-ins and metric scores.
            </p>
            <ProjectCheckinHistoryList
              entries={historyEntries}
              definitions={definitions}
            />
          </div>
        )}
      </main>
    </div>
  );
}
