# AGENTS Instructions

Pulse is a Next.js 15 App Router app (React 19, TypeScript, Tailwind 4) with Supabase and AI features via CopilotKit + AWS Bedrock.

## Scope
Applies to the entire repository.

## Commands
- `pnpm dev` (Turbopack)
- `pnpm build`
- `pnpm lint`
- `pnpm test:run` (Vitest)
- `pnpm test:e2e` (Playwright)
- `pnpm test:e2e:install` (Playwright browsers)

## Supabase (local)
- `supabase start`, `supabase stop`, `supabase status`
- `supabase db reset` is destructive, confirm first.
- Local services: API `http://localhost:54321`, Studio `http://localhost:54323`, Inbucket `http://localhost:54324` (SMTP `54325`).
- Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from `supabase status`.

## Env
- Copy `.env.example` and `supabase/.env.example`.
- Required for auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_AUTH_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_GOOGLE_SECRET`.
- Company domain: `NEXT_PUBLIC_COMPANY_EMAIL_DOMAIN`.
- AI (optional): `BEDROCK_AWS_ACCESS_KEY_ID`, `BEDROCK_AWS_SECRET_ACCESS_KEY`, `BEDROCK_MODEL_ID`, optional `BEDROCK_AWS_REGION`.
- Auth/admin: `JWT_SECRET`, `TEST_USER_PASSWORD`.
- Cron/admin: `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`.
- Email: `RESEND_API_KEY`, `EMAIL_FROM`, optional `NEXT_PUBLIC_ENABLE_EMAILS` (local uses Inbucket).
- Optional: `HR_EMAIL`, `LANGSMITH_*`, `ALLOWED_CORS_DOMAIN_SUFFIX`, `CODERPUSH_PULSE_SECRET_KEY`, `NEXT_PUBLIC_GA_ID`.

## Code Conventions
- TypeScript only. Prefer functional React components and hooks.
- Use `cn` from `src/lib/utils.ts` for class names.
- shadcn/ui style rules in `components.json`.
- Keep new code and tests in `src/`.

## Key Locations
- `src/app/(authenticated)` user routes: daily-pulse, daily-tasks, submissions, history, leaderboard, profile.
- `src/app/admin` admin UI.
- `src/app/api` API routes: daily tasks, submissions, questions, comments, leaderboard, monthly reports, cron.
- Supabase clients: `src/utils/supabase/{server,client,api,middleware}.ts`.
- Email: `src/lib/email.ts` (Inbucket in dev, Resend in prod).

## Testing Notes
- E2E tests require local Supabase and the Playwright MCP workflow. See `docs/prompt-work-with-playwright-mcp.md`.
- For Supabase testing strategy, see `docs/supabase-in-test.md` and verify against current code.

## Docs
- `CLAUDE.md` has extra context; treat `docs/` as design notes and verify against code.
