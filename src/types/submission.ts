export interface Submission {
  id: string;
  email: string;
  week_number: number;
  primary_project: {
    name: string;
    hours: number;
  };
  additional_projects: Array<{
    project: string;
    hours: number;
  }>;
  manager: string;
  feedback?: string;
  changes_next_week?: string;
  milestones?: string;
  other_feedback?: string;
  hours_reporting_impact?: string;
  form_completion_time?: number;
  status: 'pending' | 'submitted' | 'late' | 'not_submitted';
  created_at: string;
} 