import { Page } from '@playwright/test';
import { generateAutoLoginToken } from '@/lib/auth/generateAutoLoginToken';
import { createClient as createAdminClient } from '@supabase/supabase-js';

interface TestUser {
  id: string;
  email: string;
}

// Cache for created test users to avoid duplicates
const testUsers = new Map<string, TestUser>();

/**
 * Creates a test user if it doesn't exist, or returns the existing one
 */
export async function createTestUser(email: string): Promise<TestUser> {
  if (!process.env.TEST_USER_PASSWORD) {
    throw new Error('TEST_USER_PASSWORD environment variable is not defined');
  }

  // Check if user already exists in cache
  if (testUsers.has(email)) {
    return testUsers.get(email)!;
  }

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

  try {
    // First check if user exists
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    if (listError) throw listError;
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      const user = { id: existingUser.id, email: existingUser.email! };
      testUsers.set(email, user);
      return user;
    }

    // Create new user if doesn't exist
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: true,
      password: process.env.TEST_USER_PASSWORD!,
      user_metadata: { is_test_user: true }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Failed to create test user: No user data returned');

    const user = { id: data.user.id, email: data.user.email! };
    testUsers.set(email, user);
    return user;
  } catch (error) {
    throw error;
  }
}

/**
 * Auto-login helper for E2E tests
 */
export async function autoLogin(page: Page, email: string) {
  // Ensure user exists
  const user = await createTestUser(email);
  
  // Generate token and perform auto-login
  const token = await generateAutoLoginToken(user.email);
  
  // Visit auto-login URL
  await page.goto(`/api/auth/auto-login?token=${token}`);
  
  // Wait for redirect to home page
  await page.waitForURL('/');
}
