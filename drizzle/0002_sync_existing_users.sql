-- Sync existing users from auth.users to users
INSERT INTO users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM users)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

-- Add comment to document the migration
COMMENT ON FUNCTION public.handle_new_user() IS 'Syncs new auth.users to users and handles existing user sync'; 