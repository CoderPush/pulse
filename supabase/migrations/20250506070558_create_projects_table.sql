-- Migration to create the projects table

CREATE TABLE projects (
    -- Unique identifier for each project
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Name of the project (required)
    name TEXT NOT NULL,

    -- Flag to determine if the project should be listed in the form
    -- Defaults to TRUE, meaning projects are visible by default
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamp when the project was created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Add a comment to describe the table
COMMENT ON TABLE projects IS 'Stores project information, including visibility status.';

-- Optional: Add comments for columns
COMMENT ON COLUMN projects.name IS 'The display name of the project.';
COMMENT ON COLUMN projects.is_active IS 'Controls whether the project appears in selection lists (TRUE = visible).';
