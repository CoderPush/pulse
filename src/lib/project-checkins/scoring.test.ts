import { describe, expect, it } from 'vitest';

import {
  buildMetricResponse,
  buildProjectHealthSnapshots,
  getTriggerFlags,
} from '@/lib/project-checkins/scoring';
import type {
  ProjectCheckinMetricDefinition,
  ProjectCheckinMetricResponse,
} from '@/types/project-checkin';

const definitions: ProjectCheckinMetricDefinition[] = [
  {
    metric_key: 'clarity',
    display_order: 1,
    layer: 'foundation',
    name: 'Clarity',
    prompt: 'Clarity prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: false,
    always_comment: false,
    tag_options: ['Requirements'],
    project_type_overrides: {},
    scale_guide: [],
  },
  {
    metric_key: 'team_capacity',
    display_order: 2,
    layer: 'foundation',
    name: 'Team Capacity',
    prompt: 'Capacity prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: false,
    always_comment: false,
    tag_options: ['Too many tasks'],
    project_type_overrides: {},
    scale_guide: [],
  },
  {
    metric_key: 'codebase_health',
    display_order: 3,
    layer: 'foundation',
    name: 'Codebase Health',
    prompt: 'Codebase prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: true,
    always_comment: false,
    tag_options: ['Tech debt'],
    project_type_overrides: {},
    scale_guide: [],
  },
  {
    metric_key: 'delivery_progress',
    display_order: 4,
    layer: 'execution',
    name: 'Delivery Progress',
    prompt: 'Delivery prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: false,
    always_comment: false,
    tag_options: ['Blocked'],
    project_type_overrides: {},
    scale_guide: [],
  },
  {
    metric_key: 'rework_waste',
    display_order: 5,
    layer: 'execution',
    name: 'Rework & Waste',
    prompt: 'Rework prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: false,
    always_comment: false,
    tag_options: ['Requirement changed'],
    project_type_overrides: {},
    scale_guide: [],
  },
  {
    metric_key: 'collaboration_ownership',
    display_order: 6,
    layer: 'execution',
    name: 'Collaboration & Ownership',
    prompt: 'Collaboration prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: false,
    always_comment: false,
    tag_options: ['Blocked by external'],
    project_type_overrides: {},
    scale_guide: [],
  },
  {
    metric_key: 'client_alignment',
    display_order: 7,
    layer: 'outcome',
    name: 'Client Alignment',
    prompt: 'Client prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: false,
    always_comment: false,
    tag_options: ['Expectation mismatch'],
    project_type_overrides: {},
    scale_guide: [],
  },
  {
    metric_key: 'output_quality',
    display_order: 8,
    layer: 'outcome',
    name: 'Output Quality',
    prompt: 'Output prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: false,
    always_comment: false,
    tag_options: ['Bugs'],
    project_type_overrides: {},
    scale_guide: [],
  },
  {
    metric_key: 'learning_velocity',
    display_order: 9,
    layer: 'outcome',
    name: 'Learning Velocity',
    prompt: 'Learning prompt',
    description: null,
    benchmark_version: 'v1',
    skippable: false,
    always_comment: true,
    tag_options: ['Knowledge shared'],
    project_type_overrides: {},
    scale_guide: [],
  },
];

function createResponse(
  metric_key: ProjectCheckinMetricResponse['metric_key'],
  score: number | null,
  options?: Partial<ProjectCheckinMetricResponse>,
): ProjectCheckinMetricResponse {
  return {
    id: `${metric_key}-${score ?? 'skip'}`,
    submission_id: options?.submission_id ?? 'submission-1',
    metric_key,
    score,
    previous_score: options?.previous_score ?? null,
    delta: options?.delta ?? null,
    is_skipped: options?.is_skipped ?? false,
    selected_tags: options?.selected_tags ?? [],
    note: options?.note ?? null,
    trigger_flags: options?.trigger_flags ?? [],
    created_at: options?.created_at ?? new Date().toISOString(),
  };
}

describe('project check-in scoring', () => {
  it('adds low-score, large-shift, and always-comment prompt flags when relevant', () => {
    expect(
      getTriggerFlags({
        score: 2,
        previousScore: 4,
        isSkipped: false,
        alwaysComment: true,
      }),
    ).toEqual(expect.arrayContaining(['low_score', 'large_shift', 'always_comment']));
  });

  it('builds metric response payloads with previous score and delta', () => {
    const payload = buildMetricResponse({
      definition: definitions[0],
      submissionId: 'submission-1',
      value: {
        score: 2,
        isSkipped: false,
        selectedTags: ['Requirements'],
        note: 'Requirements changed mid-week',
      },
      previousScore: 4,
    });

    expect(payload.metric_key).toBe('clarity');
    expect(payload.previous_score).toBe(4);
    expect(payload.delta).toBe(-2);
    expect(payload.trigger_flags).toEqual(expect.arrayContaining(['low_score', 'large_shift']));
  });

  it('computes project health snapshots and flags risky patterns', () => {
    const responses: ProjectCheckinMetricResponse[] = [
      createResponse('clarity', 2, { submission_id: 'submission-1' }),
      createResponse('clarity', 1, { submission_id: 'submission-2' }),
      createResponse('team_capacity', 2, { submission_id: 'submission-1' }),
      createResponse('team_capacity', 2, { submission_id: 'submission-2' }),
      createResponse('codebase_health', 2, { submission_id: 'submission-1' }),
      createResponse('codebase_health', 2, { submission_id: 'submission-2' }),
      createResponse('delivery_progress', 4, { submission_id: 'submission-1' }),
      createResponse('delivery_progress', 5, { submission_id: 'submission-2' }),
      createResponse('rework_waste', 2, { submission_id: 'submission-1' }),
      createResponse('rework_waste', 2, { submission_id: 'submission-2' }),
      createResponse('collaboration_ownership', 3, { submission_id: 'submission-1' }),
      createResponse('collaboration_ownership', 4, { submission_id: 'submission-2' }),
      createResponse('client_alignment', 2, { submission_id: 'submission-1' }),
      createResponse('client_alignment', 2, { submission_id: 'submission-2' }),
      createResponse('output_quality', 2, { submission_id: 'submission-1' }),
      createResponse('output_quality', 2, { submission_id: 'submission-2' }),
      createResponse('learning_velocity', 2, { submission_id: 'submission-1' }),
      createResponse('learning_velocity', 2, { submission_id: 'submission-2' }),
    ];

    const snapshots = buildProjectHealthSnapshots({
      projectId: 'project-1',
      submissionPeriodId: 123,
      teamSize: 3,
      definitions,
      responses,
      previousAverageByMetric: {
        clarity: 2,
        client_alignment: 4,
        learning_velocity: 2,
      },
    });

    const claritySnapshot = snapshots.find((snapshot) => snapshot.metric_key === 'clarity');
    const capacitySnapshot = snapshots.find((snapshot) => snapshot.metric_key === 'team_capacity');
    const codebaseSnapshot = snapshots.find((snapshot) => snapshot.metric_key === 'codebase_health');
    const clientSnapshot = snapshots.find((snapshot) => snapshot.metric_key === 'client_alignment');
    const learningSnapshot = snapshots.find((snapshot) => snapshot.metric_key === 'learning_velocity');

    expect(claritySnapshot?.average_score).toBe(1.5);
    expect(claritySnapshot?.alert_flags).toContain('clarity_risk');
    expect(capacitySnapshot?.alert_flags).toContain('capacity_rework_spiral');
    expect(codebaseSnapshot?.alert_flags).toContain('unsustainable_delivery');
    expect(clientSnapshot?.alert_flags).toContain('client_alignment_drop');
    expect(learningSnapshot?.alert_flags).toContain('learning_stagnation');
  });
});
