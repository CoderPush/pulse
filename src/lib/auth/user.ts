export function getInitials(email?: string): string {
  if (!email) return 'U';
  const parts = email.split('@')[0].split(/[\s._-]+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + (parts[parts.length - 1][0] || '')).toUpperCase();
} 