-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY NOT NULL,
    email text NOT NULL,
    name text,
    is_admin boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE public.users IS 'User profiles for the application';
COMMENT ON COLUMN public.users.email IS 'User email address from auth.users';
COMMENT ON COLUMN public.users.name IS 'User display name';
COMMENT ON COLUMN public.users.is_admin IS 'Whether the user has admin privileges';

-- Create weeks table
CREATE TABLE IF NOT EXISTS public.weeks (
    id serial NOT NULL,
    year integer NOT NULL,
    week_number integer NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    submission_start timestamp with time zone NOT NULL,
    submission_end timestamp with time zone NOT NULL,
    late_submission_end timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT weeks_year_week_number_pk PRIMARY KEY(year, week_number)
);

COMMENT ON TABLE public.weeks IS 'Defines submission windows for weekly pulses';
COMMENT ON COLUMN public.weeks.year IS 'Calendar year';
COMMENT ON COLUMN public.weeks.week_number IS 'Week number (1-53)';
COMMENT ON COLUMN public.weeks.start_date IS 'Start of the week (Monday)';
COMMENT ON COLUMN public.weeks.end_date IS 'End of the week (Sunday)';
COMMENT ON COLUMN public.weeks.submission_start IS 'When submissions open (Friday 5PM)';
COMMENT ON COLUMN public.weeks.submission_end IS 'When submissions are due (Monday 2PM)';
COMMENT ON COLUMN public.weeks.late_submission_end IS 'Final deadline (Tuesday 5PM)';

-- Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    year integer NOT NULL,
    week_number integer NOT NULL,
    primary_project_name text NOT NULL,
    primary_project_hours integer NOT NULL,
    additional_projects jsonb DEFAULT '[]',
    manager text NOT NULL,
    feedback text,
    changes_next_week text,
    milestones text,
    other_feedback text,
    hours_reporting_impact text,
    form_completion_time integer,
    status text DEFAULT 'pending' NOT NULL,
    is_late boolean DEFAULT false,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    FOREIGN KEY (year, week_number) REFERENCES public.weeks(year, week_number)
);

COMMENT ON TABLE public.submissions IS 'Weekly pulse submissions from users';
COMMENT ON COLUMN public.submissions.user_id IS 'The user who submitted the pulse';
COMMENT ON COLUMN public.submissions.year IS 'The year of the pulse submission';
COMMENT ON COLUMN public.submissions.week_number IS 'The week number of the pulse submission';
COMMENT ON COLUMN public.submissions.primary_project_name IS 'The main project the user worked on';
COMMENT ON COLUMN public.submissions.primary_project_hours IS 'Hours spent on the primary project';
COMMENT ON COLUMN public.submissions.additional_projects IS 'JSON array of other projects and hours';
COMMENT ON COLUMN public.submissions.manager IS 'The user''s manager at the time of submission';
COMMENT ON COLUMN public.submissions.feedback IS 'General feedback for the week';
COMMENT ON COLUMN public.submissions.changes_next_week IS 'Planned changes for next week';
COMMENT ON COLUMN public.submissions.milestones IS 'Key milestones achieved';
COMMENT ON COLUMN public.submissions.other_feedback IS 'Additional feedback';
COMMENT ON COLUMN public.submissions.hours_reporting_impact IS 'Impact of hours reporting';
COMMENT ON COLUMN public.submissions.form_completion_time IS 'Time taken to complete the form in seconds';
COMMENT ON COLUMN public.submissions.status IS 'Status of the submission (pending, submitted, etc)';
COMMENT ON COLUMN public.submissions.is_late IS 'Whether the submission was late';
COMMENT ON COLUMN public.submissions.submitted_at IS 'When the submission was made';
COMMENT ON COLUMN public.submissions.created_at IS 'When the submission was created';

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_week 
ON public.reminder_logs (user_id, year, week_number);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_by 
ON public.reminder_logs (sent_by);

COMMENT ON TABLE public.reminder_logs IS 'Tracks when reminders were sent to users for weekly pulse submissions';
COMMENT ON COLUMN public.reminder_logs.user_id IS 'The user who received the reminder';
COMMENT ON COLUMN public.reminder_logs.sent_by IS 'The admin who sent the reminder';
COMMENT ON COLUMN public.reminder_logs.year IS 'The year of the pulse submission';
COMMENT ON COLUMN public.reminder_logs.week_number IS 'The week number of the pulse submission';
COMMENT ON COLUMN public.reminder_logs.sent_at IS 'When the reminder was sent';