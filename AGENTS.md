# AGENTS Instructions

This repository contains a Next.js 15 web application called **Pulse**. It uses Supabase for authentication and database storage, Tailwind CSS for styling, and shadcn/ui components.

Codex should also read `CLAUDE.md` in the repository root for extended architecture and workflow details.

## Scope
These instructions apply to the entire repository.

## Development Guidelines
- Use TypeScript for all source code.
- Prefer functional React components and hooks.
- Use the utility `cn` from `src/lib/utils.ts` to compose CSS class names.
- UI components should follow the shadcn/ui style (see `components.json`).
- Keep new code and tests within the `src/` directory structure.
- Start the development server with `pnpm dev` and build with `pnpm build`.
- Manage Supabase locally with:
  - `supabase start` – start local instance
  - `supabase stop` – stop local instance
  - `supabase status` – check status
  - `supabase db reset` – reset database **(destroys local data, confirm before running)**

## Linting and Formatting
- Run `pnpm lint` before committing to ensure ESLint rules pass.

## Testing
- Unit tests use **Vitest**. Run them with `pnpm test:run`.
- End-to-end tests use **Playwright** and require a local Supabase instance and the MCP server. Run them with `pnpm test:e2e`.
- Additional helpers: `pnpm test:e2e:debug` and `pnpm test:coverage`.
- If tests fail due to environment limitations (e.g. missing dependencies), note this in the PR.

## Commit Messages
Use short descriptive commit messages, for example:
```
feat: add weekly submission API
docs: update README with setup steps
```

## Additional Notes
- E2E tests must drive the browser via the MCP server as described in `docs/prompt-work-with-playwright-mcp.md`.
- For Supabase-related tests, see `docs/supabase-in-test.md` for the hybrid approach using mocks and a local instance.
- Consult `docs/test-plan.md` and `docs/implementation.md` for deeper explanations.
- `CLAUDE.md` contains extended documentation for human contributors.
- Keep documentation updates in the `docs/` directory when adding new features.
