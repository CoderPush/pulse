export function getEmailSubject(type: string): string {
  const subjects = {
    'initial': 'Weekly Pulse Form is Now Open',
    'on-time': 'Weekly Pulse Reminder - Deadline Approaching',
    'late-1': 'Weekly Pulse - Late Submission Reminder',
    'late-2': 'Weekly Pulse - Final Morning Reminder',
    'late-3': 'Weekly Pulse - Last Chance to Submit'
  };
  return subjects[type as keyof typeof subjects] || 'Weekly Pulse Reminder';
}

export function getEmailTemplate(type: string, name: string, magicLink: string): string {
  const templates = {
    'initial': `
      <h2>Weekly Pulse Form is Now Open</h2>
      <p>Hi ${name},</p>
      <p>The Weekly Pulse form is now open for submissions. Click the button below to access it:</p>
      <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">Submit Weekly Pulse</a>
    `,
    'on-time': `
      <h2>Weekly Pulse Reminder</h2>
      <p>Hi ${name},</p>
      <p>This is a reminder that the Weekly Pulse form is due soon. Click below to submit:</p>
      <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">Submit Weekly Pulse</a>
    `,
    'late-1': `
      <h2>Late Submission Reminder</h2>
      <p>Hi ${name},</p>
      <p>You haven't submitted your Weekly Pulse yet. The form will close on Tuesday at 5PM.</p>
      <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">Submit Now</a>
    `,
    'late-2': `
      <h2>Final Morning Reminder</h2>
      <p>Hi ${name},</p>
      <p>This is your final morning reminder to submit your Weekly Pulse. The form closes today at 5PM.</p>
      <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">Submit Now</a>
    `,
    'late-3': `
      <h2>Last Chance to Submit</h2>
      <p>Hi ${name},</p>
      <p>This is your final reminder. The Weekly Pulse form will close in a few hours.</p>
      <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;">Submit Now</a>
    `
  };
  return templates[type as keyof typeof templates] || '';
} 