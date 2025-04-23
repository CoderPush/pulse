# Weekly Pulse - Feature Implementation Guide

## Core Features


### 1. Authentication System
- [ ] Implement Supabase Auth
  - [ ] Google OAuth integration
  - [ ] Magic Link authentication
  - [ ] Email whitelist configuration for admins
  - [ ] Automatic login via magic link in email/Mattermost

### 2. Weekly Submission Form
- [ ] Multi-step form implementation
  - [ ] Step 1: Welcome Screen
    - [ ] Personalized greeting
    - [ ] Week number display
    - [ ] Start button
  - [ ] Step 2: Project Selection
    - [ ] Searchable dropdown
    - [ ] Recent projects autocomplete
    - [ ] Project allocation tracking
  - [ ] Step 3: Hours Worked
    - [ ] Number input (10-80 hours validation)
    - [ ] Info tooltip about billable tracking
  - [ ] Step 4: Manager Selection
    - [ ] Autocomplete text input
    - [ ] Team list matching
  - [ ] Step 5: Feedback
    - [ ] Optional text area
    - [ ] 500 character limit
  - [ ] Step 6: Review
    - [ ] Summary of all inputs
    - [ ] Back/Submit buttons
  - [ ] Step 7: Success Screen
    - [ ] Confirmation message
    - [ ] History view link

### 3. Submission Window Logic
- [ ] Implement time-based form access
  - [ ] Form opens: Friday 5PM UTC-5
  - [ ] On-time deadline: Monday 2PM UTC-5
  - [ ] Late submission cutoff: Tuesday 5PM UTC-5
  - [ ] Form lock after cutoff

### 4. Reminder System
- [ ] Configure reminder schedule
  - [ ] Monday 5PM reminder
  - [ ] Tuesday 9AM reminder
  - [ ] Tuesday 12PM reminder
- [ ] Integration with Mattermost API
- [ ] Email notifications via SMTP

### 5. Admin Dashboard
- [ ] Data viewing capabilities
  - [ ] Filter by employee
  - [ ] Filter by week
  - [ ] Filter by team
  - [ ] Filter by submission status
- [ ] Analytics
  - [ ] Submission rate trends
  - [ ] Average hours chart
  - [ ] Challenge tag cloud

### 6. User History
- [ ] Personal submission history
  - [ ] Table view of past submissions
  - [ ] Columns: project, hours, manager, challenges, submission time
  - [ ] Download history feature (CSV/PDF)
- [ ] Backfilled data display (Weeks 9-15)

## Technical Implementation

### 1. Database Schema (Supabase)
```sql
-- Users table
users {
  id: uuid
  email: string
  name: string
  team: string
  is_admin: boolean
}

-- Submissions table
submissions {
  id: uuid
  user_id: uuid
  week_number: integer
  project: string
  hours: integer
  manager: string
  feedback: text
  submitted_at: timestamp
  is_late: boolean
}

-- Projects table
projects {
  id: uuid
  name: string
  is_active: boolean
}
```

### 2. API Endpoints
- [ ] `/api/submissions`
  - [ ] GET: List submissions (with filters)
  - [ ] POST: Create new submission
  - [ ] GET: User's submission history
- [ ] `/api/reminders`
  - [ ] POST: Send reminder
  - [ ] GET: Check reminder status
- [ ] `/api/admin`
  - [ ] GET: Dashboard data
  - [ ] POST: Export data

### 3. Background Jobs
- [ ] Vercel Cron Jobs
  - [ ] Weekly form opening
  - [ ] Deadline reminders
  - [ ] Form locking
  - [ ] Data aggregation

## UI Components

### 1. Form Components
- [ ] MultiStepForm
- [ ] ProjectSelector
- [ ] HoursInput
- [ ] ManagerSelector
- [ ] FeedbackInput
- [ ] ReviewPanel

### 2. Dashboard Components
- [ ] SubmissionTable
- [ ] AnalyticsCharts
- [ ] FilterPanel
- [ ] ExportButton

### 3. Common Components
- [ ] Header
- [ ] Navigation
- [ ] LoadingSpinner
- [ ] ErrorBoundary
- [ ] ToastNotifications

## Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAILTRAP_API_KEY=

# Mattermost
MATTERMOST_WEBHOOK_URL=
MATTERMOST_API_TOKEN=

# App Config
NEXT_PUBLIC_APP_URL=
ADMIN_EMAIL_WHITELIST=
```

## Testing Requirements
- [ ] Form validation tests
- [ ] Authentication tests
- [ ] Submission window tests
- [ ] Reminder system tests
- [ ] Admin dashboard tests
- [ ] Export functionality tests

## Deployment Checklist
- [ ] Vercel project setup
- [ ] GitHub Actions workflow
- [ ] Environment variables configuration
- [ ] Database migration
- [ ] Initial data import
- [ ] Monitoring setup 