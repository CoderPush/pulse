# Pulse Implementation Guide

## Stack (Current)
- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS 4 + shadcn/ui
- Supabase (Auth + Postgres)
- CopilotKit + AWS Bedrock for AI features
- Email: Resend in production, Inbucket locally
- Testing: Vitest + Playwright

## App Structure
- `src/app/(authenticated)` user flows: daily-pulse, daily-tasks, submissions, history, leaderboard, profile
- `src/app/admin` admin UI: submissions, users, projects, time approval, follow-ups, questions, daily tasks
- `src/app/api` API routes: submissions, questions, comments, daily tasks, leaderboard, monthly reports, cron
- `src/utils/supabase` Supabase clients for server/client/middleware
- `src/lib` shared helpers (email, prompts, utils)

## Auth
- Supabase SSR clients in `src/utils/supabase`.
- Google OAuth configured via Supabase; domain restriction uses `NEXT_PUBLIC_COMPANY_EMAIL_DOMAIN`.
- Auto-login endpoint uses `JWT_SECRET` + `TEST_USER_PASSWORD`.

## Data Model (High Level)
- Core: `users`, `weeks`, `submissions`, `submission_answers`, `submission_shares`, `questions`, `comments`
- Reporting: `templates`, `template_questions`, `submission_periods`, `submission_period_users`, `recurring_schedules`
- Tasks/projects: `daily_tasks`, `projects`
- Monthly: `monthly_reports`, `monthly_report_comments`
- Utility: `reminder_logs`
- Canonical schema is in `supabase/migrations/`.

## AI
- `/api/copilotkit` runtime for the UI assistant
- `/api/parse-daily-tasks` and `/api/ai-weekly-insight` use Bedrock models

## Email
- `src/lib/email.ts` routes to Inbucket when `NODE_ENV=development` and Resend otherwise.
- Sharing emails are gated by `NEXT_PUBLIC_ENABLE_EMAILS=true`.

## Cron
- Cron endpoints live under `/api/cron/*` and call admin reminder routes.
- `CRON_SECRET` is required for cron/authenticated reminder endpoints.
- Vercel cron schedules are defined in `vercel.json`.

## More Detail
- Testing: `docs/test-plan.md`
- Supabase testing strategy: `docs/supabase-in-test.md`
- Playwright MCP requirement: `docs/prompt-work-with-playwright-mcp.md`
