/**
 * Authentication API Endpoints Test Suite
 * 
 * Tests authentication API endpoints directly to ensure they
 * work correctly independent of the UI layer.
 */
import { test, expect, APIRequestContext } from '@playwright/test';
import { 
  loginUser, 
  clearAuthState, 
  DEFAULT_TEST_CREDENTIALS,
  LoginCredentials
} from '../helpers/auth';

test.describe('Authentication API Endpoints', () => {

  test('POST /api/v1/auth/login - successful login', async ({ request }) => {
    console.log('Testing login API endpoint...');
    
    const loginData = {
      email: DEFAULT_TEST_CREDENTIALS.email,
      password: DEFAULT_TEST_CREDENTIALS.password
    };
    
    const response = await request.post('/api/v1/auth/login', {
      data: loginData,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeTruthy();
    expect(responseData.data.user).toBeTruthy();
    expect(responseData.data.user.email).toBe(loginData.email);
    expect(responseData.data.message).toBe('Login successful');
    
    // Verify sensitive data is not included
    expect(responseData.data.user.password).toBeUndefined();
    
    // Verify response includes proper headers
    const setCookieHeaders = response.headers()['set-cookie'];
    expect(setCookieHeaders).toBeTruthy();
    
    console.log('✅ Login API endpoint test passed');
  });

  test('POST /api/v1/auth/login - invalid credentials', async ({ request }) => {
    console.log('Testing login API with invalid credentials...');
    
    const invalidCredentials: LoginCredentials = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    };
    
    const response = await request.post('/api/v1/auth/login', {
      data: invalidCredentials,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(401);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBeTruthy();
    expect(responseData.code).toBe('LOGIN_FAILED');
    
    console.log('✅ Invalid credentials API test passed');
  });

  test('POST /api/v1/auth/login - malformed request', async ({ request }) => {
    console.log('Testing login API with malformed request...');
    
    // Test with missing password
    let response = await request.post('/api/v1/auth/login', {
      data: { email: DEFAULT_TEST_CREDENTIALS.email },
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(400);
    
    let responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.code).toBe('VALIDATION_ERROR');
    
    // Test with invalid email format
    response = await request.post('/api/v1/auth/login', {
      data: { 
        email: 'invalid-email',
        password: DEFAULT_TEST_CREDENTIALS.password 
      },
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(400);
    
    responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.code).toBe('VALIDATION_ERROR');
    
    // Test with completely invalid JSON
    response = await request.post('/api/v1/auth/login', {
      data: 'invalid json string',
      headers: { 'Content-Type': 'application/json' }
    });
    
    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(400);
    
    responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.code).toBe('INVALID_JSON');
    
    console.log('✅ Malformed request API test passed');
  });

  test('GET /api/v1/auth/me - authenticated request', async ({ page, request }) => {
    console.log('Testing /me endpoint with authentication...');
    
    // Login via UI to establish session
    await clearAuthState(page);
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Now make API request (should include cookies automatically)
    const response = await page.request.get('/api/v1/auth/me');
    
    expect(response.ok()).toBe(true);
    expect(response.status()).toBe(200);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    expect(responseData.data).toBeTruthy();
    expect(responseData.data.user).toBeTruthy();
    expect(responseData.data.user.email).toBe(DEFAULT_TEST_CREDENTIALS.email);
    expect(responseData.data.user.id).toBeTruthy();
    
    // Verify sensitive data is not included
    expect(responseData.data.user.password).toBeUndefined();
    
    console.log('✅ Authenticated /me endpoint test passed');
  });

  test('GET /api/v1/auth/me - unauthenticated request', async ({ request }) => {
    console.log('Testing /me endpoint without authentication...');
    
    const response = await request.get('/api/v1/auth/me');
    
    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(401);
    
    const responseData = await response.json();
    expect(responseData.success).toBe(false);
    expect(responseData.error).toBe('Authentication required');
    expect(responseData.code).toBe('UNAUTHORIZED');
    
    console.log('✅ Unauthenticated /me endpoint test passed');
  });

  test('POST /api/v1/auth/logout - authenticated logout', async ({ page }) => {
    console.log('Testing logout API endpoint...');
    
    // Login first
    await clearAuthState(page);
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Verify we're authenticated
    let meResponse = await page.request.get('/api/v1/auth/me');
    expect(meResponse.ok()).toBe(true);
    
    // Logout via API
    const logoutResponse = await page.request.post('/api/v1/auth/logout');
    
    // Note: Some logout implementations return 200, others redirect
    const acceptableStatuses = [200, 302, 204];
    expect(acceptableStatuses).toContain(logoutResponse.status());
    
    // Verify we're no longer authenticated
    meResponse = await page.request.get('/api/v1/auth/me');
    expect(meResponse.ok()).toBe(false);
    expect(meResponse.status()).toBe(401);
    
    console.log('✅ Logout API endpoint test passed');
  });

  test('API rate limiting protection', async ({ request }) => {
    console.log('Testing API rate limiting...');
    
    const invalidCredentials = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };
    
    // Make multiple failed requests rapidly
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request.post('/api/v1/auth/login', {
          data: invalidCredentials,
          headers: { 'Content-Type': 'application/json' }
        })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // Should get 401 responses initially, then 429 (rate limited) responses
    let rateLimitedCount = 0;
    let unauthorizedCount = 0;
    
    responses.forEach(response => {
      if (response.status() === 429) {
        rateLimitedCount++;
      } else if (response.status() === 401) {
        unauthorizedCount++;
      }
    });
    
    // Should have at least some rate limited responses
    expect(rateLimitedCount).toBeGreaterThan(0);
    expect(unauthorizedCount).toBeGreaterThan(0);
    
    console.log(`Rate limiting test: ${rateLimitedCount} rate limited, ${unauthorizedCount} unauthorized`);
    console.log('✅ Rate limiting protection test passed');
  });

  test('CORS headers are present on auth endpoints', async ({ request }) => {
    console.log('Testing CORS headers on auth endpoints...');
    
    // Test OPTIONS request (preflight)
    const optionsResponse = await request.fetch('/api/v1/auth/login', {
      method: 'OPTIONS'
    });
    
    expect(optionsResponse.ok()).toBe(true);
    
    const corsHeaders = optionsResponse.headers();
    expect(corsHeaders['access-control-allow-credentials']).toBe('true');
    expect(corsHeaders['access-control-allow-methods']).toBeTruthy();
    expect(corsHeaders['access-control-allow-headers']).toBeTruthy();
    
    console.log('✅ CORS headers test passed');
  });

  test('invalid HTTP methods return proper errors', async ({ request }) => {
    console.log('Testing invalid HTTP methods...');
    
    // Test GET on login endpoint (should be POST only)
    const getResponse = await request.get('/api/v1/auth/login');
    expect(getResponse.status()).toBe(405); // Method Not Allowed
    
    const responseData = await getResponse.json();
    expect(responseData.success).toBe(false);
    expect(responseData.code).toBe('METHOD_NOT_ALLOWED');
    
    // Test POST on /me endpoint (should be GET only)
    const postResponse = await request.post('/api/v1/auth/me', {
      data: {},
      headers: { 'Content-Type': 'application/json' }
    });
    expect(postResponse.status()).toBe(405);
    
    console.log('✅ Invalid HTTP methods test passed');
  });

  test('security headers are present', async ({ request }) => {
    console.log('Testing security headers...');
    
    const response = await request.post('/api/v1/auth/login', {
      data: DEFAULT_TEST_CREDENTIALS,
      headers: { 'Content-Type': 'application/json' }
    });
    
    const headers = response.headers();
    
    // Common security headers that should be present
    const expectedSecurityHeaders = [
      'x-content-type-options',
      'x-frame-options', 
      'x-xss-protection',
      'referrer-policy'
    ];
    
    expectedSecurityHeaders.forEach(headerName => {
      expect(headers[headerName]).toBeTruthy();
    });
    
    console.log('✅ Security headers test passed');
  });
});