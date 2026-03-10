import 'server-only';

import { createClient } from '@/utils/supabase/server';
import type {
  ProjectCheckinDashboardProject,
  ProjectCheckinDashboardWeek,
  ProjectCheckinHistoryEntry,
  ProjectCheckinMetricDefinition,
  ProjectCheckinMetricKey,
  ProjectCheckinMetricResponse,
  ProjectCheckinSubmission,
} from '@/types/project-checkin';
import { PROJECT_CHECKIN_METRIC_KEYS } from '@/types/project-checkin';
import { format, getISOWeek, getISOWeekYear, setISOWeek, startOfISOWeek, subWeeks } from 'date-fns';

function normalizeMetricDefinition(row: {
  metric_key: ProjectCheckinMetricDefinition['metric_key'];
  display_order: number;
  layer: ProjectCheckinMetricDefinition['layer'];
  name: string;
  prompt: string;
  description: string | null;
  benchmark_version: string;
  skippable: boolean;
  always_comment: boolean;
  tag_options: unknown;
  project_type_overrides: unknown;
  scale_guide: unknown;
}): ProjectCheckinMetricDefinition {
  return {
    ...row,
    tag_options: Array.isArray(row.tag_options) ? (row.tag_options as string[]) : [],
    project_type_overrides:
      row.project_type_overrides && typeof row.project_type_overrides === 'object'
        ? (row.project_type_overrides as ProjectCheckinMetricDefinition['project_type_overrides'])
        : {},
    scale_guide: Array.isArray(row.scale_guide)
      ? (row.scale_guide as ProjectCheckinMetricDefinition['scale_guide'])
      : [],
  };
}

function normalizeMetricResponse(row: {
  id: string;
  submission_id: string;
  metric_key: ProjectCheckinMetricKey;
  score: number | null;
  previous_score: number | null;
  delta: number | null;
  is_skipped: boolean;
  selected_tags: unknown;
  note: string | null;
  trigger_flags: unknown;
  created_at: string;
}): ProjectCheckinMetricResponse {
  return {
    ...row,
    selected_tags: Array.isArray(row.selected_tags) ? (row.selected_tags as string[]) : [],
    trigger_flags: Array.isArray(row.trigger_flags) ? (row.trigger_flags as string[]) : [],
  };
}

export async function getProjectCheckinMetricDefinitions(): Promise<ProjectCheckinMetricDefinition[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_checkin_metric_definitions')
    .select(
      'metric_key, display_order, layer, name, prompt, description, benchmark_version, skippable, always_comment, tag_options, project_type_overrides, scale_guide',
    )
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch project check-in metric definitions:', error);
    return [];
  }

  return (data ?? []).map(normalizeMetricDefinition);
}

async function getSubmissionForProjectAndWeek(
  userId: string,
  projectId: string,
  year: number,
  weekNumber: number,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('submissions')
    .select('id, user_id, submission_period_id, project_id, type, year, week_number, open_note, payload_version, submitted_at')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('type', 'project_checkin')
    .eq('year', year)
    .eq('week_number', weekNumber)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch project check-in submission:', error);
    return null;
  }
  return data as ProjectCheckinSubmission | null;
}

async function getMetricResponsesForSubmissionIds(submissionIds: string[]): Promise<ProjectCheckinMetricResponse[]> {
  if (!submissionIds.length) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_checkin_metric_responses')
    .select(
      'id, submission_id, metric_key, score, previous_score, delta, is_skipped, selected_tags, note, trigger_flags, created_at',
    )
    .in('submission_id', submissionIds)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch project check-in metric responses:', error);
    return [];
  }

  return (data ?? []).map(normalizeMetricResponse);
}

/** Active projects available for check-in (any user can select). */
export async function getActiveProjects(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch active projects:', error);
    return [];
  }
  return (data ?? []) as { id: string; name: string }[];
}

async function getPreviousSubmissionByWeek(
  userId: string,
  projectId: string,
  year: number,
  weekNumber: number,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('submissions')
    .select('id, user_id, submission_period_id, project_id, type, year, week_number, open_note, payload_version, submitted_at')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .eq('type', 'project_checkin')
    .or(`year.lt.${year},and(year.eq.${year},week_number.lt.${weekNumber})`)
    .order('year', { ascending: false })
    .order('week_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch previous project check-in submission:', error);
    return null;
  }
  return data as ProjectCheckinSubmission | null;
}

export async function getProjectCheckinPageData(
  userId: string,
  projectId: string,
  year: number,
  weekNumber: number,
): Promise<{
  project: { id: string; name: string } | null;
  definitions: ProjectCheckinMetricDefinition[];
  currentSubmission: ProjectCheckinSubmission | null;
  currentResponses: ProjectCheckinMetricResponse[];
  previousResponsesByMetric: Partial<Record<ProjectCheckinMetricKey, ProjectCheckinMetricResponse>>;
}> {
  const supabase = await createClient();
  const [projectResult, definitions, currentSubmission, previousSubmission] = await Promise.all([
    supabase.from('projects').select('id, name').eq('id', projectId).eq('is_active', true).maybeSingle(),
    getProjectCheckinMetricDefinitions(),
    getSubmissionForProjectAndWeek(userId, projectId, year, weekNumber),
    getPreviousSubmissionByWeek(userId, projectId, year, weekNumber),
  ]);

  const project =
    projectResult.error || !projectResult.data
      ? null
      : (projectResult.data as { id: string; name: string });
  if (!project) {
    return {
      project: null,
      definitions,
      currentSubmission: null,
      currentResponses: [],
      previousResponsesByMetric: {},
    };
  }

  const responseIds = [currentSubmission?.id, previousSubmission?.id].filter(Boolean) as string[];
  const responses = await getMetricResponsesForSubmissionIds(responseIds);

  const currentResponses = currentSubmission
    ? responses.filter((response) => response.submission_id === currentSubmission.id)
    : [];

  const previousResponses = previousSubmission
    ? responses.filter((response) => response.submission_id === previousSubmission.id)
    : [];

  const previousResponsesByMetric = Object.fromEntries(
    previousResponses.map((response) => [response.metric_key, response]),
  ) as Partial<Record<ProjectCheckinMetricKey, ProjectCheckinMetricResponse>>;

  return {
    project,
    definitions,
    currentSubmission,
    currentResponses,
    previousResponsesByMetric,
  };
}

export async function getProjectCheckinHistory(userId: string): Promise<ProjectCheckinHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('submissions')
    .select(
      'id, user_id, submission_period_id, project_id, type, year, week_number, open_note, payload_version, submitted_at, project:projects!inner(id, name, is_active)',
    )
    .eq('user_id', userId)
    .eq('type', 'project_checkin')
    .not('year', 'is', null)
    .not('week_number', 'is', null)
    .order('year', { ascending: false })
    .order('week_number', { ascending: false })
    .order('submitted_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Failed to fetch project check-in history:', error);
    return [];
  }

  const submissions = (data ?? []).map((row) => ({
    submission: {
      id: row.id,
      user_id: row.user_id,
      submission_period_id: row.submission_period_id,
      project_id: row.project_id,
      type: row.type,
      year: row.year,
      week_number: row.week_number,
      open_note: row.open_note,
      payload_version: row.payload_version,
      submitted_at: row.submitted_at,
    },
    project: Array.isArray(row.project) ? row.project[0] : row.project,
    year: row.year ?? 0,
    weekNumber: row.week_number ?? 0,
  }));

  const responses = await getMetricResponsesForSubmissionIds(
    submissions.map((entry) => entry.submission.id),
  );

  const responsesBySubmissionId = new Map<string, ProjectCheckinMetricResponse[]>();
  for (const response of responses) {
    const current = responsesBySubmissionId.get(response.submission_id) ?? [];
    current.push(response);
    responsesBySubmissionId.set(response.submission_id, current);
  }

  return submissions.map((entry) => ({
    submission: entry.submission,
    project: entry.project,
    year: entry.year,
    weekNumber: entry.weekNumber,
    responses: responsesBySubmissionId.get(entry.submission.id) ?? [],
  }));
}

/** Build (year, weekNumber) for the last 5 weeks (oldest first). */
function getLastFiveWeeks(): { year: number; weekNumber: number }[] {
  const weeks: { year: number; weekNumber: number }[] = [];
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = subWeeks(now, i);
    weeks.push({
      year: getISOWeekYear(d),
      weekNumber: getISOWeek(d),
    });
  }
  return weeks;
}

export async function getMyProjectsDashboardData(userId: string): Promise<{
  projects: ProjectCheckinDashboardProject[];
  definitions: ProjectCheckinMetricDefinition[];
}> {
  const supabase = await createClient();
  const definitions = await getProjectCheckinMetricDefinitions();

  const fiveWeeks = getLastFiveWeeks();
  const weekLabels = fiveWeeks.map(({ year, weekNumber }) => {
    const dayInWeek = setISOWeek(new Date(year, 0, 4), weekNumber);
    const monday = startOfISOWeek(dayInWeek);
    return format(monday, 'MMM d');
  });

  const fiveWeeksSet = new Set(
    fiveWeeks.map((w) => `${w.year}:${w.weekNumber}`),
  );

  const { data: mySubRows } = await supabase
    .from('submissions')
    .select('project_id')
    .eq('user_id', userId)
    .eq('type', 'project_checkin')
    .not('project_id', 'is', null);

  const myProjectIds = [...new Set((mySubRows ?? []).map((r) => r.project_id as string))];
  if (myProjectIds.length === 0) {
    return {
      projects: [],
      definitions,
    };
  }

  const { data: projectRows } = await supabase
    .from('projects')
    .select('id, name')
    .in('id', myProjectIds);

  const projectMap = new Map<string, { id: string; name: string }>();
  for (const p of projectRows ?? []) {
    projectMap.set(p.id, { id: p.id, name: p.name });
  }

  // All submissions (all users) for these projects and last 5 weeks — team avg = avg of all submitted scores per project/week
  const { data: allSubRows } = await supabase
    .from('submissions')
    .select('id, project_id, year, week_number')
    .eq('type', 'project_checkin')
    .in('project_id', myProjectIds)
    .not('year', 'is', null)
    .not('week_number', 'is', null);

  const allSubmissionIds: string[] = [];
  const projectWeekToWeekIndex = new Map<string, number>();
  for (const s of allSubRows ?? []) {
    const key = `${s.project_id}:${s.year}:${s.week_number}`;
    if (!fiveWeeksSet.has(`${s.year}:${s.week_number}`)) continue;
    const weekIndex = fiveWeeks.findIndex(
      (w) => w.year === s.year && w.weekNumber === s.week_number,
    );
    if (weekIndex === -1) continue;
    allSubmissionIds.push(s.id);
    projectWeekToWeekIndex.set(key, weekIndex);
  }

  const allResponses = await getMetricResponsesForSubmissionIds(allSubmissionIds);

  // Build (projectId, weekIndex) -> submission ids for team aggregation
  const submissionToProjectWeek = new Map<string, { projectId: string; weekIndex: number }>();
  for (const s of allSubRows ?? []) {
    const key = `${s.project_id}:${s.year}:${s.week_number}`;
    const weekIndex = projectWeekToWeekIndex.get(key);
    if (weekIndex == null) continue;
    submissionToProjectWeek.set(s.id, { projectId: s.project_id as string, weekIndex });
  }

  // Team avg per (projectId, weekIndex, metric_key) = average of all scores for that project/week/metric
  const teamAvgMap = new Map<
    string,
    Map<number, Partial<Record<ProjectCheckinMetricKey, number | null>>>
  >();
  for (const r of allResponses) {
    if (r.score == null) continue;
    const pw = submissionToProjectWeek.get(r.submission_id);
    if (!pw) continue;
    let byWeek = teamAvgMap.get(pw.projectId);
    if (!byWeek) {
      byWeek = new Map();
      teamAvgMap.set(pw.projectId, byWeek);
    }
    let metrics = byWeek.get(pw.weekIndex);
    if (!metrics) {
      metrics = {};
      byWeek.set(pw.weekIndex, metrics);
    }
    const arr = (metrics as Record<string, number[]>)[r.metric_key];
    if (!arr) (metrics as Record<string, number[]>)[r.metric_key] = [r.score];
    else arr.push(r.score);
  }

  const teamScoresByProjectAndWeek = new Map<
    string,
    Map<number, Partial<Record<ProjectCheckinMetricKey, number | null>>>
  >();
  for (const [projectId, byWeek] of teamAvgMap) {
    const out = new Map<number, Partial<Record<ProjectCheckinMetricKey, number | null>>>();
    for (const [weekIndex, metrics] of byWeek) {
      const averaged: Partial<Record<ProjectCheckinMetricKey, number | null>> = {};
      for (const k of PROJECT_CHECKIN_METRIC_KEYS) {
        const arr = (metrics as Record<string, number[]>)[k];
        if (!arr?.length) {
          averaged[k] = null;
        } else {
          const sum = arr.reduce((a, b) => a + b, 0);
          averaged[k] = Math.round((sum / arr.length) * 10) / 10;
        }
      }
      out.set(weekIndex, averaged);
    }
    teamScoresByProjectAndWeek.set(projectId, out);
  }

  const { data: subRows } = await supabase
    .from('submissions')
    .select('id, project_id, year, week_number')
    .eq('user_id', userId)
    .eq('type', 'project_checkin')
    .in('project_id', myProjectIds);

  const submissionIds: string[] = [];
  const projectWeekToSubmissionId = new Map<string, string>();
  for (const s of subRows ?? []) {
    const key = `${s.project_id}:${s.year}:${s.week_number}`;
    const inRange = fiveWeeks.some(
      (w) => w.year === s.year && w.weekNumber === s.week_number,
    );
    if (inRange) {
      submissionIds.push(s.id);
      projectWeekToSubmissionId.set(key, s.id);
    }
  }

  const responses = await getMetricResponsesForSubmissionIds(submissionIds);
  const responsesBySubmissionId = new Map<string, ProjectCheckinMetricResponse[]>();
  for (const r of responses) {
    const list = responsesBySubmissionId.get(r.submission_id) ?? [];
    list.push(r);
    responsesBySubmissionId.set(r.submission_id, list);
  }

  const projects: ProjectCheckinDashboardProject[] = myProjectIds.map((projectId) => {
    const project = projectMap.get(projectId) ?? { id: projectId, name: projectId };
    const weeks: ProjectCheckinDashboardWeek[] = fiveWeeks.map((w, i) => ({
      ...w,
      label: weekLabels[i] ?? '',
      submissionPeriodId: null,
    }));

    const teamScoresByWeek: Record<ProjectCheckinMetricKey, (number | null)[]> = {} as Record<
      ProjectCheckinMetricKey,
      (number | null)[]
    >;
    for (const k of PROJECT_CHECKIN_METRIC_KEYS) {
      teamScoresByWeek[k] = fiveWeeks.map((_, weekIndex) => {
        const byWeek = teamScoresByProjectAndWeek.get(projectId)?.get(weekIndex);
        const v = byWeek?.[k];
        return v ?? null;
      });
    }

    const myScoresByWeek: Record<ProjectCheckinMetricKey, (number | null)[]> = {} as Record<
      ProjectCheckinMetricKey,
      (number | null)[]
    >;
    let hasAnyMyScore = false;
    for (const k of PROJECT_CHECKIN_METRIC_KEYS) {
      myScoresByWeek[k] = fiveWeeks.map((w) => {
        const key = `${projectId}:${w.year}:${w.weekNumber}`;
        const subId = projectWeekToSubmissionId.get(key);
        if (!subId) return null;
        const resps = responsesBySubmissionId.get(subId) ?? [];
        const r = resps.find((x) => x.metric_key === k);
        if (r?.score != null) hasAnyMyScore = true;
        return r?.score ?? null;
      });
    }

    return {
      id: project.id,
      name: project.name,
      weeks,
      teamScoresByWeek,
      myScoresByWeek: hasAnyMyScore ? myScoresByWeek : null,
    };
  });

  return { projects, definitions };
}
