export interface Project {
  name: string;
  hours: number;
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
}

export interface ScreenProps {
  onNext: () => void;
  onBack?: () => void;
  formData: WeeklyPulseFormData;
  setFormData: (data: WeeklyPulseFormData) => void;
} 