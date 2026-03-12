import type {
  ProjectCheckinMetricDefinition,
  ProjectCheckinMetricFormValue,
  ProjectCheckinMetricKey,
  ProjectCheckinMetricResponse,
  ProjectWeeklyHealthSnapshot,
} from '@/types/project-checkin';

type BuildMetricResponseArgs = {
  definition: ProjectCheckinMetricDefinition;
  submissionId: string;
  value: ProjectCheckinMetricFormValue;
  previousScore: number | null;
};

type BuildHealthSnapshotsArgs = {
  projectId: string;
  submissionPeriodId: number;
  teamSize: number;
  definitions: ProjectCheckinMetricDefinition[];
  responses: ProjectCheckinMetricResponse[];
  previousAverageByMetric: Partial<Record<ProjectCheckinMetricKey, number | null>>;
};

type MetricAggregate = {
  average: number | null;
  min: number | null;
  max: number | null;
  variance: number | null;
  responseCount: number;
};

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function roundToFourDecimals(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function calculateVariance(values: number[]): number | null {
  if (!values.length) return null;

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return roundToFourDecimals(variance);
}

export function getDelta(score: number | null, previousScore: number | null): number | null {
  if (score === null || previousScore === null) return null;
  return score - previousScore;
}

export function getTriggerFlags(args: {
  score: number | null;
  previousScore: number | null;
  isSkipped: boolean;
  alwaysComment: boolean;
}): string[] {
  const flags = new Set<string>();

  if (args.alwaysComment) {
    flags.add('always_comment');
  }

  if (!args.isSkipped && args.score !== null && args.score <= 2) {
    flags.add('low_score');
  }

  if (
    !args.isSkipped &&
    args.score !== null &&
    args.previousScore !== null &&
    Math.abs(args.score - args.previousScore) >= 2
  ) {
    flags.add('large_shift');
  }

  return Array.from(flags);
}

export function buildMetricResponse({
  definition,
  submissionId,
  value,
  previousScore,
}: BuildMetricResponseArgs) {
  const score = value.isSkipped ? null : value.score;
  const delta = getDelta(score, previousScore);
  const triggerFlags = getTriggerFlags({
    score,
    previousScore,
    isSkipped: value.isSkipped,
    alwaysComment: definition.always_comment,
  });

  return {
    submission_id: submissionId,
    metric_key: definition.metric_key,
    score,
    previous_score: previousScore,
    delta,
    is_skipped: value.isSkipped,
    selected_tags: value.selectedTags,
    note: value.note.trim() || null,
    trigger_flags: triggerFlags,
  };
}

export function shouldPromptForDetail(args: {
  definition: ProjectCheckinMetricDefinition;
  value: ProjectCheckinMetricFormValue;
  previousScore: number | null;
}): boolean {
  return getTriggerFlags({
    score: args.value.isSkipped ? null : args.value.score,
    previousScore: args.previousScore,
    isSkipped: args.value.isSkipped,
    alwaysComment: args.definition.always_comment,
  }).length > 0;
}

function aggregateMetricResponses(
  metricKey: ProjectCheckinMetricKey,
  responses: ProjectCheckinMetricResponse[],
): MetricAggregate {
  const values = responses
    .filter((response) => response.metric_key === metricKey && !response.is_skipped && response.score !== null)
    .map((response) => response.score as number);

  if (!values.length) {
    return {
      average: null,
      min: null,
      max: null,
      variance: null,
      responseCount: 0,
    };
  }

  const average = roundToOneDecimal(values.reduce((sum, value) => sum + value, 0) / values.length);

  return {
    average,
    min: Math.min(...values),
    max: Math.max(...values),
    variance: calculateVariance(values),
    responseCount: values.length,
  };
}

function buildAlertFlagsByMetric(args: {
  aggregates: Record<ProjectCheckinMetricKey, MetricAggregate>;
  previousAverageByMetric: Partial<Record<ProjectCheckinMetricKey, number | null>>;
}): Record<ProjectCheckinMetricKey, string[]> {
  const alerts = {} as Record<ProjectCheckinMetricKey, Set<string>>;

  for (const metricKey of Object.keys(args.aggregates) as ProjectCheckinMetricKey[]) {
    alerts[metricKey] = new Set<string>();
    const aggregate = args.aggregates[metricKey];
    if (aggregate.min !== null && aggregate.max !== null && aggregate.max - aggregate.min >= 3) {
      alerts[metricKey].add('high_variance');
    }
  }

  const clarity = args.aggregates.clarity.average;
  const previousClarity = args.previousAverageByMetric.clarity ?? null;
  if (clarity !== null && clarity <= 2 && previousClarity !== null && previousClarity <= 2) {
    alerts.clarity.add('clarity_risk');
  }

  const capacity = args.aggregates.team_capacity.average;
  const rework = args.aggregates.rework_waste.average;
  if (capacity !== null && capacity <= 2 && rework !== null && rework <= 2) {
    alerts.team_capacity.add('capacity_rework_spiral');
    alerts.rework_waste.add('capacity_rework_spiral');
  }

  const delivery = args.aggregates.delivery_progress.average;
  if (delivery !== null && delivery <= 2) {
    alerts.delivery_progress.add('delivery_off_track');
  }

  const codebase = args.aggregates.codebase_health.average;
  if (codebase !== null && codebase <= 2 && delivery !== null && delivery >= 4) {
    alerts.codebase_health.add('unsustainable_delivery');
    alerts.delivery_progress.add('unsustainable_delivery');
  }

  const clientAlignment = args.aggregates.client_alignment.average;
  const previousClientAlignment = args.previousAverageByMetric.client_alignment ?? null;
  if (
    clientAlignment !== null &&
    previousClientAlignment !== null &&
    previousClientAlignment - clientAlignment >= 2
  ) {
    alerts.client_alignment.add('client_alignment_drop');
  }

  const outputQuality = args.aggregates.output_quality.average;
  if (outputQuality !== null && outputQuality <= 2 && codebase !== null && codebase <= 2) {
    alerts.output_quality.add('quality_rooted_in_codebase');
    alerts.codebase_health.add('quality_rooted_in_codebase');
  }

  if (outputQuality !== null && outputQuality <= 2 && codebase !== null && codebase >= 4) {
    alerts.output_quality.add('quality_rooted_in_process');
  }

  const learning = args.aggregates.learning_velocity.average;
  const previousLearning = args.previousAverageByMetric.learning_velocity ?? null;
  if (learning !== null && learning <= 2 && previousLearning !== null && previousLearning <= 2) {
    alerts.learning_velocity.add('learning_stagnation');
  }

  return Object.fromEntries(
    Object.entries(alerts).map(([metricKey, flags]) => [metricKey, Array.from(flags)]),
  ) as Record<ProjectCheckinMetricKey, string[]>;
}

export function buildProjectHealthSnapshots({
  projectId,
  submissionPeriodId,
  teamSize,
  definitions,
  responses,
  previousAverageByMetric,
}: BuildHealthSnapshotsArgs): Omit<ProjectWeeklyHealthSnapshot, 'calculated_at'>[] {
  const aggregates = Object.fromEntries(
    definitions.map((definition) => [
      definition.metric_key,
      aggregateMetricResponses(definition.metric_key, responses),
    ]),
  ) as Record<ProjectCheckinMetricKey, MetricAggregate>;

  const alertsByMetric = buildAlertFlagsByMetric({ aggregates, previousAverageByMetric });

  return definitions.map((definition) => {
    const aggregate = aggregates[definition.metric_key];

    return {
      project_id: projectId,
      submission_period_id: submissionPeriodId,
      metric_key: definition.metric_key,
      average_score: aggregate.average,
      min_score: aggregate.min,
      max_score: aggregate.max,
      variance: aggregate.variance,
      response_count: aggregate.responseCount,
      team_size: teamSize,
      previous_average: previousAverageByMetric[definition.metric_key] ?? null,
      alert_flags: alertsByMetric[definition.metric_key] ?? [],
    };
  });
}
