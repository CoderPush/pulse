# Schema Refactor Plan: Supporting Daily and Weekly Reports

## Overview

Currently, the system supports only weekly submissions. To enhance flexibility and support daily reports (and potentially other frequencies in the future), we propose a schema refactor and a more extensible design.

---

## 1. Current Limitation
- The `submissions` table is tightly coupled to weekly submissions (`year`, `week_number`).
- The `weeks` table defines weekly windows only.

---

## 2. Goal
- Support both weekly and daily submissions (and more in the future) with a clean, extensible schema.

---

## 3. Proposed Schema Changes

### A. Generalize the Submission Period

- **New Table:** `submission_periods` to represent any reporting period (daily, ad-hoc, etc.).
- **Backward-Compatible:** The existing weekly pulse system (using `year`, `week_number`, and the `weeks` table) remains unchanged and continues to be used for weekly submissions.
- **For new features only:** Daily, ad-hoc, or future custom reports will use the new `submission_periods` table and related tables.
- **No migration required:** There is no need to migrate or drop columns from the existing weekly pulse data.

```sql
CREATE TABLE IF NOT EXISTS public.submission_periods (
    id serial PRIMARY KEY,
    period_type text NOT NULL, -- 'daily', 'ad-hoc', etc.
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    event_name text, -- Optional: for ad-hoc events
    event_description text, -- Optional: for ad-hoc events
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

- For ad-hoc events, create a row with `period_type = 'ad-hoc'` and fill in `event_name`/`event_description` as needed.
- For daily or other new types, create rows as needed for each period.

---

### B. Template System for Questions (Recommended: Templates Table)

- **Recommended Design:**
  - Use a `templates` table to define each form type (e.g., daily, weekly, ad-hoc, or custom event).
  - Use a join table `template_questions` to associate questions (by version) with templates, allowing questions to be reused across multiple templates and supporting flexible ordering.
  - This approach is more flexible and future-proof, as it allows for:
    - Reusing questions in multiple templates
    - Customizing question order per template
    - Supporting new or custom templates without schema changes

- **Schema Example:**

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE template_questions (
    template_id UUID REFERENCES templates(id),
    question_id UUID REFERENCES questions(id),
    display_order INTEGER DEFAULT 0,
    PRIMARY KEY (template_id, question_id)
);
```

- **How to Use:**
  - When rendering a form, select the template (e.g., by name or id), then fetch the latest version of each question associated with that template (using your versioning logic).
  - The frontend dynamically renders the form based on the questions for the selected template.
  - Answers are stored in the `submission_answers` table as before.

---

### C. Admin Workflow: Creating Templates and Assigning Users

- **Template Creation:**
  - Admins can create new templates, give them a name and description, and select which questions (by version) are included in the template.
  - Templates can be for any purpose: daily, weekly, ad-hoc, or custom events.

- **Assigning Users to Templates/Forms:**
  - Admins can select users who are required to fill out a specific template for a given period (e.g., a daily form for a specific date, a weekly form, or an ad-hoc event).
  - This can be managed by associating users with `submission_periods` and templates.

- **Schema Suggestions:**

```sql
-- Assign users to submission periods (for a given template)
CREATE TABLE submission_period_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_period_id INTEGER REFERENCES submission_periods(id),
    user_id UUID REFERENCES users(id),
    template_id UUID REFERENCES templates(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

- **How submission_periods works for daily templates:**
  - You do NOT need to pre-create all days in a year. Instead, create a `submission_periods` row for each day (or range) only as needed (e.g., when a daily form is required for a specific date or group of users).
  - For recurring daily forms, you can automate the creation of these periods, but only for the relevant users and dates.

- **Admin View:**
  - Admins should have a UI to:
    - Create and manage templates (name, description, questions)
    - Assign templates to users for specific periods (dates, weeks, or events)
    - Track which users have or have not submitted their forms for each period

---

## 4. Frontend/Backend Design
- When creating a submission, the UI fetches the template for the period (daily/weekly) and renders the questions dynamically.
- The backend validates and stores answers according to the template.

---

## 5. Migration Plan
- Migrate existing weekly data to the new structure.
- Backfill `submission_periods` for all existing weekly submissions.
- Create default templates for weekly and daily reports.

---

## 6. Benefits
- Easily add new report types (monthly, ad-hoc, etc.).
- Clean separation of period, template, and answers.
- Flexible for future changes.

---

## 7. Next Steps
1. Confirm if this normalized, flexible approach is desired.
2. Draft SQL migration scripts.
3. Update backend API and frontend data flow to use the new structure.

---

## 8. Backward-Compatible Approach: No Migration Required for Weekly Pulse

- The new `submission_periods` system is **additive** and does **not** require migrating existing weekly pulse data.
- Your current weekly pulse system (using `year`, `week_number`, and the `weeks` table) can continue to operate as before, with no changes or migration needed.
- The new tables (`submission_periods`, `templates`, `template_questions`, etc.) are used **only for new features** such as daily, ad-hoc, or custom templates.
- This means:
  - Weekly pulse submissions and queries remain unchanged.
  - New types of reports (daily, ad-hoc, etc.) use the new flexible system.
  - Both systems can coexist, minimizing risk and disruption.
- If you ever want to unify everything under `submission_periods` in the future, you can do so gradually, but it is not required.

| Feature                | Old Weekly Pulse | New Daily/Ad-hoc/Custom |
|------------------------|------------------|-------------------------|
| Data Model             | year, week_number, weeks table | submission_periods, templates, etc. |
| Migration Needed?      | No               | No                      |
| Can Coexist?           | Yes              | Yes                     |
| Future Unification?    | Optional         | Optional                |

- Create default templates for weekly and daily reports.
- ~Backfill `submission_periods` for all existing weekly submissions.~ (Not required) 

---

## 9. Example: Supporting Daily Pulse with submission_periods and User Assignments

### Example Flow: Daily Pulse

#### 1. Admin Creates a Daily Pulse Template
- Admin goes to the Templates section in the admin UI.
- Clicks "Create Template", enters a name (e.g., "Daily Standup"), and a description.
- Adds or selects questions to include in this template (e.g., "What did you work on today?", "Any blockers?").
- Questions are versioned and can be reused in other templates.

#### 2. Admin Assigns Users to the Daily Pulse
- Admin selects the template (e.g., "Daily Standup").
- Chooses the date(s) for which the daily pulse should be filled (e.g., 2024-07-01).
- Selects users (or groups/teams) who are required to fill out the form for that day.
- For each selected date, a row is created in `submission_periods` with `period_type = 'daily'`, `start_date` and `end_date` for that day, and the template ID.
- For each user and period, a row is created in `submission_period_users` linking the user, period, and template.

#### 3. Users Fill Out the Daily Pulse
- On the specified day, assigned users see the daily pulse form in their dashboard.
- The form is dynamically generated based on the template and its questions.
- When a user submits, a row is created in `submissions` (linked to the user and submission_period), and answers are stored in `submission_answers`.

#### 4. Admin Tracks Responses
- Admin can view a dashboard for any given day (submission_period):
  - See all users assigned to that daily pulse.
  - See which users have submitted (responses) and which have not (non-responses).
  - Drill down to view individual responses.

### Example Tables

| submission_periods |
|-------------------|
| id | period_type | start_date | end_date | template_id | ... |
|----|-------------|------------|----------|-------------|-----|
| 1  | daily       | 2024-07-01 | 2024-07-01 | ...       | ... |

| submission_period_users |
|------------------------|
| id | submission_period_id | user_id | template_id | assigned_at |
|----|---------------------|---------|-------------|-------------|
| 1  | 1                   | userA   | ...         | ...         |
| 2  | 1                   | userB   | ...         | ...         |

| submissions |
|-------------|
| id | user_id | submission_period_id | submitted_at | ... |
|----|---------|---------------------|--------------|-----|
| 1  | userA   | 1                   | 2024-07-01   | ... |

| submission_answers |
|-------------------|
| id | submission_id | question_id | answer | ... |
|----|---------------|-------------|--------|-----|
| 1  | 1             | q1          | ...    | ... |

### Visual Flow (Step-by-Step)

1. **Admin creates template** → 2. **Admin adds questions** → 3. **Admin assigns users for a date** → 4. **System creates submission_periods and submission_period_users** → 5. **Users fill form** → 6. **System records submissions and answers** → 7. **Admin dashboard shows who responded and who did not** 

---

## 10. Scenario: Recurring Daily Pulse with Automated Period Creation

### Admin Configuration Example
- **Starting on:** 2025-06-09 (Monday)
- **How often:** Weekly (with daily check-ins on Mon–Fri)
- **On which days:** Mon, Tue, Wed, Thu, Fri
- **Start reminder time:** (e.g., 09:00, or "at participant's work start time")

### How submission_periods Are Created
- For each week, and for each selected day (Mon–Fri), create a row in `submission_periods` for each day the pulse should run.
- Example for the week starting 2025-06-09:

| id | period_type | start_date           | end_date             | template_id | reminder_time | ... |
|----|-------------|---------------------|----------------------|-------------|--------------|-----|
| 1  | daily       | 2025-06-09 09:00:00 | 2025-06-09 23:59:59  | ...         | 09:00        | ... |
| 2  | daily       | 2025-06-10 09:00:00 | 2025-06-10 23:59:59  | ...         | 09:00        | ... |
| 3  | daily       | 2025-06-11 09:00:00 | 2025-06-11 23:59:59  | ...         | 09:00        | ... |
| 4  | daily       | 2025-06-12 09:00:00 | 2025-06-12 23:59:59  | ...         | 09:00        | ... |
| 5  | daily       | 2025-06-13 09:00:00 | 2025-06-13 23:59:59  | ...         | 09:00        | ... |

- Repeat for each week as needed.

### Automating Period Creation
- Use a scheduled job (e.g., a serverless function or cron job in Vercel) to automatically create new `submission_periods` for each upcoming week based on the admin's configuration.
- The job can run once a week (e.g., every Sunday night) and create periods for the next week for all active recurring daily pulses.

#### Pros of This Approach
- **Scalable:** Handles any number of recurring daily/weekly/ad-hoc schedules.
- **Flexible:** Easy to adjust schedules, add/remove users, or change templates.
- **Reliable:** Ensures periods are always created in advance, so users always see the correct forms.

#### Cons / Considerations
- **Requires a scheduler:** You need a reliable way to run scheduled jobs (Vercel cron jobs, Supabase Edge Functions, or another scheduler).
- **Edge Cases:** If the job fails, periods may not be created—add monitoring/alerts.
- **Data Growth:** Over time, many `submission_periods` rows will be created (one per day per schedule), but this is manageable with proper indexing and archiving.

### Summary
- This approach is widely used in SaaS products for recurring tasks and is considered a good practice.
- You can also allow admins to manually create or adjust periods if needed.

---

## 11. Summary

### Pros
- **Extensible:** Easily supports new report types (daily, ad-hoc, custom) without disrupting the weekly pulse.
- **Flexible:** Clean separation of period, template, and answers; templates and questions can be reused and versioned.
- **Backward-compatible:** No migration required for existing weekly pulse data; both systems can coexist.
- **Admin Control:** Admins can create templates, assign users, and track responses/non-responses.
- **Automatable:** Supports scheduled jobs to automate period creation for recurring daily/weekly forms.

### Cons / Considerations
- **Scheduler Required:** Needs a reliable job (e.g., Vercel cron) to create new periods for recurring forms.
- **Data Growth:** Many rows in `submission_periods` over time (manageable with indexing/archiving).
- **Edge Cases:** If the job fails, periods may not be created—monitoring is needed.
- **Slight Complexity:** Two systems (old weekly, new flexible) must be maintained in parallel.

### What is Kept for Weekly Pulse
- The current weekly pulse system (using `year`, `week_number`, and the `weeks` table) remains unchanged.
- No migration or refactor is required for existing weekly data or logic.
- Weekly pulse submissions and queries continue to use the old structure.

### What Will Support Daily Pulse
- The new system uses:
  - `submission_periods` to define each daily reporting window.
  - `templates` and `template_questions` to define and group questions for each form.
  - `submission_period_users` to assign users to each period/template.
  - `submissions` and `submission_answers` to store user responses.
- Admins can:
  - Create daily (or other) templates and questions.
  - Assign users and dates for daily reporting.
  - Track who has/has not responded for each day.
- Periods for daily forms are created automatically (e.g., via a scheduled job) or manually as needed.

---

## 12. Reminder Feature: Email Reminders for Daily and Missed Submissions

### How the Schema Supports Reminders

- **submission_periods:**
  - Each row defines a reporting window (e.g., a specific day for a daily pulse).
  - You can use `start_date`, `end_date`, and (optionally) a `reminder_time` column to schedule reminders.

- **submission_period_users:**
  - Links users to specific periods and templates.
  - You know exactly which users are expected to submit for each period.

- **submissions:**
  - Check if a user has submitted for a given `submission_period_id`.
  - If not, they are eligible for a reminder.

- **reminder_logs:**
  - Tracks when reminders were sent to users for each period.
  - Prevents duplicate reminders and provides an audit trail.

### Example Reminder Flows

#### A. Daily Reminder
- Each morning, check all `submission_period_users` for today's period.
- For each user who has not submitted, send a reminder email.
- Log the reminder in `reminder_logs`.

#### B. Missed Submission Reminder
- At the end of each day (or next morning), check for users who were assigned to yesterday's period but did not submit.
- Send a "You missed yesterday's pulse" email.
- Log the reminder in `reminder_logs`.

### Optional Schema Extensions
- Add a `reminder_time` column to `submission_periods` for custom reminder scheduling.
- Add a user preferences table if you want to allow users to snooze or opt out of reminders.

### Summary
- The schema already supports robust reminder logic for daily and missed submissions.
- Backend logic (cron job or scheduled function) can use these tables to send reminders and track them efficiently.

--- 