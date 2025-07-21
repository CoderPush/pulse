import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const wantsDailyReminders = searchParams.get('wants_daily_reminders');
    const userId = searchParams.get('userId');

    // Build the query
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    // If userId is provided, get specific user
    if (userId) {
      query = query.eq('id', userId);
    } else {
      // Apply search filter if provided
      if (search) {
        query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`);
      }

      if (wantsDailyReminders === 'true') {
        query = query.eq('wants_daily_reminders', true);
      }
    }

    const { data: users, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const { userId, is_admin, name, wants_daily_reminders } = await request.json();
    const trimmedName = typeof name === 'string' ? name.trim() : undefined;

    if (
      !userId ||
      (typeof is_admin !== 'boolean' && 
       typeof trimmedName !== 'string' &&
       typeof wants_daily_reminders !== 'boolean') ||
      trimmedName === ''
    ) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Don't allow users to remove their own admin status
    if (userId === user.id && is_admin === false) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin status' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (typeof is_admin === 'boolean') updateData.is_admin = is_admin;
    if (typeof wants_daily_reminders === 'boolean') updateData.wants_daily_reminders = wants_daily_reminders;
    if (typeof trimmedName === 'string' && trimmedName !== '') updateData.name = trimmedName;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 