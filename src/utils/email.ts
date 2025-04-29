interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<void> {
  // For now, just log the email details
  console.log('Sending email:', {
    to,
    subject,
    html
  });

  // TODO: Implement actual email sending using your preferred email service
  // Example with Resend:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'pulse@yourdomain.com',
  //   to,
  //   subject,
  //   html
  // });
} 