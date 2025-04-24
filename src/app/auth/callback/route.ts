import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Simply redirect to the client-side callback page
  return NextResponse.redirect(new URL('/auth/callback/client', request.url), {
    status: 302
  });
}
