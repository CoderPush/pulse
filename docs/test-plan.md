# Test Plan for Pulse

## Overview
This document outlines the testing strategy for the Pulse application, using Vitest for unit/integration tests and Playwright for end-to-end (E2E) testing.

## Test Stack

### Unit and Integration Tests (Vitest)
- **Framework**: Vitest + React Testing Library
- **Key Dependencies**:
  ```json
  {
    "@testing-library/react": "^14.2.1",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.2.1",
    "vitest": "^1.3.1",
    "jsdom": "^24.0.0",
    "@vitest/coverage-v8": "^1.3.1"
  }
  ```

### End-to-End Tests (Playwright)
- **Framework**: Playwright Test
- **Key Dependencies**:
  ```json
  {
    "@playwright/test": "^1.42.1",
    "@types/node": "^20.11.24"
  }
  ```

## Directory Structure

```
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button/
│   │   │   │   ├── Button.tsx
│   │   │   │   └── Button.test.tsx  <-- Test colocated with component
│   │   ├── WeekFilter/
│   │   │   ├── WeekFilter.tsx
│   │   │   └── WeekFilter.test.tsx <-- Test colocated with component
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── time.ts
│   │   │   ├── time.test.ts     <-- Test colocated with utility
│   │   │   ├── date.ts
│   │   │   └── date.test.ts     <-- Test colocated with utility
│   ├── app/
│   │   ├── (authenticated)/
│   │   │   ├── history/
│   │   │   │   ├── page.tsx
│   │   │   │   └── page.test.tsx    <-- Test colocated (if needed for client logic)
│   ├── hooks/
│   │   ├── useMyHook.ts
│   │   └── useMyHook.test.ts    <-- Test colocated with hook
│   ├── test/                   # Optional: For global setup/mocks
│   │   ├── setup.ts           
│   │   └── __mocks__/         
│   └── ... (other source files and their tests)
├── e2e/                       # Playwright tests
│   ├── auth.setup.ts         # Auth setup for E2E
│   ├── fixtures/             # Test fixtures
│   └── specs/                # Test specifications
├── vitest.config.ts          # Vitest configuration
└── playwright.config.ts      # Playwright configuration
```

## Test Categories

### 1. Unit Tests (Vitest)
- **Location**: Colocated with source files (e.g., `Button.test.tsx` next to `Button.tsx`). Tests focus on individual components or functions in isolation, mocking dependencies.
- **Coverage Areas**:
  - React Components (Rendering, Props, Basic Interaction)
  - Utility Functions
  - Hooks
  - State Management
  - Helper Functions

### 2. Integration Tests (Vitest)
- **Location**: Colocated with the primary source file orchestrating the interaction (e.g., a page component's test file `page.test.tsx`). Tests focus on how multiple units work together, potentially with mocked external services (like Supabase).
- **Coverage Areas**:
  - Component Interactions within a feature or page
  - API Route Handlers
  - Data Flow
  - State Management Integration
  - Supabase Client Integration

### 3. E2E Tests (Playwright)
- **Location**: `e2e/specs/`
- **Coverage Areas**:
  - User Flows
  - Authentication (Google OAuth)
  - Form Submissions
  - Navigation
  - Data Persistence

## Configuration Files

### Vitest Configuration
Will be added to `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

### Playwright Configuration
Will be added to `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    storageState: './e2e/fixtures/storageState.json',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },
  ],
})
```

## Test Scripts
Will be added to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

## Authentication Testing Strategy

### Unit/Integration Tests
- Mock Supabase authentication
- Test auth state management
- Test protected routes
- Test auth-related components

### E2E Tests
- Use Playwright's built-in authentication handling
- Store authenticated state for reuse
- Test real Google OAuth flow
- Verify protected routes with authenticated sessions

## CI/CD Integration

### GitHub Actions Configuration
Will be added to `.github/workflows/test.yml`:
```yaml
name: Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - name: Install dependencies
        run: pnpm install
      - name: Run unit & integration tests
        run: pnpm test:run
      - name: Install Playwright browsers
        run: pnpm playwright install --with-deps
      - name: Run E2E tests
        run: pnpm test:e2e
```

## Implementation Plan

1. **Phase 1: Setup (Week 1)**
   - Install test dependencies
   - Configure Jest and Playwright
   - Set up CI pipeline
   - Create initial test structure

2. **Phase 2: Unit Tests (Week 2)**
   - Implement component tests
   - Add utility function tests
   - Set up mock services

3. **Phase 3: Integration Tests (Week 3)**
   - Add API route tests
   - Implement Supabase integration tests
   - Test component interactions

4. **Phase 4: E2E Tests (Week 4)**
   - Set up auth flows
   - Implement critical user journeys
   - Add cross-browser testing

## Code Coverage Goals

- Unit Tests: 80% coverage
- Integration Tests: 70% coverage
- E2E Tests: Cover all critical user paths

## Best Practices

1. **Test Organization**
   - One test file per component/feature
   - Clear test descriptions
   - Consistent naming conventions

2. **Testing Principles**
   - Test behavior, not implementation
   - Keep tests independent
   - Use meaningful assertions
   - Follow AAA pattern (Arrange, Act, Assert)

3. **Mocking Strategy**
   - Mock external services
   - Use fixtures for test data
   - Maintain mock data separately

## Review and Maintenance

- Regular review of test coverage
- Update tests with new features
- Maintain test documentation
- Regular cleanup of obsolete tests