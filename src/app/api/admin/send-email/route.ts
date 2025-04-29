import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate, getEmailSubject } from '@/lib/email-templates';

// Helper function to sleep for X ms
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!userData?.is_admin) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { emails, type } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Emails list is required' },
        { status: 400 }
      );
    }

    const results = [];

    // Send 2 emails, then sleep
    for (let i = 0; i < emails.length; i += 2) {
      const batch = emails.slice(i, i + 2); // take 2 emails at a time

      const batchResults = await Promise.all(
        batch.map(async (email) => {
          const magicLink = `${process.env.NEXT_PUBLIC_APP_URL}`;
          const template = getEmailTemplate(type, email, magicLink);
          const subject = getEmailSubject(type);

          return sendEmail({
            to: email,
            subject,
            html: template
          });
        })
      );

      results.push(...batchResults);

      // Sleep for 1 second after sending 2 emails
      if (i + 2 < emails.length) {
        await sleep(1000);
      }
    }

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
