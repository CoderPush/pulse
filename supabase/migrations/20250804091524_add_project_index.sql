-- Add index on project column for better performance
CREATE INDEX IF NOT EXISTS daily_tasks_project_idx ON daily_tasks(project);

-- Add comment to the index
COMMENT ON INDEX daily_tasks_project_idx IS 'Index on project column for efficient filtering and DISTINCT queries.'; 