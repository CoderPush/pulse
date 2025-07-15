# Refactor: Save Daily Tasks to Database

This document outlines the plan to refactor the AI Daily Pulse Assistant feature to save daily tasks into a dedicated database table instead of relying on `localStorage`.

## Design Decisions

### Why Not Use `questions` and `templates`?

For the AI Daily Pulse Assistant, we will use a dedicated `daily_tasks` table with a fixed schema rather than leveraging the existing `questions` and `templates` system.

-   **Simplicity:** The daily task entry is designed for rapid, free-form input. A fixed schema is simpler and more performant, avoiding complex joins.
-   **Consistency:** The feature currently uses a hardcoded set of fields. The new database structure will mirror this consistent design.
-   **Different Use Case:** The `templates` system is built for flexible, admin-configurable reports. Daily task logging is more of a personal, consistent activity log.

## Phase 1: Backend Setup

### 1. Create a New Database Migration

-   **Action:** Create a new Supabase migration file.
-   **Table Name:** `daily_tasks`
-   **Schema:**
    -   `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
    -   `user_id`: `uuid` (Foreign Key to `public.users(id)`, `on delete cascade`)
    -   `task_date`: `date` (Not Null)
    -   `project`: `text`
    -   `bucket`: `text`
    -   `hours`: `numeric(4, 2)`
    -   `description`: `text`
    -   `created_at`: `timestamptz` (Default: `now()`)
-   **Indexes:**
    -   `daily_tasks_user_id_idx` on `(user_id)`
    -   `daily_tasks_task_date_idx` on `(task_date)`

### 2. Implement API Endpoints

-   **Action:** Create a new API route at `src/app/api/daily-tasks/route.ts`.
-   **Endpoints:**
    -   **`GET /api/daily-tasks`**:
        -   Fetch all tasks for the authenticated user.
        -   Allow filtering by date range (e.g., `startDate`, `endDate`).
    -   **`POST /api/daily-tasks`**:
        -   Create one or more tasks.
        -   The body should accept an array of task objects.
    -   **`PUT /api/daily-tasks/[id]`**:
        -   Create a dynamic route `src/app/api/daily-tasks/[id]/route.ts`.
        -   Update a single task specified by its `id`.
    -   **`DELETE /api/daily-tasks/[id]`**:
        -   Create a dynamic route `src/app/api/daily-tasks/[id]/route.ts`.
        -   Delete a single task specified by its `id`.

## Phase 2: Frontend Refactoring

### 1. Data Fetching

-   **File:** `src/app/(authenticated)/ai-demo-page/page.tsx`
-   **Action:**
    -   Remove the `useEffect` hook that loads data from `localStorage`.
    -   Implement a new `useEffect` that fetches tasks from `GET /api/daily-tasks` when the component mounts.
    -   Manage loading and error states during the fetch.

### 2. Data Modification

-   **Files:**
    -   `src/app/(authenticated)/ai-demo-page/parse/ParseTab.tsx`
    -   `src/app/(authenticated)/ai-demo-page/parse/TaskEditForm.tsx`
    -   `src/app/(authenticated)/ai-demo-page/parse/TaskSummaryList.tsx`
-   **Actions:**
    -   **Create:** In `ParseTab.tsx`, when `onParse` is called after the AI assistant returns tasks, send the new tasks to `POST /api/daily-tasks`.
    -   **Update:** In `TaskEditForm.tsx`, the "Save" button's `onSubmit` handler should call `PUT /api/daily-tasks/[id]`.
    -   **Delete:** In `TaskSummaryList.tsx`, the "Del" button's `onClick` handler should call `DELETE /api/daily-tasks/[id]`.
    -   **State Management:**
        -   The `forms` state in `AiDemoPage` must be updated to include the database `id` for each task.
        -   The local state should be updated optimistically or after successful API responses to reflect changes.
    -   **Cleanup:** The `saveTasks` function and its prop drilling will be removed.

## Phase 3: Ancillary Features

### 1. Project Suggestions

-   **File:** `src/app/(authenticated)/ai-demo-page/parse/DailyPulseAIAssistant.tsx`
-   **Action:**
    -   The `getProjectsFromStorage` function will be replaced.
    -   A new API endpoint, perhaps `GET /api/daily-tasks/projects`, will be created to return a unique list of project names for the current user.
    -   The component will call this endpoint to populate project suggestions.

## Phase 4: Reminder System

To encourage consistent daily logging, we will implement an automated reminder system for a select group of users.

### 1. Update User Schema

-   **Action:** As part of the migration, alter the `users` table.
-   **Change:** Add a new column `wants_daily_reminders BOOLEAN DEFAULT FALSE`. This flag allows users (or admins) to opt-in to receiving daily reminders.

### 2. Create Reminder Cron Job

-   **Action:** Create a new scheduled cron job.
-   **File:** `src/app/api/cron/daily-task-reminders/route.ts`
-   **Logic:**
    1.  The job will run daily (e.g., at 4 PM).
    2.  It will fetch all users who have `wants_daily_reminders` set to `TRUE`.
    3.  For each user, it will check if an entry exists in the `daily_tasks` table for the current date.
    4.  If no task is found, it will trigger a reminder email to the user using the existing email service. 