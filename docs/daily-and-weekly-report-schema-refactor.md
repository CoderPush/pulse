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
    template_id UUID REFERENCES templates(id),
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

## 13. Usage Pattern: Reusing Templates for Different Groups and Times

### Key Concepts
- **Template:** Defines the structure/questions of a form (e.g., "Daily Check-in").
- **Submission Period:** Represents a specific instance of a form to be filled (e.g., "Daily Check-in for 2024-07-01").
- **User Assignment:** Links users to a specific submission period (not directly to the template).

### How to Use
- To use the same template for different groups of users at different times:
  1. **Create a submission period** (e.g., for today) and link it to the template.
  2. **Assign users** (e.g., A and B) to this submission period.
  3. Later, **create another submission period** (e.g., for tomorrow or another ad-hoc date) using the same template.
  4. **Assign a different set of users** (e.g., C and D) to this new submission period.
- **You do NOT need to create a new template for each group of users.**
- **You do NOT assign users directly to the template.**
- **You assign users to a submission period that uses the template.**

### Example

| submission_periods | id | template_id | period_type | start_date   | end_date     |
|-------------------|----|-------------|-------------|-------------|-------------|
|                   | 1  | daily_checkin_template | ad-hoc      | 2024-07-01  | 2024-07-01  |
|                   | 2  | daily_checkin_template | ad-hoc      | 2024-07-02  | 2024-07-02  |

| submission_period_users | id | submission_period_id | user_id |
|------------------------|----|---------------------|---------|
|                        | 1  | 1                   | A       |
|                        | 2  | 1                   | B       |
|                        | 3  | 2                   | C       |
|                        | 4  | 2                   | D       |

- On 2024-07-01, users A and B are assigned to fill out the "Daily Check-in" form.
- On 2024-07-02, users C and D are assigned to fill out the same "Daily Check-in" form.
- The template is reused, and each submission period can have its own group of users.

### Summary
- **Templates** define the questions.
- **Submission periods** are the "instances" of a check-in (date, context, etc.).
- **Users** are assigned to submission periods, not directly to templates.
- This allows you to use the same template for any group of users, any number of times, without duplication.

---

## 14. Summary of New Tables for Flexible Reporting

### 1. submission_periods
- Represents each reporting window (e.g., a specific day for a daily check-in, or an ad-hoc event).
- **Key columns:**
  - `id`
  - `period_type` (e.g., 'daily', 'ad-hoc')
  - `start_date`, `end_date`
  - `template_id` (links to the template used for this period)
  - `event_name`, `event_description` (optional, for ad-hoc)
  - `created_at`

### 2. templates
- Defines the structure/questions of a form (e.g., "Daily Check-in").
- **Key columns:**
  - `id`
  - `name`
  - `description`

### 3. template_questions
- Associates questions (by version) with templates, allowing for flexible ordering and reuse.
- **Key columns:**
  - `template_id`
  - `question_id`
  - `display_order`

### 4. submission_period_users
- Assigns users to a specific submission period (not directly to templates).
- **Key columns:**
  - `id`
  - `submission_period_id`
  - `user_id`
  - `template_id`
  - `assigned_at`

---

### How They Work Together
- **Templates** define the questions.
- **Submission periods** are the "instances" of a check-in (date, context, etc.), each linked to a template.
- **Users** are assigned to submission periods via `submission_period_users`.
- **template_questions** allows you to reuse and order questions in any template.

---

## 15. Implementation Plan: Steps to Roll Out Flexible Reporting

### 1. Database Migration
- Create new tables: `submission_periods`, `templates`, `template_questions`, `submission_period_users`.
- Add necessary foreign key constraints and indexes for performance.
- (Optional) Add columns for reminders, event names, etc.

### 2. Backend API Changes
- Implement endpoints to:
  - Create, update, and fetch templates and their questions.
  - Create and manage submission periods (including recurring logic for daily/weekly).
  - Assign users to submission periods.
  - Record and fetch submissions and answers for each period.
  - Track and fetch reminder logs.

### 3. Admin UI
- Build UI for:
  - Creating and editing templates (add/remove questions, set order).
  - Creating and managing submission periods (date, template, etc.).
  - Assigning users to periods (with search/filter for users).
  - Viewing submission status (who has/has not filled for each period).
  - Managing reminders (view logs, trigger manual reminders if needed).

### 4. User Dashboard
- Show users their assigned forms for each period.
- Allow users to fill and submit answers for each assigned period.
- Show submission history and status.

### 5. Reminder Logic
- Implement scheduled jobs (e.g., cron or serverless functions) to:
  - Send daily reminders to users who have not filled their assigned forms.
  - Send missed submission reminders for previous days.
  - Log all reminders in `reminder_logs`.

### 6. Testing and Rollout
- Write tests for all new database logic and API endpoints.
- Test admin and user flows end-to-end.
- Roll out to a staging environment for internal testing.
- Gradually enable for production users, monitoring for issues.

### 7. Documentation and Training
- Update user and admin documentation to explain new features and workflows.
- Train admins on how to create templates, assign users, and track responses.

---

## 16. Additional Best Practices & Considerations

### 1. Submission Conflict Prevention
To ensure data integrity, add a unique constraint to the `submissions` table:

```sql
ALTER TABLE submissions
ADD CONSTRAINT unique_submission_per_user_per_period
UNIQUE (submission_period_id, user_id);
```
This prevents duplicate submissions by the same user for the same period.

---

### 2. Template Evolution Handling
When a template's questions are changed (added, removed, or updated):
- **Best Practice:** Lock the set of questions for each submission period once it is created (or when the first user submits).
- This ensures all users for that period answer the same set of questions, and historical data remains consistent.
- If you want to allow live updates, clearly indicate in the UI which periods are affected and consider versioning the template-question assignments.

---

### 3. Admin UX Flow (Recommended)
**Suggested steps for the admin interface:**
1. **Create/Edit Template:**  
   - Add/remove questions, set order, save as a reusable template.
2. **Create Submission Period:**  
   - Select template, set date(s), configure reminders.
3. **Assign Users:**  
   - Select users for the period (search, filter, bulk add).
4. **Track Responses:**  
   - Dashboard shows assigned users, who has/has not submitted, and allows sending reminders.
5. **View History:**  
   - See past periods, responses, and template/question versions used.


---

### 4. Gradual Weekly Integration (Future Consideration)
- For now, weekly pulse data remains in the old structure.
- In the future, you may choose to link new weekly periods to `submission_periods` for unified dashboards and analytics.
- This is optional and can be planned as a long-term alignment step.

---

## [Update: Recurring Schedules, Reminder Time, and Dynamic Period Creation]

### 1. Why This Update?
To support flexible recurring schedules (e.g., "only send 4 days a week"), custom reminder times, and dynamic admin updates, we recommend the following additions to the schema and operational flow.

---

### 2. New Table: recurring_schedules

This table stores the recurrence pattern and reminder configuration for each template. The cron job will use this table to generate `submission_periods` for the upcoming week.

```sql
CREATE TABLE IF NOT EXISTS recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    days_of_week TEXT[] NOT NULL, -- e.g., ['Mon','Tue','Thu','Fri']
    reminder_time TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE
);
```

- **days_of_week:** Array of days (e.g., ['Mon','Tue','Thu','Fri'])
- **reminder_time:** Default reminder time for the schedule
- **start_date/end_date:** When the recurrence starts/ends

---

### 3. Add reminder_time to submission_periods

To allow for custom reminders per period:

```sql
ALTER TABLE submission_periods ADD COLUMN IF NOT EXISTS reminder_time TIME;
```

---

### 4. Operational Flow: Dynamic Period Creation with Cron Job

- When an admin creates or updates a recurring follow-up, store the schedule in `recurring_schedules`.
- **Do not** pre-create all `submission_periods` for all future days.
- Instead, run a **cron job** (e.g., every Sunday) that:
  - Reads all active `recurring_schedules`.
  - For each, creates a `submission_periods` row for each day in the next week that matches the `days_of_week` array.
  - Assigns users as needed.
- If the admin updates the schedule (e.g., changes from 5 days to 4 days), update the `days_of_week` in `recurring_schedules`. The next cron run will use the new config.

---

### 5. Example: Supporting "Only Send 4 Days a Week"

- Admin sets up a daily follow-up for Mon, Tue, Thu, Fri at 09:00.
- This is saved in `recurring_schedules`.
- The cron job creates `submission_periods` for those days only.
- If the admin later changes to a different set of days, the next week's periods will reflect the new days.

---

### 6. Summary Table: What to Add

| Table                | Field                | Purpose                                  |
|----------------------|----------------------|------------------------------------------|
| submission_periods   | reminder_time (TIME) | When to send reminders for this period   |
| templates            | is_active (BOOL)     | (Optional) Soft delete/disable           |
| recurring_schedules  | days_of_week (TEXT[])| Store which days to create periods       |
| recurring_schedules  | reminder_time (TIME) | Store default reminder time              |
| recurring_schedules  | start_date, end_date | When recurrence starts/ends              |

---

### 7. Migration SQL Example

```sql
ALTER TABLE submission_periods ADD COLUMN IF NOT EXISTS reminder_time TIME;

CREATE TABLE IF NOT EXISTS recurring_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES templates(id) ON DELETE CASCADE,
    days_of_week TEXT[] NOT NULL, -- e.g., ['Mon','Tue','Thu','Fri']
    reminder_time TIME NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE
);
```

---

### 8. Cron Job Logic (Pseudocode)

```js
for each recurring_schedule where is_active:
  for each day in next week:
    if day_of_week in days_of_week:
      create submission_period (if not exists)
      assign users as needed
```

---

### 9. Conclusion
- This approach supports flexible recurring schedules, custom reminder times, and dynamic admin updates.
- The cron job ensures periods are created just-in-time, reflecting the latest admin configuration.
- The schema remains clean and scalable for future needs.

---

[End of update]

# [Original content continues below]

---

## [Update: Reminder Feature for Daily/Weekly/Ad-hoc Submissions]

### 1. Overview
To ensure users complete their assigned forms, the system supports automated email reminders. Reminders are sent only to users who have not yet submitted for a given reporting period, at the configured reminder time.

---

### 2. Reminder Logic
- At each `reminder_time` (e.g., 09:00), a scheduled cron job (e.g., Vercel Cron) runs.
- For each `submission_period` where the current date matches `start_date` and the current time matches `reminder_time`:
  - Find all users assigned to that period (`submission_period_users`).
  - For each user, check if they have already submitted (row in `submissions` for that `submission_period_id` and `user_id`).
  - **Send a reminder email only to users who have NOT submitted.**

---

### 3. Example SQL to Find Users Who Need a Reminder

```sql
SELECT
  spu.user_id,
  sp.id AS submission_period_id,
  sp.reminder_time,
  sp.start_date,
  t.name AS template_name
FROM
  submission_periods sp
JOIN
  submission_period_users spu ON spu.submission_period_id = sp.id
JOIN
  templates t ON sp.template_id = t.id
LEFT JOIN
  submissions s ON s.submission_period_id = sp.id AND s.user_id = spu.user_id
WHERE
  sp.start_date::date = CURRENT_DATE
  AND sp.reminder_time = CURRENT_TIME::time(0)
  AND s.id IS NULL;
```

---

### 4. Cron Job Scheduling
- Run the cron job every 5–10 minutes (or as needed for your precision).
- For each run, check for `submission_periods` with a `reminder_time` matching the current time window.
- Send reminders only to users who have not submitted.

---

### 5. Missed Submission Reminders (Optional)
- At the end of each day, run a separate job to remind users who never submitted for that day.
- Use similar logic, but check for periods that have ended and users who still have not submitted.

---

### 6. Best Practices
- Store a log of sent reminders (optional, for audit and to avoid duplicates).
- Make the cron job timezone-aware if you have users in different regions.
- Use Supabase or your backend to query the data, and Vercel serverless function to send emails.

---

### 7. Example Reminder Flow
1. Cron job runs at 09:00.
2. Finds all `submission_periods` with `reminder_time = 09:00` and `start_date = today`.
3. For each period, finds all assigned users who have not submitted.
4. Sends reminder emails to those users.

---

[End of reminder feature update]

--- 


Recommended Flow:
Step 1 (Questions):
Create all questions.
Create the template (with name, description, etc.).
Link the questions to the template (insert into template_questions).
Store the template ID for use in later steps.
Step 2 (Participants):
Assign users to the template/period.
Step 3 (Frequency/Schedule):
Set up recurring schedules, reminders, etc.