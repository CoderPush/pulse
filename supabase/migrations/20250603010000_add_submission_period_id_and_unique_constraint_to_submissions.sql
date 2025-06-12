-- Migration: Add submission_period_id to submissions and unique constraint

ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS submission_period_id INTEGER REFERENCES submission_periods(id) ON DELETE SET NULL;

-- Add unique constraint to prevent duplicate submissions per user per period
ALTER TABLE submissions
ADD CONSTRAINT unique_submission_per_user_per_period
UNIQUE (submission_period_id, user_id); 