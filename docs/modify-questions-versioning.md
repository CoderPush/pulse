# Modifiable Questions with Versioning

This document describes the plan and implementation steps for supporting **modifiable, versioned questions** in the Weekly Pulse app, using Next.js 15 and Supabase (local).  
The goal is to allow admins to edit questions, track versions, and always serve the latest version of each question to users.

---

## 1. Database Schema

Create a `questions` table with the following fields:

| Column      | Type      | Description                                         |
|-------------|-----------|-----------------------------------------------------|
| id          | UUID (PK) | Unique identifier for this question version         |
| parent_id   | UUID      | Points to the original question (self-referencing)  |
| version     | integer   | Version number (starts at 1, increments on edit)    |
| title       | text      | Question title                                      |
| description | text      | Question description                                |
| type        | text      | Question type (e.g., text, number, textarea)        |
| required    | boolean   | Whether the question is required                    |
| category    | text      | Category of the question                            |
| created_at  | timestamp | When this version was created                       |
| updated_at  | timestamp | When this version was last updated                  |

**Notes:**
- The first version of a question has `parent_id = id`.
- Each edit creates a new row with the same `parent_id` and `version = previous_version + 1`.
- There is **no status field**; only the latest version per `parent_id` is considered active.

---

## 2. API Endpoints

- **GET `/api/questions`**  
  Returns the latest version of each question (grouped by `parent_id`, highest `version`).

- **PUT `/api/questions/:id`**  
  Admin edits a question.  
  Creates a new row with incremented `version` and same `parent_id`.

- **GET `/api/questions/history/:parent_id`**  
  Returns all versions of a question for audit/history.

---

## 3. Frontend Changes

### a. User-Facing Weekly Pulse Form

- Fetch `/api/questions` to get the latest version of each question.
- Render the form dynamically based on the returned questions list.
- Each week, the form will always reflect the latest question versions.

### b. Admin Page

- Display a list of questions (latest version per `parent_id`).
- Allow admins to edit a question (title, description, etc.).
- On save, call `PUT /api/questions/:id` to create a new version.
- Optionally, show question version history (using `/api/questions/history/:parent_id`).

---

## 4. Versioning Logic

When editing a question:
1. Fetch the current latest version for the `parent_id`.
2. Insert a new row with:
   - `parent_id` = original question's `parent_id`
   - `version` = latest version + 1
   - Updated `title`/`description`/other fields
   - New `created_at`/`updated_at`

---

## 5. Example SQL: Fetch Latest Versions

```sql
SELECT DISTINCT ON (parent_id)
  id, parent_id, version, title, description, type, required, category, created_at
FROM questions
ORDER BY parent_id, version DESC;
```

---

## 6. Seed Data

- On first run, insert default questions as version 1 (`parent_id = id`, `version = 1`).

---

## 7. Migration Steps

1. Create the `questions` table as described above.
2. Seed default questions as version 1.
3. Update API endpoints to use the new table and versioning logic.
4. Update frontend to fetch and render questions dynamically.
5. Update admin page to allow editing and versioning of questions.

---

## 8. Implementation Notes

- There is **no status field**; only the latest version per `parent_id` is used.
- All question modifications are tracked as new versions for audit/history.
- The Weekly Pulse form and admin page should both use the `/api/questions` endpoint for the latest questions.

---

## 9. References

- [Next.js Route Handlers (App Router)](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)

---

**After implementing this plan, the Weekly Pulse app will support dynamic, versioned questions, editable by admins, and always serve the latest version to users.**