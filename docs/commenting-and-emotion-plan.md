# Two-way Commenting & Emotion Feature Plan

## Overview
Enable admins and users to communicate on weekly submissions via comments and emotions (reactions). Admins can comment and react to any submission; users can reply and react back. Notifications and visibility are managed for both roles.

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

---

## 2. API Endpoints (Next.js Route Handlers)
- `POST /api/comments` — Add a comment (admin or user)
- `GET /api/comments?submission_id=` — Get all comments for a submission (with replies)
- `POST /api/comments/[id]/emotions` — Add emotion to a comment
- `POST /api/submissions/[id]/emotions` — Add emotion to a submission (optional)
- `POST /api/comments/[id]/reply` — Add a reply to a comment

---

## 3. Frontend Features

### Admin Dashboard
- View all submissions
- Add comment to any submission
- Add emotion to any submission or comment
- See all comments and replies (threaded view)
- See who commented/emoted

### User Dashboard
- View their own submissions and all comments/replies
- Reply to admin comments
- Add emotion to comments or submissions
- See who commented/emoted

---

## 4. Email Notification
- When admin comments, trigger email to user (via Supabase Edge Functions or Next.js API route with nodemailer/Resend)
- When user replies, optionally notify admin

---

## 5. Security & Auth
- Use Supabase Auth to identify users and admins
- Only admins can comment on any submission; users can only comment/reply on their own submissions
- Store `author_id` and `author_role` for each comment

---

## 6. UI/UX Suggestions
- Threaded comments (replies nested under parent)
- Show avatars and names for commenters
- Emoji picker for emotions
- Real-time updates (optional: Supabase Realtime)
- Mark unread comments for users/admins

---

## 7. Extra Suggestions for Two-way Communication
- Allow tagging (e.g., @admin, @user)
- Allow file/image attachments in comments
- Allow marking a comment as "resolved" or "actioned"
- Option for private comments (visible only to admin/user)
- Notification bell in dashboard for new comments/replies

---

## 8. Implementation Steps
1. Update DB schema
2. Create API endpoints for comments and emotions
3. Integrate with Supabase Auth for role/user identification
4. Build UI components for threaded comments, emotion picker, etc.
5. Set up email notifications for new comments/replies
6. Test permissions (admin vs user)
7. Polish UX (avatars, real-time, notifications) 