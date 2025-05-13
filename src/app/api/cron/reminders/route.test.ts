import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { createClient } from '@/utils/supabase/server';
import { getMostRecentThursdayWeek } from '@/lib/utils/date';
import { setupSupabaseMocks } from '@/test-utils/supabase-mocks';

vi.mock('@/utils/supabase/server');
vi.mock('@/lib/utils/date', () => ({
  getMostRecentThursdayWeek: vi.fn()
}));

// --- Helper Types ---
type MockUser = {
  id: string;
  email: string;
  name: string;
};

const createMockUser = (id: string): MockUser => ({
  id,
  email: `user${id}@example.com`,
  name: `User ${id}`,
});

const createMockRequest = (headers: Record<string, string> = {}): Request => {
  return {
    headers: {
      get: (key: string) => headers[key],
    },
  } as unknown as Request;
};

describe('/api/cron/reminders GET Handler', () => {
  const mocks = setupSupabaseMocks();
  const mockCreateClient = createClient as Mock;
  const mockGetMostRecentThursdayWeek = getMostRecentThursdayWeek as Mock;
  const OLD_ENV = process.env;
  let GET: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    process.env.CRON_SECRET = 'test-secret';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    GET = (await import('./route')).GET;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockReturnValue(mocks.mockSupabaseClient);
    mockGetMostRecentThursdayWeek.mockReturnValue(25);
    process.env = { ...OLD_ENV, CRON_SECRET: 'test-secret', NEXT_PUBLIC_APP_URL: 'http://localhost:3000' };
  });


  it('should return 401 if authorization header is missing or invalid', async () => {
    const reqNoAuth = createMockRequest();
    const reqWrongAuth = createMockRequest({ authorization: 'Bearer wrong' });
    let res = await GET(reqNoAuth);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe('Unauthorized');
    res = await GET(reqWrongAuth);
    expect(res.status).toBe(401);
    expect(await res.text()).toBe('Unauthorized');
  });

  it('should call downstream API and return its result if users need reminders', async () => {
    mocks.mockSelect.mockResolvedValueOnce({ data: [createMockUser('1'), createMockUser('2')], error: null });
    mocks.mockEq.mockResolvedValueOnce({ data: [{ user_id: '1' }], error: null });
    global.fetch = vi.fn().mockResolvedValue({
      headers: { get: () => 'application/json' },
      json: async () => ({ results: [{ userId: '2', success: true }] }),
      status: 200
    });
    const req = createMockRequest({ authorization: 'Bearer test-secret' });
    const res = await GET(req);
    const json = await res.json();
    expect(json).toEqual({
      results: [
        {
          userId: '1',
          response: { results: [{ userId: '2', success: true }] },
          status: 200
        },
        {
          userId: '2',
          response: { results: [{ userId: '2', success: true }] },
          status: 200
        }
      ]
    });
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/admin/submissions/remind',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('should return 500 if supabase user fetch fails', async () => {
    mocks.mockSelect.mockResolvedValueOnce({ eq: vi.fn(() => mocks.mockEq) });
    mocks.mockEq.mockReturnValueOnce({ eq: mocks.mockEq });
    mocks.mockEq.mockResolvedValueOnce({ data: null, error: { message: 'fail' } });
    const req = createMockRequest({ authorization: 'Bearer test-secret' });
    const res = await GET(req);
    const json = await res.json();
    expect(res.status).toBe(500);
    expect(json).toEqual({ error: 'Failed to fetch users' });
  });

  it('should return downstream error if downstream API returns non-JSON', async () => {
    mocks.mockSelect.mockResolvedValueOnce({ data: [createMockUser('1'), createMockUser('2')], error: null });
    mocks.mockEq.mockResolvedValueOnce({ data: [{ user_id: '1' }], error: null });
    global.fetch = vi.fn().mockResolvedValue({
      headers: { get: () => 'text/plain' },
      text: async () => 'Downstream error',
      status: 500
    });
    const req = createMockRequest({ authorization: 'Bearer test-secret' });
    const res = await GET(req);
    const json = await res.json();
    expect(json).toEqual({
      results: [
        {
          userId: '1',
          response: { error: 'Downstream error', status: 500 },
          status: 500
        },
        {
          userId: '2',
          response: { error: 'Downstream error', status: 500 },
          status: 500
        }
      ]
    });
    expect(res.status).toBe(500);
  });
}); 