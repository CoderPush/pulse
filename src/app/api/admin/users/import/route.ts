import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

    const { emails } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email format: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Get existing users
    const { data: existingUsers } = await supabase
      .from('users')
      .select('email')
      .in('email', emails);

    const existingEmails = new Set(existingUsers?.map(user => user.email) || []);
    const newEmails = emails.filter(email => !existingEmails.has(email));

    if (newEmails.length === 0) {
      return NextResponse.json({
        success: true,
        successCount: 0,
        skipCount: emails.length,
        message: 'All users already exist'
      });
    }

    // Create admin client with service role key
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const results = await Promise.allSettled(
      newEmails.map(async (email) => {
        const { data, error } = await adminClient.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            is_admin: false
          }
        });
        
        if (error) {
          console.error(`Error creating user ${email}:`, error);
          throw error;
        }
        
        return data;
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      successCount,
      skipCount: existingEmails.size,
      errorCount,
      message: `Successfully imported ${successCount} users, skipped ${existingEmails.size} existing users${errorCount > 0 ? `, ${errorCount} errors` : ''}`
    });
  } catch (error) {
    console.error('Error in import endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 