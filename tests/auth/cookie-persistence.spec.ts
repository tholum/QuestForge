/**
 * Cookie Persistence Test Suite
 * 
 * Tests that authentication cookies are properly set, maintained,
 * and cleared during the authentication lifecycle.
 */
import { test, expect, Page } from '@playwright/test';
import { 
  loginUser, 
  logoutUser, 
  isUserAuthenticated, 
  clearAuthState,
  DEFAULT_TEST_CREDENTIALS 
} from '../helpers/auth';

test.describe('Authentication Cookie Persistence', () => {

  test.beforeEach(async ({ page }) => {
    // Start with clean state
    await clearAuthState(page);
  });

  test('login sets authentication cookies correctly', async ({ page }) => {
    console.log('Testing cookie creation during login...');
    
    // Verify no auth cookies initially
    let cookies = await page.context().cookies();
    const initialAuthCookies = cookies.filter(cookie => 
      cookie.name === 'accessToken' || cookie.name === 'refreshToken'
    );
    expect(initialAuthCookies.length).toBe(0);
    
    // Login
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Verify auth cookies are now set
    cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(cookie => cookie.name === 'accessToken');
    const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
    
    expect(accessTokenCookie).toBeTruthy();
    expect(refreshTokenCookie).toBeTruthy();
    
    // Verify cookie security settings
    expect(accessTokenCookie!.httpOnly).toBe(true);
    expect(accessTokenCookie!.sameSite).toBe('Strict');
    expect(refreshTokenCookie!.httpOnly).toBe(true);
    expect(refreshTokenCookie!.sameSite).toBe('Strict');
    
    // Verify cookies have expiration
    expect(accessTokenCookie!.expires).toBeGreaterThan(Date.now() / 1000);
    expect(refreshTokenCookie!.expires).toBeGreaterThan(Date.now() / 1000);
    
    console.log('✅ Cookie creation test passed');
  });

  test('cookies persist across page navigations', async ({ page }) => {
    console.log('Testing cookie persistence across navigation...');
    
    // Login and get initial cookies
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    const initialCookies = await page.context().cookies();
    const initialAccessToken = initialCookies.find(c => c.name === 'accessToken')?.value;
    
    expect(initialAccessToken).toBeTruthy();
    
    // Navigate to different pages
    const testPages = ['/dashboard', '/goals', '/progress', '/settings'];
    
    for (const testPage of testPages) {
      await page.goto(testPage);
      await page.waitForLoadState('networkidle');
      
      // Verify cookies are still present
      const currentCookies = await page.context().cookies();
      const currentAccessToken = currentCookies.find(c => c.name === 'accessToken')?.value;
      
      expect(currentAccessToken).toBe(initialAccessToken);
      expect(await isUserAuthenticated(page)).toBe(true);
    }
    
    console.log('✅ Cookie persistence navigation test passed');
  });

  test('cookies persist across page reloads', async ({ page }) => {
    console.log('Testing cookie persistence across reloads...');
    
    // Login and get initial cookies
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    const initialCookies = await page.context().cookies();
    const initialAccessToken = initialCookies.find(c => c.name === 'accessToken')?.value;
    
    expect(initialAccessToken).toBeTruthy();
    
    // Reload the page multiple times
    for (let i = 0; i < 3; i++) {
      console.log(`Reload attempt ${i + 1}`);
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify cookies are still present and authentication works
      const currentCookies = await page.context().cookies();
      const currentAccessToken = currentCookies.find(c => c.name === 'accessToken')?.value;
      
      expect(currentAccessToken).toBe(initialAccessToken);
      expect(await isUserAuthenticated(page)).toBe(true);
    }
    
    console.log('✅ Cookie persistence reload test passed');
  });

  test('logout properly clears authentication cookies', async ({ page }) => {
    console.log('Testing cookie clearance on logout...');
    
    // Login first
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Verify cookies are set
    let cookies = await page.context().cookies();
    let accessTokenCookie = cookies.find(cookie => cookie.name === 'accessToken');
    let refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
    
    expect(accessTokenCookie).toBeTruthy();
    expect(refreshTokenCookie).toBeTruthy();
    
    // Logout
    await logoutUser(page);
    
    // Verify cookies are cleared or expired
    cookies = await page.context().cookies();
    accessTokenCookie = cookies.find(cookie => cookie.name === 'accessToken');
    refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
    
    // Cookies should either be absent or have expired values
    if (accessTokenCookie) {
      expect(accessTokenCookie.expires).toBeLessThanOrEqual(Date.now() / 1000);
    }
    if (refreshTokenCookie) {
      expect(refreshTokenCookie.expires).toBeLessThanOrEqual(Date.now() / 1000);
    }
    
    // Verify authentication is actually cleared
    expect(await isUserAuthenticated(page)).toBe(false);
    
    console.log('✅ Cookie clearance test passed');
  });

  test('API requests include authentication cookies', async ({ page }) => {
    console.log('Testing API requests with authentication cookies...');
    
    // Login first
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Make direct API request and verify it includes cookies
    const apiResponse = await page.request.get('/api/v1/auth/me');
    expect(apiResponse.ok()).toBe(true);
    
    const apiData = await apiResponse.json();
    expect(apiData.success).toBe(true);
    expect(apiData.data.user).toBeTruthy();
    expect(apiData.data.user.email).toBe(DEFAULT_TEST_CREDENTIALS.email);
    
    console.log('✅ API cookie inclusion test passed');
  });

  test('expired cookies result in authentication failure', async ({ page, context }) => {
    console.log('Testing expired cookie handling...');
    
    // Login first to establish valid session
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    expect(await isUserAuthenticated(page)).toBe(true);
    
    // Manually set expired cookies
    await context.addCookies([
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
    
    // Now authentication should fail
    expect(await isUserAuthenticated(page)).toBe(false);
    
    // Try to access protected resource
    const apiResponse = await page.request.get('/api/v1/auth/me');
    expect(apiResponse.ok()).toBe(false);
    expect(apiResponse.status()).toBe(401);
    
    console.log('✅ Expired cookie handling test passed');
  });

  test('cookies are scoped correctly (path and domain)', async ({ page }) => {
    console.log('Testing cookie scope and security...');
    
    // Login to set cookies
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Get auth cookies
    const cookies = await page.context().cookies();
    const accessTokenCookie = cookies.find(cookie => cookie.name === 'accessToken');
    const refreshTokenCookie = cookies.find(cookie => cookie.name === 'refreshToken');
    
    expect(accessTokenCookie).toBeTruthy();
    expect(refreshTokenCookie).toBeTruthy();
    
    // Verify cookie scope settings
    expect(accessTokenCookie!.domain).toMatch(/localhost/);
    expect(accessTokenCookie!.path).toBe('/');
    expect(refreshTokenCookie!.domain).toMatch(/localhost/);
    expect(refreshTokenCookie!.path).toBe('/');
    
    // Verify security settings
    expect(accessTokenCookie!.httpOnly).toBe(true);
    expect(accessTokenCookie!.sameSite).toBe('Strict');
    expect(refreshTokenCookie!.httpOnly).toBe(true);
    expect(refreshTokenCookie!.sameSite).toBe('Strict');
    
    // In development, secure should be false (HTTP), in production it should be true (HTTPS)
    expect(accessTokenCookie!.secure).toBe(false); // Development setting
    expect(refreshTokenCookie!.secure).toBe(false); // Development setting
    
    console.log('✅ Cookie scope and security test passed');
  });

  test('cookies are not accessible via JavaScript (HttpOnly)', async ({ page }) => {
    console.log('Testing HttpOnly cookie protection...');
    
    // Login to set cookies
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Try to access cookies via JavaScript
    const cookieAccessResults = await page.evaluate(() => {
      // Attempt to read cookies via document.cookie
      const documentCookies = document.cookie;
      
      return {
        documentCookie: documentCookies,
        hasAccessToken: documentCookies.includes('accessToken'),
        hasRefreshToken: documentCookies.includes('refreshToken')
      };
    });
    
    // HttpOnly cookies should not be accessible via JavaScript
    expect(cookieAccessResults.hasAccessToken).toBe(false);
    expect(cookieAccessResults.hasRefreshToken).toBe(false);
    
    // But authentication should still work via the browser's automatic cookie handling
    expect(await isUserAuthenticated(page)).toBe(true);
    
    console.log('✅ HttpOnly cookie protection test passed');
  });
});