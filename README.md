# Pulse

Pulse is an internal web app for weekly pulse submissions, daily task logging, and admin reporting with AI-assisted inputs. It is built with Next.js, Supabase, and CopilotKit.

## Stack
- Next.js 15 App Router, React 19, TypeScript
- Supabase (Auth + Postgres)
- Tailwind CSS 4 + shadcn/ui
- CopilotKit + AWS Bedrock (AI parsing and insights)

## Core Areas
- Weekly pulse submissions, history, comments, and sharing
- Daily tasks logging and AI parsing
- Leaderboards and streak tracking
- Admin workflows for submissions, users, projects, time approval, and reminders
- Monthly reports and exports

## Local Development
1. `pnpm install`
2. `cp .env.example .env`
3. `cp supabase/.env.example supabase/.env`
4. `supabase start`
5. Fill `.env` values from `supabase status`
6. `pnpm dev`

App: `http://localhost:3000`  
Supabase Studio: `http://localhost:54323`  
Email (Inbucket): `http://localhost:54324`

## Scripts
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test:run`
- `pnpm test:e2e`
- `pnpm test:e2e:install`

## Testing
- Unit: `pnpm test:run`
- E2E: `pnpm test:e2e` (requires local Supabase and Playwright MCP)
- Debug/UI: `pnpm test:e2e:debug`, `pnpm test:e2e:ui`

## Env Notes
- AI endpoints require `BEDROCK_AWS_ACCESS_KEY_ID`, `BEDROCK_AWS_SECRET_ACCESS_KEY`, `BEDROCK_MODEL_ID` (optional `BEDROCK_AWS_REGION`).
- Cron endpoints require `CRON_SECRET`.
- Email uses Resend in production; locally it uses Supabase Inbucket. Set `NEXT_PUBLIC_ENABLE_EMAILS=true` to send share emails.
- Auth uses `NEXT_PUBLIC_COMPANY_EMAIL_DOMAIN`; auto-login uses `JWT_SECRET` + `TEST_USER_PASSWORD`. Optional `HR_EMAIL` controls monthly report recipients.

## Project Structure
- `src/app` routes (authenticated user flows, admin UI, API routes)
- `src/components` UI
- `src/utils/supabase` Supabase clients
- `supabase/` migrations, config, seed data
- `docs/` design notes and plans
