-- Migration to create the comments table

CREATE TABLE comments (
    -- Unique identifier for each comment
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- The submission this comment belongs to
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,

    -- For replies: parent comment (nullable for top-level comments)
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,

    -- Who wrote the comment
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Role of the author (e.g., 'admin', 'user', 'manager')
    author_role TEXT NOT NULL,

    -- The comment text
    content TEXT NOT NULL,

    -- Timestamp when the comment was created
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Optional: Indexes for performance
CREATE INDEX idx_comments_submission_id ON comments(submission_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);

-- Optional: Add a comment to describe the table
COMMENT ON TABLE comments IS 'Stores threaded comments for submissions, supporting admin and user roles.';

-- Optional: Add comments for columns
COMMENT ON COLUMN comments.submission_id IS 'The submission this comment is associated with.';
COMMENT ON COLUMN comments.parent_id IS 'Parent comment for replies (null for top-level).';
COMMENT ON COLUMN comments.author_id IS 'User who wrote the comment.';
COMMENT ON COLUMN comments.author_role IS 'Role of the comment author: admin or user.';
COMMENT ON COLUMN comments.content IS 'The comment text.';