export interface Project {
  name: string;
  hours: number;
}

export interface WeeklyPulseSubmission {
  id: string;
  user_id?: string;
  email: string;
  week_number: number;
  status: string;
  submission_at: string;
  created_at: string;
  manager: string;
  primary_project: Project;
  additional_projects: Project[];
  feedback?: string;
  changes_next_week?: string;
  milestones?: string;
  other_feedback?: string;
  hours_reporting_impact?: string;
  form_completion_time?: number;
}

export interface ProjectHistory {
  week: number;
  project: string;
  hours: number;
}

export interface AdditionalProject {
  project: string;
  hours: number;
}

export interface WeeklyPulseFormData {
  userId: string;
  email: string;
  weekNumber: number;
  primaryProject: Project;
  additionalProjects: AdditionalProject[];
  manager: string;
  feedback: string;
  changesNextWeek: string;
  milestones: string;
  otherFeedback: string;
  hoursReportingImpact: string;
  formCompletionTime: number;
  startTime?: string;
  endTime?: string;
  answers?: Record<string, string | string[]>;
}

export interface ScreenProps {
  onNext: () => void;
  onBack?: () => void;
  formData: WeeklyPulseFormData;
  setFormData: (data: WeeklyPulseFormData) => void;
  error?: string | null;
  projects?: Array<{ id: string; name: string }>;
  userId?: string;
  currentWeekNumber?: number;
  currentYear?: number;
  readOnly?: boolean;
  hideButton?: boolean;
}

export interface Question {
  id: string;
  parent_id?: string;
  version: number;
  title: string;
  description: string;
  type: string;
  required: boolean;
  category: string;
  created_at?: string;
  updated_at?: string;
  display_order?: number;
  is_active?: boolean;
  choices?: string[];
} 