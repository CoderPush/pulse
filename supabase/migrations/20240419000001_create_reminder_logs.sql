-- Create reminder_logs table
CREATE TABLE IF NOT EXISTS public.reminder_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sent_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    year integer NOT NULL,
    week_number integer NOT NULL,
    sent_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    FOREIGN KEY (year, week_number) REFERENCES public.weeks(year, week_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_week 
ON public.reminder_logs (user_id, year, week_number);

-- Create index for sent_by lookups
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_by 
ON public.reminder_logs (sent_by);

-- Add foreign key constraints to reminder_logs table
ALTER TABLE public.reminder_logs
    ADD CONSTRAINT reminder_logs_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT reminder_logs_sent_by_fkey 
        FOREIGN KEY (sent_by) REFERENCES public.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT reminder_logs_year_week_number_fkey 
        FOREIGN KEY (year, week_number) REFERENCES public.weeks(year, week_number);

-- Add table and column comments
COMMENT ON TABLE public.reminder_logs IS 'Tracks when reminders were sent to users for weekly pulse submissions';
COMMENT ON COLUMN public.reminder_logs.user_id IS 'The user who received the reminder';
COMMENT ON COLUMN public.reminder_logs.sent_by IS 'The admin who sent the reminder';
COMMENT ON COLUMN public.reminder_logs.year IS 'The year of the pulse submission';
COMMENT ON COLUMN public.reminder_logs.week_number IS 'The week number of the pulse submission';
COMMENT ON COLUMN public.reminder_logs.sent_at IS 'When the reminder was sent'; 