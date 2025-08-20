-- Add billable column to daily_tasks table
ALTER TABLE public.daily_tasks 
ADD COLUMN billable BOOLEAN DEFAULT TRUE NOT NULL;

-- Add comment for the billable column
COMMENT ON COLUMN public.daily_tasks.billable IS 'Whether the task is billable to clients. Defaults to true.';