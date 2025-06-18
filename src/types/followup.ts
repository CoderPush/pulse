export type FollowUp = {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  days: string[];
  reminderTime: string | null;
  participants: number;
  createdAt: string;
  type?: string;
};

export type FollowUpQuestion = {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  required: boolean;
  choices?: string[];
  display_order?: number;
};

export type Template = {
  id: string;
  name: string;
  description: string;
};

export type Question = {
  id: string;
  title?: string;
  text?: string;
  type: string;
  description?: string;
  required?: boolean;
  choices?: string[];
};

export type SubmissionPeriod = {
  id: string;
  period_type: string;
  start_date: string;
  end_date: string;
  template_id: string;
};

export type Submission = {
  id: string;
  submission_period_id: string;
  submitted_at: string;
  user_id: string;
  type: string;
};

export type DailyPeriodForm = {
  period: SubmissionPeriod;
  template: Template | null;
  questions: Question[];
  submission: Submission | null;
  form: Record<string, string | string[]>;
  submitted: boolean;
  submitting: boolean;
  submitError: string | null;
}; 