const buttonStyle = 'display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 4px;';

export function getDailyTaskReminderEmail({ userName, pulseUrl }: { userName: string, pulseUrl: string }): string {
  return `
    <p>Hi ${userName},</p>
    <p>This is a friendly reminder to log your daily tasks and keep your progress on track.</p>
    <p>Please take a moment to submit your daily pulse here:</p>
    <p><a href="${pulseUrl}" style="${buttonStyle}">Log Your Tasks</a></p>
    <p>Thanks for your hard work!</p>
    <p>Best regards,<br>The Pulse Team</p>
    `;
}

export function getMonthlyLogReminderEmail({ userName, monthName, deadlineDate, reportUrl }: { userName: string, monthName: string, deadlineDate: string, reportUrl: string }): string {
  return `
    <p>Hi ${userName},</p>
    <p>Reminder: Please submit your ${monthName} time log by ${deadlineDate}.</p>
    <p>Please review and submit your report here:</p>
    <p><a href="${reportUrl}" style="${buttonStyle}">Review & Submit Report</a></p>
    <p>Thanks for your hard work!</p>
    <p>Best regards,</p>
    `;
}
