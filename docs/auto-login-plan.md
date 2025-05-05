# Auto-Login Implementation Plan

## Overview

This plan provides two distinct implementations for auto-login functionality:

1. **Simple Auto-Login for E2E Testing**: A streamlined version focused on making end-to-end testing easier
2. **Complete Reminder Flow**: A full-featured implementation with email reminders and enhanced security

## Version 1: Simple Auto-Login for E2E Testing

### Overview
A simplified version designed to make E2E testing easier, particularly for testing authenticated user flows. This version uses environment variables for test credentials and minimal logging.

### File Structure
```
src/
├── app/
│   └── api/
│       └── auth/
│           └── auto-login/
│               └── route.ts
├── lib/
│   └── auth/
│       └── generateAutoLoginToken.ts
e2e/
├── fixtures/
│   └── auth.ts
└── specs/
    └── auth.spec.ts
```

### Implementation Steps

#### 1. JWT Token Generation
**File:** `src/lib/auth/generateAutoLoginToken.ts`

```typescript
import jwt from 'jsonwebtoken';

interface AutoLoginToken {
  userId: string;
  exp: number;
}

export function generateAutoLoginToken(userId: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  return jwt.sign(
    { 
      userId,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    },
    process.env.JWT_SECRET
  );
}
```

#### 2. Auto-Login API Route
**File:** `src/app/api/auth/auto-login/route.ts`

```typescript
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
  } catch (error) {
    return Response.redirect(new URL('/auth/login', request.url));
  }
}
```

#### 3. E2E Test Helper
**File:** `e2e/fixtures/auth.ts`

```typescript
import { Page } from '@playwright/test';
import { generateAutoLoginToken } from '@/lib/auth/generateAutoLoginToken';
import { createClient as createAdminClient } from '@supabase/supabase-js';

interface TestUser {
  id: string;
  email: string;
}

// Cache for created test users to avoid duplicates
const testUsers = new Map<string, TestUser>();

export async function createTestUser(email: string): Promise<TestUser> {
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
      password: process.env.TEST_USER_PASSWORD || 'Test123!',
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

export async function autoLogin(page: Page, email: string) {
  try {
    // Ensure user exists
    const user = await createTestUser(email);
    
    // Generate token and perform auto-login
    const token = await generateAutoLoginToken(user.email);
    
    // Visit auto-login URL
    await page.goto(`/api/auth/auto-login?token=${token}`);
    
    // Wait for redirect to home page
    await page.waitForURL('/');
  } catch (error) {
    throw error;
  }
}
```

#### 4. E2E Test Example
**File:** `e2e/specs/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { autoLogin, createTestUser } from '../fixtures/auth';

test.describe('Auto Login', () => {
  test('can auto login with valid token and redirects to home', async ({ page }) => {
    // Create test user
    const testUser = await createTestUser('test@example.com');

    // Perform auto login
    await autoLogin(page, testUser.email);

    // Verify redirect to home page
    await expect(page).toHaveURL('/');
  });
});
```

### Environment Variables
```env
JWT_SECRET=your-secure-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
TEST_USER_PASSWORD=your-test-password
```

### Implementation Order

1. Set up environment variables
2. Create JWT token generation helper
3. Implement auto-login API route
4. Create E2E test helpers
5. Write E2E tests

### Security Notes
- This implementation is for E2E testing only
- Never expose this endpoint in production
- Use strong JWT secret
- Keep service role key secure
- Use environment variables for test credentials
- Minimal logging for cleaner code

## Version 2: Complete Reminder Flow

### Overview
A full-featured implementation that includes email reminders, enhanced security, and comprehensive monitoring.

### Implementation Details

#### 1. Enhanced JWT Token

```typescript
interface AutoLoginToken {
  userId: string;
  exp: number;
  jti: string;  // Unique token identifier
  nonce: string; // Prevent replay attacks
}

function generateAutoLoginToken(userId: string, isHighSecurity: boolean = false): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  // Generate a unique token ID using crypto
  const jti = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  const expiry = isHighSecurity 
    ? Number(process.env.TOKEN_EXPIRY_HIGH_SECURITY)
    : Number(process.env.TOKEN_EXPIRY);

  return jwt.sign(
    { 
      userId,
      exp: Math.floor(Date.now() / 1000) + expiry,
      jti,
      nonce
    },
    process.env.JWT_SECRET
  );
}
```

#### 2. API: Send Email Reminder

**File:** `src/app/api/admin/submissions/remind/route.ts`

```typescript
async function sendReminderEmail(userId: string) {
  const token = generateAutoLoginToken(userId);
  const loginLink = `https://your-app.com/api/auth/auto-login?token=${token}`;
  
  await sendEmail({
    to: userId,
    subject: 'Your Weekly Pulse Reminder',
    template: 'reminder',
    data: { loginLink }
  });
  
  await logReminderSent(userId);
}
```

#### 3. Auto-Login Endpoint with Security

**File:** `src/app/api/auth/auto-login/route.ts`

```typescript
export async function GET(request: Request) {
  // Rate limiting check
  if (await isRateLimited(request)) {
    return new Response('Too many attempts', { status: 429 });
  }

  const token = new URL(request.url).searchParams.get('token');
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  try {
    const payload = verifyAutoLoginToken(token);
    const { userId } = payload;
    
    // Generate new password
    const newPassword = generateSecurePassword();
    
    // Update user password
    await updateUserPassword(userId, newPassword);
    
    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userId,
      password: newPassword
    });

    if (error) throw error;

    // Log successful login
    await logLoginAttempt({
      userId,
      ip: request.headers.get('x-forwarded-for'),
      success: true
    });

    // Set session and redirect
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('session', data.session.access_token);
    
    return response;
  } catch (error) {
    await logLoginAttempt({
      userId: payload?.userId,
      ip: request.headers.get('x-forwarded-for'),
      success: false,
      error: error.message
    });
    
    return new Response('Invalid token', { status: 401 });
  }
}
```

#### 4. Token Verification

```typescript
type TokenVerificationResult = {
  success: true;
  payload: AutoLoginToken;
} | {
  success: false;
  error: 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'TOKEN_MALFORMED';
  message: string;
};

function verifyAutoLoginToken(token: string): TokenVerificationResult {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as AutoLoginToken;
    return { success: true, payload };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return {
        success: false,
        error: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      };
    }
    
    if (err instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        error: 'TOKEN_INVALID',
        message: 'Invalid token'
      };
    }
    
    return {
      success: false,
      error: 'TOKEN_MALFORMED',
      message: 'Token is malformed'
    };
  }
}
```

#### 5. Security Features

- Rate limiting (max 5 attempts per IP per hour)
- IP tracking and logging
- Token nonce for replay prevention
- Dynamic password generation
- Comprehensive audit logging

#### 6. Environment Variables (Version 2)

```env
JWT_SECRET=your-secure-secret
TOKEN_EXPIRY=259200  # 3 days in seconds
TOKEN_EXPIRY_HIGH_SECURITY=3600  # 1 hour in seconds
RATE_LIMIT_WINDOW=3600  # 1 hour in seconds
RATE_LIMIT_MAX=5  # max attempts per window
```

#### 7. Test Examples

**File:** `tests/auth/reminder-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Reminder Flow', () => {
  test('sends reminder email with valid token', async ({ page }) => {
    // Test email sending
    // Test token generation
    // Test auto-login flow
  });

  test('respects rate limiting', async ({ page }) => {
    // Test rate limiting
  });

  test('handles expired tokens', async ({ page }) => {
    // Test token expiration
  });
});
```

## Implementation Priority

1. **Version 1 (Simple Auto-Login)**
   - Implement first for E2E testing
   - Focus on test helper functions
   - Use fixed test credentials
   - Minimal security features

2. **Version 2 (Complete Flow)**
   - Implement after Version 1 is stable
   - Add all security features
   - Implement email integration
   - Add monitoring and logging
   - Integrate with reminder system

## Security Considerations

### Version 1 (Simple)
- Basic JWT validation
- Fixed test credentials
- No rate limiting
- Minimal logging

### Version 2 (Complete)
- Enhanced JWT with nonce
- Dynamic password generation
- Rate limiting
- IP tracking
- Comprehensive logging
- Email security
- Token expiration
- Audit trails

## Next Steps

1. Implement Version 1:
   - Set up JWT generation
   - Create auto-login endpoint
   - Implement test helpers
   - Write initial E2E tests

2. Implement Version 2:
   - Add security features
   - Implement email system
   - Set up monitoring
   - Add comprehensive logging
   - Write security-focused tests
