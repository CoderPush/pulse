-- Project check-in: key by (year, week_number), no dependency on submission_periods/weeks.
-- Allow submissions with any (year, week_number) by dropping FK to weeks for submissions.
-- (Weekly pulse can still use weeks in app logic; DB no longer enforces it.)

ALTER TABLE public.submissions
DROP CONSTRAINT IF EXISTS submissions_year_week_number_fkey;

-- One submission per user per project per week (optional: allow multiple by not having this)
CREATE UNIQUE INDEX IF NOT EXISTS submissions_project_checkin_user_project_week
ON public.submissions (user_id, project_id, year, week_number)
WHERE type = 'project_checkin' AND project_id IS NOT NULL AND year IS NOT NULL AND week_number IS NOT NULL;

COMMENT ON INDEX submissions_project_checkin_user_project_week IS 'One project check-in per user per project per (year, week)';
