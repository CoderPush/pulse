import { vi } from 'vitest';

export const setupSupabaseMocks = () => {
  const mockEq = vi.fn();
  const mockIn = vi.fn();
  const mockGte = vi.fn();
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn(); // Mock for regular select
  const mockSelectWithOptions = vi.fn(); // Mock for select with options
  const mockFrom = vi.fn();
  const mockGetUser = vi.fn();

  const mockSupabaseClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  };

  // Setup mockFrom implementation - This mimics the original structure
  mockFrom.mockImplementation(() => ({
    select: (selectArg: string, options?: { count: 'exact' }) => {
      if (options?.count === 'exact') {
         // This setup was working - mockSelectWithOptions returns eq
        mockSelectWithOptions.mockReturnValue({ eq: mockEq });
        return mockSelectWithOptions(selectArg, options);
      }
       // This setup was working - mockSelect returns eq and in
      mockSelect.mockReturnValue({ eq: mockEq, in: mockIn });
      return mockSelect(selectArg);
    },
    insert: mockInsert,
  }));

  // Default resolutions/chaining setup - Mimic original
  // This setup seemed sufficient for the tests passed
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder }); // Allows eq chaining, single, order
  mockIn.mockReturnValue({ gte: mockGte }); // in returns gte
  mockGte.mockResolvedValue({ data: [], error: null }); // gte resolves
  mockSingle.mockResolvedValue({ data: null, error: null }); // single resolves
  mockOrder.mockResolvedValue({ data: null, error: null, count: 0 }); // order resolves
  mockInsert.mockResolvedValue({ data: null, error: null }); // insert resolves

  // Return all mocks needed by the tests
  return {
    mockEq,
    mockIn,
    mockGte,
    mockOrder,
    mockSingle,
    mockInsert,
    mockSelect, 
    mockSelectWithOptions,
    mockFrom,
    mockGetUser,
    mockSupabaseClient,
  };
};

// Type definition for the returned mocks (optional but good practice)
export type SupabaseMocks = ReturnType<typeof setupSupabaseMocks>; 