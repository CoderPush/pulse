-- Create function to get unique projects efficiently
CREATE OR REPLACE FUNCTION get_unique_projects()
RETURNS TABLE(project text)
LANGUAGE sql
AS $$
  SELECT DISTINCT project 
  FROM daily_tasks 
  WHERE project IS NOT NULL AND project != '' 
  ORDER BY project;
$$;

-- Add comment to the function
COMMENT ON FUNCTION get_unique_projects() IS 'Returns all unique project names from daily_tasks table, excluding null and empty values.'; 