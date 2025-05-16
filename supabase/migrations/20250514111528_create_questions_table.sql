-- Migration to create the questions table for versioned, modifiable questions

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    category TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_parent_question FOREIGN KEY (parent_id) REFERENCES questions(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED
);

-- The first version of a question has parent_id = id
-- Each edit creates a new row with the same parent_id and version = previous_version + 1

COMMENT ON TABLE questions IS 'Stores all versions of pulse questions. Only the latest version per parent_id is active.';
COMMENT ON COLUMN questions.parent_id IS 'Self-referencing. Points to the original question (first version: parent_id = id).';
COMMENT ON COLUMN questions.version IS 'Version number for this question (starts at 1, increments on edit).';
COMMENT ON COLUMN questions.type IS 'Type of question (e.g., text, number, textarea).';
COMMENT ON COLUMN questions.required IS 'Whether the question is required.';
COMMENT ON COLUMN questions.category IS 'Category of the question.';
COMMENT ON COLUMN questions.display_order IS 'Order of the question in the form.';

-- Create the get_latest_questions function
CREATE OR REPLACE FUNCTION get_latest_questions()
RETURNS SETOF questions AS $$
  WITH LatestVersions AS (
    SELECT parent_id, MAX(version) as max_version
    FROM questions
    GROUP BY parent_id
  )
  SELECT q.* 
  FROM questions q
  JOIN LatestVersions lv ON q.parent_id = lv.parent_id AND q.version = lv.max_version
  ORDER BY q.display_order
$$
LANGUAGE SQL;
