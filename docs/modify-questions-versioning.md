# Modifiable Questions with Versioning

This document describes the plan and implementation steps for supporting **modifiable, versioned questions** in the Weekly Pulse app, using Next.js 15 and Supabase (local).  
The goal is to allow admins to edit questions, track versions, and always serve the latest version of each question to users.

---

## 1. Database Schema

### Questions Table
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

### Submission Answers Table
Create a `submission_answers` table to store answers to questions:

| Column         | Type      | Description                                    |
|----------------|-----------|------------------------------------------------|
| id             | UUID (PK) | Unique identifier for this answer              |
| submission_id  | UUID      | Reference to the submission                    |
| question_id    | UUID      | Reference to the question version              |
| answer         | text      | The answer to the question                     |
| created_at     | timestamp | When this answer was created                   |
| updated_at     | timestamp | When this answer was last updated              |

**Notes:**
- The first version of a question has `parent_id = id`.
- Each edit creates a new row with the same `parent_id` and `version = previous_version + 1`.
- There is **no status field**; only the latest version per `parent_id` is considered active.
- Answers are linked to specific question versions for historical accuracy.

---

## 2. API Endpoints

- **GET `/api/questions`**  
  Returns the latest version of each question (grouped by `parent_id`, highest `version`).

- **PUT `/api/questions/:id`**  
  Admin edits a question.  
  Creates a new row with incremented `version` and same `parent_id`.

- **GET `/api/questions/history/:parent_id`**  
  Returns all versions of a question for audit/history.

- **POST `/api/submissions`**  
  Creates a new submission with answers to all questions.

- **GET `/api/submissions/:id`**  
  Returns a submission with its answers and the questions they correspond to.

---

## 3. Frontend Changes

### a. User-Facing Weekly Pulse Form

- Fetch `/api/questions` to get the latest version of each question.
- Render the form dynamically based on the returned questions list.
- Each week, the form will always reflect the latest question versions.
- Store answers in a state object mapping question IDs to answers.

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

When submitting answers:
1. Get the latest version of each question.
2. Store answers in `submission_answers` table with:
   - `submission_id` = the new submission's ID
   - `question_id` = the specific question version's ID
   - `answer` = the user's response

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
- Example seed data:

```sql
INSERT INTO questions (id, parent_id, version, title, description, type, required, category)
VALUES 
  (gen_random_uuid(), gen_random_uuid(), 1, 'Primary Project', 'What was your main project this week?', 'text', true, 'projects'),
  (gen_random_uuid(), gen_random_uuid(), 1, 'Hours Spent', 'How many hours did you spend on this project?', 'number', true, 'projects'),
  (gen_random_uuid(), gen_random_uuid(), 1, 'Feedback', 'Any feedback for this week?', 'textarea', false, 'feedback');
```

---

## 7. Migration Steps

1. Create the `questions` table as described above.
2. Create the `submission_answers` table as described above.
3. Seed default questions as version 1.
4. Update API endpoints to use the new tables and versioning logic.
5. Update frontend to fetch and render questions dynamically.
6. Update admin page to allow editing and versioning of questions.

---

## 8. Implementation Notes

- There is **no status field**; only the latest version per `parent_id` is used.
- All question modifications are tracked as new versions for audit/history.
- The Weekly Pulse form and admin page should both use the `/api/questions` endpoint for the latest questions.
- Answers are stored with references to specific question versions for historical accuracy.
- The system supports different question types (text, number, textarea) and required/optional questions.

---

## 9. References

- [Next.js Route Handlers (App Router)](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript/introduction)

---

**After implementing this plan, the Weekly Pulse app will support dynamic, versioned questions, editable by admins, and always serve the latest version to users.**