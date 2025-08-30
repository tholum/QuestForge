# E2E Testing Guide for Goal Assistant

## 🔍 404 Detection Test Suite

This comprehensive Playwright test suite automatically detects 404 issues throughout the Goal Assistant application. It systematically navigates to all pages and checks for missing content, broken routes, or error states.

## ⚡ Quick Start

### 1. Check if ready to test
```bash
npm run test:e2e:check
```

### 2. Run 404 detection tests
Choose one of these methods:

#### Method A: Automatic (Recommended)
```bash
npm run test:e2e:404:auto
```
This automatically starts the dev server, runs tests, and cleans up.

#### Method B: Manual
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests
npm run test:e2e:404
```

### 3. View results
```bash
npm run test:e2e:report
```

## 📁 Test Suite Structure

```
tests/
├── 404-detection.spec.ts           # Main test file
├── helpers/
│   └── auth.ts                     # Authentication utilities
├── setup/
│   └── seed-e2e-data.ts           # Test data seeding
├── global-setup.ts                 # Global test setup
├── run-404-detection.js            # Automated test runner
├── check-test-readiness.js         # Environment checker
├── 404-detection-README.md         # Detailed documentation
└── TESTING-GUIDE.md               # This file
```

## 🎯 What Gets Tested

### Core Application Pages (Protected)
- Dashboard (`/`)
- Goals (`/goals`)
- Progress (`/progress`)
- Settings (`/settings`) 
- Profile (`/profile`)
- Analytics (`/analytics`)
- Achievements (`/achievements`)
- Calendar (`/calendar`)
- Modules listing (`/modules`)

### Module Pages (Protected)
- Fitness (`/modules/fitness`)
- Learning (`/modules/learning`)
- Home Projects (`/modules/home`)
- Bible Study (`/modules/bible`)
- Work Projects (`/modules/work`)

### Authentication Pages (Public)
- Login (`/auth/login`)
- Register (`/auth/register`)
- Forgot Password (`/auth/forgot-password`)
- Reset Password (`/auth/reset-password`)

## 🔧 Test Features

### Authentication Handling
- Automatically logs in using demo credentials (`demo@example.com` / `password123`)
- Tests both public and protected routes appropriately
- Handles login/logout flows seamlessly

### 404 Detection Methods
1. **HTTP Status Check**: Verifies server doesn't return 404 status
2. **Content Analysis**: Scans page content for "404" or "not found" messages
3. **UI Element Validation**: Ensures pages have essential UI components
4. **Navigation Verification**: Confirms pages load without errors

### Reporting & Screenshots
- **Detailed JSON Reports**: Saved to `test-results/404-reports/`
- **HTML Reports**: Standard Playwright HTML reports
- **Failure Screenshots**: Automatic screenshots of failed pages
- **Console Logging**: Real-time test progress and results

## 📊 Understanding Results

### Success Indicators
✅ Page loads successfully  
✅ No 404 HTTP status  
✅ No 404 content in page body  
✅ Essential UI elements present  

### Failure Types
❌ **HTTP 404**: Server returns 404 status code  
❌ **Content 404**: Page contains 404 error messages  
❌ **Navigation Error**: Failed to load due to server/network issues  
❌ **Empty Page**: Page loads but has minimal/no content  

### Report Structure
```json
{
  "testRun": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "totalPages": 19,
    "successfulPages": 17,
    "failedPages": 1,
    "notFoundPages": 1
  },
  "workingPages": ["/", "/goals", "/progress"],
  "pagesWithIssues": ["/missing-page"]
}
```

## 🚀 Available Commands

| Command | Description |
|---------|-------------|
| `npm run test:e2e:check` | Check if environment is ready |
| `npm run test:e2e:404` | Run 404 tests (dev server must be running) |
| `npm run test:e2e:404:auto` | Automated test run with server management |
| `npm run test:e2e:ui` | Run tests with Playwright UI |
| `npm run test:e2e:headed` | Run tests in visible browser |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:report` | View HTML test report |

## 🔧 Configuration

### Environment Setup
The tests require:
- Development server running on `http://localhost:3000`
- SQLite database with seeded demo user
- Playwright browser drivers installed

### Authentication
Demo user credentials (auto-created):
- Email: `demo@example.com`
- Password: `password123`

### Browser Configuration
Tests run on:
- Chromium (default)
- Firefox
- WebKit (Safari)

## 🐛 Troubleshooting

### Common Issues

#### ❌ Server not running
```bash
# Solution: Start the dev server
npm run dev
```

#### ❌ Database issues
```bash
# Solution: Reset database
npm run db:generate
npm run db:push
npm run db:seed
```

#### ❌ Missing Playwright browsers
```bash
# Solution: Install browsers
npx playwright install
```

#### ❌ Port conflicts
The tests expect the server on port 3000. Change the port in:
- `playwright.config.ts` (baseURL)
- `tests/global-setup.ts` (warmup URL)

### Debug Workflow
1. Run readiness check: `npm run test:e2e:check`
2. If issues found, follow the suggested fixes
3. Use debug mode: `npm run test:e2e:debug`
4. Check screenshots in `test-results/404-screenshots/`

## 🎨 Customization

### Adding New Pages
Edit `tests/404-detection.spec.ts`:
```javascript
const PAGE_CATEGORIES = {
  corePages: [
    // Add new protected pages here
    '/new-page'
  ],
  authPages: [
    // Add new public pages here  
    '/auth/new-auth-page'
  ]
};
```

### Modifying Success Criteria
Edit the `testPageFor404` function to adjust:
- HTTP status checks
- Content validation rules
- UI element detection logic

### Custom Authentication
Modify credentials in `tests/helpers/auth.ts`:
```javascript
export const DEFAULT_TEST_CREDENTIALS = {
  email: 'your-test@example.com',
  password: 'your-password'
};
```

## 📈 Integration with CI/CD

### GitHub Actions Example
```yaml
name: 404 Detection Tests
on: [push, pull_request]

jobs:
  test-404:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Setup database
        run: |
          npm run db:generate
          npm run db:push
          npm run db:seed
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run 404 detection tests
        run: npm run test:e2e:404:auto
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: 404-test-results
          path: |
            test-results/
            playwright-report/
```

## 📝 Maintenance

### Regular Tasks
- **Update page lists** when new routes are added to the application
- **Clean old screenshots** from `test-results/404-screenshots/`
- **Archive old reports** from `test-results/404-reports/`
- **Review failed tests** and update success criteria as needed

### Performance Considerations
- Tests include small delays between page navigations to prevent server overload
- Use `workers: 1` in CI to avoid resource conflicts
- Consider running tests against staging environment for faster feedback

## 🆘 Support

For issues with the 404 detection tests:

1. **Check the logs**: Console output shows detailed progress and errors
2. **Review screenshots**: Failed pages are automatically screenshotted
3. **Examine reports**: JSON reports contain detailed failure information
4. **Use debug mode**: Step through tests with `npm run test:e2e:debug`

Remember: The goal is to catch missing pages and broken routes before users do! 🎯