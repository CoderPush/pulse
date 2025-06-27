-- 1. Make weekly-specific fields nullable
ALTER TABLE submissions
ALTER COLUMN week_number DROP NOT NULL,
ALTER COLUMN year DROP NOT NULL,
ALTER COLUMN primary_project_name DROP NOT NULL,
ALTER COLUMN primary_project_hours DROP NOT NULL,
ALTER COLUMN manager DROP NOT NULL;

-- 2. Add type column
ALTER TABLE submissions
ADD COLUMN type text;

-- 3. Backfill existing weekly submissions
UPDATE submissions SET type = 'weekly' WHERE type IS NULL; 