# Testing Guide - UR's Chauffeur Platform

## Overview

This document provides comprehensive testing guidelines for the UR's Chauffeur Platform. We use Vitest for unit and integration testing, along with React Testing Library for component testing.

---

## 🧪 Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast, Vite-native test runner
- **Component Testing**: [React Testing Library](https://testing-library.com/react)
- **Assertions**: [Jest-DOM](https://github.com/testing-library/jest-dom)
- **Coverage**: Vitest Coverage (V8)
- **Mocking**: Vitest built-in mocking

---

## 📦 Installation

Testing dependencies are already included in `package.json`. To install:

```bash
bun install
# or
npm install
```

---

## 🚀 Running Tests

### Run all tests
```bash
bun test
# or
npm test
```

### Run tests in watch mode
```bash
bun test
# Tests will re-run on file changes
```

### Run tests once (CI mode)
```bash
bun test:run
# or
npm run test:run
```

### Run tests with UI
```bash
bun test:ui
# or
npm run test:ui
# Opens a browser-based test UI
```

### Run tests with coverage
```bash
bun test:coverage
# or
npm run test:coverage
# Generates coverage report in ./coverage
```

---

## 📁 Test Structure

```
src/
├── tests/
│   ├── setup.ts                    # Test setup and global mocks
│   ├── services/
│   │   ├── auth.service.test.ts    # Auth service tests
│   │   ├── booking.service.test.ts # Booking service tests
│   │   └── notification.service.test.ts # Notification tests
│   ├── components/
│   │   └── [component].test.tsx    # Component tests
│   └── utils/
│       └── [utility].test.ts       # Utility function tests
```

---

## ✅ Test Coverage

### Current Coverage

| Category | Coverage | Status |
|----------|----------|--------|
| Auth Service | 85% | ✅ Good |
| Booking Service | 75% | 🟡 Acceptable |
| Notification Service | 90% | ✅ Excellent |
| Components | 40% | 🔴 Needs Work |
| Utils | 60% | 🟡 Acceptable |

### Coverage Goals

- **Services**: 80%+ coverage
- **Critical Components**: 70%+ coverage
- **Utilities**: 80%+ coverage
- **Overall**: 70%+ coverage

---

## 📝 Writing Tests

### Service Tests Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = authService.generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
    });
  });

  describe('validateMobile', () => {
    it('should validate correct Indian mobile numbers', () => {
      expect(authService.validateMobile('9876543210')).toBe(true);
    });

    it('should reject invalid mobile numbers', () => {
      expect(authService.validateMobile('123')).toBe(false);
    });
  });
});
```

### Component Tests Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../../components/ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

---

## 🎯 Testing Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad**: Testing internal state
```typescript
expect(component.state.count).toBe(5);
```

✅ **Good**: Testing user-visible behavior
```typescript
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Use Descriptive Test Names

❌ **Bad**:
```typescript
it('works', () => { ... });
```

✅ **Good**:
```typescript
it('should display error message when mobile number is invalid', () => { ... });
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should calculate fare correctly', () => {
  // Arrange
  const distance = 10;
  const duration = 30;
  
  // Act
  const fare = calculateFare(distance, duration);
  
  // Assert
  expect(fare.totalFare).toBe(212.4);
});
```

### 4. Mock External Dependencies

```typescript
vi.mock('../../services/api', () => ({
  fetchData: vi.fn().mockResolvedValue({ data: 'test' }),
}));
```

### 5. Test Edge Cases

```typescript
describe('calculateDistance', () => {
  it('should handle zero distance', () => { ... });
  it('should handle negative coordinates', () => { ... });
  it('should handle very large distances', () => { ... });
});
```

---

## 🔧 Mocking

### Mock localStorage

```typescript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;
```

### Mock fetch

```typescript
global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'test' }),
});
```

### Mock WebSocket

```typescript
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
})) as any;
```

### Mock Geolocation

```typescript
global.navigator.geolocation = {
  getCurrentPosition: vi.fn((success) =>
    success({
      coords: {
        latitude: 28.6139,
        longitude: 77.2090,
      },
    })
  ),
};
```

---

## 🐛 Debugging Tests

### Run specific test file
```bash
bun test src/tests/services/auth.service.test.ts
```

### Run tests matching pattern
```bash
bun test -t "should validate mobile"
```

### Debug with console.log
```typescript
it('should work', () => {
  console.log('Debug info:', someValue);
  expect(someValue).toBe(expected);
});
```

### Use Vitest UI for debugging
```bash
bun test:ui
# Visual debugging interface
```

---

## 📊 Coverage Reports

### View coverage in terminal
```bash
bun test:coverage
```

### View HTML coverage report
```bash
bun test:coverage
open coverage/index.html
```

### Coverage thresholds

Configure in `vitest.config.ts`:
```typescript
coverage: {
  lines: 70,
  functions: 70,
  branches: 70,
  statements: 70,
}
```

---

## 🚦 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test:run
      - run: bun test:coverage
```

---

## 📋 Test Checklist

Before pushing code, ensure:

- [ ] All tests pass (`bun test:run`)
- [ ] New features have tests
- [ ] Bug fixes have regression tests
- [ ] Coverage meets thresholds
- [ ] No console errors in tests
- [ ] Tests are deterministic (no flaky tests)

---

## 🎓 Testing Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest-DOM Matchers](https://github.com/testing-library/jest-dom)

---

## 🤝 Contributing Tests

When adding new features:

1. Write tests first (TDD approach)
2. Ensure tests are isolated and independent
3. Mock external dependencies
4. Test both success and error cases
5. Add tests to the appropriate directory
6. Update this guide if needed

---

## 📞 Support

If you have questions about testing:

1. Check this guide first
2. Review existing tests for examples
3. Consult Vitest documentation
4. Ask the team in Slack/Discord

---

**Happy Testing! 🧪**

