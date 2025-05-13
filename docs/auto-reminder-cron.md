# Automatic Reminder System with Vercel Cron Jobs

This document describes how to implement an automatic reminder system for weekly pulse submissions using Vercel Cron Jobs

## Overview
- Automatically send reminders to users who have not submitted their weekly pulse.
- Reminders are sent at:
  - **Friday 5 PM** (form opens)
  - **Monday 2 PM** (remind users who have not submitted)
- Uses Vercel Cron Jobs to trigger reminders.
- Leverages existing reminder logic and templates.

## Steps

### 1. Create a New API Route for Cron Jobs
- Path: `src/app/api/cron/reminders/route.ts`
- This route:
  - Runs automatically at scheduled times
  - Finds users who haven't submitted for the current week
  - Sends reminders using the existing reminder logic

### 2. Vercel Cron Configuration
Add the following to your `vercel.json`:

```json5
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 17 * * 5"  // Friday at 5 PM
    },
    {
      "path": "/api/cron/reminders",
      "schedule": "0 14 * * 1"  // Monday at 2 PM
    }
  ]
}
```

### 3. Implementation Details

#### a. Create the Cron Route
- Implement logic to:
  - Authenticate using a secret token
  - Find users who have not submitted for the current week
  - Call the existing reminder API with the list of users

#### b. Environment Variables
Add to your `.env`:
```
CRON_SECRET=your-secure-random-string
```

#### c. Security
- Cron jobs are triggered by Vercel per schedule.
	- The endpoint is secured with `CRON_SECRET` to prevent unauthorized execution.

#### d. Testing
- Test the cron route locally using `curl` or similar tools
- Verify emails are sent and logs are created

#### e. Deployment
1. Add the `vercel.json` configuration
2. Set up the `CRON_SECRET` in Vercel environment variables
3. Deploy to Vercel
4. Monitor the first few runs

### 4. Notes on Existing Reminder Logic
- The reminder logic in `src/app/api/admin/submissions/remind/route.ts` is reused
- Handles different templates based on reminder count
- 24-hour cooldown between reminders
- Proper logging and error handling

---