import { Resend } from 'resend';
import nodemailer from 'nodemailer';

interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: Error | unknown;
}

interface EmailAttachment {
  filename: string;
  content: string | Buffer; // Base64 string for Resend, Buffer for nodemailer
  contentType?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
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

interface ResendEmailPayload {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}

async function sendEmailWithResend(options: EmailOptions): Promise<EmailResponse> {
  try {
    const emailPayload: ResendEmailPayload = {
      from: process.env.EMAIL_FROM || 'Weekly Pulse <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      emailPayload.attachments = options.attachments.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string' 
          ? att.content 
          : att.content.toString('base64'),
      }));
    }

    const { data, error } = await resend.emails.send(emailPayload);

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
    // Convert array to comma-separated string if needed
    const toAddress = Array.isArray(options.to) ? options.to.join(',') : options.to;
    
    console.log('Sending email to Inbucket:', {
      to: toAddress,
      subject: options.subject,
      // Log a preview of the HTML content
      htmlPreview: options.html.substring(0, 100) + '...',
      hasAttachments: options.attachments && options.attachments.length > 0,
    });

    interface NodemailerMailOptions {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
    }

    const mailOptions: NodemailerMailOptions = {
      from: process.env.EMAIL_FROM || 'Weekly Pulse <onboarding@resend.dev>',
      to: toAddress,
      subject: options.subject,
      html: options.html,
    };

    // Add attachments if provided
    if (options.attachments && options.attachments.length > 0) {
      mailOptions.attachments = options.attachments.map(att => ({
        filename: att.filename,
        content: typeof att.content === 'string' 
          ? Buffer.from(att.content, 'base64')
          : att.content,
        contentType: att.contentType || 'text/csv',
      }));
    }

    const info = await localTransporter.sendMail(mailOptions);

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