-- Create the daily_tasks table
CREATE TABLE public.daily_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_date date NOT NULL,
    project text,
    bucket text,
    hours numeric(4, 2),
    description text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Add comments to the table and columns
COMMENT ON TABLE public.daily_tasks IS 'Stores daily task entries from the AI assistant page.';
COMMENT ON COLUMN public.daily_tasks.user_id IS 'The user who created the task.';
COMMENT ON COLUMN public.daily_tasks.task_date IS 'The date the task was for.';
COMMENT ON COLUMN public.daily_tasks.project IS 'The project associated with the task.';
COMMENT ON COLUMN public.daily_tasks.bucket IS 'The category or tag for the task (e.g., #feature, #bugfix).';
COMMENT ON COLUMN public.daily_tasks.hours IS 'The number of hours spent on the task.';
COMMENT ON COLUMN public.daily_tasks.description IS 'A description of the task.';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS daily_tasks_user_id_idx ON public.daily_tasks(user_id);
CREATE INDEX IF NOT EXISTS daily_tasks_task_date_idx ON public.daily_tasks(task_date);

-- Add the wants_daily_reminders column to the users table
ALTER TABLE public.users
ADD COLUMN wants_daily_reminders BOOLEAN DEFAULT FALSE;

-- Add comment for the new column
COMMENT ON COLUMN public.users.wants_daily_reminders IS 'Whether the user wants to receive daily task reminders.';
