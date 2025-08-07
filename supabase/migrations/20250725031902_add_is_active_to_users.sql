-- Add is_active column to users table for soft delete functionality
ALTER TABLE public.users
ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Create an index for better performance when filtering active users
CREATE INDEX idx_users_is_active ON public.users(is_active);

-- Update any existing users to be active by default
UPDATE public.users SET is_active = TRUE WHERE is_active IS NULL; 