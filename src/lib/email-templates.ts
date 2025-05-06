export type ReminderType = 'on-time' | 'late-1' | 'late-2' | 'late-3';

interface TemplateData {
  userName: string | null;
  weekNumber: number;
  year: number;
}

export function getReminderSubject(type: ReminderType, data: TemplateData): string {
  const weekText = `Week ${data.weekNumber}, ${data.year}`;
  
  switch (type) {
    case 'on-time':
      return `Pulse Check Reminder - ${weekText}`;
    case 'late-1':
      return `Pulse Check Overdue - ${weekText}`;
    case 'late-2':
      return `Second Reminder: Pulse Check Still Missing - ${weekText}`;
    case 'late-3':
      return `Final Notice: Missing Pulse Check - ${weekText}`;
  }
}

interface TemplateProps {
  name: string | null;
  week: number;
  year: number;
  link: string;
}

function getGreeting(name: string | null): string {
  return name ? `Hi ${name}` : 'Hi there';
}

const buttonStyle = 'display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;';

export const onTimeTemplate = ({ name, week, year, link }: TemplateProps): string => `
  <p>${getGreeting(name)},</p>
  <p>This is a friendly reminder to submit your weekly pulse for Week ${week}, ${year}.</p>
  <p>Your feedback helps us understand how you're doing and how we can improve.</p>
  <p>Please take a moment to complete your submission:</p>
  <p><a href="${link}" style="${buttonStyle}">Submit Weekly Pulse</a></p>
  <p>Best regards,<br>Pulse Team</p>
`;

export const lateTemplate1 = ({ name, week, year, link }: TemplateProps): string => `
  <p>${getGreeting(name)},</p>
  <p>We noticed you haven't submitted your weekly pulse for Week ${week}, ${year} yet.</p>
  <p>Your feedback is important to us, and we'd really appreciate hearing from you.</p>
  <p>Please take a few minutes to complete your submission:</p>
  <p><a href="${link}" style="${buttonStyle}">Submit Now</a></p>
  <p>Best regards,<br>Pulse Team</p>
`;

export const lateTemplate2 = ({ name, week, year, link }: TemplateProps): string => `
  <p>${getGreeting(name)},</p>
  <p>This is our second reminder about your weekly pulse submission for Week ${week}, ${year}.</p>
  <p>We value your input and want to ensure your voice is heard.</p>
  <p>Please complete your submission as soon as possible:</p>
  <p><a href="${link}" style="${buttonStyle}">Submit Now</a></p>
  <p>Best regards,<br>Pulse Team</p>
`;

export const lateTemplate3 = ({ name, week, year, link }: TemplateProps): string => `
  <p>${getGreeting(name)},</p>
  <p>This is an urgent reminder about your weekly pulse submission for Week ${week}, ${year}.</p>
  <p>Your feedback is crucial for our team's success and well-being.</p>
  <p>Please submit your response as soon as possible:</p>
  <p><a href="${link}" style="${buttonStyle}">Submit Now</a></p>
  <p>Best regards,<br>Pulse Team</p>
`; 
