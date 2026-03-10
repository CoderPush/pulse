'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { PROJECT_CHECKIN_LAYER_STYLES, SCORE_COLORS } from '@/lib/project-checkins/constants';
import { cn } from '@/lib/utils';
import type {
  ProjectCheckinDashboardProject,
  ProjectCheckinMetricDefinition,
} from '@/types/project-checkin';
import { PROJECT_CHECKIN_METRIC_KEYS } from '@/types/project-checkin';
import { ChevronDown } from 'lucide-react';

const PERCEPTION_GAP_THRESHOLD = 1.5;

function avg(arr: (number | null)[]): number | null {
  const valid = arr.filter((v): v is number => v !== null && v !== undefined);
  if (valid.length === 0) return null;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function getScoreColor(value: number | null | undefined): string {
  if (value === null || value === undefined) return '#94a3b8';
  const sc = SCORE_COLORS[Math.round(value) as 1 | 2 | 3 | 4 | 5];
  return sc?.fill ?? '#94a3b8';
}

function getScoreBg(value: number | null | undefined): string {
  if (value === null || value === undefined) return '#f8fafc';
  const sc = SCORE_COLORS[Math.round(value) as 1 | 2 | 3 | 4 | 5];
  return sc?.bg ?? '#f8fafc';
}

function ScoreBar({
  value,
  max = 5,
  color,
  height = 8,
}: {
  value: number | null | undefined;
  max?: number;
  color?: string;
  height?: number;
}) {
  const pct =
    value !== null && value !== undefined ? (value / max) * 100 : 0;
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-slate-200 transition-[width] duration-300 ease-out"
      style={{ height, borderRadius: height / 2 }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300 ease-out"
        style={{
          width: `${pct}%`,
          background: color ?? getScoreColor(value),
          borderRadius: height / 2,
        }}
      />
    </div>
  );
}

function GapIndicator({
  myScore,
  teamScore,
}: {
  myScore: number | null;
  teamScore: number | null;
}) {
  if (myScore === null || teamScore === null) return null;
  const diff = Math.round((myScore - teamScore) * 10) / 10;
  if (Math.abs(diff) < 0.5)
    return (
      <span className="text-[10px] text-slate-400">≈ team</span>
    );
  if (diff < 0)
    return (
      <span className="text-[10px] font-bold text-red-600">
        ▼ {Math.abs(diff)} below team
      </span>
    );
  return (
    <span className="text-[10px] font-bold text-green-600">
      ▲ {diff} above team
    </span>
  );
}

function MyProjectCard({
  project,
  definitions,
  isExpanded,
  onToggle,
  activeWeekIndex,
  timeScale,
  activeWeekIndices,
  currentLabel,
}: {
  project: ProjectCheckinDashboardProject;
  definitions: ProjectCheckinMetricDefinition[];
  isExpanded: boolean;
  onToggle: () => void;
  activeWeekIndex: number;
  timeScale: 'weeks' | 'months';
  activeWeekIndices: number[];
  currentLabel: string;
}) {
  const safeWeekIndex =
    project.weeks.length > 0
      ? Math.max(0, Math.min(activeWeekIndex, project.weeks.length - 1))
      : 0;
  const indicesToUse =
    timeScale === 'weeks' ? [safeWeekIndex] : activeWeekIndices;

  const teamScoresLast = PROJECT_CHECKIN_METRIC_KEYS.flatMap((k) =>
    indicesToUse
      .map((idx) => project.teamScoresByWeek[k]?.[idx] ?? null)
      .filter((v): v is number => v !== null),
  );
  const overallTeam =
    teamScoresLast.length > 0
      ? Math.round(
          (teamScoresLast.reduce((a, b) => a + b, 0) / teamScoresLast.length) *
            10,
        ) / 10
      : null;
  const myScoresLast = project.myScoresByWeek
    ? (PROJECT_CHECKIN_METRIC_KEYS.flatMap((k) =>
        indicesToUse
          .map((idx) => project.myScoresByWeek![k]?.[idx] ?? null)
          .filter((v): v is number => v !== null),
      ) as number[])
    : [];
  const overallMy =
    myScoresLast.length > 0
      ? Math.round(
          (myScoresLast.reduce((a, b) => a + b, 0) / myScoresLast.length) * 10,
        ) / 10
      : null;

  const defMap = useMemo(
    () => new Map(definitions.map((d) => [d.metric_key, d])),
    [definitions],
  );

  const metricsWithData = PROJECT_CHECKIN_METRIC_KEYS.filter((k) =>
    indicesToUse.some((idx) => {
      const v = project.teamScoresByWeek[k]?.[idx] ?? null;
      return v !== null && v !== undefined;
    }),
  );

  return (
    <div
      className="mb-3.5 overflow-hidden rounded-[14px] border-[1.5px] bg-white transition-all duration-200"
      style={{
        borderColor: `${getScoreColor(overallTeam)}20`,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex flex-1 items-center gap-2.5">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] text-lg font-extrabold"
            style={{
              background: getScoreBg(overallTeam),
              border: `1.5px solid ${getScoreColor(overallTeam)}30`,
              color: getScoreColor(overallTeam),
            }}
          >
            {overallTeam ?? '—'}
          </div>
          <div>
            <div className="text-[15px] font-bold text-slate-800">
              {project.name}
            </div>
            <div className="text-[11px] text-slate-400">
              {currentLabel} · Team health
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {overallMy !== null && (
            <div className="text-center">
              <div className="text-[9px] font-semibold text-slate-400">
                MY AVG
              </div>
              <div
                className="text-base font-extrabold"
                style={{ color: getScoreColor(overallMy) }}
              >
                {overallMy}
              </div>
            </div>
          )}
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-400 transition-transform duration-200',
              isExpanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {/* Mini metric bars — always visible */}
      <div className="grid grid-cols-3 gap-x-3 gap-y-1.5 px-5 pb-3.5">
        {metricsWithData.map((k) => {
          const teamVal = avg(
            indicesToUse.map(
              (idx) => project.teamScoresByWeek[k]?.[idx] ?? null,
            ),
          );
          return (
            <div
              key={k}
              className="flex items-center gap-1.5"
            >
              <span className="w-[52px] flex-shrink-0 text-right text-[9px] text-slate-400">
                {defMap.get(k)?.name?.split(' ')[0] ?? k}
              </span>
              <ScoreBar value={teamVal} height={6} />
              <span
                className="w-4 text-center text-[11px] font-bold"
                style={{ color: getScoreColor(teamVal) }}
              >
                {teamVal ?? '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-slate-100 px-5 py-4">
          {/* Your Score vs Team */}
          <div className="mb-2.5 text-[13px] font-bold text-slate-800">
            Your Score vs Team Average
          </div>
          <div className="mb-5 grid gap-1.5">
            {metricsWithData.map((k) => {
              const team = avg(
                indicesToUse.map(
                  (idx) => project.teamScoresByWeek[k]?.[idx] ?? null,
                ),
              );
              const my = project.myScoresByWeek
                ? avg(
                    indicesToUse.map(
                      (idx) => project.myScoresByWeek![k]?.[idx] ?? null,
                    ),
                  )
                : null;
              const prevMy =
                timeScale === 'weeks' && safeWeekIndex > 0
                  ? project.myScoresByWeek?.[k]?.[safeWeekIndex - 1] ?? null
                  : null;
              const myDelta =
                my !== null && prevMy !== null ? my - prevMy : null;
              const layerStyle = defMap.get(k)
                ? PROJECT_CHECKIN_LAYER_STYLES[defMap.get(k)!.layer]
                : null;
              return (
                <div
                  key={k}
                  className="grid grid-cols-[110px_1fr_40px_40px_90px] items-center gap-2 border-b border-slate-50 py-1.5"
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: layerStyle?.color ?? '#64748b' }}
                  >
                    {defMap.get(k)?.name ?? k}
                  </span>
                  <div className="relative h-2.5 overflow-hidden rounded-[5px] bg-slate-200">
                    <div
                      className="absolute left-0 top-0 h-full rounded-[5px]"
                      style={{
                        width: `${((team ?? 0) / 5) * 100}%`,
                        background: `${getScoreColor(team)}30`,
                      }}
                    />
                    {my !== null && (
                      <div
                        className="absolute left-0 top-0.5 h-2 rounded rounded-[4px] transition-[width] duration-300"
                        style={{
                          width: `${(my / 5) * 100}%`,
                          background: getScoreColor(my),
                        }}
                      />
                    )}
                    <div
                      className="absolute top-[-2px] h-3.5 w-0.5 rounded-sm bg-slate-400"
                      style={{
                        left: `calc(${((team ?? 0) / 5) * 100}% - 1px)`,
                      }}
                    />
                  </div>
                  <span
                    className="text-center text-[13px] font-extrabold"
                    style={{ color: getScoreColor(my) }}
                  >
                    {my ?? '—'}
                  </span>
                  <span className="text-center text-[11px] text-slate-400">
                    {myDelta !== null && myDelta !== 0 ? (
                      <span
                        className="font-bold"
                        style={{
                          color:
                            myDelta > 0 ? '#16a34a' : '#dc2626',
                        }}
                      >
                        {myDelta > 0 ? `+${myDelta}` : myDelta}
                      </span>
                    ) : (
                      '—'
                    )}
                  </span>
                  <GapIndicator myScore={my} teamScore={team} />
                </div>
              );
            })}
          </div>

          {/* Trend chart — 5 weeks */}
          <div className="mb-2.5 text-[13px] font-bold text-slate-800">
            My Trend (5 weeks)
          </div>
          <div className="mb-5 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={project.weeks.map((w, i) => {
                  const myAvg = project.myScoresByWeek
                    ? avg(
                        PROJECT_CHECKIN_METRIC_KEYS.map(
                          (k) => project.myScoresByWeek![k]?.[i] ?? null,
                        ),
                      )
                    : null;
                  const teamAvg = avg(
                    PROJECT_CHECKIN_METRIC_KEYS.map(
                      (k) => project.teamScoresByWeek[k]?.[i] ?? null,
                    ),
                  );
                  return {
                    week: w.label,
                    myAvg,
                    teamAvg,
                  };
                })}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis
                  domain={[0, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="myAvg"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  name="My Average"
                />
                <Line
                  type="monotone"
                  dataKey="teamAvg"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Team Average"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Leadership response — placeholder / closing the loop */}
          <div className="mb-4">
            <div className="mb-2 text-[13px] font-bold text-amber-700">
              💬 Leadership Response
            </div>
            <div className="rounded-[10px] border border-amber-200/50 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-800">
              No leadership response for this project yet. Responses will
              appear here when added.
            </div>
          </div>

          {/* Team learnings */}
          <div>
            <div className="mb-2 text-[13px] font-bold text-emerald-700">
              📚 Team Learnings
            </div>
            {project.teamLearnings.length === 0 ? (
              <div className="rounded-[10px] border border-emerald-200/50 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-800">
                No team learnings shared yet for this project.
              </div>
            ) : (
              <div className="space-y-1.5">
                {project.teamLearnings.slice(0, 4).map((l, idx) => (
                  <div
                    key={`${l.weekIndex}-${idx}-${l.weekLabel}`}
                    className="rounded-[9px] border border-emerald-200/60 bg-emerald-50/80 px-3 py-2 text-[11px] text-emerald-900"
                  >
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span className="font-semibold">Week {l.weekLabel}</span>
                      {l.score != null && (
                        <span className="text-[10px] font-bold text-emerald-700">
                          Score {l.score}
                        </span>
                      )}
                    </div>
                    {l.tags.length > 0 && (
                      <div className="mb-0.5 flex flex-wrap gap-1">
                        {l.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {l.note && (
                      <div className="text-[11px] leading-snug text-emerald-900">
                        {l.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type MyProjectsDashboardProps = {
  projects: ProjectCheckinDashboardProject[];
  definitions: ProjectCheckinMetricDefinition[];
};

export default function MyProjectsDashboard({
  projects,
  definitions,
}: MyProjectsDashboardProps) {
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const totalWeeks = projects[0]?.weeks.length ?? 0;
  const [activeWeekIndex, setActiveWeekIndex] = useState(() =>
    totalWeeks > 0 ? totalWeeks - 1 : 0,
  );
  const [timeScale, setTimeScale] = useState<'weeks' | 'months'>('weeks');
  const [projectFilter, setProjectFilter] = useState('');

  const safeWeekIndex =
    totalWeeks > 0 ? Math.max(0, Math.min(activeWeekIndex, totalWeeks - 1)) : 0;

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
    const activeMonth = monthChips.find((m) =>
      m.weekIndices.includes(safeWeekIndex),
    );
    return activeMonth?.weekIndices ?? [safeWeekIndex];
  }, [monthChips, safeWeekIndex, timeScale, totalWeeks]);

  const perceptionGaps = useMemo(() => {
    const gaps: Array<{
      projectName: string;
      metricName: string;
      my: number;
      team: number;
      diff: number;
    }> = [];
    const lastIdx = projects[0]?.weeks.length ?? 0;
    if (lastIdx === 0) return gaps;
    const indicesToUse =
      timeScale === 'weeks' ? [safeWeekIndex] : activeWeekIndices;
    for (const p of visibleProjects) {
      if (!p.myScoresByWeek) continue;
      for (const k of PROJECT_CHECKIN_METRIC_KEYS) {
        const my =
          p.myScoresByWeek[k]
            ? avg(indicesToUse.map((i) => p.myScoresByWeek![k]?.[i] ?? null))
            : null;
        const team = avg(
          indicesToUse.map((i) => p.teamScoresByWeek[k]?.[i] ?? null),
        );
        if (
          my !== null &&
          team !== null &&
          Math.abs(my - team) >= PERCEPTION_GAP_THRESHOLD
        ) {
          const def = definitions.find((d) => d.metric_key === k);
          gaps.push({
            projectName: p.name,
            metricName: def?.name ?? k,
            my,
            team,
            diff: my - team,
          });
        }
      }
    }
    return gaps;
  }, [activeWeekIndices, definitions, safeWeekIndex, timeScale, visibleProjects]);

  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-5 py-8 text-center">
        <p className="mb-2 font-semibold text-indigo-900">
          No project check-ins yet
        </p>
        <p className="mb-4 text-sm text-indigo-700">
          Start a check-in for any project to see your scores vs team health
          here.
        </p>
        <Button asChild className="rounded-lg bg-indigo-600 font-semibold">
          <Link href="/check-ins/new">Start check-in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Controls: time + project filter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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

      {/* Summary cards — team vs your score per project */}
      <div className="mb-5 flex flex-wrap gap-3">
        {visibleProjects.map((p) => {
          const indicesToUse =
            timeScale === 'weeks' ? [safeWeekIndex] : activeWeekIndices;
          const teamVals = PROJECT_CHECKIN_METRIC_KEYS.flatMap((k) =>
            indicesToUse
              .map((idx) => p.teamScoresByWeek[k]?.[idx] ?? null)
              .filter((v): v is number => v !== null),
          );
          const overallTeam =
            teamVals.length > 0
              ? Math.round(
                  (teamVals.reduce((a, b) => a + b, 0) / teamVals.length) * 10,
                ) / 10
              : null;
          const myVals = p.myScoresByWeek
            ? (PROJECT_CHECKIN_METRIC_KEYS.flatMap((k) =>
                indicesToUse
                  .map((idx) => p.myScoresByWeek![k]?.[idx] ?? null)
                  .filter((v): v is number => v !== null),
              ) as number[])
            : [];
          const overallMy =
            myVals.length > 0
              ? Math.round(
                  (myVals.reduce((a, b) => a + b, 0) / myVals.length) * 10,
                ) / 10
              : null;
          const currentLabel =
            timeScale === 'weeks'
              ? p.weeks[safeWeekIndex]?.label ?? ''
              : monthChips.find((m) =>
                  m.weekIndices.includes(safeWeekIndex),
                )?.label ?? '';
          return (
            <div
              key={p.id}
              className="flex min-w-[200px] flex-1 flex-shrink-0 items-center justify-between rounded-[10px] border-[1.5px] px-4 py-3"
              style={{
                background: getScoreBg(overallTeam),
                borderColor: `${getScoreColor(overallTeam)}25`,
              }}
            >
              <div>
                <div className="text-xs font-bold text-slate-800">{p.name}</div>
                <div className="text-[10px] text-slate-400">
                  {currentLabel}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-[8px] font-semibold uppercase text-slate-400">
                    Team
                  </div>
                  <div
                    className="text-xl font-extrabold"
                    style={{ color: getScoreColor(overallTeam) }}
                  >
                    {overallTeam ?? '—'}
                  </div>
                </div>
                {overallMy !== null && (
                  <div className="text-center">
                    <div className="text-[8px] font-semibold uppercase text-indigo-500">
                      You
                    </div>
                    <div
                      className="text-xl font-extrabold"
                      style={{ color: getScoreColor(overallMy) }}
                    >
                      {overallMy}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Perception gap callout */}
      {perceptionGaps.length > 0 && (
        <div className="mb-5 rounded-xl border-[1.5px] border-amber-300 bg-amber-50 px-4 py-3.5">
          <div className="mb-2 text-[13px] font-bold text-amber-700">
            🔍 Perception Gaps
          </div>
          <div className="mb-2 text-xs text-amber-800">
            Your score differs significantly from team average — worth
            discussing?
          </div>
          {perceptionGaps.map((g, i) => (
            <div
              key={`${g.projectName}-${g.metricName}-${i}`}
              className="flex flex-wrap items-center gap-2 py-0.5 text-xs"
            >
              <span className="font-semibold text-amber-900">
                {g.projectName}
              </span>
              <span className="text-amber-700">·</span>
              <span className="text-amber-800">{g.metricName}</span>
              <span
                className="font-extrabold"
                style={{ color: getScoreColor(g.my) }}
              >
                You: {g.my}
              </span>
              <span className="text-amber-700">vs</span>
              <span
                className="font-extrabold"
                style={{ color: getScoreColor(g.team) }}
              >
                Team: {g.team}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Project cards */}
      <div className="mb-3 text-base font-extrabold text-slate-800">
        My Projects
      </div>
      {visibleProjects.map((p) => (
        <MyProjectCard
          key={p.id}
          project={p}
          definitions={definitions}
          isExpanded={expandedProject === p.id}
          activeWeekIndex={safeWeekIndex}
          timeScale={timeScale}
          activeWeekIndices={activeWeekIndices}
          currentLabel={
            timeScale === 'weeks'
              ? p.weeks[safeWeekIndex]?.label ?? ''
              : monthChips.find((m) =>
                  m.weekIndices.includes(safeWeekIndex),
                )?.label ?? ''
          }
          onToggle={() =>
            setExpandedProject(expandedProject === p.id ? null : p.id)
          }
        />
      ))}

      {/* Check-in CTA */}
      <div className="mt-2 flex items-center justify-between rounded-xl border-[1.5px] border-indigo-200 bg-indigo-50 px-5 py-4">
        <div>
          <div className="text-sm font-bold text-indigo-800">
            Weekly Check-in
          </div>
          <div className="text-xs text-indigo-600">
            Due this week — fill in your project health scores
          </div>
        </div>
        <Button asChild className="rounded-lg bg-indigo-600 font-bold">
          <Link href="/check-ins/new">Start Check-in →</Link>
        </Button>
      </div>
    </div>
  );
}
