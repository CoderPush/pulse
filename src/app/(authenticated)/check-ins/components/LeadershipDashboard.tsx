'use client';

import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { PROJECT_CHECKIN_LAYER_STYLES } from '@/lib/project-checkins/constants';
import type {
  ProjectCheckinDashboardProject,
  ProjectCheckinMetricDefinition,
  ProjectCheckinMetricKey,
} from '@/types/project-checkin';
import { PROJECT_CHECKIN_METRIC_KEYS } from '@/types/project-checkin';
import { cn } from '@/lib/utils';

type LeadershipDashboardProps = {
  projects: ProjectCheckinDashboardProject[];
  definitions: ProjectCheckinMetricDefinition[];
};

function avg(values: Array<number | null | undefined>): number | null {
  const valid = values.filter((value): value is number => value != null);
  if (!valid.length) return null;
  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

function getScoreColor(value: number | null | undefined): string {
  if (value == null) return '#94a3b8';
  if (value >= 4.5) return '#059669';
  if (value >= 3.5) return '#16a34a';
  if (value >= 2.5) return '#ca8a04';
  if (value >= 1.5) return '#ea580c';
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

function scoreDelta(values: Array<number | null | undefined>, index: number): number | null {
  if (index <= 0) return null;
  const current = values[index];
  const previous = values[index - 1];
  if (current == null || previous == null) return null;
  return Math.round((current - previous) * 10) / 10;
}

function DeltaChip({ value }: { value: number | null }) {
  if (value == null || value === 0) {
    return <span className="text-[11px] text-slate-400">—</span>;
  }

  return (
    <span className={cn('text-[11px] font-bold', value > 0 ? 'text-emerald-600' : 'text-red-600')}>
      {value > 0 ? `↑${value}` : `↓${Math.abs(value)}`}
    </span>
  );
}

function HealthCell({ value, size = 34 }: { value: number | null; size?: number }) {
  return (
    <div
      className="inline-flex items-center justify-center rounded-lg border-[1.5px] font-extrabold"
      style={{
        width: size,
        height: size,
        color: getScoreColor(value),
        background: getScoreBg(value),
        borderColor: `${getScoreColor(value)}30`,
        fontSize: Math.max(12, size * 0.38),
      }}
    >
      {value ?? '—'}
    </div>
  );
}

function projectOverall(project: ProjectCheckinDashboardProject, weekIndex: number): number | null {
  return avg(PROJECT_CHECKIN_METRIC_KEYS.map((key) => project.teamScoresByWeek[key]?.[weekIndex] ?? null));
}

function ProjectDetail({
  project,
  definitions,
  latestWeekIndex,
  selectedWeekIndices,
  selectedPeriodLabel,
  onBack,
}: {
  project: ProjectCheckinDashboardProject;
  definitions: ProjectCheckinMetricDefinition[];
  latestWeekIndex: number;
  selectedWeekIndices: number[];
  selectedPeriodLabel: string;
  onBack: () => void;
}) {
  const definitionMap = useMemo(
    () => new Map(definitions.map((definition) => [definition.metric_key, definition])),
    [definitions],
  );

  const trendData = useMemo(
    () =>
      project.weeks.map((week, weekIndex) => {
        const row: Record<string, number | string | null> = {
          week: week.label,
          overall: projectOverall(project, weekIndex),
        };
        for (const metricKey of PROJECT_CHECKIN_METRIC_KEYS) {
          row[metricKey] = project.teamScoresByWeek[metricKey]?.[weekIndex] ?? null;
        }
        return row;
      }),
    [project],
  );

  const radarData = useMemo(
    () =>
      PROJECT_CHECKIN_METRIC_KEYS.map((metricKey) => {
        const current = project.teamScoresByWeek[metricKey]?.[latestWeekIndex] ?? null;
        const previous = project.teamScoresByWeek[metricKey]?.[latestWeekIndex - 1] ?? null;
        return {
          metric:
            definitionMap
              .get(metricKey)
              ?.name.split(' ')
              .slice(0, 2)
              .join(' ') ?? metricKey,
          current: current ?? 0,
          previous: previous ?? 0,
          hasCurrent: current != null,
        };
      }).filter((item) => item.hasCurrent),
    [definitionMap, latestWeekIndex, project],
  );

  const latestWeekLabel = selectedPeriodLabel || project.weeks[latestWeekIndex]?.label || 'Latest';
  const latestOverall = projectOverall(project, latestWeekIndex);
  const latestLearnWeek = project.teamLearnings.find((learning) => learning.weekIndex === latestWeekIndex);
  const latestTags = latestLearnWeek ? [...new Set(latestLearnWeek.tags)] : [];
  const recentNotes = project.teamLearnings
    .filter((learning) => learning.note.trim().length > 0)
    .slice(0, 3);
  const submittedUsersForPeriod = Array.from(
    new Map(
      selectedWeekIndices
        .flatMap((weekIndex) => project.submittedUsersByWeek[weekIndex] ?? [])
        .map((user) => [user.id, user]),
    ).values(),
  ).sort((a, b) => a.name.localeCompare(b.name));
  const submittedIds = new Set(submittedUsersForPeriod.map((user) => user.id));
  const missingUsersForPeriod = project.participantPool
    .filter((user) => !submittedIds.has(user.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-[13px] font-bold text-indigo-600 transition-colors hover:text-indigo-500"
      >
        ← Back to Portfolio
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-extrabold text-slate-900">{project.name}</div>
          <div className="text-[13px] text-slate-500">Project deep dive · {latestWeekLabel}</div>
        </div>
        <div className="flex gap-2">
          <div
            className="rounded-xl border-[1.5px] px-4 py-2 text-center"
            style={{
              borderColor: `${getScoreColor(latestOverall)}40`,
              background: getScoreBg(latestOverall),
            }}
          >
            <div className="text-[10px] font-semibold text-slate-400">Health</div>
            <div className="text-2xl font-extrabold" style={{ color: getScoreColor(latestOverall) }}>
              {latestOverall ?? '—'}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-center">
            <div className="text-[10px] font-semibold text-slate-400">Responses</div>
            <div className="text-2xl font-extrabold text-cyan-700">
              {submittedUsersForPeriod.length}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECT_CHECKIN_METRIC_KEYS.map((metricKey) => {
          const definition = definitionMap.get(metricKey);
          const current = project.teamScoresByWeek[metricKey]?.[latestWeekIndex] ?? null;
          const delta = scoreDelta(project.teamScoresByWeek[metricKey], latestWeekIndex);
          const layerStyle = definition ? PROJECT_CHECKIN_LAYER_STYLES[definition.layer] : null;

          return (
            <div
              key={metricKey}
              className="rounded-xl border-[1.5px] bg-white px-3.5 py-3"
              style={{ borderColor: `${getScoreColor(current)}30` }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-[0.08em]"
                style={{ color: layerStyle?.color ?? '#64748b' }}
              >
                {definition?.layer ?? 'metric'}
              </div>
              <div className="mt-0.5 text-[13px] font-bold text-slate-800">
                {definition?.name ?? metricKey}
              </div>
              <div className="mt-2 flex items-end gap-2">
                <div className="text-2xl font-extrabold" style={{ color: getScoreColor(current) }}>
                  {current ?? '—'}
                </div>
                <DeltaChip value={delta} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border-[1.5px] border-slate-200 bg-white p-4">
          <div className="mb-2 text-[14px] font-bold text-slate-900">Health Trend (5 weeks)</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="overall" stroke="#0f172a" strokeWidth={2.5} dot={{ r: 3.5 }} />
                <Line type="monotone" dataKey="clarity" stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line
                  type="monotone"
                  dataKey="delivery_progress"
                  stroke="#0891b2"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="client_alignment"
                  stroke="#059669"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border-[1.5px] border-slate-200 bg-white p-4">
          <div className="mb-2 text-[14px] font-bold text-slate-900">Current vs Last Week</div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9 }} />
                <Radar
                  name="This Week"
                  dataKey="current"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Radar
                  name="Last Week"
                  dataKey="previous"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.06}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border-[1.5px] border-slate-200 bg-white p-4">
          <div className="mb-3 text-[14px] font-bold text-slate-900">
            Submitted ({submittedUsersForPeriod.length})
          </div>
          {submittedUsersForPeriod.length === 0 ? (
            <div className="text-[12px] text-slate-500">No submissions in this period.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {submittedUsersForPeriod.map((user) => (
                <span
                  key={user.id}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                >
                  {user.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border-[1.5px] border-slate-200 bg-white p-4">
          <div className="mb-3 text-[14px] font-bold text-slate-900">
            Missing ({missingUsersForPeriod.length})
          </div>
          {missingUsersForPeriod.length === 0 ? (
            <div className="text-[12px] text-slate-500">No one missing in this period.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {missingUsersForPeriod.map((user) => (
                <span
                  key={user.id}
                  className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-800"
                >
                  {user.name}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border-[1.5px] border-slate-200 bg-white p-4">
          <div className="mb-3 text-[14px] font-bold text-slate-900">Top Tags (This Week)</div>
          {latestTags.length === 0 ? (
            <div className="text-[12px] text-slate-500">No tagged insights this week.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {latestTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border-[1.5px] border-slate-200 bg-white p-4">
          <div className="mb-3 text-[14px] font-bold text-slate-900">Team Notes (Recent)</div>
          {recentNotes.length === 0 ? (
            <div className="text-[12px] text-slate-500">No recent notes yet.</div>
          ) : (
            <div className="space-y-2">
              {recentNotes.map((learning) => (
                <div
                  key={`${learning.weekIndex}-${learning.note}`}
                  className="rounded-lg border-l-[3px] border-indigo-300 bg-slate-50 px-3 py-2 text-[12px] text-slate-700"
                >
                  <span className="mr-2 font-semibold text-slate-500">{learning.weekLabel}</span>
                  {learning.note}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LeadershipDashboard({
  projects,
  definitions,
}: LeadershipDashboardProps) {
  const totalWeeks = projects[0]?.weeks.length ?? 0;
  const [activeWeekIndex, setActiveWeekIndex] = useState(() =>
    totalWeeks > 0 ? totalWeeks - 1 : 0,
  );
  const [timeScale, setTimeScale] = useState<'weeks' | 'months'>('weeks');
  const [projectFilter, setProjectFilter] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const safeWeekIndex =
    totalWeeks > 0 ? Math.max(0, Math.min(activeWeekIndex, totalWeeks - 1)) : 0;
  const definitionMap = useMemo(
    () => new Map(definitions.map((definition) => [definition.metric_key, definition])),
    [definitions],
  );

  const monthChips = useMemo(() => {
    if (!projects[0]?.weeks.length)
      return [] as { key: string; label: string; weekIndices: number[] }[];
    const weeks = projects[0].weeks;
    const buckets = new Map<string, { label: string; weekIndices: number[] }>();
    weeks.forEach((week, idx) => {
      const monthAbbrev = (week.label ?? '').split(' ')[0] ?? '';
      const key = `${monthAbbrev}-${week.year}`;
      const label = `${monthAbbrev} ${week.year}`;
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
    const activeMonth = monthChips.find((month) => month.weekIndices.includes(safeWeekIndex));
    return activeMonth?.weekIndices ?? [safeWeekIndex];
  }, [monthChips, safeWeekIndex, timeScale, totalWeeks]);

  const selectedPeriodLabel =
    timeScale === 'weeks'
      ? projects[0]?.weeks[safeWeekIndex]?.label ?? 'Latest'
      : monthChips.find((month) => month.weekIndices.includes(safeWeekIndex))?.label ?? 'Latest';

  const filteredProjects = useMemo(() => {
    if (!projectFilter.trim()) return projects;
    const lower = projectFilter.toLowerCase();
    return projects.filter((project) => project.name.toLowerCase().includes(lower));
  }, [projectFilter, projects]);

  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  function overallForPeriod(project: ProjectCheckinDashboardProject, weekIndices: number[]): number | null {
    return avg(
      PROJECT_CHECKIN_METRIC_KEYS.flatMap((metricKey) =>
        weekIndices.map((weekIdx) => project.teamScoresByWeek[metricKey]?.[weekIdx] ?? null),
      ),
    );
  }

  function metricAverageForPeriod(
    project: ProjectCheckinDashboardProject,
    metricKey: ProjectCheckinMetricKey,
    weekIndices: number[],
  ): number | null {
    return avg(weekIndices.map((weekIdx) => project.teamScoresByWeek[metricKey]?.[weekIdx] ?? null));
  }

  const portfolioStats = useMemo(() => {
    const metricAverages: Partial<Record<ProjectCheckinMetricKey, number | null>> = {};
    for (const metricKey of PROJECT_CHECKIN_METRIC_KEYS) {
      metricAverages[metricKey] = avg(
        filteredProjects.map((project) => metricAverageForPeriod(project, metricKey, activeWeekIndices)),
      );
    }

    const overallByProject = filteredProjects.map((project) => overallForPeriod(project, activeWeekIndices));

    return {
      metricAverages,
      firmOverall: avg(overallByProject),
      needsAttention: filteredProjects.filter((project) => {
        const score = overallForPeriod(project, activeWeekIndices);
        return score != null && score < 2.5;
      }).length,
      criticalProjects: filteredProjects.filter((project) => {
        const score = overallForPeriod(project, activeWeekIndices);
        return score != null && score <= 2;
      }),
    };
  }, [activeWeekIndices, filteredProjects]);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-5 py-8 text-center">
        <div className="mb-2 text-base font-bold text-indigo-900">No project check-in data yet</div>
        <div className="text-sm text-indigo-700">
          Leadership dashboard will appear after teams submit weekly project check-ins.
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectDetail
        project={selectedProject}
        definitions={definitions}
        latestWeekIndex={safeWeekIndex}
        selectedWeekIndices={activeWeekIndices}
        selectedPeriodLabel={selectedPeriodLabel}
        onBack={() => setSelectedProjectId(null)}
      />
    );
  }

  return (
    <div>
      <div className="mb-1 text-xl font-extrabold text-slate-900">Portfolio Overview</div>
      <p className="mb-4 text-[13px] text-slate-500">
        Click any project to open detailed view. Data source is the latest project check-in window.
      </p>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-500">Time</span>
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
              {projects[0].weeks.map((week, idx) => (
                <button
                  key={`${week.year}-${week.weekNumber}`}
                  type="button"
                  onClick={() => setActiveWeekIndex(idx)}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px]',
                    idx === safeWeekIndex
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >
                  {idx === totalWeeks - 1 ? 'Latest' : week.label}
                </button>
              ))}
            </div>
          )}

          {timeScale === 'months' && monthChips.length > 0 && (
            <div className="ml-2 flex flex-wrap gap-1">
              {monthChips.map((month) => (
                <button
                  key={month.key}
                  type="button"
                  onClick={() =>
                    setActiveWeekIndex(
                      month.weekIndices[month.weekIndices.length - 1] ?? 0,
                    )
                  }
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px]',
                    month.weekIndices.includes(safeWeekIndex)
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
                  )}
                >
                  {month.label}
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
            onChange={(event) => setProjectFilter(event.target.value)}
            placeholder="Search projects"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-700 outline-none ring-0 placeholder:text-slate-400 focus:border-indigo-400"
          />
        </div>
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border-[1.5px] border-slate-200 bg-white px-4 py-3">
          <div className="text-[11px] font-semibold text-slate-400">Active Projects</div>
          <div className="mt-1 text-3xl font-extrabold text-slate-900">{filteredProjects.length}</div>
        </div>
        <div className="rounded-xl border-[1.5px] border-slate-200 bg-white px-4 py-3">
          <div className="text-[11px] font-semibold text-slate-400">Firm Health Avg</div>
          <div className="mt-1 text-3xl font-extrabold" style={{ color: getScoreColor(portfolioStats.firmOverall) }}>
            {portfolioStats.firmOverall ?? '—'}
          </div>
        </div>
        <div
          className="rounded-xl border-[1.5px] px-4 py-3"
          style={{
            borderColor: portfolioStats.needsAttention > 0 ? '#fca5a5' : '#86efac',
            background: portfolioStats.needsAttention > 0 ? '#fef2f2' : '#f0fdf4',
          }}
        >
          <div className="text-[11px] font-semibold text-slate-500">Need Attention</div>
          <div className={cn('mt-1 text-3xl font-extrabold', portfolioStats.needsAttention > 0 ? 'text-red-600' : 'text-emerald-600')}>
            {portfolioStats.needsAttention}
          </div>
        </div>
      </div>

      <div className="rounded-xl border-[1.5px] border-slate-200 bg-white">
        <table className="w-full table-fixed border-collapse">
          <colgroup>
            <col className="w-[18%]" />
            <col className="w-[6%]" />
            {PROJECT_CHECKIN_METRIC_KEYS.map((metricKey) => (
              <col key={metricKey} className="w-[7.2%]" />
            ))}
            <col className="w-[5%]" />
          </colgroup>
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-3 text-left text-[12px] font-bold text-slate-500">
                Project
              </th>
              <th className="px-1 py-3 text-center text-[10px] font-bold text-slate-500">AVG</th>
              {PROJECT_CHECKIN_METRIC_KEYS.map((metricKey) => {
                const definition = definitionMap.get(metricKey);
                const layerStyle = definition ? PROJECT_CHECKIN_LAYER_STYLES[definition.layer] : null;
                return (
                  <th
                    key={metricKey}
                    className="px-1 py-3 text-center text-[9px] font-bold leading-tight"
                    style={{ color: layerStyle?.color ?? '#64748b' }}
                    title={definition?.name ?? metricKey}
                  >
                    {(definition?.name ?? metricKey)
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => (
                        <div key={part}>{part}</div>
                      ))}
                  </th>
                );
              })}
              <th className="px-1 py-3 text-center text-[10px] font-bold text-slate-500">Δ</th>
            </tr>
          </thead>

          <tbody>
            {filteredProjects.map((project) => {
              const overall = overallForPeriod(project, activeWeekIndices);
              let previousOverall: number | null = null;
              if (timeScale === 'weeks') {
                previousOverall =
                  safeWeekIndex > 0
                    ? overallForPeriod(project, [safeWeekIndex - 1])
                    : null;
              } else {
                const activeMonthIndex = monthChips.findIndex((month) =>
                  month.weekIndices.includes(safeWeekIndex),
                );
                if (activeMonthIndex > 0) {
                  const previousMonthWeekIndices =
                    monthChips[activeMonthIndex - 1].weekIndices;
                  previousOverall = overallForPeriod(
                    project,
                    previousMonthWeekIndices,
                  );
                }
              }
              const delta =
                overall != null && previousOverall != null
                  ? Math.round((overall - previousOverall) * 10) / 10
                  : null;

              return (
                <tr
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className="cursor-pointer border-t border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5">
                    <div className="truncate text-[13px] font-bold text-slate-900">{project.name}</div>
                    <div className="text-[10px] text-slate-400">{selectedPeriodLabel}</div>
                  </td>
                  <td className="px-1 py-2 text-center">
                    <HealthCell value={overall} />
                  </td>
                  {PROJECT_CHECKIN_METRIC_KEYS.map((metricKey) => (
                    <td key={metricKey} className="px-1 py-2 text-center">
                      <HealthCell
                        value={metricAverageForPeriod(
                          project,
                          metricKey,
                          activeWeekIndices,
                        )}
                        size={32}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-2 text-center">
                    <DeltaChip value={delta} />
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="px-4 py-2.5 text-[12px] font-bold text-slate-600">
                Firm Average
              </td>
              <td className="px-1 py-2 text-center">
                <HealthCell value={portfolioStats.firmOverall} />
              </td>
              {PROJECT_CHECKIN_METRIC_KEYS.map((metricKey) => (
                <td key={metricKey} className="px-1 py-2 text-center">
                  <HealthCell value={portfolioStats.metricAverages[metricKey] ?? null} size={32} />
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {portfolioStats.criticalProjects.length > 0 && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <div className="mb-1 text-[13px] font-bold text-red-700">Critical Signals</div>
          <div className="flex flex-wrap gap-1.5">
            {portfolioStats.criticalProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProjectId(project.id)}
                className="rounded-full border border-red-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-100"
              >
                {project.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
