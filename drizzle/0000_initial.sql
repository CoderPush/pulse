-- Create users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE TABLE users (
            id uuid PRIMARY KEY NOT NULL,
            email text NOT NULL,
            name text,
            is_admin boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT now() NOT NULL
        );
    END IF;
END $$;

-- Create weeks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weeks') THEN
        CREATE TABLE weeks (
            id serial PRIMARY KEY NOT NULL,
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
    END IF;
END $$;

-- Create submissions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
        CREATE TABLE submissions (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
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
            status text NOT NULL DEFAULT 'pending',
            is_late boolean DEFAULT false,
            submitted_at timestamp with time zone DEFAULT now() NOT NULL,
            created_at timestamp with time zone DEFAULT now() NOT NULL
        );
    END IF;
END $$;

-- Create reminder_logs table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reminder_logs') THEN
        CREATE TABLE reminder_logs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            user_id uuid NOT NULL REFERENCES users(id) ON DELETE cascade,
            week_number integer NOT NULL,
            sent_at timestamp with time zone DEFAULT now() NOT NULL,
            sent_by uuid NOT NULL REFERENCES users(id) ON DELETE cascade
        );

        CREATE INDEX idx_reminder_logs_user_week ON reminder_logs (user_id, week_number);
    END IF;
END $$; 