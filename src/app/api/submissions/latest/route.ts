import { NextRequest, NextResponse } from 'next/server';
import { isAllowedOrigin, corsHeaders } from '../../../../utils/cors';
import { createClient } from '../../../../utils/supabase/server';

// Fetch the latest submission (pulse) for a user by email from Supabase
async function getLatestSubmissionByEmail(email: string) {
  const supabase = await createClient();

  // Step 1: Get the user ID from the users table
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) return null;

  // Step 2: Get the latest submission using that user_id
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (submissionError) throw submissionError;

  return submission;
}

function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const expected = process.env.CODERPUSH_PULSE_SECRET_KEY;
  if (!authHeader || !expected) return false;
  // Support 'Bearer <token>' or just the token
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : authHeader;
  return token === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const email = req.nextUrl.searchParams.get('email');
  const origin = req.headers.get('origin');

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json(
      { error: 'CORS forbidden' },
      { status: 403 }
    );
  }

  if (!email) {
    return NextResponse.json(
      { error: 'Missing email' },
      {
        status: 400,
        headers: corsHeaders(origin),
      }
    );
  }

  try {
    const data = await getLatestSubmissionByEmail(email);
    if (!data) {
      return NextResponse.json(
        { error: 'No submission found' },
        {
          status: 404,
          headers: corsHeaders(origin),
        }
      );
    }
    return NextResponse.json(data, {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (error) {
    // Log the error for server-side debugging and monitoring
    console.error('Error in GET /api/submissions/latest:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: corsHeaders(origin),
      }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!isAllowedOrigin(origin)) {
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
} 