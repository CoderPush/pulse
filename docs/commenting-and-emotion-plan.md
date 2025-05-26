# Two-way Commenting & Emotion Feature Plan

## Overview
Enable admins and users to communicate on weekly submissions via comments and emotions (reactions). Admins can comment and react to any submission; users can reply and react back. Admins can also share a submission (pulse) with other users (e.g., managers) so they can view and comment. 
---

## 1. Database Design

### Tables

#### `comments`
| Column        | Type         | Description                        |
|--------------|--------------|------------------------------------|
| id           | uuid (PK)    | Unique comment ID                  |
| submission_id| uuid (FK)    | References the submission          |
| parent_id    | uuid (FK)    | For replies (nullable)             |
| author_id    | uuid (FK)    | References users table             |
| author_role  | text         | 'admin' or 'user'                  |
| content      | text         | The comment text                   |
| created_at   | timestamp    | When comment was made              |

#### `comment_emotions`
| Column      | Type         | Description                        |
|-------------|--------------|------------------------------------|
| id          | uuid (PK)    | Unique ID                          |
| comment_id  | uuid (FK)    | References comments                |
| user_id     | uuid (FK)    | Who reacted                        |
| emotion     | text         | e.g. 'like', 'love', 'insightful'  |
| created_at  | timestamp    | When emotion was added             |

#### `submission_emotions` (optional)
| Column        | Type         | Description                        |
|---------------|--------------|------------------------------------|
| id            | uuid (PK)    | Unique ID                          |
| submission_id | uuid (FK)    | References submissions             |
| user_id       | uuid (FK)    | Who reacted                        |
| emotion       | text         | e.g. 'like', 'love', etc.          |
| created_at    | timestamp    | When emotion was added             |

#### `submission_shares` (NEW)
| Column         | Type         | Description                              |
|----------------|--------------|------------------------------------------|
| id             | uuid (PK)    | Unique ID                                |
| submission_id  | uuid (FK)    | References submissions                   |
| shared_with_id | uuid (FK)    | User who can view/comment (manager/etc.) |
| shared_by_id   | uuid (FK)    | Admin who shared                         |
| created_at     | timestamp    | When shared                              |

---

## 2. API Endpoints (Next.js Route Handlers)
- `POST /api/comments` — Add a comment (admin or user)
- `GET /api/comments?submission_id=` — Get all comments for a submission (with replies)
- `POST /api/comments/[id]/emotions` — Add emotion to a comment
- `POST /api/submissions/[id]/emotions` — Add emotion to a submission (optional)
- `POST /api/comments/[id]/reply` — Add a reply to a comment
- `POST /api/submissions/[id]/share` — Share a submission with another user (admin only)
- `GET /api/submissions/shared-with-me` — List submissions shared with the current user

---

## 3. Frontend Features

### Admin Dashboard
- View all submissions
- Add comment to any submission
- Add emotion to any submission or comment
- See all comments and replies (threaded view)
- See who commented/emoted
- **Share a submission with other users (search & select user, e.g., manager)**
- **See who a submission is shared with**

### User Dashboard
- View their own submissions and all comments/replies
- Reply to admin comments
- Add emotion to comments or submissions
- See who commented/emoted
- **See submissions shared with them (not just their own)**
- **Comment on shared submissions if they have access**

---

## 4. Email Notification
- When admin comments, trigger email to user (via Supabase Edge Functions or Next.js API route with nodemailer/Resend)
- When user replies, optionally notify admin
- **When a submission is shared, notify the user (email or in-app)**

---

## 5. Security & Auth
- Use Supabase Auth to identify users and admins
- Only admins can comment on any submission; users can only comment/reply on their own submissions
- Store `author_id` and `author_role` for each comment
- **Only users listed in `submission_shares` (or the original owner/admin) can view/comment on a shared submission**
- **Only admins can share submissions**

---

## 6. UI/UX Suggestions
- Threaded comments (replies nested under parent)
- Show avatars and names for commenters
- Emoji picker for emotions
- Real-time updates (optional: Supabase Realtime)
- Mark unread comments for users/admins
- **"Share" button on each submission (admin only)**
- **Modal to select users to share with**
- **"Shared with" list on submission detail**

---

## 7. Extra Suggestions for Two-way Communication
- Allow tagging (e.g., @admin, @user)
- Allow file/image attachments in comments
- Allow marking a comment as "resolved" or "actioned"
- Option for private comments (visible only to admin/user)
- Notification bell in dashboard for new comments/replies

---

## 8. Implementation Steps
1. Update DB schema (add `submission_shares` table)
2. Create API endpoints for comments, emotions, and sharing
3. Integrate with Supabase Auth for role/user identification
4. Build UI components for threaded comments, emotion picker, sharing, etc.
5. Set up email notifications for new comments/replies and shares
6. Test permissions (admin vs user, shared users)
7. Polish UX (avatars, real-time, notifications) 