import { Resend } from 'resend';
import nodemailer from 'nodemailer';

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: Error | unknown;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const isLocalEnvironment = process.env.NODE_ENV === 'development';
const INBUCKET_HOST = 'localhost';
const INBUCKET_SMTP_PORT = 54325; // Default Supabase Inbucket SMTP port

// Create reusable transporter for local development
const localTransporter = nodemailer.createTransport({
  host: INBUCKET_HOST,
  port: INBUCKET_SMTP_PORT,
  secure: false, // true for 465, false for other ports
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

async function sendEmailWithResend(options: EmailOptions): Promise<EmailResponse> {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Weekly Pulse <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error('Error sending email with Resend:', error);
      return { success: false, error };
    }

    console.log('Email sent with Resend:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending email with Resend:', error);
    return { success: false, error };
  }
}

async function sendEmailWithInbucket(options: EmailOptions): Promise<EmailResponse> {
  try {
    console.log('Sending email to Inbucket:', {
      to: options.to,
      subject: options.subject,
      // Log a preview of the HTML content
      htmlPreview: options.html.substring(0, 100) + '...',
    });

    const info = await localTransporter.sendMail({
      from: process.env.EMAIL_FROM || 'Weekly Pulse <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    console.log('Email sent to Inbucket successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email with Inbucket:', error);
    return { success: false, error };
  }
}

export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  if (isLocalEnvironment) {
    return sendEmailWithInbucket(options);
  }
  return sendEmailWithResend(options);
} 