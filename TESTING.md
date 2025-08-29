# Testing Guide

This document outlines the comprehensive testing setup for the Goal Assistant project using Vitest, React Testing Library, and MSW.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Patterns](#test-patterns)
- [Coverage](#coverage)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## Overview

Our testing setup follows Test-Driven Development (TDD) principles and aims for >80% code coverage. We use multiple testing strategies:

- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interactions and API flows
- **API Tests**: Backend route handlers
- **Database Tests**: Prisma operations
- **Storybook Tests**: Visual component testing

## Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast unit test framework
- **React Testing**: [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **DOM Environment**: [jsdom](https://github.com/jsdom/jsdom)
- **API Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/)
- **Coverage**: [V8 Coverage](https://vitest.dev/guide/coverage.html)
- **Test Utils**: Custom render functions and test utilities

## Project Structure

```
src/
├── test/                           # Test configuration and utilities
│   ├── setup.ts                    # Global test setup
│   ├── api-setup.ts               # API test setup
│   ├── db-setup.ts                # Database test setup
│   ├── utils.tsx                  # Custom render functions and utilities
│   └── mocks/                     # MSW mock handlers
│       ├── handlers.ts            # API mock handlers
│       ├── server.ts              # Server setup for Node.js
│       └── browser.ts             # Browser setup for development
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx        # Component tests
├── lib/
│   ├── utils.test.ts              # Utility function tests
│   └── prisma/
│       └── client.test.ts         # Database tests
├── app/api/
│   └── v1/users/
│       ├── route.ts
│       └── route.test.ts          # API route tests
├── hooks/
│   ├── useLocalStorage.ts
│   └── useLocalStorage.test.ts    # Custom hook tests
└── test/integration/              # Integration tests
    └── user-management.test.tsx
```

## Running Tests

### Available Scripts

```bash
# Run all tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test projects
npm run test:unit      # Unit and component tests
npm run test:api       # API route tests
npm run test:db        # Database tests
npm run test:storybook # Storybook tests

# CI/CD optimized run
npm run test:ci

# Run tests for changed files only
npm run test:changed

# Debug tests
npm run test:debug
```

### Test Projects

Our Vitest configuration includes multiple projects:

1. **unit**: Component and utility tests (jsdom environment)
2. **api**: API route tests (Node.js environment)
3. **db**: Database/Prisma tests (Node.js environment)
4. **storybook**: Visual component tests (browser environment)

## Writing Tests

### File Naming Conventions

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.tsx`
- API tests: `route.test.ts`
- Component tests: `ComponentName.test.tsx`

### Test Structure

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';

describe('ComponentName', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should render correctly', () => {
    // Test implementation
  });

  describe('when in loading state', () => {
    it('should show loading indicator', () => {
      // Nested test
    });
  });
});
```

## Test Patterns

### 1. Component Testing

```typescript
import { render, screen } from '@/test/utils';
import { Button } from './button';

describe('Button', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. API Route Testing

```typescript
import { GET, POST } from './route';

describe('/api/v1/users', () => {
  it('should return users', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: expect.any(String) })
    ]));
  });
});
```

### 3. Custom Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

describe('useLocalStorage', () => {
  it('should store and retrieve values', () => {
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'initial')
    );

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
  });
});
```

### 4. Database Testing

```typescript
import { prisma } from '@/test/db-setup';

describe('User operations', () => {
  it('should create a user', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com', name: 'Test User' }
    });

    expect(user).toMatchObject({
      id: expect.any(String),
      email: 'test@example.com',
      name: 'Test User'
    });
  });
});
```

### 5. Integration Testing

```typescript
import { render, screen, waitFor } from '@/test/utils';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('User Management Integration', () => {
  it('should handle full user lifecycle', async () => {
    const { user } = render(<UserManagement />);
    
    // Create user
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.click(screen.getByRole('button', { name: /create/i }));
    
    // Verify user appears
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

## Coverage

### Coverage Configuration

Coverage is configured to require 80% coverage across all metrics:

```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
```

### Running Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

### Coverage Exclusions

The following are excluded from coverage:

- Test files (`**/*.test.*`)
- Configuration files (`**/*.config.*`)
- Type definitions (`**/*.d.ts`)
- Storybook stories (`**/*.stories.*`)
- Build artifacts (`dist/**`, `.next/**`)

## Mock Service Worker (MSW)

### Setting Up Mocks

MSW handlers are defined in `/src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/users', () => {
    return HttpResponse.json([
      { id: '1', name: 'John Doe', email: 'john@example.com' }
    ]);
  }),
];
```

### Using Custom Handlers

```typescript
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

// Override default handler for a specific test
server.use(
  http.get('/api/v1/users', () => {
    return new HttpResponse(null, { status: 500 });
  })
);
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run db:generate
      - run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Test Commands for CI

```bash
# Run all tests with coverage and verbose output
npm run test:ci

# This is equivalent to:
vitest run --coverage --reporter=verbose
```

## Troubleshooting

### Common Issues

1. **Tests timeout**: Increase timeout in vitest config
2. **MSW not intercepting**: Ensure server is started in setup files
3. **DOM not available**: Use jsdom environment for component tests
4. **Prisma issues**: Check database setup in db-setup.ts

### Debugging Tests

```bash
# Debug with Chrome DevTools
npm run test:debug

# Run specific test file
npx vitest run src/components/button.test.tsx

# Run tests matching pattern
npx vitest run --grep "should handle click"
```

### Environment Variables

Test-specific environment variables can be set in test setup files:

```typescript
// src/test/setup.ts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain behavior
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Use MSW for API calls, mock heavy dependencies
4. **Test User Interactions**: Focus on user behavior, not implementation
5. **Accessibility Testing**: Include accessibility assertions
6. **Error Handling**: Test error scenarios and edge cases
7. **Async Testing**: Properly handle promises and async operations
8. **Cleanup**: Ensure tests don't affect each other

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)