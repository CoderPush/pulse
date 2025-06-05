# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development workflow:**
```bash
pnpm dev                    # Start dev server with Turbopack
pnpm build                  # Build for production
pnpm lint                   # Run ESLint
```

**Database management:**
```bash
supabase start             # Start local Supabase
supabase stop              # Stop local Supabase
supabase db reset          # Reset local database (CONFIRM BEFORE RUNNING)
supabase status            # Check Supabase status
```

**Testing commands:**
```bash
pnpm test                   # Run unit tests in watch mode
pnpm test:run              # Run unit tests once
pnpm test:coverage         # Run unit tests with coverage
pnpm test:e2e              # Run Playwright E2E tests
pnpm test:e2e:ui           # Run E2E tests with UI mode
pnpm test:e2e:debug        # Run E2E tests in debug mode
```

## Architecture Overview

### Application Structure
- **Next.js 15 App Router** with route groups: `(authenticated)` for protected routes, `admin` for admin-only areas
- **Supabase local development** - always confirm before running `supabase db reset` as it resets the database
- **Multi-step form flow** orchestrated by `WeeklyPulseForm` with screen-based progression
- **Dynamic questions system** with versioned questions supporting multiple types (text, textarea, number, multiple_choice, checkbox)

### Authentication & Authorization
- **Supabase SSR authentication** with three client types:
  - Server: `/utils/supabase/server.ts` for server components
  - API: `/utils/supabase/api.ts` for API routes
  - Middleware: `/utils/supabase/middleware.ts` for route protection
- **Two-tier access control**: authenticated users vs admin users (`is_admin` flag)
- **Middleware-based route protection** in `/src/middleware.ts`

### Database Schema
- **Versioned questions**: Questions use `parent_id` self-reference with version incrementing
- **Submission windows**: Friday 5PM opens → Monday 2PM due → Tuesday 5PM late cutoff
- **JSONB storage**: `additional_projects` in submissions, `answers` in submission_answers
- **Hierarchical data**: Comments with `parent_id`, questions with versioning

### Form Architecture
- **Screen components** in `/src/components/screens/` with consistent interfaces
- **Question-to-screen mapping**: Categories map to specialized screens (e.g., `primaryProject` → `ProjectSelectionScreen`)
- **Dynamic question rendering** falls back by question type
- **Form data structure**: Core submission data + `answers` object keyed by question ID

### Testing Strategy
- **Unit tests**: Vitest with React Testing Library and jsdom
- **E2E tests**: Playwright with automatic dev server setup
- **Test utilities**: Supabase mocks in `/src/test-utils/`

### Key Business Logic
- **Week calculations**: ISO week numbers with `date-fns` for consistency
- **Auto-sharing**: Submissions auto-shared with managers for `@coderpush.com` emails
- **Streak calculation**: Configurable start week with exclusions for holidays
- **Late submission detection**: Based on submission window timing

### Component Patterns
- **Screen components**: Follow props pattern `{onNext, onBack, formData, setFormData, error}`
- **Admin components**: Modular structure in `/src/components/admin/`
- **UI components**: Radix UI-based components in `/src/components/ui/`

### Important Notes
- Always use Next.js 15 latest practices, not older patterns
- Supabase local development - confirm before database resets
- Form validation happens at multiple levels: form, API, and database
- Time tracking from `startTime` to completion for analytics