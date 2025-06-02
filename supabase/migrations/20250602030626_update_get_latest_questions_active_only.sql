CREATE OR REPLACE FUNCTION get_active_latest_questions()
RETURNS SETOF questions AS $$
  WITH LatestVersions AS (
    SELECT parent_id, MAX(version) as max_version
    FROM questions
    GROUP BY parent_id
  )
  SELECT q.* 
  FROM questions q
  JOIN LatestVersions lv ON q.parent_id = lv.parent_id AND q.version = lv.max_version
  WHERE q.is_active = true
  ORDER BY q.display_order
$$
LANGUAGE SQL;
