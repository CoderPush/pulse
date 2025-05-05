import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST } from './route'; // Import the handler
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email';
import * as emailTemplates from '@/utils/email-templates'; // Import all templates/functions

// --- Mock dependencies ---
vi.mock('@/utils/supabase/server');
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn() // Only provide the mocked function
}));
vi.mock('@/utils/email-templates', async (importOriginal) => {
  const actual = await importOriginal<typeof emailTemplates>();
  return {
    ...actual, // Keep actual types/constants if needed
    // Mock the functions we want to spy on
    onTimeTemplate: vi.fn().mockReturnValue('<div>On Time HTML</div>'),
    lateTemplate1: vi.fn().mockReturnValue('<div>Late 1 HTML</div>'),
    lateTemplate2: vi.fn().mockReturnValue('<div>Late 2 HTML</div>'),
    lateTemplate3: vi.fn().mockReturnValue('<div>Late 3 HTML</div>'),
    getReminderSubject: vi.fn().mockReturnValue('Test Subject'),
  };
});

// --- Test Suite ---
describe('/api/admin/submissions/remind POST Handler', () => {
  // Create mock functions for each method in the chain
  const mockEq = vi.fn();
  const mockIn = vi.fn();
  const mockGte = vi.fn();
  const mockOrder = vi.fn();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockSelect = vi.fn();
  const mockSelectWithOptions = vi.fn(); // For select('*', { count: 'exact' })
  const mockFrom = vi.fn();
  const mockGetUser = vi.fn();

  // Create the mock Supabase client
  const mockSupabaseClient = {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  };

  // Set up the method chain
  mockFrom.mockImplementation((tableName) => ({
    select: (selectArg: string, options?: { count: 'exact' }) => {
      if (options?.count === 'exact') {
        mockSelectWithOptions.mockReturnValue({ eq: mockEq });
        return mockSelectWithOptions(selectArg, options);
      }
      mockSelect.mockReturnValue({ eq: mockEq, in: mockIn });
      return mockSelect(selectArg);
    },
    insert: mockInsert,
  }));

  // Set up the chain returns
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder });
  mockIn.mockReturnValue({ gte: mockGte });
  mockGte.mockResolvedValue({ data: [], error: null });
  mockSingle.mockResolvedValue({ data: null, error: null });
  mockOrder.mockResolvedValue({ data: null, error: null, count: 0 });
  mockInsert.mockResolvedValue({ data: null, error: null });

  // Set up other mocks
  const mockSendEmail = sendEmail as Mock;
  const mockCreateClient = createClient as Mock;
  const mockOnTimeTemplate = emailTemplates.onTimeTemplate as Mock;
  const mockLateTemplate1 = emailTemplates.lateTemplate1 as Mock;
  const mockLateTemplate2 = emailTemplates.lateTemplate2 as Mock;
  const mockLateTemplate3 = emailTemplates.lateTemplate3 as Mock;
  const mockGetReminderSubject = emailTemplates.getReminderSubject as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockReturnValue(mockSupabaseClient);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-user-id' } }, error: null });
    mockSendEmail.mockResolvedValue({ success: true });
  });

  const createMockRequest = (body: any): Request => {
    return { json: async () => body } as Request;
  };

  it('should use onTimeTemplate and type "on-time" for the first reminder (count=0)', async () => {
    const user = { id: 'user-1', email: 'user1@example.com', name: 'User One' };
    const week = 25;
    const year = 2024;
    const requestBody = { userIds: [user.id], week, year };
    const mockRequest = createMockRequest(requestBody);

    // Set up all mock responses for this test
    mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null }); // Admin check
    mockIn.mockResolvedValueOnce({ data: [user], error: null }); // User lookup
    mockGte.mockResolvedValueOnce({ data: [], error: null }); // Recent reminders check
    mockOrder.mockResolvedValueOnce({ count: 0, error: null }); // Count check
    mockInsert.mockResolvedValueOnce({ error: null }); // Insert reminder log

    await POST(mockRequest);

    expect(mockGetReminderSubject).toHaveBeenCalledWith('on-time', { userName: user.name, weekNumber: week, year });
    expect(mockOnTimeTemplate).toHaveBeenCalledWith({ 
      name: user.name, 
      week, 
      year, 
      link: expect.stringContaining(`/?week=${week}&year=${year}`) 
    });
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      subject: 'Test Subject',
      html: '<div>On Time HTML</div>',
    }));
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should use lateTemplate1 and type "late-1" for the second reminder (count=1)', async () => {
    const user = { id: 'user-2', email: 'user2@example.com', name: 'User Two' };
    const week = 26;
    const year = 2024;
    const requestBody = { userIds: [user.id], week, year };
    const mockRequest = createMockRequest(requestBody);

    // Set up all mock responses for this test
    mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null }); // Admin check
    mockIn.mockResolvedValueOnce({ data: [user], error: null }); // User lookup
    mockGte.mockResolvedValueOnce({ data: [], error: null }); // Recent reminders check
    mockOrder.mockResolvedValueOnce({ count: 1, error: null }); // Count check
    mockInsert.mockResolvedValueOnce({ error: null }); // Insert reminder log

    await POST(mockRequest);

    expect(mockGetReminderSubject).toHaveBeenCalledWith('late-1', { userName: user.name, weekNumber: week, year });
    expect(mockLateTemplate1).toHaveBeenCalledWith({ 
      name: user.name, 
      week, 
      year, 
      link: expect.stringContaining(`/?week=${week}&year=${year}`) 
    });
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      subject: 'Test Subject',
      html: '<div>Late 1 HTML</div>',
    }));
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should use lateTemplate2 and type "late-2" for the third reminder (count=2)', async () => {
    const user = { id: 'user-3', email: 'user3@example.com', name: 'User Three' };
    const week = 27;
    const year = 2024;
    const requestBody = { userIds: [user.id], week, year };
    const mockRequest = createMockRequest(requestBody);

    // Set up all mock responses for this test
    mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null }); // Admin check
    mockIn.mockResolvedValueOnce({ data: [user], error: null }); // User lookup
    mockGte.mockResolvedValueOnce({ data: [], error: null }); // Recent reminders check
    mockOrder.mockResolvedValueOnce({ count: 2, error: null }); // Count check
    mockInsert.mockResolvedValueOnce({ error: null }); // Insert reminder log

    await POST(mockRequest);

    expect(mockGetReminderSubject).toHaveBeenCalledWith('late-2', { userName: user.name, weekNumber: week, year });
    expect(mockLateTemplate2).toHaveBeenCalledWith({ 
      name: user.name, 
      week, 
      year, 
      link: expect.stringContaining(`/?week=${week}&year=${year}`) 
    });
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      subject: 'Test Subject',
      html: '<div>Late 2 HTML</div>',
    }));
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should use lateTemplate3 and type "late-3" for subsequent reminders (count=3+)', async () => {
    const user = { id: 'user-4', email: 'user4@example.com', name: 'User Four' };
    const week = 28;
    const year = 2024;
    const requestBody = { userIds: [user.id], week, year };
    const mockRequest = createMockRequest(requestBody);

    // Set up all mock responses for this test
    mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null }); // Admin check
    mockIn.mockResolvedValueOnce({ data: [user], error: null }); // User lookup
    mockGte.mockResolvedValueOnce({ data: [], error: null }); // Recent reminders check
    mockOrder.mockResolvedValueOnce({ count: 3, error: null }); // Count check
    mockInsert.mockResolvedValueOnce({ error: null }); // Insert reminder log

    await POST(mockRequest);

    expect(mockGetReminderSubject).toHaveBeenCalledWith('late-3', { userName: user.name, weekNumber: week, year });
    expect(mockLateTemplate3).toHaveBeenCalledWith({ 
      name: user.name, 
      week, 
      year, 
      link: expect.stringContaining(`/?week=${week}&year=${year}`) 
    });
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: user.email,
      subject: 'Test Subject',
      html: '<div>Late 3 HTML</div>',
    }));
    expect(mockInsert).toHaveBeenCalled();
  });

  // TODO: Add more tests for other scenarios:
  // - User recently reminded (sendEmail should not be called)
  // - sendEmail fails
  // - Auth fails / User is not admin
  // - Missing request body parameters
  // - No users found
});