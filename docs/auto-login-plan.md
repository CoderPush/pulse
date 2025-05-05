# Auto-Login Implementation Plan

## Overview

This plan provides two distinct implementations for auto-login functionality:

1. **Simple Auto-Login for E2E Testing**: A streamlined version focused on making end-to-end testing easier
2. **Complete Reminder Flow**: A full-featured implementation with email reminders and enhanced security

## Version 1: Simple Auto-Login for E2E Testing

### Overview
A simplified version designed to make E2E testing easier, particularly for testing authenticated user flows. This version includes basic password management while maintaining minimal security features.

### Implementation Details

#### 1. Simple JWT Token Generation

```typescript
interface SimpleAutoLoginToken {
  userId: string;
  exp: number;
}

function generateSimpleAutoLoginToken(userId: string): string {
  return jwt.sign(
    { 
      userId,
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    },
    process.env.JWT_SECRET
  );
}
```

#### 2. Password Management

```typescript
// src/lib/auth/password.ts
function generateSimplePassword(): string {
  // Generate a simple but secure password for testing
  return crypto.randomBytes(16).toString('hex');
}

async function updateUserPassword(userId: string, newPassword: string) {
  const { error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  );
  
  if (error) {
    throw new Error(`Failed to update password: ${error.message}`);
  }
}
```

#### 3. Auto-Login API Endpoint

**File:** `src/app/api/auth/auto-login/route.ts`

```typescript
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as SimpleAutoLoginToken;
    const { userId } = payload;
    
    // Generate and update password
    const newPassword = generateSimplePassword();
    await updateUserPassword(userId, newPassword);
    
    // Sign in user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userId,
      password: newPassword
    });

    if (error) throw error;

    // Set session cookie and redirect
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('session', data.session.access_token);
    
    return response;
  } catch (error) {
    return new Response('Invalid token', { status: 401 });
  }
}
```

#### 4. Playwright Test Helper

**File:** `tests/helpers/auth.ts`

```typescript
export async function autoLogin(page: Page, userId: string) {
  const token = generateSimpleAutoLoginToken(userId);
  await page.goto(`/api/auth/auto-login?token=${token}`);
  await page.waitForURL('/');
}

// Helper to create a test user if needed
export async function createTestUser(email: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true
  });
  
  if (error) throw error;
  return data.user;
}
```

#### 5. Test Examples

**File:** `tests/auth/auto-login.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { autoLogin, createTestUser } from '../helpers/auth';

test.describe('Auto Login', () => {
  test.beforeEach(async () => {
    // Create test user if needed
    await createTestUser('test@example.com');
  });

  test('can auto login with valid token', async ({ page }) => {
    await autoLogin(page, 'test@example.com');
    await expect(page).toHaveURL('/');
  });

  test('redirects to home after successful login', async ({ page }) => {
    await autoLogin(page, 'test@example.com');
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('handles invalid token', async ({ page }) => {
    await page.goto('/api/auth/auto-login?token=invalid');
    await expect(page).toHaveURL('/login');
  });
});
```

#### 6. Environment Variables (Version 1)

```env
JWT_SECRET=your-secure-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Version 2: Complete Reminder Flow

### Overview
A full-featured implementation that includes email reminders, enhanced security, and comprehensive monitoring.

### Implementation Details

#### 1. Enhanced JWT Token

```typescript
interface AutoLoginToken {
  user_id: string;
  exp: number;
  jti: string;  // Unique token identifier
  nonce: string; // Prevent replay attacks
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
    const { user_id } = payload;
    
    // Generate new password
    const newPassword = generateSecurePassword();
    
    // Update user password
    await updateUserPassword(user_id, newPassword);
    
    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: user_id,
      password: newPassword
    });

    if (error) throw error;

    // Log successful login
    await logLoginAttempt({
      userId: user_id,
      ip: request.headers.get('x-forwarded-for'),
      success: true
    });

    // Set session and redirect
    const response = NextResponse.redirect(new URL('/', request.url));
    response.cookies.set('session', data.session.access_token);
    
    return response;
  } catch (error) {
    await logLoginAttempt({
      userId: payload?.user_id,
      ip: request.headers.get('x-forwarded-for'),
      success: false,
      error: error.message
    });
    
    return new Response('Invalid token', { status: 401 });
  }
}
```

#### 4. Security Features

- Rate limiting (max 5 attempts per IP per hour)
- IP tracking and logging
- Token nonce for replay prevention
- Dynamic password generation
- Comprehensive audit logging

#### 5. Environment Variables (Version 2)

```env
JWT_SECRET=your-secure-secret
TOKEN_EXPIRY=259200  # 3 days in seconds
TOKEN_EXPIRY_HIGH_SECURITY=3600  # 1 hour in seconds
RATE_LIMIT_WINDOW=3600  # 1 hour in seconds
RATE_LIMIT_MAX=5  # max attempts per window
```

#### 6. Test Examples

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
