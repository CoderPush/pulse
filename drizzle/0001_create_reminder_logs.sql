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