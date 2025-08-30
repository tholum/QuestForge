# 404 Detection Test Suite

This comprehensive test suite automatically detects 404 issues throughout the Goal Assistant application by systematically navigating to all pages and checking for missing content or error states.

## Features

- **Comprehensive Page Coverage**: Tests all core pages, module pages, and authentication pages
- **Authentication Handling**: Properly logs in/out to test both public and protected routes
- **Detailed Reporting**: Generates JSON reports with detailed information about each page test
- **Screenshot Capture**: Takes screenshots of failed pages for debugging
- **Multiple Test Modes**: Individual category tests and comprehensive full-app test

## Test Coverage

### Core Application Pages
- `/` (Dashboard)
- `/goals`
- `/progress` 
- `/settings`
- `/profile`
- `/analytics`
- `/achievements`
- `/calendar`
- `/modules`

### Module Pages
- `/modules/fitness`
- `/modules/learning`
- `/modules/home`
- `/modules/bible`
- `/modules/work`

### Authentication Pages
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`

## How to Run

### Prerequisites

1. **Start the development server** in one terminal:
   ```bash
   npm run dev
   ```

2. **Ensure test data is seeded** (happens automatically, but you can run manually):
   ```bash
   npm run db:seed
   ```

### Running Tests

#### Run all E2E tests (including 404 detection):
```bash
npm run test:e2e
```

#### Run only the 404 detection test:
```bash
npm run test:e2e:404
```

#### Run with UI mode for debugging:
```bash
npm run test:e2e:ui
```

#### Run in headed mode (see browser):
```bash
npm run test:e2e:headed
```

#### Run with debug mode:
```bash
npm run test:e2e:debug
```

## Test Results

### Reports
Test results are saved in multiple formats:

1. **HTML Report**: `playwright-report/index.html`
   ```bash
   npm run test:e2e:report
   ```

2. **JSON Report**: `playwright-report.json`

3. **Detailed 404 Reports**: `test-results/404-reports/404-detection-{timestamp}.json`

### Screenshots
Failed pages are automatically screenshotted and saved to:
- `test-results/404-screenshots/`

## Understanding Test Results

### Success Criteria
A page is considered successful if:
- HTTP status is not 404
- Page content doesn't contain 404 error messages
- Page has essential UI elements (not completely empty)
- No navigation errors occur

### Failure Types

1. **HTTP 404**: Server returns 404 status code
2. **Content 404**: Page loads but contains 404 error messages
3. **Navigation Error**: Page fails to load due to network/server issues
4. **Empty Page**: Page loads but appears to be empty or minimal content

### Sample Report Structure
```json
{
  "testRun": {
    "timestamp": "2025-01-15T10:30:00.000Z",
    "totalPages": 19,
    "successfulPages": 17,
    "failedPages": 1,
    "notFoundPages": 1
  },
  "results": [
    {
      "url": "/goals",
      "status": "success",
      "httpStatus": 200,
      "hasContent": true
    },
    {
      "url": "/missing-page", 
      "status": "404",
      "httpStatus": 404,
      "errorMessage": "HTTP 404 status returned",
      "screenshot": "test-results/404-screenshots/missing-page.png"
    }
  ],
  "workingPages": ["/", "/goals", "/progress"],
  "pagesWithIssues": ["/missing-page"]
}
```

## Authentication

The tests use the demo account for authentication:
- **Email**: `demo@example.com`
- **Password**: `password123`

This account is automatically created by the test setup process.

## Troubleshooting

### Common Issues

1. **Server not running**: Make sure `npm run dev` is running
2. **Database issues**: Run `npm run db:generate && npm run db:push`
3. **Missing test data**: The global setup should handle this, but you can manually run `npm run db:seed`
4. **Port conflicts**: The tests expect the server on `http://localhost:3000`

### Debug Mode
Use the debug mode to step through tests:
```bash
npm run test:e2e:debug
```

### Headed Mode
See the browser while tests run:
```bash
npm run test:e2e:headed
```

## Customization

### Adding More Pages
To test additional pages, edit `tests/404-detection.spec.ts` and add URLs to the appropriate category in the `PAGE_CATEGORIES` object.

### Modifying Success Criteria
The success criteria can be adjusted in the `testPageFor404` function by modifying:
- HTTP status checks
- Content validation rules
- UI element detection logic

### Custom Authentication
To use different credentials, modify the `DEFAULT_TEST_CREDENTIALS` in `tests/helpers/auth.ts`.

## Integration with CI/CD

Add this to your CI pipeline:
```yaml
- name: Run 404 Detection Tests
  run: |
    npm run dev &
    sleep 10
    npm run test:e2e:404
    kill %1
```

## Maintenance

- **Regular Updates**: Update page lists when new routes are added
- **Screenshot Cleanup**: Periodically clean old screenshots from `test-results/404-screenshots/`
- **Report Archive**: Archive old reports from `test-results/404-reports/`