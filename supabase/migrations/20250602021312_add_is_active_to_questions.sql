ALTER TABLE questions ADD COLUMN is_active boolean DEFAULT true;
-- Optionally, backfill all existing questions as active
UPDATE questions SET is_active = true WHERE is_active IS NULL; 