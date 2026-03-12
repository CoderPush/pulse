'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type {
  ProjectCheckinDashboardProject,
  ProjectCheckinHistoryEntry,
  ProjectCheckinMetricDefinition,
} from '@/types/project-checkin';
import MyProjectsDashboard from './MyProjectsDashboard';
import AllProjectsDashboard from './AllProjectsDashboard';
import ProjectCheckinHistoryList from './ProjectCheckinHistoryList';

type CheckinsPageContentProps = {
  myProjects: ProjectCheckinDashboardProject[];
  allProjects: ProjectCheckinDashboardProject[];
  myProjectIds: string[];
  definitions: ProjectCheckinMetricDefinition[];
  historyEntries: ProjectCheckinHistoryEntry[];
};

const tabs = [
  { key: 'my', label: 'My Projects', countKey: 'my' as const },
  { key: 'all', label: 'All Projects', countKey: 'all' as const },
  { key: 'history', label: 'History', countKey: 'history' as const },
];

function ScoreGuideBadge({
  score,
  label,
  shortLabel,
  description,
}: {
  score: number;
  label: string;
  shortLabel: string;
  description?: string;
}) {
  const toneByScore: Record<number, string> = {
    1: 'border-red-200 bg-red-50 text-red-700',
    2: 'border-orange-200 bg-orange-50 text-orange-700',
    3: 'border-amber-200 bg-amber-50 text-amber-700',
    4: 'border-green-200 bg-green-50 text-green-700',
    5: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };

  return (
    <div
      className={cn(
        'rounded-md border px-2.5 py-1.5 text-[11px] leading-tight',
        toneByScore[score] ?? 'border-slate-200 bg-slate-50 text-slate-700',
      )}
    >
      <div className="font-bold">
        {score} · {label}
      </div>
      <div className="mt-0.5">{shortLabel}</div>
      {description?.trim() && (
        <div className="mt-1 text-[10px] leading-relaxed opacity-90">{description}</div>
      )}
    </div>
  );
}

export default function CheckinsPageContent({
  myProjects,
  allProjects,
  myProjectIds,
  definitions,
  historyEntries,
}: CheckinsPageContentProps) {
  const [activeTab, setActiveTab] = useState<'my' | 'all' | 'history'>('my');

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
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="inline-flex h-9 items-center rounded-lg border border-slate-600 bg-slate-800 px-3 text-[12px] font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-700"
              >
                Benchmark guide
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-[860px] overflow-hidden p-0 sm:max-w-[860px]">
              <div className="max-h-[85vh] overflow-y-auto p-5">
                <DialogHeader className="mb-4">
                  <DialogTitle>Project Health Metric Benchmarks</DialogTitle>
                  <DialogDescription>
                    Shared scoring guide for all project check-in metrics (1-5 scale).
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                  {definitions.map((definition) => (
                    <section
                      key={definition.metric_key}
                      className="rounded-xl border border-slate-200 bg-white p-3.5"
                    >
                      <div className="mb-1.5">
                        <div className="text-[14px] font-bold text-slate-800">{definition.name}</div>
                        <div className="text-[12px] text-slate-500">{definition.prompt}</div>
                      </div>

                      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                        {definition.scale_guide
                          .slice()
                          .sort((a, b) => a.score - b.score)
                          .map((guide) => (
                            <ScoreGuideBadge
                              key={`${definition.metric_key}-${guide.score}`}
                              score={guide.score}
                              label={guide.label}
                              shortLabel={guide.shortLabel}
                              description={guide.description}
                            />
                          ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </DialogContent>
          </Dialog>

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
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 bg-white px-6">
        {tabs.map((tab) => {
          const count =
            tab.countKey === 'my'
              ? myProjects.length
              : tab.countKey === 'all'
              ? allProjects.length
              : historyEntries.length;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'my' | 'all' | 'history')}
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
            projects={myProjects}
            definitions={definitions}
          />
        )}
        {activeTab === 'all' && (
          <div>
            <div className="mb-1 text-base font-extrabold text-slate-800">
              All Projects
            </div>
            <p className="mb-4 text-[13px] text-slate-500">
              See how all projects are doing, spot patterns, and find teams you
              can help.
            </p>
            <AllProjectsDashboard
              projects={allProjects}
              definitions={definitions}
              myProjectIds={myProjectIds}
            />
          </div>
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
