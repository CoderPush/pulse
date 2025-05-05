# Auto-Login via Email Reminder Implementation Plan

## Overview

This plan enables users to receive an email reminder with a secure, expiring auto-login link. The link allows the user to log in automatically, even if they previously signed up with Google or were imported. The solution uses stateless JWT tokens.

## Implementation Details

### 1. Generate Unique, Secure Passwords

- When a user clicks the auto-login link, generate a new, strong, random password for them
- Update their password in Supabase using the Admin API
- Never expose the password to the user
- Store password update timestamp for security auditing

### 2. JWT-Based Auto-Login Link

- When sending a reminder email, generate a JWT token containing:
  - The user's ID (stable, immutable identifier)
  - An expiration timestamp (configurable via TOKEN_EXPIRY env var)
    - Default: 3 days for regular reminders
    - 1 hour for high-security operations
    - Adjust based on use case:
      - Admin reminders: 3 days
      - Password reset: 1 hour
      - High-security operations: 1 hour
  - A unique token identifier (jti claim)
    - Standard JWT claim for unique identification
    - Helps prevent token reuse
    - Improves interoperability with JWT tools
- Sign the JWT with a strong server-side secret
- Include the JWT as a query parameter in the auto-login link

### 3. API: Send Email Reminder

**File:** `src/app/api/admin/submissions/remind/route.ts`

#### Steps:
1. For each user to remind:
   - Generate a JWT token with user ID and expiration
   - Construct the auto-login link:  
     `https://your-app.com/api/auth/auto-login?token=<JWT>`
   - Use this link in the email template with expiration notice
2. Send the email as usual
3. Log the reminder in your `reminder_logs` table

### 4. API: Auto-Login Endpoint

**File:** `src/app/api/auth/auto-login/route.ts` (to be created)

#### Steps:
1. Rate limiting check (e.g., max 5 attempts per IP per hour)
2. Receive the JWT token from the query parameter
3. Verify the JWT signature and expiration
4. Extract the user ID from the token
5. Generate a new, strong, random password
6. Use the Supabase Admin API to update the user's password
7. Use the Supabase client to sign in the user
8. Set the session cookie or return the access token
9. Redirect the user to the app
10. Log the successful login

#### Error Handling:
```typescript
interface ErrorResponse {
  error: 'TOKEN_EXPIRED' | 'INVALID_TOKEN' | 'USER_NOT_FOUND' | 'LOGIN_FAILED' | 'RATE_LIMITED';
  message: string;
  code: number;
}
```

### 5. Security Considerations

- Use a strong secret for signing JWTs
- Set expiration for the JWT (3 days)
- Never expose the password in the URL or email
- Include nonce in the JWT to prevent replay attacks
- Implement rate limiting
- Track and log all login attempts
- Monitor for suspicious patterns
- Implement IP-based security checks

### 6. Environment Variables

```env
JWT_SECRET=your-secure-secret
TOKEN_EXPIRY=259200  # Default: 3 days in seconds
TOKEN_EXPIRY_HIGH_SECURITY=3600  # 1 hour in seconds
RATE_LIMIT_WINDOW=3600  # 1 hour in seconds
RATE_LIMIT_MAX=5  # max attempts per window
```

### 7. TypeScript Interfaces

```typescript
interface AutoLoginToken {
  user_id: string;
  exp: number;
  jti: string;  // Standard JWT ID claim
}

interface LoginAttempt {
  user_id: string;
  ip: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}
```

### 8. Code Examples

#### JWT Generation
```typescript
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateAutoLoginToken(userId: string, isHighSecurity: boolean = false) {
  // Generate a unique token ID using crypto
  const jti = crypto.randomBytes(16).toString('hex');
  const expiry = isHighSecurity 
    ? Number(process.env.TOKEN_EXPIRY_HIGH_SECURITY)
    : Number(process.env.TOKEN_EXPIRY);

  return jwt.sign(
    { 
      user_id: userId,
      exp: Math.floor(Date.now() / 1000) + expiry,
      jti  // Using standard JWT ID claim
    },
    process.env.JWT_SECRET
  );
}
```

#### Password Generation
```typescript
function generatePassword(): string {
  return crypto.randomBytes(32).toString('hex');
}
```

#### Token Verification
```typescript
function verifyAutoLoginToken(token: string): AutoLoginToken | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET) as AutoLoginToken;
  } catch (err) {
    return null;
  }
}
```

### 9. Monitoring and Logging

#### Log Events:
- Token generation
- Login attempts (success/failure)
- Password updates
- Rate limit hits
- Suspicious activity

#### Metrics to Track:
- Login success rate
- Token usage patterns
- Rate limit hits
- Error distribution
- Response times

### 10. Testing Strategy

#### Unit Tests:
- Token generation/verification
- Password generation
- Rate limiting
- Error handling

#### Integration Tests:
- Full auto-login flow
- Email delivery
- Session management
- Error scenarios

#### Security Tests:
- Token validation
- Rate limiting
- Password security
- Session handling

### 11. Implementation Flow

| Step | Action | Description | Security Measure |
|------|--------|-------------|------------------|
| 1. Generate JWT | Email sending | Create secure JWT | Nonce, expiration |
| 2. Send link | Email delivery | Include secure link | Rate limiting |
| 3. User clicks | Auto-login | Verify and process | Usage tracking |
| 4. Session | Authentication | Set secure session | Token validation |

### 12. Next Steps

1. Set up environment variables
2. Implement JWT generation in email reminder API
3. Create auto-login API endpoint with security measures
4. Set up monitoring and logging
5. Implement rate limiting
6. Create error handling pages
7. Test the full flow:
   - Email delivery
   - Link generation
   - Auto-login process
   - Session handling
   - Security measures
   - Error scenarios
8. Deploy monitoring
9. Document API endpoints