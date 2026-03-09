export const PROJECT_CHECKIN_METRIC_KEYS = [
  'clarity',
  'team_capacity',
  'codebase_health',
  'delivery_progress',
  'rework_waste',
  'collaboration_ownership',
  'client_alignment',
  'output_quality',
  'learning_velocity',
] as const;

export const PROJECT_CHECKIN_LAYERS = ['foundation', 'execution', 'outcome'] as const;

export type ProjectCheckinMetricKey = (typeof PROJECT_CHECKIN_METRIC_KEYS)[number];
export type ProjectCheckinLayer = (typeof PROJECT_CHECKIN_LAYERS)[number];

export type ProjectCheckinScaleGuide = {
  score: number;
  label: string;
  shortLabel: string;
  description: string;
};

export type ProjectTypeOverride = {
  optional?: boolean;
  prompt?: string;
  visibilityHint?: string;
};

export type ProjectCheckinMetricDefinition = {
  metric_key: ProjectCheckinMetricKey;
  display_order: number;
  layer: ProjectCheckinLayer;
  name: string;
  prompt: string;
  description: string | null;
  benchmark_version: string;
  skippable: boolean;
  always_comment: boolean;
  tag_options: string[];
  project_type_overrides: Record<string, ProjectTypeOverride>;
  scale_guide: ProjectCheckinScaleGuide[];
};

export type ProjectCheckinMetricFormValue = {
  score: number | null;
  isSkipped: boolean;
  selectedTags: string[];
  note: string;
};

export type ProjectCheckinMetricPayload = {
  metricKey: ProjectCheckinMetricKey;
  score: number | null;
  isSkipped: boolean;
  selectedTags: string[];
  note: string;
};

export type ProjectCheckinMetricResponse = {
  id: string;
  submission_id: string;
  metric_key: ProjectCheckinMetricKey;
  score: number | null;
  previous_score: number | null;
  delta: number | null;
  is_skipped: boolean;
  selected_tags: string[];
  note: string | null;
  trigger_flags: string[];
  created_at: string;
};

export type ProjectCheckinSubmission = {
  id: string;
  user_id: string;
  submission_period_id: number | null;
  project_id: string;
  type: string;
  year: number | null;
  week_number: number | null;
  open_note: string | null;
  payload_version: string | null;
  submitted_at: string;
};

export type ProjectCheckinProject = {
  id: string;
  name: string;
  is_active?: boolean;
};

export type ProjectMembership = {
  id: string;
  role: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  project: ProjectCheckinProject;
};

export type ProjectCheckinPeriod = {
  id: number;
  period_type: string;
  start_date: string;
  end_date: string;
  event_name: string | null;
  event_description: string | null;
};

export type ProjectCheckinWeek = {
  year: number;
  weekNumber: number;
};

export type ProjectCheckinLandingItem = {
  membership: ProjectMembership;
};

export type ProjectCheckinHistoryEntry = {
  submission: ProjectCheckinSubmission;
  project: ProjectCheckinProject;
  year: number;
  weekNumber: number;
  responses: ProjectCheckinMetricResponse[];
};

export type ProjectWeeklyHealthSnapshot = {
  project_id: string;
  submission_period_id: number;
  metric_key: ProjectCheckinMetricKey;
  average_score: number | null;
  min_score: number | null;
  max_score: number | null;
  variance: number | null;
  response_count: number;
  team_size: number;
  previous_average: number | null;
  alert_flags: string[];
  calculated_at: string;
};

export type ProjectCheckinSubmitResponse = {
  success: boolean;
  submissionId: string;
};
