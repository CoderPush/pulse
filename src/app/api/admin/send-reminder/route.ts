import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { getEmailSubject, getEmailTemplate } from '@/lib/email-templates';

export async function POST(request: Request) {
  try {
    // Create admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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

    // Get all users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*');

    console.log('Users query result:', { usersData, usersError });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    // Process each user
    const results = [];
    for (const user of usersData) {
      try {
        // Add a delay of 1 second between each email send
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate magic link using admin API
        const { data, error: authError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: user.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
          }
        });

        if (authError) throw authError;

        // Use the action_link directly from Supabase
        const magicLink = data.properties.action_link;

        // Send email with our custom template
        const name = user.name || 'there';
        const { error: emailError } = await sendEmail({
          to: user.email,
          subject: getEmailSubject('initial'),
          html: getEmailTemplate('initial', name, magicLink),
        });

        if (emailError) throw emailError;

        results.push({
          email: user.email,
          success: true,
        });
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
        results.push({
          email: user.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully sent reminder emails to all users',
      results,
    });
  } catch (error) {
    console.error('Error in send-reminder:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 