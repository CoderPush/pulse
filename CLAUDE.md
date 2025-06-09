# CLAUDE Development Notes

This document contains extended guidance for working on Pulse. Codex will also use these instructions for additional context.

## Local Development Workflow

- Install dependencies with `pnpm install`.
- Start the application locally with `pnpm dev`.
- Build for production with `pnpm build`.

### Supabase Local
- `supabase start` &mdash; start the local Supabase instance.
- `supabase stop` &mdash; stop the instance when not needed.
- `supabase status` &mdash; check whether Supabase is running.
- `supabase db reset` &mdash; **destroys local data. Confirm before running.**

## Architecture Overview

Pulse uses Next.js 15 with the App Router. Key route groups are `(authenticated)` for user views and `admin` for administrative pages. Supabase authentication works on both the server and API routes through helper clients in `src/lib/supabase` (`server.ts`, `api.ts`, `middleware.ts`).

Submissions are collected via the multi-step `WeeklyPulseForm`. Questions are versioned so that historical submissions retain their original questions. Track the time from `startTime` to form completion for analytics purposes.

## Testing Tools

- Unit tests: `pnpm test:run`
- Coverage: `pnpm test:coverage`
- End-to-end tests: `pnpm test:e2e` (requires MCP and local Supabase)
- Debugging E2E tests: `pnpm test:e2e:debug`

## Important Notes

- Follow modern Next.js 15 patterns (server actions, file-based routing).
- Form validation occurs at the UI, API layer, and database constraints.
- Refer to `docs/test-plan.md` for the full testing strategy and `docs/implementation.md` for architecture details.

