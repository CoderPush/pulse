# Weekly Pulse Authentication Flow (Phase 1)

## Overview
This document outlines the simplified authentication flow for Weekly Pulse's first phase, focusing on the magic link email system with manual email triggering.

## Weekly Submission Schedule
| Event | Time (UTC-5) | Description |
|-------|-------------|-------------|
| Form Opens | Friday 5PM | Form becomes available for submissions |
| On-Time Deadline | Monday 2PM | Target deadline for submissions |
| Reminder #1 | Monday 5PM | First reminder email |
| Reminder #2 | Tuesday 9AM | Second reminder email |
| Reminder #3 | Tuesday 12PM | Final reminder email |
| Final Cutoff | Tuesday 5PM | Form hard closes |

## Magic Link Email Flow

### 1. Initial Form Access (Friday 5PM)
- Admin manually triggers initial notification email
- Email includes:
  - Welcome message
  - Form availability announcement
  - Direct magic link to the form
  - Submission deadline information

### 2. On-Time Reminder (Monday 2PM)
- Admin manually triggers reminder email
- Email includes:
  - Urgency message about approaching deadline
  - Magic link to the form
  - Time remaining until deadline
  - Quick access button

### 3. Late Submission Reminders
#### Reminder #1 (Monday 5PM)
- Admin manually triggers reminder
- Email includes:
  - "Late submission" notification
  - Magic link to the form
  - New deadline information (Tuesday 5PM)
  - Warning about form closure

#### Reminder #2 (Tuesday 9AM)
- Admin manually triggers reminder
- Email includes:
  - "Last chance" message
  - Magic link to the form
  - Hours remaining until final cutoff
  - Urgency indicators

#### Reminder #3 (Tuesday 12PM)
- Admin manually triggers final reminder
- Email includes:
  - "Final reminder" message
  - Magic link to the form
  - Countdown to form closure
  - Clear consequences of missing submission

### 4. Magic Link Implementation
- Each magic link is:
  - Single-use
  - Time-limited (expires after 24 hours)
  - Contains user-specific token
  - Automatically logs user in when clicked
  - Redirects directly to the form

### 5. Form Access Control
- Form opens: Friday 5PM UTC+7
- Form closes: Tuesday 5PM UTC+7
- Magic links generated after Tuesday 5PM will:
  - Still authenticate the user
  - Show a "Form Closed" message
  - Provide information about next week's submission window

## Technical Implementation Requirements

### 1. Database Schema Updates
```sql
-- Users table
ALTER TABLE users
ADD COLUMN has_submitted_this_week BOOLEAN DEFAULT FALSE,
ADD COLUMN last_submission_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN last_reminder_sent TIMESTAMP WITH TIME ZONE;

-- Submissions table
ALTER TABLE submissions
ADD COLUMN submission_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN is_late BOOLEAN DEFAULT FALSE;
```

### 2. Environment Variables
```env
# Email Configuration
EMAIL_PROVIDER_API_KEY=your_api_key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME="Weekly Pulse"

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app-url.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key

# Admin Configuration
ADMIN_API_KEY=your_admin_api_key
```

### 3. Required API Endpoints
- `/api/admin/send-reminder` - Admin endpoint to trigger reminder emails
  - Query parameters:
    - `type`: 'initial' | 'on-time' | 'late-1' | 'late-2' | 'late-3'
    - `users`: 'all' | 'unsubmitted' (default: 'unsubmitted')
  - Headers:
    - `Authorization: Bearer ${ADMIN_API_KEY}`

- `/api/auth/magic-link` - Generate and send magic links
- `/api/submissions/status` - Check submission status
- `/api/form/access` - Control form access based on schedule

### 4. Email Templates
Create separate email templates for:
1. Initial form access
2. On-time reminder
3. Late submission reminders (3 variations)
4. Form closed notification

## Security Considerations
1. Magic links must be:
   - Single-use
   - Time-limited
   - User-specific
   - HTTPS-only
2. Implement rate limiting for magic link requests
3. Use secure random token generation
4. Implement proper error handling for expired/invalid links
5. Log all authentication attempts
6. Secure admin API endpoint with API key authentication

## Testing Requirements
1. Test admin API endpoint
2. Verify magic link expiration
3. Test form access control
4. Verify submission status tracking
5. Test error scenarios
6. Validate email templates

## Implementation Steps
1. Set up database schema
2. Configure email service
3. Implement magic link generation
4. Create email templates
5. Create admin API endpoint
6. Implement form access control
7. Add submission tracking
8. Test complete flow
9. Deploy and monitor

## Monitoring and Maintenance
1. Monitor email delivery rates
2. Track magic link usage
3. Monitor submission rates
4. Track reminder effectiveness
5. Regular security audits
6. Performance monitoring
7. Error logging and alerting

## Admin API Usage Example
```bash
# Send initial reminder
curl -X POST "https://your-app-url.com/api/admin/send-reminder?type=initial&users=all" \
  -H "Authorization: Bearer your_admin_api_key"

# Send late reminder to unsubmitted users
curl -X POST "https://your-app-url.com/api/admin/send-reminder?type=late-1" \
  -H "Authorization: Bearer your_admin_api_key"
```

## Future Enhancements (Phase 2)
1. Implement automated cron jobs
2. Add email scheduling interface
3. Add email template customization
4. Add email delivery tracking dashboard
5. Implement automated form access control
