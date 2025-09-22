# Multi-Team Support Plan for Pulse App

## Background
Currently, Pulse is hardcoded to work for a single company (e.g., @company.com emails). To scale, we need to support multiple teams/companies, each with their own users, admins, and settings. This document outlines the requirements, migration plan, and technical considerations for enabling multi-team support.

---

## Goals
- Allow anyone to create a new team (company/workspace) in Pulse
- Remove hardcoded email domain restrictions (e.g., NEXT_PUBLIC_COMPANY_EMAIL_DOMAIN)
- Support team-specific authentication, onboarding, and admin controls
- Ensure data isolation between teams (submissions, projects, users, etc.)
- Enable team discovery/joining via invite or request
- Support both Weekly and Daily Pulse flows per team

---

## Requirements

### 1. Team Model
- Add a `teams` table (id, name, slug, created_at, owner_id, etc.)
- Each user can belong to one or more teams (many-to-many: `team_members` table)
- Each submission, project, etc. is linked to a team

### 2. Team Creation & Onboarding
- New users can create a team on signup
- Existing users can invite others to their team (via email invite or link)
- Optionally, allow open registration or require admin approval

### 3. Authentication & Authorization
- Remove global email domain check
- On login, users select or are routed to their team
- Team admins can manage members, roles, and settings

### 4. Data Isolation
- All queries for submissions, projects, questions, etc. must be filtered by team
- No cross-team data leakage

### 5. UI/UX Changes
- Team switcher in the UI (if user belongs to multiple teams)
- Team-specific branding (logo, name, etc.)
- Team management screens (admin only)
- Update onboarding/login flows to support team context

### 6. Migration
- Migrate existing users and data to a default team (e.g., 'CoderPush')
- Backfill all existing records with team_id

### 7. API & Backend
- Update all API endpoints to require and validate team context
- Enforce team membership/roles in backend logic

### 8. Email & Notifications
- Team-specific email templates and sender info
- Invites, reminders, and notifications scoped to team

---

## Technical Steps
1. **DB Schema:**
   - Create `teams` and `team_members` tables
   - Add `team_id` to relevant tables (users, submissions, projects, etc.)
2. **Auth:**
   - Remove domain restriction logic
   - Add team selection/creation to signup/login
3. **API:**
   - Update endpoints to require team context
   - Enforce team membership/roles
4. **UI:**
   - Add team switcher and management screens
   - Update onboarding and invite flows
5. **Migration:**
   - Script to migrate all existing data to a default team
6. **Testing:**
   - Test for data isolation, team switching, and onboarding
7. **Docs:**
   - Update documentation for multi-team support

---

## Open Questions
- Should users be able to belong to multiple teams with the same email?
- Should teams be discoverable/searchable, or invite-only?
- What are the default roles/permissions per team?
- How to handle billing (if/when needed) per team?

---

## References
- See `Weekly Pulse - Product Requirements Document (PRD).md` for current flows
- See `auto-login-plan.md` for authentication details

---

## Implementation Plan (Phased Approach)

### Phase 1: Core Multi-Team Foundation
**Database Schema Changes:**
```sql
-- New tables
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    owner_id UUID REFERENCES users(id)
);

CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- Add team_id to existing tables (nullable initially for safe migration)
ALTER TABLE users ADD COLUMN current_team_id UUID REFERENCES teams(id);
ALTER TABLE submissions ADD COLUMN team_id UUID REFERENCES teams(id);
ALTER TABLE projects ADD COLUMN team_id UUID REFERENCES teams(id);
ALTER TABLE questions ADD COLUMN team_id UUID REFERENCES teams(id);
```

### Phase 2: Data Migration
**Migration Script:**
```sql
-- Create default team for existing data
INSERT INTO teams (name, slug, owner_id) 
VALUES ('CoderPush', 'coderpush', (SELECT id FROM users WHERE is_admin = true LIMIT 1));

-- Migrate all existing users to default team
INSERT INTO team_members (team_id, user_id, role)
SELECT t.id, u.id, CASE WHEN u.is_admin THEN 'admin' ELSE 'member' END
FROM teams t, users u WHERE t.slug = 'coderpush';

-- Backfill team_id for all existing data
UPDATE submissions SET team_id = (SELECT id FROM teams WHERE slug = 'coderpush');
UPDATE projects SET team_id = (SELECT id FROM teams WHERE slug = 'coderpush');
UPDATE questions SET team_id = (SELECT id FROM teams WHERE slug = 'coderpush');
UPDATE users SET current_team_id = (SELECT id FROM teams WHERE slug = 'coderpush');

-- Make team_id NOT NULL after migration
ALTER TABLE submissions ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE projects ALTER COLUMN team_id SET NOT NULL;
ALTER TABLE questions ALTER COLUMN team_id SET NOT NULL;
```

### Phase 3: Authentication & API Updates
- Remove domain restriction from `src/app/auth/callback/route.ts`
- Add team context to all API endpoints in `/src/app/api/`
- Update auto-sharing logic to work within team boundaries
- Add team selection/creation to signup flow

**Key Files to Update:**
- `src/utils/companyDomain.ts` - Remove hardcoded domain logic
- `src/app/auth/callback/route.ts` - Remove domain validation (lines 20-27)
- `src/app/api/submissions/route.ts` - Add team filtering and update auto-sharing (lines 122-143)
- `src/app/api/admin/submissions/[id]/share/route.ts` - Update sharing restrictions (lines 66-73)

### Phase 4: UI & Team Management
- Team switcher component
- Team creation/invitation flows
- Admin team management interface
- Update all queries to filter by current team
- Add Row Level Security (RLS) policies for data isolation

**Data Isolation with RLS:**
```sql
-- Enable RLS on all team-scoped tables
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create policies for team isolation
CREATE POLICY team_isolation_submissions ON submissions 
FOR ALL USING (team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
));
```

## Critical Migration Considerations

### Schema Conflicts
- Current `submissions` table has NOT NULL constraints that need to be handled carefully during migration
- Need to coordinate with daily/weekly reporting refactor if implementing simultaneously

### Data Safety
1. Test migration with production data copy first
2. Use nullable team_id initially, then make NOT NULL after backfill
3. Implement RLS policies for data isolation
4. Add monitoring for cross-team data leaks

### Performance
- Add indexes on team_id columns after migration
- Consider partitioning large tables by team_id for better performance

## Next Steps
- ✅ Schema design validated against current database
- ✅ Migration risks identified and mitigated  
- ✅ Phased implementation plan created
- 🔄 Ready for implementation in phases 