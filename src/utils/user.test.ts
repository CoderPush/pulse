import { describe, it, expect } from 'vitest';
import { getInitials } from './user';

describe('User Utils (src/utils/user.ts)', () => {
  describe('getInitials', () => {
    it('returns initials from standard email format', () => {
      expect(getInitials('john.doe@example.com')).toBe('JD');
    });

    it('returns first two letters if only one part before @', () => {
      expect(getInitials('alice@example.com')).toBe('AL');
    });

    it('handles different separators like _ or -', () => {
      expect(getInitials('jane_smith@example.com')).toBe('JS');
      expect(getInitials('bob-ross@example.com')).toBe('BR');
    });

    it('returns fallback U if email is undefined or empty', () => {
      expect(getInitials(undefined)).toBe('U');
      expect(getInitials('')).toBe('U'); // Assuming empty string should also fallback
    });

    it('uppercases the initials', () => {
      expect(getInitials('lowercase.name@example.com')).toBe('LN');
      expect(getInitials('single@example.com')).toBe('SI');
    });

    it('handles emails with multiple separators', () => {
      expect(getInitials('first-middle_last@example.com')).toBe('FL');
    });
  });
}); 