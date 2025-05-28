-- Migration to create the submission_answers table for storing answers to dynamic questions

CREATE TABLE submission_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL,
    question_id UUID NOT NULL,
    answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_submission FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_question FOREIGN KEY (question_id) REFERENCES questions(id)
);

-- Add indexes for faster lookups
CREATE INDEX idx_submission_answers_submission_id ON submission_answers(submission_id);
CREATE INDEX idx_submission_answers_question_id ON submission_answers(question_id);

-- Add comments for documentation
COMMENT ON TABLE submission_answers IS 'Stores answers to questions for each submission';
COMMENT ON COLUMN submission_answers.submission_id IS 'The submission this answer belongs to';
COMMENT ON COLUMN submission_answers.question_id IS 'The question being answered';
COMMENT ON COLUMN submission_answers.answer IS 'The answer to the question';

-- Create a function to get answers with question details
CREATE OR REPLACE FUNCTION get_submission_answers(submission_id UUID)
RETURNS TABLE (
    id UUID,
    question_id UUID,
    answer TEXT,
    question_title TEXT,
    question_description TEXT,
    question_type TEXT,
    question_required BOOLEAN,
    question_category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sa.id,
        sa.question_id,
        sa.answer,
        q.title as question_title,
        q.description as question_description,
        q.type as question_type,
        q.required as question_required,
        q.category as question_category
    FROM submission_answers sa
    JOIN questions q ON sa.question_id = q.id
    WHERE sa.submission_id = $1
    ORDER BY q.display_order;
END;
$$ LANGUAGE plpgsql;
