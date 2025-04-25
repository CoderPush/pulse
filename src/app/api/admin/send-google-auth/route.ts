import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

interface RequestBody {
  emails: string[];
}

export async function POST(request: Request) {
  try {
    // Verify admin API key
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const apiKey = authHeader.split(' ')[1];
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Get emails from request body
    const body: RequestBody = await request.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'No emails provided' },
        { status: 400 }
      );
    }

    // Process each email
    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          // Create login link with email parameter
          const loginLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/login?email=${encodeURIComponent(email)}`;

          // Send email with our custom template
          const { error: emailError } = await sendEmail({
            to: email,
            subject: 'Complete your weekly pulse survey',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Weekly Pulse Reminder</h2>
                <p>Hi there,</p>
                <p>This is a reminder to complete your weekly pulse survey. Click the button below to access the survey.</p>
                <div style="margin: 30px 0;">
                  <a href="${loginLink}" 
                     style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Complete Weekly Pulse
                  </a>
                </div>
                <p>If you have any questions, please contact your manager.</p>
                <p>Best regards,<br>Weekly Pulse Team</p>
              </div>
            `,
          });

          if (emailError) throw emailError;

          return {
            email,
            success: true,
          };
        } catch (error) {
          console.error(`Error processing email ${email}:`, error);
          return {
            email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully sent login emails to specified users',
      results,
    });
  } catch (error) {
    console.error('Error in send-google-auth:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 