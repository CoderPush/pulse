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

Logic:
- Create interface for token payload (userId, expiry)
- Check for JWT_SECRET environment variable
- Generate token with 1-hour expiry
- Return signed JWT token

#### 2. Auto-Login API Route
**File:** `src/app/api/auth/auto-login/route.ts`

Flow:
1. Extract token from URL parameters
2. If no token, redirect to login
3. Verify JWT token
4. Get user details from Supabase
5. Sign in user with test credentials
6. Redirect to home page on success
7. Handle errors by redirecting to login

#### 3. E2E Test Helper
**File:** `e2e/fixtures/auth.ts`

Functions:
- createTestUser(email): Creates or retrieves test user
- autoLogin(page, email): Handles auto-login flow for tests

#### 4. E2E Test Example
**File:** `e2e/specs/auth.spec.ts`

Test Cases:
- Auto login with valid token
- Verify redirect to home page
- Handle invalid tokens

### Environment Variables
```env
JWT_SECRET=your-secure-secret
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
TEST_USER_PASSWORD=your-test-password
```

## Version 2: Complete Reminder Flow

### Overview
A full-featured implementation that includes email reminders, enhanced security, and comprehensive monitoring.

### Implementation Details

#### 1. Enhanced JWT Token
- Add unique token ID (jti)
- Add nonce for replay prevention
- Configurable expiry times
- High security mode option

#### 2. API: Send Email Reminder
Flow:
1. Generate secure token
2. Create login link
3. Send email with template
4. Log reminder sent

#### 3. Auto-Login Endpoint with Security
Flow:
1. Check rate limits
2. Validate token
3. Generate new password
4. Update user credentials
5. Sign in user
6. Set session cookie
7. Log attempt
8. Handle errors

#### 4. Token Verification
Validation Steps:
1. Verify JWT signature
2. Check expiration
3. Validate token structure
4. Return detailed error messages

#### 5. Security Features
- Rate limiting (5 attempts/hour/IP)
- IP tracking
- Token nonce
- Dynamic passwords
- Audit logging

#### 6. Environment Variables
```env
JWT_SECRET=your-secure-secret
TOKEN_EXPIRY=259200  # 3 days
TOKEN_EXPIRY_HIGH_SECURITY=3600  # 1 hour
RATE_LIMIT_WINDOW=3600  # 1 hour
RATE_LIMIT_MAX=5
```

## Implementation Priority

1. **Version 1 (Simple Auto-Login)**
   - Basic JWT implementation
   - Test helper functions
   - Fixed credentials
   - Minimal security

2. **Version 2 (Complete Flow)**
   - Enhanced security
   - Email integration
   - Monitoring
   - Comprehensive logging

## Security Considerations

### Version 1 (Simple)
- Basic JWT validation
- Fixed test credentials
- No rate limiting
- Minimal logging

### Version 2 (Complete)
- Enhanced JWT with nonce
- Dynamic passwords
- Rate limiting
- IP tracking
- Comprehensive logging
- Email security
- Token expiration
- Audit trails

## Next Steps

1. Implement Version 1:
   - JWT generation
   - Auto-login endpoint
   - Test helpers
   - Initial E2E tests

2. Implement Version 2:
   - Security features
   - Email system
   - Monitoring
   - Comprehensive logging
   - Security tests
