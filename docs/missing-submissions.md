# Missing Submissions Tracking

## Core Features
1. New "Missing Submissions" view in admin
2. List users who haven't submitted for current week
3. Manual reminder sending functionality
4. Track reminder history

## Implementation Steps
1. [ ] Create missing submissions table
   ```sql
   CREATE TABLE reminder_logs (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     week_number INTEGER,
     sent_at TIMESTAMP,
     sent_by UUID REFERENCES users(id)
   );
   ```

2. [ ] Create missing submissions page
   - Week selector (defaults to current week)
   - User list with submission and reminder status
   - Bulk action buttons
   - Reminder history

3. [ ] Add API endpoints
   - GET `/api/admin/submissions/missing`
     ```typescript
     // Query params:
     // - year (optional, defaults to current)
     // - week (optional, defaults to current)
     // Returns:
     // - List of users without submissions
     // - Their last reminder info
     // - Week deadline info
     ```
   - POST `/api/admin/submissions/remind`
     ```typescript
     // Body:
     // - user_ids: string[] (UUIDs of users to remind)
     // - year: number
     // - week: number
     // - message: string (optional custom message)
     ```

4. [ ] Implement missing submissions query
   ```sql
   WITH current_week AS (
     SELECT year, week_number, submission_start, submission_end, late_submission_end
     FROM weeks
     WHERE year = :year
       AND week_number = :week_number
   )
   SELECT 
     u.id as user_id,
     u.email,
     u.name,
     cw.year,
     cw.week_number,
     cw.submission_end,
     cw.late_submission_end,
     rl.sent_at as last_reminder_sent,
     rl.sent_by as last_reminder_sent_by
   FROM users u
   CROSS JOIN current_week cw
   LEFT JOIN submissions s ON 
     s.user_id = u.id 
     AND s.year = cw.year 
     AND s.week_number = cw.week_number
   LEFT JOIN reminder_logs rl ON
     rl.user_id = u.id
     AND rl.week_number = cw.week_number
     AND rl.sent_at = (
       SELECT MAX(sent_at)
       FROM reminder_logs
       WHERE user_id = u.id
         AND week_number = cw.week_number
     )
   WHERE s.id IS NULL
   ORDER BY rl.sent_at ASC NULLS FIRST;
   ```

5. [ ] Implement reminder sending
   - Email template with magic link
   - Store reminder history in reminder_logs
   - Prevent duplicate reminders within 24h
   - Track who sent the reminder

## UI Components
1. Week Selection
   - Dropdown for year/week selection
   - Default to current week
   - Show submission window dates

2. Missing Users List
   - User info (name, email)
   - Submission status
   - Last reminder sent (if any)
   - Individual remind button
   - Bulk selection checkbox

3. Action Bar
   - Bulk remind button
   - Export to CSV option
   - Filter options:
     - Never reminded
     - Reminded > 24h ago
     - All missing

## Testing Checklist
- [ ] View shows correct missing users
- [ ] Week selector works correctly
- [ ] Send individual reminders
- [ ] Send bulk reminders
- [ ] Track reminder history
- [ ] Verify email delivery
- [ ] Check magic links work
- [ ] Verify 24h reminder throttling
- [ ] Test past weeks querying
- [ ] Validate reminder logs creation

## Notes
- Query includes reminder history to help admins make informed decisions
- Users are ordered by reminder status (never reminded first)
- System prevents reminder spam with 24h cooldown
- Magic links in reminders for easy submission access
- All reminder actions are logged for accountability 