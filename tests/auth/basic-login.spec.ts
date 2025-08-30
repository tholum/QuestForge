/**
 * Basic Login Test - Simple validation of core authentication functionality
 */
import { test, expect } from '@playwright/test';
import { 
  loginUser, 
  isUserAuthenticated, 
  DEFAULT_TEST_CREDENTIALS 
} from '../helpers/auth';

test.describe('Basic Authentication Test', () => {

  test('basic login functionality works', async ({ page }) => {
    console.log('Testing basic login...');
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on login page
    expect(page.url()).toMatch(/auth\/login/);
    
    // Check that we're not authenticated initially
    const initialAuth = await isUserAuthenticated(page);
    console.log(`Initial auth state: ${initialAuth}`);
    
    // Attempt login
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);
    
    // Check that we're now authenticated
    const finalAuth = await isUserAuthenticated(page);
    console.log(`Final auth state: ${finalAuth}`);
    expect(finalAuth).toBe(true);
    
    // Verify we're on dashboard
    expect(page.url()).toMatch(/dashboard/);
    
    console.log('✅ Basic login test passed');
  });

  test('direct API authentication check', async ({ request }) => {
    console.log('Testing API authentication directly...');
    
    // Test login endpoint
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: DEFAULT_TEST_CREDENTIALS,
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`Login API status: ${loginResponse.status()}`);
    expect(loginResponse.ok()).toBe(true);
    
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.data.user.email).toBe(DEFAULT_TEST_CREDENTIALS.email);
    
    console.log('✅ Direct API auth test passed');
  });
});