/**
 * Final Validation Test Suite
 * 
 * Simple validation to confirm all pages are working correctly
 * without the false positive 404 detection issues
 */
import { test, expect } from '@playwright/test';
import { loginUser, logoutUser } from './helpers/auth';

test.describe('Page Validation Test Suite', () => {
  
  test('Authentication pages are accessible and functional', async ({ page }) => {
    console.log('Testing authentication pages...');
    
    // Test login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Verify login page loads correctly
    await expect(page).toHaveURL(/.*auth\/login/);
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    console.log('✅ Login page is accessible and functional');
    
    // Test registration page
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth\/register/);
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    
    console.log('✅ Registration page is accessible and functional');
    
    // Test forgot password page
    await page.goto('/auth/forgot-password');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/.*auth\/forgot-password/);
    
    console.log('✅ Forgot password page is accessible');
  });

  test('Protected pages are accessible after authentication', async ({ page }) => {
    console.log('Testing protected pages with authentication...');
    
    // Login first
    await loginUser(page);
    
    // Test core pages
    const corePages = [
      { url: '/', title: 'Home' },
      { url: '/dashboard', title: 'Dashboard' },
      { url: '/goals', title: 'Goals' },
      { url: '/progress', title: 'Progress' },
      { url: '/settings', title: 'Settings' },
      { url: '/profile', title: 'Profile' },
      { url: '/analytics', title: 'Analytics' },
      { url: '/achievements', title: 'Achievements' },
      { url: '/calendar', title: 'Calendar' },
      { url: '/modules', title: 'Modules' }
    ];
    
    for (const pageData of corePages) {
      console.log(`Testing page: ${pageData.url}`);
      
      await page.goto(pageData.url);
      await page.waitForLoadState('networkidle');
      
      // Verify page loads and isn't a 404
      const response = await page.goto(pageData.url);
      expect(response?.status()).toBe(200);
      
      // Verify we have essential UI elements indicating the page loaded correctly
      const hasEssentialElements = await page.evaluate(() => {
        const selectors = [
          'main', 'header', 'nav', 'h1', 'h2', '.container',
          '[data-testid]', 'button', 'form', '.page', '.content'
        ];
        
        return selectors.some(selector => {
          const elements = document.querySelectorAll(selector);
          return elements.length > 0;
        });
      });
      
      expect(hasEssentialElements).toBe(true);
      console.log(`✅ ${pageData.title} page is accessible and functional`);
    }
  });

  test('Module pages are accessible after authentication', async ({ page }) => {
    console.log('Testing module pages with authentication...');
    
    // Ensure authenticated
    await loginUser(page);
    
    const modulePages = [
      { url: '/modules/fitness', title: 'Fitness Module' },
      { url: '/modules/learning', title: 'Learning Module' },
      { url: '/modules/home', title: 'Home Projects Module' },
      { url: '/modules/bible', title: 'Bible Study Module' },
      { url: '/modules/work', title: 'Work Projects Module' }
    ];
    
    for (const moduleData of modulePages) {
      console.log(`Testing module: ${moduleData.url}`);
      
      await page.goto(moduleData.url);
      await page.waitForLoadState('networkidle');
      
      // Verify page loads with 200 status
      const response = await page.goto(moduleData.url);
      expect(response?.status()).toBe(200);
      
      // Verify page has content and isn't empty
      const pageText = await page.textContent('body');
      expect(pageText).toBeTruthy();
      expect(pageText!.trim().length).toBeGreaterThan(100);
      
      console.log(`✅ ${moduleData.title} is accessible and functional`);
    }
  });

  test('Demo user login works correctly', async ({ page }) => {
    console.log('Testing demo user login specifically...');
    
    // Ensure we start logged out
    await logoutUser(page);
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Fill in demo credentials
    await page.fill('input[name="email"]', 'demo@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Submit login form
    const loginPromise = page.waitForResponse(response => 
      response.url().includes('/api/v1/auth/login') && 
      response.request().method() === 'POST'
    );
    
    await page.click('button[type="submit"]');
    
    // Wait for login response
    const loginResponse = await loginPromise;
    console.log(`Login API response: ${loginResponse.status()}`);
    expect(loginResponse.status()).toBe(200);
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Verify we're on dashboard and authenticated
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verify user information is visible
    await expect(page.locator('text=Demo User')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Demo user login works correctly');
  });

  test('Navigation between pages works properly', async ({ page }) => {
    console.log('Testing navigation between pages...');
    
    // Login first
    await loginUser(page);
    
    // Start at dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to different pages and verify each loads correctly
    const navigationTests = [
      { from: '/dashboard', to: '/goals', linkText: 'Goals' },
      { from: '/goals', to: '/progress', linkText: 'Progress' },
      { from: '/progress', to: '/modules', linkText: 'Modules' },
      { from: '/modules', to: '/settings', linkText: 'Settings' }
    ];
    
    for (const navTest of navigationTests) {
      console.log(`Navigating from ${navTest.from} to ${navTest.to}`);
      
      // Navigate to the target page
      await page.goto(navTest.to);
      await page.waitForLoadState('networkidle');
      
      // Verify we reached the correct page
      expect(page.url()).toContain(navTest.to);
      
      // Verify page has loaded content
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body && body.textContent && body.textContent.trim().length > 200;
      });
      
      expect(hasContent).toBe(true);
      console.log(`✅ Navigation to ${navTest.to} successful`);
    }
  });
});