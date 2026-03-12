'use client';

import { useMemo, useState } from 'react';

import type {
  ProjectCheckinDashboardProject,
  ProjectCheckinMetricDefinition,
  ProjectCheckinMetricKey,
} from '@/types/project-checkin';
import { PROJECT_CHECKIN_METRIC_KEYS } from '@/types/project-checkin';
import { PROJECT_CHECKIN_LAYER_STYLES } from '@/lib/project-checkins/constants';
import { cn } from '@/lib/utils';

function getScoreColor(value: number | null | undefined): string {
  if (value == null) return '#94a3b8';
  if (value >= 4.5) return '#059669';
  if (value >= 3.5) return '#16a34a';
  if (value >= 2.5) return '#eab308';
  if (value >= 1.5) return '#f97316';
  return '#dc2626';
}

function getScoreBg(value: number | null | undefined): string {
  if (value == null) return '#f8fafc';
  if (value >= 4.5) return '#ecfdf5';
  if (value >= 3.5) return '#f0fdf4';
  if (value >= 2.5) return '#fefce8';
  if (value >= 1.5) return '#fff7ed';
  return '#fef2f2';
}

function ScoreBar({
  value,
  height = 5,
}: {
  value: number | null | undefined;
  height?: number;
}) {
  const pct = value != null ? (value / 5) * 100 : 0;
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-slate-200"
      style={{ height, borderRadius: height / 2 }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{
          width: `${pct}%`,
          background: getScoreColor(value),
          borderRadius: height / 2,
        }}
      />
    </div>
  );
}

type AllProjectsDashboardProps = {
  projects: ProjectCheckinDashboardProject[];
  definitions: ProjectCheckinMetricDefinition[];
  myProjectIds: string[];
};

export default function AllProjectsDashboard({
  projects,
  definitions,
  myProjectIds,
}: AllProjectsDashboardProps) {
  const totalWeeks = projects[0]?.weeks.length ?? 0;
  const [activeWeekIndex, setActiveWeekIndex] = useState(() =>
    totalWeeks > 0 ? totalWeeks - 1 : 0,
  );
  const [timeScale, setTimeScale] = useState<'weeks' | 'months'>('weeks');
  const [projectFilter, setProjectFilter] = useState('');

  const safeWeekIndex =
    totalWeeks > 0 ? Math.max(0, Math.min(activeWeekIndex, totalWeeks - 1)) : 0;

  const defMap = new Map<ProjectCheckinMetricKey, ProjectCheckinMetricDefinition>(
    definitions.map((d) => [d.metric_key, d]),
  );

  const visibleProjects = useMemo(() => {
    if (!projectFilter.trim()) return projects;
    const q = projectFilter.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, projectFilter]);

  const monthChips = useMemo(() => {
    if (!projects[0]?.weeks.length)
      return [] as { key: string; label: string; weekIndices: number[] }[];
    const weeks = projects[0].weeks;
    const buckets = new Map<string, { label: string; weekIndices: number[] }>();
    weeks.forEach((w, idx) => {
      const monthAbbrev = (w.label ?? '').split(' ')[0] ?? '';
      const key = `${monthAbbrev}-${w.year}`;
      const label = `${monthAbbrev} ${w.year}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.weekIndices.push(idx);
      } else {
        buckets.set(key, { label, weekIndices: [idx] });
      }
    });
    return Array.from(buckets.entries()).map(([key, value]) => ({
      key,
      label: value.label,
      weekIndices: value.weekIndices,
    }));
  }, [projects]);

  const activeWeekIndices = useMemo(() => {
    if (totalWeeks === 0) return [] as number[];
    if (timeScale === 'weeks') return [safeWeekIndex];
    const activeMonth = monthChips.find((m) => m.weekIndices.includes(safeWeekIndex));
    return activeMonth?.weekIndices ?? [safeWeekIndex];
  }, [monthChips, safeWeekIndex, timeScale, totalWeeks]);

  const firmAvg: Partial<Record<ProjectCheckinMetricKey, number | null>> = {};
  for (const k of PROJECT_CHECKIN_METRIC_KEYS) {
    const perProjectAverages: number[] = [];
    for (const p of visibleProjects) {
      const weekVals = activeWeekIndices
        .map((idx) => p.teamScoresByWeek[k]?.[idx] ?? null)
        .filter((v): v is number => v != null);
      if (!weekVals.length) continue;
      const projectAvg =
        weekVals.reduce((a, b) => a + b, 0) / weekVals.length;
      perProjectAverages.push(projectAvg);
    }
    if (!perProjectAverages.length) {
      firmAvg[k] = null;
    } else {
      const avg =
        perProjectAverages.reduce((a, b) => a + b, 0) / perProjectAverages.length;
      firmAvg[k] = Math.round(avg * 10) / 10;
    }
  }

  return (
    <div className="space-y-4">
      {/* Controls: time + project filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">
            Time
          </span>
          <div className="inline-flex rounded-full bg-slate-100 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setTimeScale('weeks')}
              className={cn(
                'rounded-full px-2.5 py-0.5',
                timeScale === 'weeks'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500',
              )}
            >
              Weeks
            </button>
            <button
              type="button"
              onClick={() => setTimeScale('months')}
              className={cn(
                'rounded-full px-2.5 py-0.5',
                timeScale === 'months'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500',
              )}
            >
              Months
            </button>
          </div>

          {timeScale === 'weeks' && totalWeeks > 0 && (
            <div className="ml-2 flex flex-wrap gap-1">
              {projects[0].weeks.map((w, idx) => (
                <button
                  key={`${w.year}-${w.weekNumber}`}
                  type="button"
                  onClick={() => setActiveWeekIndex(idx)}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px]',
                    idx === safeWeekIndex
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >
                  {idx === totalWeeks - 1 ? 'Latest' : w.label}
                </button>
              ))}
            </div>
          )}

          {timeScale === 'months' && monthChips.length > 0 && (
            <div className="ml-2 flex flex-wrap gap-1">
              {monthChips.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() =>
                    setActiveWeekIndex(
                      m.weekIndices[m.weekIndices.length - 1] ?? 0,
                    )
                  }
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px]',
                    m.weekIndices.includes(safeWeekIndex)
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Filter</span>
          <input
            type="text"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            placeholder="Search projects"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
      </div>
      {/* Firm health bars */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div className="mb-3 text-[13px] font-bold text-slate-800">
          Organization-wide Metrics
        </div>
        {totalWeeks === 0 || !visibleProjects.length ? (
          <div className="text-[12px] text-slate-500">
            No project check-ins available for the selected window.
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECT_CHECKIN_METRIC_KEYS.map((k) => {
              const v = firmAvg[k];
              if (v == null) return null;
              const def = defMap.get(k);
              const layerStyle = def ? PROJECT_CHECKIN_LAYER_STYLES[def.layer] : null;
              return (
                <div key={k} className="flex items-center gap-2">
                  <span
                    className="w-[70px] flex-shrink-0 text-right text-[10px] font-semibold"
                    style={{ color: layerStyle?.color ?? '#64748b' }}
                  >
                    {def?.name.split(' ')[0] ?? k}
                  </span>
                  <ScoreBar value={v} height={8} />
                  <span
                    className="w-7 text-right text-[12px] font-extrabold"
                    style={{ color: getScoreColor(v) }}
                  >
                    {v.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {visibleProjects.map((p) => {
          const idx = safeWeekIndex;
          const currentWeekIndices =
            timeScale === 'weeks' ? [idx] : activeWeekIndices;

          const teamVals = PROJECT_CHECKIN_METRIC_KEYS.flatMap((k) =>
            currentWeekIndices
              .map((weekIdx) => p.teamScoresByWeek[k]?.[weekIdx] ?? null)
              .filter((v): v is number => v != null),
          );
          const overall =
            teamVals.length > 0
              ? Math.round(
                  (teamVals.reduce((a, b) => a + b, 0) / teamVals.length) * 10,
                ) / 10
              : null;

          let prevOverall: number | null = null;
          if (timeScale === 'weeks') {
            const prevTeamVals =
              idx > 0
                ? PROJECT_CHECKIN_METRIC_KEYS.map(
                    (k) => p.teamScoresByWeek[k]?.[idx - 1] ?? null,
                  ).filter((v): v is number => v != null)
                : [];
            prevOverall =
              prevTeamVals.length > 0
                ? Math.round(
                    (prevTeamVals.reduce((a, b) => a + b, 0) /
                      prevTeamVals.length) *
                      10,
                  ) / 10
                : null;
          } else {
            const activeMonthIndex = monthChips.findIndex((m) =>
              m.weekIndices.includes(safeWeekIndex),
            );
            if (activeMonthIndex > 0) {
              const prevMonthWeeks = monthChips[activeMonthIndex - 1].weekIndices;
              const prevTeamVals = PROJECT_CHECKIN_METRIC_KEYS.flatMap((k) =>
                prevMonthWeeks
                  .map((weekIdx) => p.teamScoresByWeek[k]?.[weekIdx] ?? null)
                  .filter((v): v is number => v != null),
              );
              if (prevTeamVals.length > 0) {
                prevOverall = Math.round(
                  (prevTeamVals.reduce((a, b) => a + b, 0) /
                    prevTeamVals.length) *
                    10,
                ) / 10;
              }
            }
          }
          const delta =
            overall != null && prevOverall != null
              ? Math.round((overall - prevOverall) * 10) / 10
              : null;

          let lowest: { key: ProjectCheckinMetricKey; value: number } | null = null;
          let highest: { key: ProjectCheckinMetricKey; value: number } | null = null;
          for (const k of PROJECT_CHECKIN_METRIC_KEYS) {
            const v = p.teamScoresByWeek[k]?.[idx] ?? null;
            if (v == null) continue;
            if (!lowest || v < lowest.value) lowest = { key: k, value: v };
            if (!highest || v > highest.value) highest = { key: k, value: v };
          }

          const isMine = myProjectIds.includes(p.id);

          return (
            <div
              key={p.id}
              className="relative rounded-xl border border-slate-200 bg-white px-4 py-3.5"
            >
              {isMine && (
                <div className="absolute right-3 top-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-bold text-indigo-600">
                  MY PROJECT
                </div>
              )}
              <div className="mb-2 flex items-center gap-2">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-extrabold"
                  style={{
                    background: getScoreBg(overall),
                    border: `1.5px solid ${getScoreColor(overall)}30`,
                    color: getScoreColor(overall),
                  }}
                >
                  {overall ?? '—'}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-slate-900">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {timeScale === 'weeks'
                      ? p.weeks[idx]?.label ?? ''
                      : monthChips.find((m) =>
                          m.weekIndices.includes(safeWeekIndex),
                        )?.label ?? ''}
                  </div>
                </div>
                {delta != null && delta !== 0 && (
                  <div className="ml-auto text-[11px] font-bold">
                    <span
                      className={
                        delta > 0 ? 'text-emerald-600' : 'text-red-600'
                      }
                    >
                      {delta > 0 ? `↑${delta}` : `↓${Math.abs(delta)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Metric mini bars */}
              <div className="mb-2 flex flex-col gap-1">
                {PROJECT_CHECKIN_METRIC_KEYS.map((k) => {
                  const v = p.teamScoresByWeek[k]?.[idx] ?? null;
                  if (v == null) return null;
                  const def = defMap.get(k);
                  return (
                    <div key={k} className="flex items-center gap-1.5">
                      <span className="w-[52px] flex-shrink-0 text-right text-[8px] text-slate-400">
                        {def?.name.split(' ')[0] ?? k}
                      </span>
                      <ScoreBar value={v} />
                    </div>
                  );
                })}
              </div>

              {/* Highlights */}
              <div className="flex flex-wrap gap-1.5">
                {lowest && lowest.value <= 2 && (
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                    ⚠{' '}
                    {defMap.get(lowest.key)?.name.split(' ')[0] ??
                      lowest.key}{' '}
                    ({lowest.value})
                  </span>
                )}
                {highest && highest.value >= 4 && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    ★{' '}
                    {defMap.get(highest.key)?.name.split(' ')[0] ??
                      highest.key}{' '}
                    ({highest.value})
                  </span>
                )}
              </div>

              {/* Highlight learning tag & note */}
              {p.teamLearnings.length > 0 && (
                <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5">
                  <div className="mb-0.5 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold text-emerald-800">
                      Team learning · {p.teamLearnings[0].weekLabel}
                    </span>
                    {p.teamLearnings[0].score != null && (
                      <span className="text-[10px] font-bold text-emerald-700">
                        {p.teamLearnings[0].score}
                      </span>
                    )}
                  </div>
                  {p.teamLearnings[0].tags.length > 0 && (
                    <div className="mb-0.5 flex flex-wrap gap-1">
                      {p.teamLearnings[0].tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.teamLearnings[0].note && (
                    <div className="whitespace-pre-wrap text-[11px] leading-snug text-emerald-900">
                      {p.teamLearnings[0].note}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

