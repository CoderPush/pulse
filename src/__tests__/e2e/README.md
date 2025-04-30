# E2E Testing

This directory contains End-to-End tests for the application. We use Playwright for E2E testing as recommended by Next.js documentation.

## Setup

1. Install Playwright:
```bash
pnpm add -D @playwright/test
```

2. Initialize Playwright:
```bash
pnpm playwright install
```

3. Run tests:
```bash
pnpm test:e2e
```

## Writing Tests

- Place test files in this directory with the `.spec.ts` extension
- Use the `test` function from `@playwright/test`
- Test user flows and critical paths
- Focus on testing async Server Components and complex interactions 