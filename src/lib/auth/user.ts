import type { User } from '@supabase/supabase-js';

export function getInitials(email?: string): string {
  if (!email) return 'U';
  const parts = email.split('@')[0].split(/[\s._-]+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
}

export function getDisplayName(user: User): string {
  return user.user_metadata?.name && user.user_metadata.name.trim() !== ''
    ? user.user_metadata.name
    : (user.email ? user.email.split('@')[0] : '');
} 