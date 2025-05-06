import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

interface AutoLoginToken {
  userId: string;
  exp: number;
}

export async function GET(request: Request) {
  // Only allow in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return new Response('Not available in production', { status: 404 });
  }

  if (!process.env.TEST_USER_PASSWORD) {
    console.error('TEST_USER_PASSWORD environment variable is not defined');
    return Response.redirect(new URL('/auth/login', request.url));
  }

  const token = new URL(request.url).searchParams.get('token');
  
  if (!token) {
    // Redirect to login page if no token
    return Response.redirect(new URL('/auth/login', request.url));
  }

  try {
    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AutoLoginToken;
    const { userId } = payload;
    
    // Get user by ID
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(userId);
    if (userError || !user || !user.email) {
      return Response.redirect(new URL('/auth/login', request.url));
    }
    
    // Create regular client and sign in
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: process.env.TEST_USER_PASSWORD!
    });

    if (signInError) {
      return Response.redirect(new URL('/auth/login', request.url));
    }

    // Success - redirect to home page
    return Response.redirect(new URL('/', request.url));
  } catch {
    return Response.redirect(new URL('/auth/login', request.url));
  }
} 