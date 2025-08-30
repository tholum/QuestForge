/**
 * Authentication helper utilities for Playwright tests
 */
import { Page, expect, BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

export interface LoginCredentials {
  email: string;
  password: string;
}

export const DEFAULT_TEST_CREDENTIALS: LoginCredentials = {
  email: 'demo@example.com',
  password: 'password123'
};

const AUTH_STATE_FILE = path.join(__dirname, '..', 'auth-state.json');

/**
 * Load authentication state from cached file
 */
export async function loadAuthState(context: BrowserContext): Promise<boolean> {
  try {
    if (!fs.existsSync(AUTH_STATE_FILE)) {
      console.log('No cached auth state found');
      return false;
    }

    // Load the stored state
    const authState = JSON.parse(fs.readFileSync(AUTH_STATE_FILE, 'utf-8'));
    
    // Apply cookies to context
    if (authState.cookies && authState.cookies.length > 0) {
      await context.addCookies(authState.cookies);
      console.log('Loaded cached authentication state');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('Failed to load auth state:', error);
    return false;
  }
}

/**
 * Check if cached auth state is still valid
 */
export async function isAuthStateValid(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/v1/auth/me');
    if (!response.ok()) {
      return false;
    }
    
    const data = await response.json();
    return !!(data.success && data.data?.user);
  } catch {
    return false;
  }
}

/**
 * Login to the application using the provided credentials
 * Enhanced with proper cookie handling and API verification
 */
export async function loginUser(page: Page, credentials: LoginCredentials = DEFAULT_TEST_CREDENTIALS): Promise<void> {
  console.log(`Attempting to login with email: ${credentials.email}`);
  
  // Check if already authenticated before proceeding
  if (await isUserAuthenticated(page)) {
    console.log('User is already authenticated');
    return;
  }
  
  // Navigate to login page
  await page.goto('/auth/login');
  await page.waitForLoadState('networkidle');
  
  // Check if redirected to dashboard (already logged in)
  if (page.url().includes('/dashboard')) {
    console.log('User was already logged in - redirected to dashboard');
    return;
  }
  
  // Wait for login form to be visible
  await page.waitForSelector('input[name="email"]', { timeout: 10000 });
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
  
  // Fill login form
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[name="password"]', credentials.password);
  
  // Set up response interceptor to catch the login API call
  const loginPromise = page.waitForResponse(response => 
    response.url().includes('/api/v1/auth/login') && 
    response.request().method() === 'POST'
  );
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for login API response
  const loginResponse = await loginPromise;
  console.log(`Login API response status: ${loginResponse.status()}`);
  
  if (!loginResponse.ok()) {
    const responseText = await loginResponse.text();
    throw new Error(`Login failed with status ${loginResponse.status()}: ${responseText}`);
  }
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 30000 });
  
  // Verify authentication state via API
  const authResponse = await page.request.get('/api/v1/auth/me');
  if (!authResponse.ok()) {
    const responseText = await authResponse.text();
    throw new Error(`Authentication verification failed: ${responseText}`);
  }
  
  const authData = await authResponse.json();
  if (!authData.success || !authData.data?.user) {
    throw new Error(`Invalid authentication response: ${JSON.stringify(authData)}`);
  }
  
  // Verify we're on the dashboard page
  await expect(page).toHaveURL(/.*dashboard/);
  
  console.log(`Login successful for user: ${authData.data.user.email}`);
}

/**
 * Logout from the application with enhanced error handling
 */
export async function logoutUser(page: Page): Promise<void> {
  console.log('Logging out user');
  
  try {
    // Check if already logged out
    if (!(await isUserAuthenticated(page))) {
      console.log('User is already logged out');
      return;
    }
    
    // Look for logout button/link in various locations
    const logoutSelectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign Out")',
      'a:has-text("Logout")',  
      'a:has-text("Sign Out")',
      '[data-testid="logout"]',
      '[data-testid="sign-out"]',
      '[data-cy="logout"]',
      'button[aria-label*="logout" i]',
      'button[title*="logout" i]'
    ];
    
    let logoutFound = false;
    
    // Try to find and click logout button
    for (const selector of logoutSelectors) {
      try {
        const element = await page.$(selector);
        if (element && await element.isVisible()) {
          await element.click();
          logoutFound = true;
          console.log(`Found logout button: ${selector}`);
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
    
    // If no logout button found, try direct API logout
    if (!logoutFound) {
      console.log('No logout button found, using API logout');
      const logoutResponse = await page.request.post('/api/v1/auth/logout');
      if (!logoutResponse.ok()) {
        console.log(`API logout failed with status: ${logoutResponse.status()}`);
      }
    }
    
    // Navigate to login page to ensure clean state
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Verify logout was successful
    const authResponse = await page.request.get('/api/v1/auth/me');
    if (authResponse.ok()) {
      console.log('Warning: User appears to still be authenticated after logout attempt');
    } else {
      console.log('Logout successful - user is no longer authenticated');
    }
    
  } catch (error) {
    console.log('Logout process encountered error:', error);
    
    // Force navigate to login page as fallback
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Check if user is currently authenticated by calling the /me endpoint
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get('/api/v1/auth/me');
    if (!response.ok()) {
      return false;
    }
    
    const data = await response.json();
    return !!(data.success && data.data?.user);
  } catch (error) {
    console.log('Authentication check failed:', error);
    return false;
  }
}

/**
 * Get current authenticated user information
 */
export async function getCurrentUser(page: Page): Promise<any | null> {
  try {
    const response = await page.request.get('/api/v1/auth/me');
    if (!response.ok()) {
      return null;
    }
    
    const data = await response.json();
    return data.success ? data.data.user : null;
  } catch (error) {
    console.log('Get current user failed:', error);
    return null;
  }
}

/**
 * Ensure user is logged in, login if not
 * Enhanced with cached auth state and better verification
 */
export async function ensureAuthenticated(page: Page, credentials: LoginCredentials = DEFAULT_TEST_CREDENTIALS): Promise<void> {
  console.log('Ensuring user is authenticated...');
  
  // First try to load cached authentication state
  const authLoaded = await loadAuthState(page.context());
  if (authLoaded) {
    // Verify cached auth is still valid
    if (await isAuthStateValid(page)) {
      console.log('Using cached authentication state');
      
      // Navigate to dashboard to ensure we're in the right place
      const currentUrl = page.url();
      if (currentUrl.includes('/auth/login') || currentUrl.endsWith('/') || currentUrl === 'about:blank') {
        console.log('Navigating to dashboard with cached auth...');
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      }
      return;
    } else {
      console.log('Cached auth state is invalid, proceeding with login...');
    }
  }
  
  // Fallback to regular authentication check and login
  const isAuthenticated = await isUserAuthenticated(page);
  if (!isAuthenticated) {
    console.log('User not authenticated, logging in...');
    await loginUser(page, credentials);
  } else {
    console.log('User is already authenticated');
    
    // Verify we're on a protected page, navigate to dashboard if needed
    const currentUrl = page.url();
    if (currentUrl.includes('/auth/login') || currentUrl.endsWith('/')) {
      console.log('Navigating to dashboard...');
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
    }
  }
}

/**
 * Clear authentication state (useful for test cleanup)
 */
export async function clearAuthState(page: Page): Promise<void> {
  console.log('Clearing authentication state...');
  
  try {
    // Clear cookies first
    await page.context().clearCookies();
    
    // Navigate to a page to ensure we have a valid context before clearing storage
    try {
      await page.goto('about:blank');
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      
      // Clear local storage and session storage
      await page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          // Storage might not be available in some contexts
          console.log('Could not clear storage:', e.message);
        }
      });
    } catch (storageError) {
      // If storage clearing fails, that's okay - cookies are the main auth mechanism
      console.log('Storage clearing failed, but continuing:', storageError.message);
    }
    
    console.log('Authentication state cleared');
  } catch (error) {
    console.log('Error clearing auth state:', error.message);
    // Don't throw - clearing auth state should be best-effort
  }
}

/**
 * Test authentication flow - useful for debugging
 */
export async function testAuthenticationFlow(page: Page, credentials: LoginCredentials = DEFAULT_TEST_CREDENTIALS): Promise<boolean> {
  console.log('Testing complete authentication flow...');
  
  try {
    // 1. Clear any existing auth state
    await clearAuthState(page);
    
    // 2. Verify we start unauthenticated
    const startAuthenticated = await isUserAuthenticated(page);
    if (startAuthenticated) {
      console.log('Warning: Started authenticated when expected to be logged out');
    }
    
    // 3. Perform login
    await loginUser(page, credentials);
    
    // 4. Verify authentication worked
    const endAuthenticated = await isUserAuthenticated(page);
    if (!endAuthenticated) {
      console.log('Error: Login appeared to succeed but user is not authenticated');
      return false;
    }
    
    // 5. Test navigation while authenticated
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const stillAuthenticated = await isUserAuthenticated(page);
    if (!stillAuthenticated) {
      console.log('Error: Authentication was lost during navigation');
      return false;
    }
    
    console.log('Authentication flow test passed');
    return true;
    
  } catch (error) {
    console.log('Authentication flow test failed:', error);
    return false;
  }
}