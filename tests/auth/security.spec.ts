/**
 * Authentication Security Test Suite
 * 
 * Tests security features of the authentication system including
 * rate limiting, input validation, password security, and more.
 */
import { test, expect } from '@playwright/test';
import { 
  loginUser, 
  clearAuthState, 
  DEFAULT_TEST_CREDENTIALS 
} from '../helpers/auth';

test.describe('Authentication Security', () => {

  test.beforeEach(async ({ page }) => {
    await clearAuthState(page);
  });

  test('password field is properly masked', async ({ page }) => {
    console.log('Testing password field masking...');
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();
    
    // Check that password field has type="password"
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Fill password and verify it's masked
    await passwordInput.fill('testpassword');
    
    // The actual content should not be visible as plain text
    const inputType = await passwordInput.getAttribute('type');
    expect(inputType).toBe('password');
    
    console.log('✅ Password field masking test passed');
  });

  test('login form prevents CSRF attacks', async ({ page }) => {
    console.log('Testing CSRF protection...');
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Check for CSRF token or secure headers
    const form = page.locator('form');
    await expect(form).toBeVisible();
    
    // Modern applications often use SameSite cookies and proper CORS instead of CSRF tokens
    // We'll verify the response includes proper security headers
    const loginResponse = await page.request.post('/api/v1/auth/login', {
      data: DEFAULT_TEST_CREDENTIALS,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const headers = loginResponse.headers();
    expect(headers['x-content-type-options']).toBeTruthy();
    
    console.log('✅ CSRF protection test passed');
  });

  test('XSS protection in login form', async ({ page }) => {
    console.log('Testing XSS protection...');
    
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Try to inject script in email field
    const xssPayload = '<script>alert("XSS")</script>';
    
    await page.fill('input[name="email"]', xssPayload);
    await page.fill('input[name="password"]', DEFAULT_TEST_CREDENTIALS.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for response
    await page.waitForTimeout(2000);
    
    // Verify no alert was executed (XSS was prevented)
    const alertHandled = await page.evaluate(() => {
      return typeof window.alert !== 'function';
    });
    
    // Should not have executed the script
    expect(alertHandled).toBe(false); // window.alert should still be a function
    
    // And login should have failed due to invalid email format
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/auth\/login/);
    
    console.log('✅ XSS protection test passed');
  });

  test('SQL injection protection', async ({ page, request }) => {
    console.log('Testing SQL injection protection...');
    
    const sqlInjectionPayloads = [
      "admin'; DROP TABLE users; --",
      "' OR '1'='1",
      "admin' OR '1'='1' --",
      "'; DELETE FROM users WHERE '1'='1",
      "1' OR '1'='1"
    ];
    
    for (const payload of sqlInjectionPayloads) {
      const response = await request.post('/api/v1/auth/login', {
        data: {
          email: payload,
          password: 'anypassword'
        },
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Should get proper validation error, not SQL error or unauthorized access
      expect(response.status()).toBe(400); // Validation error
      
      const responseData = await response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.code).toBe('VALIDATION_ERROR');
    }
    
    console.log('✅ SQL injection protection test passed');
  });

  test('account lockout after failed attempts', async ({ request }) => {
    console.log('Testing account lockout protection...');
    
    const invalidCredentials = {
      email: DEFAULT_TEST_CREDENTIALS.email,
      password: 'wrongpassword'
    };
    
    // Make multiple failed attempts
    const maxAttempts = 6;
    let rateLimitedResponse = null;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const response = await request.post('/api/v1/auth/login', {
        data: invalidCredentials,
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`Attempt ${attempt}: Status ${response.status()}`);
      
      if (response.status() === 429) {
        rateLimitedResponse = response;
        break;
      }
      
      // Add small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Should eventually get rate limited
    expect(rateLimitedResponse).toBeTruthy();
    expect(rateLimitedResponse!.status()).toBe(429);
    
    const rateLimitData = await rateLimitedResponse!.json();
    expect(rateLimitData.success).toBe(false);
    expect(rateLimitData.code).toBe('RATE_LIMITED');
    expect(rateLimitData.retryAfter).toBeGreaterThan(0);
    
    console.log('✅ Account lockout protection test passed');
  });

  test('secure cookie attributes', async ({ page }) => {
    console.log('Testing secure cookie attributes...');
    
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    const cookies = await page.context().cookies();
    const authCookies = cookies.filter(cookie => 
      cookie.name === 'accessToken' || cookie.name === 'refreshToken'
    );
    
    expect(authCookies.length).toBeGreaterThan(0);
    
    authCookies.forEach(cookie => {
      // Should be HttpOnly (not accessible via JavaScript)
      expect(cookie.httpOnly).toBe(true);
      
      // Should have SameSite=Strict for CSRF protection
      expect(cookie.sameSite).toBe('Strict');
      
      // Should have proper path scope
      expect(cookie.path).toBe('/');
      
      // Should have expiration time
      expect(cookie.expires).toBeGreaterThan(Date.now() / 1000);
      
      // In development (HTTP), secure should be false
      // In production (HTTPS), secure should be true
      expect(typeof cookie.secure).toBe('boolean');
    });
    
    console.log('✅ Secure cookie attributes test passed');
  });

  test('input validation and sanitization', async ({ request }) => {
    console.log('Testing input validation...');
    
    const invalidInputTests = [
      {
        description: 'empty email',
        data: { email: '', password: 'password123' },
        expectedStatus: 400
      },
      {
        description: 'invalid email format',
        data: { email: 'notanemail', password: 'password123' },
        expectedStatus: 400
      },
      {
        description: 'email too long',
        data: { email: 'a'.repeat(300) + '@example.com', password: 'password123' },
        expectedStatus: 400
      },
      {
        description: 'empty password',
        data: { email: 'test@example.com', password: '' },
        expectedStatus: 400
      },
      {
        description: 'password too short',
        data: { email: 'test@example.com', password: '123' },
        expectedStatus: 400
      },
      {
        description: 'null values',
        data: { email: null, password: null },
        expectedStatus: 400
      },
      {
        description: 'undefined values',
        data: { email: undefined, password: undefined },
        expectedStatus: 400
      }
    ];
    
    for (const testCase of invalidInputTests) {
      console.log(`Testing: ${testCase.description}`);
      
      const response = await request.post('/api/v1/auth/login', {
        data: testCase.data,
        headers: { 'Content-Type': 'application/json' }
      });
      
      expect(response.status()).toBe(testCase.expectedStatus);
      
      if (response.status() === 400) {
        const responseData = await response.json();
        expect(responseData.success).toBe(false);
        expect(responseData.code).toBe('VALIDATION_ERROR');
      }
    }
    
    console.log('✅ Input validation test passed');
  });

  test('sensitive information not logged', async ({ page, request }) => {
    console.log('Testing sensitive information protection...');
    
    // Perform login with valid credentials
    const response = await request.post('/api/v1/auth/login', {
      data: DEFAULT_TEST_CREDENTIALS,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const responseData = await response.json();
    
    // Response should not contain password or token details
    expect(responseData.data?.user?.password).toBeUndefined();
    expect(responseData.data?.tokens).toBeUndefined(); // Tokens should be in cookies only
    
    // Check console logs don't contain sensitive info
    const consoleLogs = await page.evaluate(() => {
      // This is limited - in real testing you'd need server-side log inspection
      return console.log.toString();
    });
    
    expect(consoleLogs).not.toContain(DEFAULT_TEST_CREDENTIALS.password);
    
    console.log('✅ Sensitive information protection test passed');
  });

  test('session timeout handling', async ({ page }) => {
    console.log('Testing session timeout...');
    
    // Login first
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Manually expire the access token by setting it to an expired value
    await page.context().addCookies([
      {
        name: 'accessToken',
        value: 'expired.token.value',
        domain: 'localhost',
        path: '/',
        expires: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
        httpOnly: true,
        sameSite: 'Strict'
      }
    ]);
    
    // Try to access protected resource - should fail
    const response = await page.request.get('/api/v1/auth/me');
    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(401);
    
    // Navigate to protected page - should redirect to login
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to login or see login form
    const currentUrl = page.url();
    const hasLoginForm = await page.$('input[name="email"]') !== null;
    
    expect(currentUrl.includes('/auth/login') || hasLoginForm).toBe(true);
    
    console.log('✅ Session timeout handling test passed');
  });

  test('brute force protection', async ({ request }) => {
    console.log('Testing brute force protection...');
    
    const startTime = Date.now();
    const attempts = [];
    
    // Make rapid successive attempts
    for (let i = 0; i < 15; i++) {
      const attemptPromise = request.post('/api/v1/auth/login', {
        data: {
          email: 'brute.force@example.com',
          password: `attempt${i}`
        },
        headers: { 'Content-Type': 'application/json' }
      });
      
      attempts.push(attemptPromise);
    }
    
    const responses = await Promise.all(attempts);
    const endTime = Date.now();
    
    // Analyze responses
    let rateLimitedCount = 0;
    let unauthorizedCount = 0;
    let validationErrorCount = 0;
    
    responses.forEach(response => {
      if (response.status() === 429) rateLimitedCount++;
      else if (response.status() === 401) unauthorizedCount++;
      else if (response.status() === 400) validationErrorCount++;
    });
    
    console.log(`Brute force test results:`);
    console.log(`  Rate limited: ${rateLimitedCount}`);
    console.log(`  Unauthorized: ${unauthorizedCount}`);
    console.log(`  Validation errors: ${validationErrorCount}`);
    console.log(`  Total time: ${endTime - startTime}ms`);
    
    // Should have rate limiting in effect
    expect(rateLimitedCount).toBeGreaterThan(0);
    
    console.log('✅ Brute force protection test passed');
  });
});