import { NextRequest, NextResponse } from 'next/server';

// Helper function to check if the origin is allowed
function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return hostname.endsWith('.coderbase.dev') || hostname === 'coderbase.dev';
  } catch {
    return false;
  }
}

// Placeholder for actual data fetching logic
async function getLatestSubmissionByEmail(email: string) {
  // TO DO: Replace with real data fetching from Supabase
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
  // Return an empty object instead of undefined values
  return {};
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');
  const origin = req.headers.get('origin');

  if (!isAllowedOrigin(origin)) {
    return new NextResponse(
      JSON.stringify({ error: 'CORS forbidden' }),
      { status: 403 }
    );
  }

  if (!email) {
    return new NextResponse(
      JSON.stringify({ error: 'Missing email' }),
      {
        status: 400,
        headers: corsHeaders(origin),
      }
    );
  }

  try {
    const data = await getLatestSubmissionByEmail(email);
    if (!data) {
      return new NextResponse(
        JSON.stringify({ error: 'No submission found' }),
        {
          status: 404,
          headers: corsHeaders(origin),
        }
      );
    }
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: corsHeaders(origin),
    });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
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