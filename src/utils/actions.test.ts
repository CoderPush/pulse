import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { signOut } from './actions';

// Mock dependencies
vi.mock('@/utils/supabase/server');
vi.mock('next/navigation', () => ({ // Mock the entire module
  redirect: vi.fn(),
}));

describe('signOut Action (src/utils/actions.ts)', () => {
  const mockSignOut = vi.fn();
  // Let TypeScript infer the types
  const mockCreateClient = createClient;
  const mockRedirect = redirect;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup the mock Supabase client
    (mockCreateClient as Mock).mockResolvedValue({
      auth: {
        signOut: mockSignOut.mockResolvedValue({ error: null }), // Mock the signOut method
      },
    });
  });

  it('should call supabase.auth.signOut and redirect to /auth/login', async () => {
    await signOut();

    // Check if createClient was called (implicitly by calling signOut)
    expect(mockCreateClient).toHaveBeenCalled();

    // Check if supabase.auth.signOut was called
    expect(mockSignOut).toHaveBeenCalledTimes(1);

    // Check if redirect was called with the correct path
    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });

  it('should not redirect if supabase.auth.signOut throws an error', async () => {
    // Arrange: Mock signOut to throw an error
    const signOutError = new Error('Supabase sign out failed');
    mockSignOut.mockRejectedValueOnce(signOutError);

    // Act: Call the signOut action and expect it to throw
    await expect(signOut()).rejects.toThrow(signOutError);

    // Assert: Check if supabase.auth.signOut was called
    expect(mockSignOut).toHaveBeenCalledTimes(1);

    // Assert: Check if redirect was *not* called
    expect(mockRedirect).toHaveBeenCalledTimes(0);
  });
}); 