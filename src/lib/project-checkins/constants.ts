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

export const PROJECT_CHECKIN_LAYER_STYLES: Record<
  ProjectCheckinLayer,
  { color: string; border: string; icon: string }
> = {
  foundation: { color: '#6366f1', border: '#c7d2fe', icon: '◆' },
  execution: { color: '#0891b2', border: '#a5f3fc', icon: '◈' },
  outcome: { color: '#059669', border: '#a7f3d0', icon: '◇' },
};

export const SCORE_COLORS: Record<number, { bg: string; border: string; text: string; fill: string }> = {
  1: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', fill: '#ef4444' },
  2: { bg: '#fff7ed', border: '#fdba74', text: '#ea580c', fill: '#f97316' },
  3: { bg: '#fefce8', border: '#fde047', text: '#ca8a04', fill: '#eab308' },
  4: { bg: '#f0fdf4', border: '#86efac', text: '#16a34a', fill: '#22c55e' },
  5: { bg: '#ecfdf5', border: '#6ee7b7', text: '#059669', fill: '#10b981' },
};
