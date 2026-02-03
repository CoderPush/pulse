# Test Plan

## Stack
- Unit/Integration: Vitest + React Testing Library (jsdom)
- E2E: Playwright

## Locations
- Unit/integration tests: `src/**/*.{test,spec}.{ts,tsx}`
- Test setup: `src/test/setup.ts`
- Supabase mocks: `src/test-utils/supabase-mocks.ts`
- E2E tests: `e2e/specs/*.spec.ts`

## Configuration
- `vitest.config.ts`: jsdom, setup file, `@` alias
- `playwright.config.ts`: `pnpm dev` webServer, base URL `http://localhost:3000`, Chromium/Firefox/WebKit

## Commands
- `pnpm test` (watch)
- `pnpm test:run`
- `pnpm test:ui`
- `pnpm test:coverage`
- `pnpm test:e2e`
- `pnpm test:e2e:debug`
- `pnpm test:e2e:ui`
- `pnpm test:e2e:install`

## Supabase Strategy
- Prefer mocks for unit/integration tests.
- Use local Supabase for E2E and any flow tests that require real DB/RLS.

## MCP Requirement
E2E runs must use Playwright MCP. See `docs/prompt-work-with-playwright-mcp.md`.
