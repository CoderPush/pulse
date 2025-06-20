// Chart and weekMeta utilities for Weekly Pulse

export type ChartDataPoint = {
  week: number;
  [projectName: string]: number | string;
};

export function prepareChartData(submissions: any[]): ChartDataPoint[] {
  const allProjectNames = new Set<string>();
  const rawWeekMap = new Map<number, Record<string, number>>();
  for (const sub of submissions) {
    const week = sub.week_number;
    if (!rawWeekMap.has(week)) rawWeekMap.set(week, {});
    const current = rawWeekMap.get(week)!;
    const primaryName = sub.primary_project_name;
    allProjectNames.add(primaryName);
    current[primaryName] = (current[primaryName] || 0) + sub.primary_project_hours;
    for (const additional of sub.additional_projects ?? []) {
      const additionalName = additional.name;
      allProjectNames.add(additionalName);
      current[additionalName] = (current[additionalName] || 0) + additional.hours;
    }
  }
  return Array.from(rawWeekMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([week, projects]) => {
      const fullWeekData: ChartDataPoint = { week };
      for (const name of allProjectNames) {
        fullWeekData[name] = projects[name] ?? 0;
      }
      return fullWeekData;
    });
}

export function buildWeekMeta(allWeeks: any[]): Record<number, { start_date: string; end_date: string }> {
  const weekMeta: Record<number, { start_date: string; end_date: string }> = {};
  (allWeeks || []).forEach((w) => {
    weekMeta[w.week_number] = {
      start_date: w.start_date,
      end_date: w.end_date,
    };
  });
  return weekMeta;
} 