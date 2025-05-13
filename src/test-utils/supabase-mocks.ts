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

  // Helper to allow .eq().eq().single().order() chaining
  const makeEqChain = () => {
    const chain: any = {};
    chain.eq = vi.fn(() => chain);
    chain.single = mockSingle;
    chain.order = mockOrder;
    chain.in = mockIn;
    chain.gte = mockGte;
    return chain;
  };

  const mockSupabaseClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  };

  // Setup mockFrom implementation - This mimics the original structure
  mockFrom.mockImplementation(() => ({
    select: (selectArg: string, options?: { count: 'exact' }) => {
      if (options?.count === 'exact') {
        mockSelectWithOptions.mockReturnValue(makeEqChain());
        return mockSelectWithOptions(selectArg, options);
      }
      mockSelect.mockReturnValue(makeEqChain());
      return mockSelect(selectArg);
    },
    insert: mockInsert,
  }));

  // Default resolutions/chaining setup
  mockIn.mockReturnValue(makeEqChain());
  mockGte.mockResolvedValue({ data: [], error: null });
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockOrder.mockResolvedValue({ data: null, error: null, count: 0 });
  mockInsert.mockResolvedValue({ data: null, error: null });

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