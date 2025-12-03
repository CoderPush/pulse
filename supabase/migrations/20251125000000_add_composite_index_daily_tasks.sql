-- Add composite index on (user_id, task_date) for better query performance
-- This index optimizes queries that filter by user_id and date range,
-- which is common in monthly report calculations and admin queries
CREATE INDEX IF NOT EXISTS daily_tasks_user_id_task_date_idx ON public.daily_tasks(user_id, task_date);

-- Add comment to the index
COMMENT ON INDEX daily_tasks_user_id_task_date_idx IS 'Composite index on user_id and task_date for efficient filtering by user and date range queries.';


