# AGENTS Instructions

This repository contains a Next.js (App Router) web application called **Pulse**.
It uses Supabase for authentication and database storage, Tailwind CSS for styling,
and shadcn/ui components.

## Scope
The instructions in this file apply to the entire repository.

## Development Guidelines
- Use TypeScript for all source code.
- Prefer functional React components and hooks.
- Use the utility `cn` from `src/lib/utils.ts` to compose CSS class names.
- UI components should follow the shadcn/ui style (see `components.json`).
- Keep new code and tests within the `src/` directory structure.

## Linting and Formatting
- Run `pnpm lint` before committing to ensure ESLint rules pass.

## Testing
- Unit tests use **Vitest**. Run them with `pnpm test:run`.
- End-to-end tests use **Playwright** and require a local Supabase instance and the MCP server. Run them with `pnpm test:e2e`.
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
- Keep documentation updates in the `docs/` directory when adding new features.
