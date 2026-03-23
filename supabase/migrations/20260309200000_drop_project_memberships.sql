-- Drop project_memberships: check-ins no longer require membership; users select any active project.
DROP TABLE IF EXISTS public.project_memberships CASCADE;
