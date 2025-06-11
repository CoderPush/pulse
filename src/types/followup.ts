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