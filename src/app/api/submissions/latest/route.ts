import { NextRequest, NextResponse } from 'next/server';

// Helper to check if the origin is allowed
function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.coderbase.dev') || hostname === 'coderbase.dev';
  } catch {
    return false;
  }
}

// Placeholder for your actual data fetching logic
async function getLatestSubmissionByEmail(email: string) {
  // TODO: Replace with real data fetching (e.g., from Supabase)
  return { id: 'example-id', email, content: 'Latest submission', createdAt: new Date().toISOString() };
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (isAllowedOrigin(origin)) {
    return {
      'Access-Control-Allow-Origin': origin!,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
  }
  // Return an empty object, not undefined values
  return {};
}

export async function GET(req: NextRequest) {
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