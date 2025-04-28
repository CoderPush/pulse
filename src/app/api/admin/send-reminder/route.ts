import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getEmailSubject, getEmailTemplate } from '@/lib/email-templates';

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

    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'No emails provided' },
        { status: 400 }
      );
    }

    // Create admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results = await Promise.all(
      emails.map(async (email) => {
        try {
          // Generate magic link for each email
          const { data, error } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: email
          });

          if (error) throw error;

          // Extract token_hash from the action_link
          const url = new URL(data.properties.action_link);
          const token_hash = url.searchParams.get('token');

          console.log('url', url);
          console.log('token_hash', token_hash);
          
          if (!token_hash) throw new Error('No token hash found');

          // Construct our own confirmation URL
          const confirmationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token_hash=${token_hash}&type=email`;

          // Send email using our email library
          const { error: emailError } = await sendEmail({
            to: email,
            subject: getEmailSubject('initial'),
            html: getEmailTemplate('initial', 'there', confirmationUrl)
          });

          if (emailError) throw emailError;

          return {
            email,
            success: true
          };
        } catch (error) {
          console.error(`Error processing email ${email}:`, error);
          return {
            email,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Successfully sent magic links to specified users',
      results
    });
  } catch (error) {
    console.error('Error in send reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 