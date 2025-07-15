ALTER TABLE public.daily_tasks
ADD COLUMN link text;

COMMENT ON COLUMN public.daily_tasks.link IS 'An optional URL link associated with the task.'; 