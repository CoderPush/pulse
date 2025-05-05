# Auto-Login via Email Reminder Implementation Plan

## Overview

This plan enables users to receive an email reminder with a secure, expiring auto-login link. The link allows the user to log in automatically, even if they previously signed up with Google or were imported. The solution uses stateless JWT tokens

## Implementation Details

### 1. Generate Unique, Secure Passwords

- When a user clicks the auto-login link, generate a new, strong, random password for them
- Update their password in Supabase using the Admin API
- Never expose the password to the user

### 2. JWT-Based Auto-Login Link

- When sending a reminder email, generate a JWT token containing:
  - The user's ID (or email)
  - An expiration timestamp (e.g., 1 hour or 3 days)
  - (Optional) A random nonce for extra security
- Sign the JWT with a strong server-side secret
- Include the JWT as a query parameter in the auto-login link

### 3. API: Send Email Reminder

**File:** `src/app/api/admin/submissions/remind/route.ts`

#### Steps:
1. For each user to remind:
   - Generate a JWT token with user ID/email and expiration
   - Construct the auto-login link:  
     `https://your-app.com/api/auth/auto-login?token=<JWT>`
   - Use this link in the email template
2. Send the email as usual
3. Log the reminder in your `reminder_logs` table

### 4. API: Auto-Login Endpoint

**File:** `src/app/api/auth/auto-login/route.ts` (to be created)

#### Steps:
1. Receive the JWT token from the query parameter
2. Verify the JWT signature and expiration
3. Extract the user ID/email from the token
4. Generate a new, strong, random password
5. Use the Supabase Admin API to update the user's password to the new value
6. Use the Supabase client to sign in the user with the new password
7. Set the session cookie or return the access token to the frontend
8. Redirect the user to the app (now authenticated)

## Security Considerations

- Use a strong secret for signing JWTs
- Set a short expiration for the JWT (e.g., 1 hour)
- Never expose the password in the URL or email
- Optionally, include a nonce in the JWT to prevent replay attacks

## Code Examples

### JWT Payload Example
```json
{
  "user_id": "abc-123",
  "exp": 1712345678
}
```

### Password Generation (Node.js)
```javascript
const crypto = require('crypto');

function generatePassword() {
  return crypto.randomBytes(32).toString('hex'); // 64 chars, very strong
}
```

### JWT Generation (Node.js)
```javascript
const jwt = require('jsonwebtoken');

function generateAutoLoginToken(userId) {
  return jwt.sign(
    { 
      user_id: userId, 
      exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour expiry
    },
    process.env.JWT_SECRET
  );
}
```

### JWT Verification (Node.js)
```javascript
const jwt = require('jsonwebtoken');

function verifyAutoLoginToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
}
```

## Implementation Flow

| Step | Action | Description |
|------|--------|-------------|
| 1. Generate JWT | When sending email | Create JWT with user info and expiration |
| 2. Send link | Email delivery | Include `/api/auth/auto-login?token=JWT` in email |
| 3. User clicks link | Auto-login process | API verifies JWT, generates new password, updates user, signs in |
| 4. Session | Authentication | Set session cookie or return access token, redirect to app |

## Next Steps

1. Implement JWT generation in your email reminder API
2. Create the auto-login API endpoint
3. Test the full flow end-to-end:
   - Email delivery
   - Link generation
   - Auto-login process
   - Session handling
   - Security measures