import { describe, test, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as supabaseModule from '@/utils/supabase/server';

// Helper to create a mock request
function mockRequest(now?: string, auth = true) {
  const url = new URL('http://localhost/api/cron/recurring-daily-schedules' + (now ? `?now=${encodeURIComponent(now)}` : ''));
  return {
    url: url.toString(),
    headers: {
      get: (key: string) => (key === 'authorization' ? (auth ? `Bearer test-secret` : 'Bearer wrong') : undefined),
    },
  } as unknown as Request;
}

describe('GET /api/cron/recurring-daily-schedules', () => {
  const fromMock = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    vi.spyOn(supabaseModule, 'createClient').mockResolvedValue({
      from: fromMock,
    } as any);
  });

  test('returns 401 if unauthorized', async () => {
    const req = mockRequest(undefined, false);
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  test('creates only missing periods and assignments', async () => {
    // --- Mock Data ---
    const schedules = [
      { id: 1, template_id: 'a', days_of_week: ['Mon', 'Wed'], reminder_time: '09:00', user_ids: ['u1'], start_date: '2024-06-01', end_date: null },
    ];
    const existingPeriods = [{ id: 'p1', template_id: 'a', start_date: '2024-06-10' }];
    const existingAssignments = [{ submission_period_id: 'p1', user_id: 'u1' }];
    const insertedPeriod = [{ id: 'p2', template_id: 'a', start_date: '2024-06-12' }];

    // --- Mock Supabase calls based on table name ---
    fromMock.mockImplementation((tableName: string) => {
      if (tableName === 'recurring_schedules') {
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          lte: vi.fn().mockResolvedValue({ data: schedules, error: null }),
        };
      }
      if (tableName === 'submission_periods') {
        const selectMock = vi.fn();
        const insertMock = vi.fn();

        selectMock.mockImplementationOnce(() => ({
          or: vi.fn().mockResolvedValue({ data: existingPeriods, error: null }),
        }));
        
        insertMock.mockImplementationOnce(() => ({
          select: vi.fn().mockResolvedValue({ data: insertedPeriod, error: null }),
        }));

        return { select: selectMock, insert: insertMock };
      }
      if (tableName === 'submission_period_users') {
        const selectMock = vi.fn();
        const insertMock = vi.fn();
        
        selectMock.mockImplementationOnce(() => ({
          in: vi.fn().mockResolvedValue({ data: existingAssignments, error: null }),
        }));

        insertMock.mockResolvedValueOnce({ error: null });

        return { select: selectMock, insert: insertMock };
      }
    });

    // Simulate running on Sunday, June 9, 2024
    const req = mockRequest('2024-06-09T12:00:00Z');
    const res = await GET(req);
    const json = await res.json();

    expect(json.createdPeriods).toBe(1);
    expect(json.createdAssignments).toBe(1);
    expect(json.errors).toEqual([]);
  });
}); 