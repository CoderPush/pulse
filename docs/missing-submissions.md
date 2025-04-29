# Missing Submissions Tracking

## Core Features
1. ✅ New "Missing Submissions" view in admin
2. ✅ List users who haven't submitted for current week
3. ✅ Manual reminder sending functionality
4. ✅ Track reminder history

## Implementation Steps
1. ✅ Create reminder_logs table
   ```sql
   CREATE TABLE reminder_logs (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     week_number INTEGER NOT NULL,
     sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
     sent_by UUID REFERENCES users(id) ON DELETE CASCADE
   );

   CREATE INDEX idx_reminder_logs_user_week ON reminder_logs (user_id, week_number);
   ```

2. ✅ Create missing submissions page
   - ✅ Week selector (defaults to last week)
   - ✅ User list with submission and reminder status
   - ✅ Bulk action buttons
   - ✅ Reminder history

3. ✅ Add API endpoints
   - ✅ GET `/api/admin/submissions/missing`
     ```typescript
     // Query params:
     // - year (optional, defaults to current)
     // - week (optional, defaults to last week)
     // Returns:
     // - List of users without submissions
     // - Their last reminder info
     // - Week deadline info
     ```
   - ✅ POST `/api/admin/submissions/remind`
     ```typescript
     // Body:
     // - user_ids: string[] (UUIDs of users to remind)
     // - year: number
     // - week: number
     // - message: string (optional custom message)
     ```

4. ✅ Implement missing submissions query
   ```typescript
   // Efficient implementation using multiple focused queries:
   // 1. Get week info
   const weekData = await supabase
     .from('weeks')
     .select('*')
     .eq('year', targetYear)
     .eq('week_number', targetWeek)
     .single();

   // 2. Get all users
   const users = await supabase
     .from('users')
     .select('id, email, name');

   // 3. Get submissions for week
   const submissions = await supabase
     .from('submissions')
     .select('user_id')
     .eq('year', targetYear)
     .eq('week_number', targetWeek);

   // 4. Get latest reminders
   const reminders = await supabase
     .from('reminder_logs')
     .select(`
       user_id,
       sent_at,
       sent_by,
       sender:users!reminder_logs_sent_by_fkey (name)
     `)
     .eq('week_number', targetWeek)
     .order('sent_at', { ascending: false });
   ```

5. ✅ Implement reminder sending
   - ✅ Store reminder history in reminder_logs
   - ✅ Prevent duplicate reminders within 24h
   - ✅ Track who sent the reminder
   - 🚧 Email template with magic link (pending)

## UI Components
1. ✅ Week Selection
   - ✅ Dropdown for year/week selection
   - ✅ Default to last week
   - ✅ Show submission window dates

2. ✅ Missing Users List
   - ✅ User info (name, email)
   - ✅ Submission status
   - ✅ Last reminder sent (if any)
   - ✅ Individual remind button
   - ✅ Bulk selection checkbox

3. ✅ Action Bar
   - ✅ Bulk remind button
   - 🚧 Export to CSV option
   - 🚧 Filter options:
     - Never reminded
     - Reminded > 24h ago
     - All missing

## Testing Checklist
- ✅ View shows correct missing users
- ✅ Week selector works correctly
- ✅ Send individual reminders
- ✅ Send bulk reminders
- ✅ Track reminder history
- 🚧 Verify email delivery
- 🚧 Check magic links work
- ✅ Verify 24h reminder throttling
- ✅ Test past weeks querying
- ✅ Validate reminder logs creation

## Notes
- Query optimized to use separate focused queries with minimal fields
- Uses Sets and Maps for O(1) lookups
- Users are ordered by reminder status (never reminded first)
- System prevents reminder spam with 24h cooldown
- All reminder actions are logged for accountability
- Default view shows last week's missing submissions 