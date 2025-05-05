import jwt from 'jsonwebtoken';
import { createClient as createAdminClient } from '@supabase/supabase-js';

interface AutoLoginToken {
  userId: string;
  exp: number;
}

export async function generateAutoLoginToken(email: string): Promise<string> {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  // Create admin client to get user ID
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

  // Get user by email
  const { data: { users }, error } = await adminClient.auth.admin.listUsers();
  if (error) throw error;

  const user = users.find(u => u.email === email);
  if (!user) {
    throw new Error(`User with email ${email} not found`);
  }

  return jwt.sign(
    { 
      userId: user.id,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    } as AutoLoginToken,
    process.env.JWT_SECRET
  );
} 