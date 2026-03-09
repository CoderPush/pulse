# Supabase in Tests

## Default Approach
- Unit/integration tests use mocks.
- E2E tests use local Supabase.

## Mocks
- Helper: `src/test-utils/supabase-mocks.ts`
- Example usage:
```ts
import { setupSupabaseMocks } from '@/test-utils/supabase-mocks'
import { vi } from 'vitest'

vi.mock('@/utils/supabase/server')
const { mockSupabaseClient } = setupSupabaseMocks()
```

## When to Use Local Supabase
- E2E flows
- RLS policy checks
- Real SQL behaviors (constraints, RPCs, triggers)

## Notes
- Local Supabase must be running for E2E.
- See `docs/prompt-work-with-playwright-mcp.md` for MCP requirements.
