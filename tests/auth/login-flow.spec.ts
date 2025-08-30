/**
 * Comprehensive Login Flow Test Suite
 * 
 * Tests the complete authentication flow including login, logout,
 * session persistence, and error handling.
 */
import { test, expect, Page } from '@playwright/test';
import { 
  loginUser, 
  logoutUser, 
  isUserAuthenticated, 
  getCurrentUser, 
  clearAuthState,
  testAuthenticationFlow,
  DEFAULT_TEST_CREDENTIALS,
  LoginCredentials 
} from '../helpers/auth';

test.describe('Authentication Login Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Start each test with a clean authentication state
    await clearAuthState(page);
  });

  test('successful login with valid credentials', async ({ page }) => {
    console.log('Testing successful login flow...');
    
    // Verify we start unauthenticated
    expect(await isUserAuthenticated(page)).toBe(false);
    
    // Perform login
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Verify authentication state
    expect(await isUserAuthenticated(page)).toBe(true);
    
    // Verify we're on the dashboard
    expect(page.url()).toMatch(/.*dashboard/);
    
    // Verify user data is accessible
    const user = await getCurrentUser(page);
    expect(user).toBeTruthy();
    expect(user.email).toBe(DEFAULT_TEST_CREDENTIALS.email);
    
    console.log('✅ Successful login test passed');
  });

  test('login with invalid credentials fails appropriately', async ({ page }) => {
    console.log('Testing login failure with invalid credentials...');
    
    const invalidCredentials: LoginCredentials = {
      email: 'invalid@example.com',
      password: 'wrongpassword'
    };
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Fill form with invalid credentials
    await page.fill('input[name="email"]', invalidCredentials.email);
    await page.fill('input[name="password"]', invalidCredentials.password);
    
    // Set up to catch the failed login response
    const loginPromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/auth/login')
    );
    
    await page.click('button[type="submit"]');
    
    // Wait for the response
    const loginResponse = await loginPromise;
    expect(loginResponse.status()).toBe(401);
    
    // Verify we're still unauthenticated
    expect(await isUserAuthenticated(page)).toBe(false);
    
    // Verify we're still on the login page or error was shown
    const currentUrl = page.url();
    expect(currentUrl.includes('/auth/login')).toBe(true);
    
    console.log('✅ Invalid credentials test passed');
  });

  test('authentication state persists across page navigation', async ({ page }) => {
    console.log('Testing authentication persistence...');
    
    // Login first
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    expect(await isUserAuthenticated(page)).toBe(true);
    
    // Navigate to different pages and verify auth persists
    const testPages = ['/goals', '/progress', '/settings', '/dashboard'];
    
    for (const testPage of testPages) {
      console.log(`Testing navigation to: ${testPage}`);
      
      await page.goto(testPage);
      await page.waitForLoadState('networkidle');
      
      // Verify authentication is maintained
      expect(await isUserAuthenticated(page)).toBe(true);
      
      // Verify the user data is still accessible
      const user = await getCurrentUser(page);
      expect(user).toBeTruthy();
      expect(user.email).toBe(DEFAULT_TEST_CREDENTIALS.email);
    }
    
    console.log('✅ Authentication persistence test passed');
  });

  test('logout clears authentication state properly', async ({ page }) => {
    console.log('Testing logout functionality...');
    
    // Login first
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    expect(await isUserAuthenticated(page)).toBe(true);
    
    // Perform logout
    await logoutUser(page);
    
    // Verify authentication is cleared
    expect(await isUserAuthenticated(page)).toBe(false);
    
    // Verify user data is no longer accessible
    const user = await getCurrentUser(page);
    expect(user).toBeNull();
    
    // Verify we're on the login page
    expect(page.url()).toMatch(/.*auth\/login/);
    
    console.log('✅ Logout test passed');
  });

  test('protected pages redirect to login when unauthenticated', async ({ page }) => {
    console.log('Testing protected route redirection...');
    
    // Ensure we're not authenticated
    await clearAuthState(page);
    expect(await isUserAuthenticated(page)).toBe(false);
    
    const protectedPages = ['/dashboard', '/goals', '/progress', '/settings'];
    
    for (const protectedPage of protectedPages) {
      console.log(`Testing protected page: ${protectedPage}`);
      
      await page.goto(protectedPage);
      await page.waitForLoadState('networkidle');
      
      // Should redirect to login or show login form
      const currentUrl = page.url();
      const isOnLoginPage = currentUrl.includes('/auth/login') || currentUrl.includes('/login');
      
      if (!isOnLoginPage) {
        // If not redirected, check if there's a login form on the current page
        const hasLoginForm = await page.$('input[name="email"]') !== null;
        expect(hasLoginForm).toBe(true);
      } else {
        expect(isOnLoginPage).toBe(true);
      }
      
      // Verify we're still not authenticated
      expect(await isUserAuthenticated(page)).toBe(false);
    }
    
    console.log('✅ Protected route redirection test passed');
  });

  test('session persistence across browser refresh', async ({ page }) => {
    console.log('Testing session persistence across refresh...');
    
    // Login first
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    expect(await isUserAuthenticated(page)).toBe(true);
    
    // Get user info before refresh
    const userBeforeRefresh = await getCurrentUser(page);
    expect(userBeforeRefresh).toBeTruthy();
    
    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Verify authentication persists after refresh
    expect(await isUserAuthenticated(page)).toBe(true);
    
    // Verify user data is still accessible
    const userAfterRefresh = await getCurrentUser(page);
    expect(userAfterRefresh).toBeTruthy();
    expect(userAfterRefresh.email).toBe(userBeforeRefresh.email);
    expect(userAfterRefresh.id).toBe(userBeforeRefresh.id);
    
    console.log('✅ Session persistence test passed');
  });

  test('complete authentication flow test', async ({ page }) => {
    console.log('Running complete authentication flow test...');
    
    const flowTestResult = await testAuthenticationFlow(page, DEFAULT_TEST_CREDENTIALS);
    expect(flowTestResult).toBe(true);
    
    console.log('✅ Complete authentication flow test passed');
  });

  test('multiple login attempts with same credentials', async ({ page }) => {
    console.log('Testing multiple login attempts...');
    
    // First login
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    expect(await isUserAuthenticated(page)).toBe(true);
    
    // Try to login again (should not cause issues)
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    expect(await isUserAuthenticated(page)).toBe(true);
    
    // Verify we're still properly authenticated
    const user = await getCurrentUser(page);
    expect(user).toBeTruthy();
    expect(user.email).toBe(DEFAULT_TEST_CREDENTIALS.email);
    
    console.log('✅ Multiple login attempts test passed');
  });
});