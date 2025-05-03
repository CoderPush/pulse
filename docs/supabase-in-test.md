# Supabase Testing Strategy

## Overview
This document outlines our approach to testing Supabase functionality in the Pulse application. We use a hybrid approach combining mocked Supabase for unit tests and real Supabase local for integration tests.

## Testing Approaches Comparison

### Using Real Supabase Local

#### Advantages
1. **Realistic Testing**
   - Tests run against actual database schema
   - Real SQL queries and responses
   - Catches database constraints and type issues
   - Tests Row Level Security (RLS) policies
   - Validates migrations and schema changes

2. **Easier Setup**
   - Leverages existing Supabase local setup
   - No need to maintain mock implementations
   - No risk of mocks becoming outdated
   - Real-world behavior in tests

3. **Better Integration Coverage**
   - Tests actual data flows
   - Validates SQL query performance
   - Catches real-world edge cases
   - Tests database triggers and functions

#### Disadvantages
1. **Test Performance**
   - Slower test execution due to real DB operations
   - Network latency (even if local)
   - Each test needs database cleanup
   - Longer CI/CD pipeline times

2. **Test Isolation Challenges**
   - Need to manage test data cleanup
   - Potential for test interference
   - Complex state management between tests
   - Transaction management overhead

3. **CI/CD Complexity**
   - Requires Supabase setup in CI environment
   - Potential for flaky tests due to timing
   - Additional infrastructure requirements

### Using Mocked Supabase

#### Advantages
1. **Performance**
   - Fast test execution (in-memory)
   - No network latency
   - No actual DB operations
   - Quick feedback loop during development

2. **Perfect Isolation**
   - Tests run independently
   - No state cleanup needed
   - Predictable test behavior
   - Easy to test edge cases

3. **Development Experience**
   - Can run tests without Supabase
   - No external service dependencies
   - Works offline
   - Faster test writing

#### Disadvantages
1. **Maintenance Overhead**
   - Must maintain mock implementations
   - Mocks can become outdated
   - Need to sync with schema changes
   - Complex query mocking

2. **Less Realistic**
   - May miss real database issues
   - Cannot test RLS policies
   - SQL query issues might be missed
   - No real performance testing

3. **Reliability Concerns**
   - Tests might pass but fail in production
   - Mock behavior might differ from real DB
   - False sense of security
   - Missing edge cases

## Our Hybrid Approach

We use a hybrid approach that leverages the strengths of both methods:

### 1. Unit Tests (Mocked Supabase)
Use mocked Supabase for:
- Component testing
- UI interaction testing
- Error handling
- Loading states

Example mock setup:
```typescript
// src/__tests__/__mocks__/supabase.ts
import { vi } from 'vitest'

export const mockSupabaseClient = {
  auth: {
    signInWithOAuth: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn()
  },
  from: (table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  })
}
```

Example component test:
```typescript
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import { mockSupabaseClient } from '../__mocks__/supabase'
import SubmissionForm from './SubmissionForm'

vi.mock('@/lib/supabase', () => ({
  createClient: () => mockSupabaseClient
}))

describe('SubmissionForm', () => {
  it('handles successful submission', async () => {
    mockSupabaseClient.from('submissions')
      .insert
      .mockResolvedValueOnce({ data: { id: 1 }, error: null })

    render(<SubmissionForm />)
    // Test form submission...
  })
})
```

### 2. Integration Tests (Real Supabase Local)
Use real Supabase local for:
- Critical user flows
- Data persistence
- RLS policy validation
- Complex queries

Example integration test:
```typescript
import { createClient } from '@/lib/supabase'
import { beforeEach, describe, it, expect } from 'vitest'

const supabase = createClient()

describe('Weekly submission flow', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('submissions').delete().neq('id', 0)
    await supabase.from('users').delete().neq('id', 0)
  })

  it('creates a new submission', async () => {
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        week_number: 1,
        hours: 40,
        notes: 'Test submission'
      })
      .select()

    expect(error).toBeNull()
    expect(data?.[0]).toMatchObject({
      week_number: 1,
      hours: 40,
      notes: 'Test submission'
    })
  })
})
```

## Best Practices

### 1. Test Data Management
- Use unique identifiers for test data
- Clean up data before/after tests
- Use transactions where possible
- Avoid test data collision

### 2. Mocking Guidelines
- Mock at the lowest possible level
- Keep mocks simple and focused
- Update mocks when schema changes
- Document mock behavior

### 3. Test Organization
- Separate unit and integration tests
- Group tests by feature/flow
- Clear naming conventions
- Consistent test structure

### 4. CI/CD Considerations
- Set up Supabase local in CI
- Use test database
- Parallel test execution
- Proper error handling

## Implementation Example

### Directory Structure
```plaintext
src/
├── __tests__/
│   ├── __mocks__/
│   │   └── supabase.ts      # Supabase mocks
│   ├── unit/
│   │   └── components/      # Component tests with mocks
│   └── integration/
│       └── flows/           # Integration tests with real DB
```

### Test Configuration
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globalSetup: './src/test/global-setup.ts', // Supabase setup
  }
})
```

## When to Use What

### Use Mocks For:
- UI component tests
- Error state testing
- Loading state testing
- Event handler testing
- Form validation
- Navigation testing

### Use Real Supabase For:
- Data persistence flows
- Authentication flows
- RLS policy validation
- Complex queries
- Database triggers
- Real-world scenarios

## Conclusion
This hybrid approach gives us:
- Fast and reliable unit tests
- Comprehensive integration testing
- Confidence in database operations
- Maintainable test suite
- Good developer experience

Remember to:
- Keep mocks up-to-date
- Clean up test data
- Document test patterns
- Review test coverage regularly 