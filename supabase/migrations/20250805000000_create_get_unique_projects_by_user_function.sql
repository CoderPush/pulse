-- Create function to get unique projects for a specific user
CREATE OR REPLACE FUNCTION get_unique_projects_by_user(user_id_param uuid)
RETURNS TABLE(project text)
LANGUAGE sql
AS $$
  SELECT DISTINCT project 
  FROM daily_tasks 
  WHERE user_id = user_id_param AND project IS NOT NULL AND project != '' 
  ORDER BY project;
$$;

-- Add comment to the function
COMMENT ON FUNCTION get_unique_projects_by_user(uuid) IS 'Returns all unique project names for a given user from the daily_tasks table, excluding null and empty values.';
