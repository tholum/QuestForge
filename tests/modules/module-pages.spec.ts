/**
 * Module Pages E2E Tests
 * 
 * Tests that all module pages load properly with content and don't get stuck in loading states.
 * This addresses the authentication circular dependency issues identified in the PRP.
 */
import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from '../helpers/auth';

test.describe('Module Pages Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure authentication before each test using cached state
    await ensureAuthenticated(page);
  });

  const modules = [
    { name: 'fitness', title: 'Fitness Tracker' },
    { name: 'learning', title: 'Learning' }, // Could be "Learning Center" or "Learning Tracker"
    { name: 'home', title: 'Home Projects' },
    { name: 'bible', title: 'Bible Study' }, // Could be "Bible Study Center"
    { name: 'work', title: 'Work' } // Could be "Work Management Center"
  ];
  
  for (const module of modules) {
    test(`${module.name} module page loads properly`, async ({ page }) => {
      console.log(`Testing ${module.name} module page...`);
      
      // Navigate to the module page
      await page.goto(`/modules/${module.name}`);
      
      // Wait for the page to load and stabilize
      await page.waitForLoadState('networkidle');
      
      // Wait for module content to load (not just "Loading...")
      await page.waitForSelector('[data-testid="module-content"]', { 
        timeout: 15000 
      });
      
      // Verify the loading state is gone
      await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 5000 });
      
      // Verify module-specific content is present
      await expect(page.locator('[data-testid="module-title"]')).toBeVisible();
      
      // Verify we can see the module title (flexible matching)
      const moduleTitle = page.locator('[data-testid="module-title"]');
      await expect(moduleTitle).toContainText(module.title, { ignoreCase: true });
      
      // Verify we're not showing an error page or empty state
      await expect(page.locator('[data-testid="module-content"]')).toBeVisible();
      
      // Verify page URL is correct
      expect(page.url()).toContain(`/modules/${module.name}`);
      
      console.log(`✅ ${module.name} module page loaded successfully`);
    });
  }

  test('module pages do not cause authentication loops', async ({ page }) => {
    console.log('Testing that module pages do not cause authentication loops...');
    
    let authApiCalls = 0;
    
    // Monitor authentication API calls
    page.route('/api/v1/auth/me', async (route) => {
      authApiCalls++;
      const response = await page.request.fetch(route.request());
      await route.fulfill({ response });
    });
    
    // Navigate to fitness module
    await page.goto('/modules/fitness');
    await page.waitForLoadState('networkidle');
    
    // Wait a few seconds to see if there are excessive auth calls
    await page.waitForTimeout(5000);
    
    // We should see a reasonable number of auth calls (not infinite)
    console.log(`Total auth API calls: ${authApiCalls}`);
    expect(authApiCalls).toBeLessThan(10); // Should not be making excessive auth calls
    
    // Verify the page loaded properly
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible();
    
    console.log('✅ No authentication loops detected');
  });

  test('module pages are accessible after authentication without infinite redirects', async ({ page }) => {
    console.log('Testing module page accessibility after authentication...');
    
    let redirectCount = 0;
    
    // Monitor redirects
    page.on('response', (response) => {
      if ([301, 302, 307, 308].includes(response.status())) {
        redirectCount++;
        console.log(`Redirect ${redirectCount}: ${response.status()} to ${response.headers().location}`);
      }
    });
    
    // Navigate to work module
    await page.goto('/modules/work');
    await page.waitForLoadState('networkidle');
    
    // Should not have excessive redirects
    expect(redirectCount).toBeLessThan(5);
    
    // Verify we ended up on the right page
    expect(page.url()).toContain('/modules/work');
    
    // Verify content loaded
    await expect(page.locator('[data-testid="module-content"]')).toBeVisible();
    
    console.log(`✅ Module page accessible with ${redirectCount} redirects`);
  });

  test('all module pages can be navigated between without issues', async ({ page }) => {
    console.log('Testing navigation between all module pages...');
    
    for (const module of modules) {
      console.log(`Navigating to ${module.name}...`);
      
      await page.goto(`/modules/${module.name}`);
      await page.waitForLoadState('networkidle');
      
      // Verify each page loads
      await expect(page.locator('[data-testid="module-content"]')).toBeVisible();
      await expect(page.getByText('Loading...')).not.toBeVisible();
      
      // Small delay to ensure stability
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ All module pages navigable');
  });
});