-- Add a 'choices' column to the questions table for multiple choice/checkbox support
ALTER TABLE questions ADD COLUMN choices jsonb; 