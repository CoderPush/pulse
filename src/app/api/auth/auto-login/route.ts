import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

interface AutoLoginToken {
  userId: string;
  exp: number;
}

export async function GET(request: Request) {
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
      password: process.env.TEST_USER_PASSWORD || 'Test123!'
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