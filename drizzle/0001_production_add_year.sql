-- Add year column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reminder_logs' 
        AND column_name = 'year'
    ) THEN
        -- Add the year column
        ALTER TABLE "reminder_logs" ADD COLUMN "year" integer;

        -- Backfill the year column using the sent_at timestamp
        UPDATE "reminder_logs"
        SET "year" = EXTRACT(YEAR FROM sent_at);

        -- Make the column NOT NULL after backfilling
        ALTER TABLE "reminder_logs" ALTER COLUMN "year" SET NOT NULL;

        -- Drop the old index if it exists
        DROP INDEX IF EXISTS "idx_reminder_logs_user_week";

        -- Create new index with year included
        CREATE INDEX "idx_reminder_logs_user_week" ON "reminder_logs" ("user_id", "year", "week_number");
    END IF;
END $$; 