import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import createClient from '@/utils/supabase/api';
import { PROJECT_CHECKIN_PAYLOAD_VERSION } from '@/lib/project-checkins/constants';
import { buildMetricResponse } from '@/lib/project-checkins/scoring';
import {
  PROJECT_CHECKIN_METRIC_KEYS,
  type ProjectCheckinMetricDefinition,
  type ProjectCheckinMetricKey,
  type ProjectCheckinMetricResponse,
} from '@/types/project-checkin';

const metricPayloadSchema = z.object({
  metricKey: z.enum(PROJECT_CHECKIN_METRIC_KEYS),
  score: z.number().int().min(1).max(5).nullable(),
  isSkipped: z.boolean().default(false),
  selectedTags: z.array(z.string()).default([]),
  note: z.string().max(2000).default(''),
});

const submitProjectCheckinSchema = z.object({
  projectId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  weekNumber: z.number().int().min(1).max(53),
  payloadVersion: z.string().default(PROJECT_CHECKIN_PAYLOAD_VERSION),
  openNote: z.string().max(5000).default(''),
  metrics: z.array(metricPayloadSchema).length(PROJECT_CHECKIN_METRIC_KEYS.length),
});

function normalizeMetricDefinition(row: {
  metric_key: ProjectCheckinMetricKey;
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

export async function POST(request: NextRequest) {
  const response = new NextResponse();
  const supabase = createClient(request, response);

  try {
    const parsedBody = submitProjectCheckinSchema.safeParse(await request.json());
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid project check-in payload', details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const body = parsedBody.data;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.projectId)
      .eq('is_active', true)
      .maybeSingle();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found or not available for check-in' }, { status: 404 });
    }

    const { data: existingSubmission, error: existingSubmissionError } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', body.projectId)
      .eq('type', 'project_checkin')
      .eq('year', body.year)
      .eq('week_number', body.weekNumber)
      .maybeSingle();

    if (existingSubmissionError) {
      console.error('Failed to check existing project check-in submission:', existingSubmissionError);
      return NextResponse.json({ error: 'Unable to validate current submission state' }, { status: 500 });
    }

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted a check-in for this project and week' },
        { status: 409 },
      );
    }

    const { data: definitionRows, error: definitionsError } = await supabase
      .from('project_checkin_metric_definitions')
      .select(
        'metric_key, display_order, layer, name, prompt, description, benchmark_version, skippable, always_comment, tag_options, project_type_overrides, scale_guide',
      )
      .order('display_order', { ascending: true });

    if (definitionsError || !definitionRows?.length) {
      console.error('Failed to fetch project check-in metric definitions:', definitionsError);
      return NextResponse.json({ error: 'Metric definitions are unavailable' }, { status: 500 });
    }

    const definitions = definitionRows.map(normalizeMetricDefinition);
    const requestMetricsByKey = new Map(body.metrics.map((metric) => [metric.metricKey, metric]));

    if (requestMetricsByKey.size !== definitions.length) {
      return NextResponse.json({ error: 'Incomplete metric payload' }, { status: 400 });
    }

    for (const definition of definitions) {
      const metric = requestMetricsByKey.get(definition.metric_key);
      if (!metric) {
        return NextResponse.json({ error: `Missing metric: ${definition.metric_key}` }, { status: 400 });
      }

      if (!definition.skippable && metric.isSkipped) {
        return NextResponse.json({ error: `${definition.name} cannot be skipped` }, { status: 400 });
      }

      if (!metric.isSkipped && metric.score === null) {
        return NextResponse.json({ error: `${definition.name} requires a score` }, { status: 400 });
      }

      const scoreNeedsEvidence =
        !metric.isSkipped && metric.score !== null && (metric.score <= 2 || metric.score === 5);
      if (scoreNeedsEvidence && metric.note.trim().length === 0) {
        return NextResponse.json(
          { error: `${definition.name} requires a comment as evidence for score ${metric.score}` },
          { status: 400 },
        );
      }

      const invalidTags = metric.selectedTags.filter((tag) => !definition.tag_options.includes(tag));
      if (invalidTags.length > 0) {
        return NextResponse.json(
          { error: `Invalid tags for ${definition.name}`, details: invalidTags },
          { status: 400 },
        );
      }
    }

    const { data: previousSubmission, error: previousSubmissionError } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', body.projectId)
      .eq('type', 'project_checkin')
      .or(`year.lt.${body.year},and(year.eq.${body.year},week_number.lt.${body.weekNumber})`)
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previousSubmissionError) {
      console.error('Failed to fetch previous project check-in submission:', previousSubmissionError);
      return NextResponse.json({ error: 'Unable to compute score deltas' }, { status: 500 });
    }

    let previousResponsesByMetric: Partial<Record<ProjectCheckinMetricKey, ProjectCheckinMetricResponse>> = {};
    if (previousSubmission) {
      const { data: previousResponseRows, error: previousResponseError } = await supabase
        .from('project_checkin_metric_responses')
        .select(
          'id, submission_id, metric_key, score, previous_score, delta, is_skipped, selected_tags, note, trigger_flags, created_at',
        )
        .eq('submission_id', previousSubmission.id);

      if (previousResponseError) {
        console.error('Failed to fetch previous project check-in responses:', previousResponseError);
        return NextResponse.json({ error: 'Unable to compute score deltas' }, { status: 500 });
      }

      previousResponsesByMetric = Object.fromEntries(
        (previousResponseRows ?? []).map((response) => {
          const normalized = normalizeMetricResponse(response);
          return [normalized.metric_key, normalized];
        }),
      ) as Partial<Record<ProjectCheckinMetricKey, ProjectCheckinMetricResponse>>;
    }

    const now = new Date().toISOString();
    const responsePayloads = definitions.map((definition) =>
      buildMetricResponse({
        definition,
        submissionId: 'pending', // actual submission id is assigned inside the RPC
        value: {
          score: requestMetricsByKey.get(definition.metric_key)?.score ?? null,
          isSkipped: requestMetricsByKey.get(definition.metric_key)?.isSkipped ?? false,
          selectedTags: requestMetricsByKey.get(definition.metric_key)?.selectedTags ?? [],
          note: requestMetricsByKey.get(definition.metric_key)?.note ?? '',
        },
        previousScore: previousResponsesByMetric[definition.metric_key]?.score ?? null,
      }),
    );

    const { data: rpcResult, error: rpcError } = await supabase.rpc('submit_project_checkin', {
      p_user_id: user.id,
      p_project_id: body.projectId,
      p_year: body.year,
      p_week_number: body.weekNumber,
      p_payload_version: body.payloadVersion,
      p_open_note: body.openNote.trim() || null,
      p_submitted_at: now,
      p_metric_responses: responsePayloads,
    });

    if (rpcError || !rpcResult) {
      console.error('Failed to submit project check-in transactionally:', rpcError);
      return NextResponse.json({ error: 'Failed to submit project check-in' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      submissionId: rpcResult as string,
    });
  } catch (error) {
    console.error('Unexpected error in project check-in submission route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
