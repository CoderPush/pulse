import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { POST } from './route'; // Import the handler
import { createClient } from '@/utils/supabase/server';
import { sendEmail } from '@/lib/email';
import * as emailTemplates from '@/lib/email-templates'; // Import all templates/functions
import { setupSupabaseMocks } from '@/test-utils/supabase-mocks'; // Import the new mock setup

// --- Mock dependencies ---
vi.mock('@/utils/supabase/server');
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn() // Only provide the mocked function
}));
vi.mock('@/lib/email-templates', async (importOriginal) => {
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

// --- Helper Types ---
type MockUser = {
  id: string;
  email: string;
  name: string;
};

type ReminderRequest = {
  userIds: string[];
  week: number;
  year: number;
};

// --- Helper Functions ---
const createMockUser = (id: string): MockUser => ({
  id,
  email: `user${id}@example.com`,
  name: `User ${id}`,
});

const createMockRequest = (body: ReminderRequest, headers: Record<string, string> = {}): Request => {
  return {
    json: async () => body,
    headers: {
      get: (key: string) => headers[key],
    },
  } as unknown as Request;
};

// --- Test Suite ---
describe('/api/admin/submissions/remind POST Handler', () => {
  const mocks = setupSupabaseMocks();
  const mockSendEmail = sendEmail as Mock;
  const mockCreateClient = createClient as Mock;
  const mockOnTimeTemplate = emailTemplates.onTimeTemplate as Mock;
  const mockLateTemplate1 = emailTemplates.lateTemplate1 as Mock;
  const mockLateTemplate2 = emailTemplates.lateTemplate2 as Mock;
  const mockLateTemplate3 = emailTemplates.lateTemplate3 as Mock;
  const mockGetReminderSubject = emailTemplates.getReminderSubject as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockReturnValue(mocks.mockSupabaseClient);
    mocks.mockGetUser.mockResolvedValue({ data: { user: { id: 'admin-user-id' } }, error: null });
    mockSendEmail.mockResolvedValue({ success: true });
  });

  describe('Success Cases', () => {
    it('should return 200 with success results for single user reminder', async () => {
      const user = createMockUser('1');
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up all mock responses in sequence
      mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null });
      mocks.mockIn.mockResolvedValueOnce({ data: [user], error: null });
      mocks.mockGte.mockResolvedValueOnce({ data: [], error: null });
      mocks.mockOrder.mockResolvedValueOnce({ count: 0, error: null });
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        results: [{
          userId: user.id,
          success: true
        }]
      });
    });

    it('should return 200 with mixed results for multiple users', async () => {
      const users = [createMockUser('1'), createMockUser('2')];
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: users.map(u => u.id), week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up mock responses for first user
      mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null });
      mocks.mockIn.mockResolvedValueOnce({ data: users, error: null });
      mocks.mockGte.mockResolvedValueOnce({ data: [{ user_id: users[1].id }], error: null });
      mocks.mockOrder.mockResolvedValueOnce({ count: 0, error: null });
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        results: [
          {
            userId: users[0].id,
            success: true
          },
          {
            userId: users[1].id,
            success: false,
            error: 'User was reminded in the last 24 hours'
          }
        ]
      });
    });
  });

  describe('Error Cases', () => {
    it('should return 401 when user is not authenticated', async () => {
      mocks.mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      
      const requestBody = { userIds: ['user-1'], week: 25, year: 2024 };
      const mockRequest = createMockRequest(requestBody);

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('should return 401 when user is not an admin', async () => {
      mocks.mockSingle.mockResolvedValueOnce({ 
        data: { id: 'user-1', is_admin: false }, 
        error: null 
      });

      const requestBody = { userIds: ['user-1'], week: 25, year: 2024 };
      const mockRequest = createMockRequest(requestBody);

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('should return 400 when required fields are missing', async () => {
      const invalidRequests = [
        { userIds: [], week: 25, year: 2024 },
        { userIds: ['user-1'], week: null, year: 2024 },
        { userIds: ['user-1'], week: 25, year: null },
        { userIds: null, week: 25, year: 2024 },
      ];

      for (const requestBody of invalidRequests) {
        // Set up authentication and admin check mocks
        mocks.mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'admin-user-id' } }, error: null });
        mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null });

        const mockRequest = createMockRequest(requestBody as ReminderRequest);
        const response = await POST(mockRequest);
        expect(response.status).toBe(400);
        expect(await response.text()).toBe('Missing required fields');
      }
    });

    it('should return 404 when no users are found', async () => {
      // Set up admin check first
      mocks.mockSingle.mockResolvedValueOnce({ 
        data: { id: 'admin-user-id', is_admin: true }, 
        error: null 
      });
      // Then set up empty users response
      mocks.mockIn.mockResolvedValueOnce({ data: [], error: null });

      const requestBody = { userIds: ['non-existent-user'], week: 25, year: 2024 };
      const mockRequest = createMockRequest(requestBody);

      const response = await POST(mockRequest);
      expect(response.status).toBe(404);
      expect(await response.text()).toBe('No users found');
    });

    it('should return 200 with error results when email sending fails', async () => {
      const user = createMockUser('1');
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up all mock responses in sequence
      mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null });
      mocks.mockIn.mockResolvedValueOnce({ data: [user], error: null });
      mocks.mockGte.mockResolvedValueOnce({ data: [], error: null });
      mocks.mockOrder.mockResolvedValueOnce({ count: 0, error: null });
      mockSendEmail.mockResolvedValueOnce({ 
        success: false, 
        error: 'Failed to send email' 
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        results: [{
          userId: user.id,
          success: false,
          error: 'Failed to send email'
        }]
      });
    });
  });

  // --- CRON_SECRET Header Authentication ---
  describe('CRON_SECRET Header Authentication', () => {
    const CRON_SECRET = 'test-cron-secret';
    beforeAll(() => {
      process.env.CRON_SECRET = CRON_SECRET;
    });
    afterAll(() => {
      delete process.env.CRON_SECRET;
    });

    it('should allow request with valid CRON_SECRET header and bypass user/admin checks', async () => {
      const user = createMockUser('cron1');
      const week = 30;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody, { authorization: `Bearer ${CRON_SECRET}` });

      // Should NOT call user/admin checks, so no need to mockGetUser or mockSingle
      // Only mock user fetch and downstream DB/email
      mocks.mockIn.mockResolvedValueOnce({ data: [user], error: null });
      mocks.mockGte.mockResolvedValueOnce({ data: [], error: null });
      mocks.mockOrder.mockResolvedValueOnce({ count: 0, error: null });
      mocks.mockInsert.mockResolvedValueOnce({ error: null });
      mockSendEmail.mockResolvedValueOnce({ success: true });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        results: [{ userId: user.id, success: true }]
      });
      // Optionally, check that no user/admin check mocks were called
      expect(mocks.mockGetUser).not.toHaveBeenCalled();
      expect(mocks.mockSingle).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid CRON_SECRET header', async () => {
      const user = createMockUser('cron2');
      const week = 31;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody, { authorization: 'Bearer wrong-secret' });

      // Should fall back to user check, so mockGetUser returns null (unauthenticated)
      mocks.mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });
  });

  describe('Template Selection', () => {
    it('should use onTimeTemplate and type "on-time" for the first reminder (count=0)', async () => {
      const user = createMockUser('1');
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up all mock responses in sequence
      mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null });
      mocks.mockIn.mockResolvedValueOnce({ data: [user], error: null });
      mocks.mockGte.mockResolvedValueOnce({ data: [], error: null });
      mocks.mockOrder.mockResolvedValueOnce({ count: 0, error: null });
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(true);
      expect(mockGetReminderSubject).toHaveBeenCalledWith('on-time', { 
        userName: user.name, 
        weekNumber: week, 
        year 
      });
      expect(mockOnTimeTemplate).toHaveBeenCalledWith({ 
        name: user.name, 
        week, 
        year, 
        link: expect.stringContaining(`/?week=${week}&year=${year}`) 
      });
    });

    it('should use lateTemplate1 and type "late-1" for the second reminder (count=1)', async () => {
      const user = createMockUser('2');
      const week = 26;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up all mock responses in sequence
      mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null });
      mocks.mockIn.mockResolvedValueOnce({ data: [user], error: null });
      mocks.mockGte.mockResolvedValueOnce({ data: [], error: null });
      mocks.mockOrder.mockResolvedValueOnce({ count: 1, error: null });
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(true);
      expect(mockGetReminderSubject).toHaveBeenCalledWith('late-1', { 
        userName: user.name, 
        weekNumber: week, 
        year 
      });
      expect(mockLateTemplate1).toHaveBeenCalledWith({ 
        name: user.name, 
        week, 
        year, 
        link: expect.stringContaining(`/?week=${week}&year=${year}`) 
      });
    });

    it('should use lateTemplate2 and type "late-2" for the third reminder (count=2)', async () => {
      const user = createMockUser('3');
      const week = 27;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up all mock responses in sequence
      mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null });
      mocks.mockIn.mockResolvedValueOnce({ data: [user], error: null });
      mocks.mockGte.mockResolvedValueOnce({ data: [], error: null });
      mocks.mockOrder.mockResolvedValueOnce({ count: 2, error: null });
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(true);
      expect(mockGetReminderSubject).toHaveBeenCalledWith('late-2', { 
        userName: user.name, 
        weekNumber: week, 
        year 
      });
      expect(mockLateTemplate2).toHaveBeenCalledWith({ 
        name: user.name, 
        week, 
        year, 
        link: expect.stringContaining(`/?week=${week}&year=${year}`) 
      });
    });

    it('should use lateTemplate3 and type "late-3" for subsequent reminders (count=3+)', async () => {
      const user = createMockUser('4');
      const week = 28;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up all mock responses in sequence
      mocks.mockSingle.mockResolvedValueOnce({ data: { id: 'admin-user-id', is_admin: true }, error: null });
      mocks.mockIn.mockResolvedValueOnce({ data: [user], error: null });
      mocks.mockGte.mockResolvedValueOnce({ data: [], error: null });
      mocks.mockOrder.mockResolvedValueOnce({ count: 3, error: null });
      mocks.mockInsert.mockResolvedValueOnce({ error: null });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results[0].success).toBe(true);
      expect(mockGetReminderSubject).toHaveBeenCalledWith('late-3', { 
        userName: user.name, 
        weekNumber: week, 
        year 
      });
      expect(mockLateTemplate3).toHaveBeenCalledWith({ 
        name: user.name, 
        week, 
        year, 
        link: expect.stringContaining(`/?week=${week}&year=${year}`) 
      });
    });
  });

  describe('Database Error Cases', () => {
    it('should handle database error when checking admin status', async () => {
      const user = createMockUser('1');
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Mock database error for admin check
      mocks.mockSingle.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Database connection error' } 
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('should handle database error when fetching users', async () => {
      const user = createMockUser('1');
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up admin check success
      mocks.mockSingle.mockResolvedValueOnce({ 
        data: { id: 'admin-user-id', is_admin: true }, 
        error: null 
      });
      // Mock database error for user fetch
      mocks.mockIn.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Failed to fetch users' } 
      });

      const response = await POST(mockRequest);
      expect(response.status).toBe(404);
      expect(await response.text()).toBe('No users found');
    });

    it('should handle database error when checking reminder history', async () => {
      const user = createMockUser('1');
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up admin check success
      mocks.mockSingle.mockResolvedValueOnce({ 
        data: { id: 'admin-user-id', is_admin: true }, 
        error: null 
      });
      // Set up user fetch success
      mocks.mockIn.mockResolvedValueOnce({ 
        data: [user], 
        error: null 
      });
      // Mock database error for reminder history check
      mocks.mockGte.mockResolvedValueOnce({ 
        data: [], 
        error: { message: 'Failed to check reminder history' } 
      });
      // Set up reminder count success
      mocks.mockOrder.mockResolvedValueOnce({ 
        count: 0, 
        error: null 
      });
      // Set up email sending success
      mockSendEmail.mockResolvedValueOnce({ 
        success: true 
      });
      // Set up reminder insertion success
      mocks.mockInsert.mockResolvedValueOnce({ 
        error: null 
      });

      const response = await POST(mockRequest);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        userId: user.id,
        success: true
      });
    });

    it('should handle database error when inserting reminder record', async () => {
      const user = createMockUser('1');
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up all previous operations to succeed
      mocks.mockSingle.mockResolvedValueOnce({ 
        data: { id: 'admin-user-id', is_admin: true }, 
        error: null 
      });
      mocks.mockIn.mockResolvedValueOnce({ 
        data: [user], 
        error: null 
      });
      mocks.mockGte.mockResolvedValueOnce({ 
        data: [], 
        error: null 
      });
      mocks.mockOrder.mockResolvedValueOnce({ 
        count: 0, 
        error: null 
      });
      // Set up email sending success
      mockSendEmail.mockResolvedValueOnce({ 
        success: true 
      });
      // Mock database error for reminder insertion
      mocks.mockInsert.mockRejectedValueOnce(new Error('Failed to insert reminder record'));

      const response = await POST(mockRequest);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        userId: user.id,
        success: false,
        error: 'Failed to insert reminder record'
      });
    });

    it('should handle database error when counting reminders', async () => {
      const user = createMockUser('1');
      const week = 25;
      const year = 2024;
      const requestBody = { userIds: [user.id], week, year };
      const mockRequest = createMockRequest(requestBody);

      // Set up all previous operations to succeed
      mocks.mockSingle.mockResolvedValueOnce({ 
        data: { id: 'admin-user-id', is_admin: true }, 
        error: null 
      });
      mocks.mockIn.mockResolvedValueOnce({ 
        data: [user], 
        error: null 
      });
      mocks.mockGte.mockResolvedValueOnce({ 
        data: [], 
        error: null 
      });
      // Mock database error for reminder count
      mocks.mockOrder.mockResolvedValueOnce({ 
        count: 0, 
        error: { message: 'Failed to count reminders' } 
      });
      // Set up email sending success
      mockSendEmail.mockResolvedValueOnce({ 
        success: true 
      });
      // Set up reminder insertion success
      mocks.mockInsert.mockResolvedValueOnce({ 
        error: null 
      });

      const response = await POST(mockRequest);
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.results[0]).toEqual({
        userId: user.id,
        success: true
      });
    });
  });
});