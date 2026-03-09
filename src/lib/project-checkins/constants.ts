import type { ProjectCheckinLayer } from '@/types/project-checkin';

export const PROJECT_CHECKIN_PAYLOAD_VERSION = 'v1';

export const PROJECT_CHECKIN_LAYER_LABELS: Record<ProjectCheckinLayer, string> = {
  foundation: 'Foundation',
  execution: 'Execution',
  outcome: 'Outcome',
};

export const PROJECT_CHECKIN_LAYER_DESCRIPTIONS: Record<ProjectCheckinLayer, string> = {
  foundation: 'Leading signals that tell the team whether the basics are in place.',
  execution: 'How the team is operating day to day.',
  outcome: 'Lagging signals that describe what the team and client experienced.',
};
