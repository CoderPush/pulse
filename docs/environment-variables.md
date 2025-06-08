# Environment Variables Documentation

This document provides information about the environment variables used in the Pulse application.

## Core Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | The URL of your Supabase instance. | Yes | `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anonymous API key for Supabase client-side operations. | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for privileged Supabase operations. | Yes | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_APP_URL` | Base URL of the application. | Yes | `http://localhost:3000` |

## Authentication

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID for authentication. | Yes | `114506932690-kg50jcimq594n9dhe2lp5j3gh7diji7m.apps.googleusercontent.com` |
| `JWT_SECRET` | Secret key for JWT token generation and validation. | Yes | `your-secure-secret` |
| `TEST_USER_PASSWORD` | Password for test user accounts. | For testing | `Test123!` |

## Email

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `RESEND_API_KEY` | API key for Resend email service. | For production | `re_123456789` |
| `EMAIL_FROM` | Email address used as the sender for notifications. | Yes | `pulse@pulse.dev` |

## Security and Automation

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `CRON_SECRET` | Secret key for securing cron job endpoints. | Yes | `your-secure-random-string` |
| `NEXT_PUBLIC_COPILOT_CLOUD_PUBLIC_API_KEY` | API key for Copilot Cloud integration. | Optional | `ck_pub_73d71104458113fba865befd371de87e` |

## Environment Setup

### Development

For local development, copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

### Production

In production environments, ensure all required variables are properly set in your deployment platform (Vercel, AWS, etc.).

## Security Notes

- Never commit actual secret values to your repository
- Rotate keys periodically for enhanced security
- Use different keys for development and production environments