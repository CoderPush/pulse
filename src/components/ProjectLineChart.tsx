"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { ChartDataPoint } from "@/lib/utils/chart";

type Props = {
  data: ChartDataPoint[];
  weekMeta?: Record<number, { start_date: string; end_date: string }>;
};

type TooltipPayload = {
  name: string;
  value: number;
  color: string;
};

export default function ProjectLineChart({ data, weekMeta }: Props) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const allProjectNames = useMemo(() => {
    const projectNamesSet = new Set<string>();
    data.forEach(dataPoint => {
      Object.keys(dataPoint).forEach(key => {
        if (key !== "week") {
          projectNamesSet.add(key);
        }
      });
    });
    return Array.from(projectNamesSet);
  }, [data]);

  // Pagination state for weeks
  const WINDOW_SIZE = 3;
  const [windowStart, setWindowStart] = useState(0);
  const maxWindowStart = Math.max(0, data.length - WINDOW_SIZE);
  const visibleData = data.slice(windowStart, windowStart + WINDOW_SIZE);

  // Project visibility state
  const [visibleProjects, setVisibleProjects] = useState<
    Record<string, boolean>
  >(() => Object.fromEntries(allProjectNames.map((name) => [name, true])));

  // Update visibleProjects if project list changes
  useEffect(() => {
    setVisibleProjects((prev) => {
      const next: Record<string, boolean> = {};
      for (const name of allProjectNames) {
        next[name] = prev[name] !== undefined ? prev[name] : true;
      }
      return next;
    });
  }, [allProjectNames]);

  const totalHoursPerWeek = useMemo(() => {
    return data.map((d) => {
      const total = allProjectNames.reduce(
        (sum, project) => sum + (Number(d[project]) || 0),
        0
      );
      return { week: d.week, total };
    });
  }, [data, allProjectNames]);

  const projectColors = useMemo(() => {
    const colors = [
      "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#f97316", "#06b6d4",
      "#84cc16", "#ec4899", "#ef4444", "#6366f1", "#14b8a6", "#a855f7",
      "#22c55e", "#3b82f6", "#fb7185",
    ];
    const mapping: Record<string, string> = {};
    allProjectNames.forEach((project, idx) => {
      mapping[project] = colors[idx % colors.length];
    });
    return mapping;
  }, [allProjectNames]);

  function getProjectColor(projectName: string) {
    return projectColors[projectName] || "#000000";
  }

  return (
    <Card className="w-full shadow-lg border-primary/10 bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-900 dark:to-blue-950/30">
      <div>
        <h1 className="text-3xl font-bold mb-2">Weekly Project Hours</h1>
        <p className="text-muted-foreground">
          Track your time allocation across projects over time
        </p>
      </div>

      <CardContent className="pt-6">
        {/* Weekly Summary Tags */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Weekly Totals
          </h4>
          <div
            className="flex gap-2 overflow-x-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f1f5f9",
            }}
            onMouseEnter={(e) => {
              const target = e.currentTarget;
              target.style.setProperty("--scrollbar-thumb", "#94a3b8");
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.setProperty("--scrollbar-thumb", "#cbd5e1");
            }}
          >
            {totalHoursPerWeek
              .slice(windowStart, windowStart + WINDOW_SIZE)
              .map(({ week, total }) => (
                <div
                  key={week}
                  className="relative flex items-center bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 rounded-xl shadow-md border-l-4 border-amber-400 px-3 py-2"
                >
                  <span className="min-w-15 text-amber-800 dark:text-amber-200 text-sm font-medium">
                    Week {week}
                  </span>
                  <Badge className="bg-sky-200 text-amber-900 ml-2 font-bold shadow-sm">
                    {total}h
                  </Badge>
                </div>
              ))}
          </div>
        </div>

        {/* Chart Container */}
        <div className="bg-gradient-to-br from-white/80 to-blue-50/80 dark:from-gray-800/80 dark:to-blue-950/80 rounded-2xl p-6 border border-blue-100 dark:border-blue-800 shadow-inner">
          <div className="w-full h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#cbd5e1"
                  strokeOpacity={0.6}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 12, fill: "#475569" }}
                  tickLine={{ stroke: "#94a3b8" }}
                  axisLine={{ stroke: "#94a3b8" }}
                  label={{
                    value: "Week",
                    position: "insideBottomRight",
                    offset: -8,
                    fontSize: 14,
                    fill: "#475569",
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#475569" }}
                  tickLine={{ stroke: "#94a3b8" }}
                  axisLine={{ stroke: "#94a3b8" }}
                  label={{
                    value: "Hours",
                    angle: -90,
                    position: "insideLeft",
                    offset: 8,
                    fontSize: 14,
                    fill: "#475569",
                    fontWeight: 600,
                  }}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      weekMeta={weekMeta}
                      hoveredProject={hoveredProject}
                    />
                  }
                />
                <Legend
                  verticalAlign="top"
                  height={50}
                  iconType="circle"
                  wrapperStyle={{
                    paddingBottom: "20px",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                />
                {allProjectNames.map((project) => {
                  if (!visibleProjects[project]) return null;
                  const color = getProjectColor(project);
                  return (
                    <Line
                      key={project}
                      isAnimationActive={false}
                      type="monotone"
                      dataKey={project}
                      strokeWidth={3}
                      stroke={color}
                      dot={{
                        r: 5,
                        strokeWidth: 3,
                        fill: "#fff",
                        stroke: color,
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                      }}
                      activeDot={{
                        r: 7,
                        fill: color,
                        stroke: "#fff",
                        strokeWidth: 3,
                        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))",
                      }}
                      onMouseEnter={() => setHoveredProject(project)}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pagination Controls */}
        <PaginationControls
          windowStart={windowStart}
          setWindowStart={setWindowStart}
          maxWindowStart={maxWindowStart}
          data={data}
          WINDOW_SIZE={WINDOW_SIZE}
        />

        {/* Project Toggle Panel */}
        <ProjectTogglePanel
          allProjectNames={allProjectNames}
          visibleProjects={visibleProjects}
          setVisibleProjects={setVisibleProjects}
          getProjectColor={getProjectColor}
        />
      </CardContent>
    </Card>
  );
}

// --- Subcomponents ---

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
  weekMeta?: Record<number, { start_date: string; end_date: string }>;
  hoveredProject?: string | null;
};

function CustomTooltip({
  active,
  payload,
  label,
  weekMeta,
  hoveredProject,
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0 || label === undefined)
    return null;

  let shownPayload = payload;

  if (hoveredProject) {
    shownPayload = payload.filter((p) => p.name === hoveredProject);
  }

  const total = shownPayload.reduce(
    (sum, entry) => sum + (entry?.value ?? 0),
    0
  );

  // Get week start/end dates
  let weekDates: string | null = null;
  if (weekMeta?.[label]) {
    const { start_date, end_date } = weekMeta[label];
    // Format as YYYY-MM-DD
    const start = new Date(start_date).toISOString().slice(0, 10);
    const end = new Date(end_date).toISOString().slice(0, 10);
    weekDates = `${start} → ${end}`;
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 p-4 border border-blue-200 dark:border-blue-700 rounded-2xl shadow-xl text-sm space-y-2 max-w-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
            Week {label}
          </p>
          {weekDates && (
            <p className="text-xs text-blue-500 dark:text-blue-200 mt-0.5">
              {weekDates}
            </p>
          )}
        </div>
      </div>
      {shownPayload.map((entry, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 bg-white/50 dark:bg-gray-700/50 rounded-lg p-2 border border-blue-100 dark:border-blue-800"
        >
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className="font-medium text-gray-700 dark:text-gray-200">
              {entry.name}
            </span>
          </div>
          <Badge className="bg-yellow-300 text-blue-900 font-bold shadow-sm">
            {entry.value}h
          </Badge>
        </div>
      ))}
      {shownPayload.length > 1 && (
        <div className="pt-2 border-t border-blue-200 dark:border-blue-700 mt-3">
          <div className="flex items-center justify-between bg-gradient-to-r from-sky-100 to-blue-100 dark:from-sky-900 dark:to-blue-900 rounded-lg p-2 border-l-4 border-sky-400">
            <span className="font-bold text-blue-900 dark:text-blue-100">
              Total Hours
            </span>
            <Badge className="bg-sky-200 text-blue-900 font-bold shadow">
              {total}h
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
}

type PaginationControlsProps = {
  windowStart: number;
  setWindowStart: (fn: (prev: number) => number) => void;
  maxWindowStart: number;
  data: ChartDataPoint[];
  WINDOW_SIZE: number;
};

function PaginationControls({
  windowStart,
  setWindowStart,
  maxWindowStart,
  data,
  WINDOW_SIZE,
}: PaginationControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <button
        onClick={() => setWindowStart((prev) => Math.max(0, prev - 1))}
        disabled={windowStart === 0}
        className={`p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow transition disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Previous weeks"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        Weeks {data[windowStart]?.week}
        {windowStart + 1 < data.length
          ? ` - ${
              data[Math.min(windowStart + WINDOW_SIZE - 1, data.length - 1)]
                ?.week
            }`
          : ""}
      </span>
      <button
        onClick={() =>
          setWindowStart((prev) => Math.min(maxWindowStart, prev + 1))
        }
        disabled={windowStart >= maxWindowStart}
        className={`p-2 rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow transition disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="Next weeks"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

type ProjectTogglePanelProps = {
  allProjectNames: string[];
  visibleProjects: Record<string, boolean>;
  setVisibleProjects: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  getProjectColor: (projectName: string) => string;
};

function ProjectTogglePanel({
  allProjectNames,
  visibleProjects,
  setVisibleProjects,
  getProjectColor,
}: ProjectTogglePanelProps) {
  return (
    <div className="flex flex-wrap gap-3 items-center my-4">
      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300 mr-2">
        Toggle Projects:
      </span>
      {allProjectNames.map((project) => (
        <label
          key={project}
          className="flex items-center gap-1 cursor-pointer select-none"
        >
          <input
            type="checkbox"
            checked={visibleProjects[project]}
            onChange={() =>
              setVisibleProjects((prev) => ({
                ...prev,
                [project]: !prev[project],
              }))
            }
            className="accent-blue-600 w-4 h-4 rounded border-gray-300"
          />
          <span
            className="text-xs font-medium"
            style={{
              color: visibleProjects[project]
                ? getProjectColor(project)
                : "#94a3b8",
            }}
          >
            {project}
          </span>
        </label>
      ))}
    </div>
  );
}
