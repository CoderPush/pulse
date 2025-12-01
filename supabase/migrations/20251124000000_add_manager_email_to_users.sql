-- Add manager_email column to users table
ALTER TABLE public.users
ADD COLUMN manager_email text;

-- Add comment for the new column
COMMENT ON COLUMN public.users.manager_email IS 'Email address of the user''s manager for notifications and approvals';

