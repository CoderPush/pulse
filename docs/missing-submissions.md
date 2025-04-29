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
   - Week selector
   - User list with submission status
   - Bulk action buttons
   - Reminder history

3. [ ] Add API endpoints
   - GET `/api/admin/submissions/missing`
   - POST `/api/admin/submissions/remind`

4. [ ] Implement reminder sending
   - Email template with magic link
   - Store reminder history
   - Prevent duplicate reminders

## Testing Checklist
- [ ] View shows correct missing users
- [ ] Send individual reminders
- [ ] Send bulk reminders
- [ ] Track reminder history
- [ ] Verify email delivery
- [ ] Check magic links work 