/**
 * Module Validation Test
 * 
 * Simple validation test to confirm module authentication fixes are working.
 * This test verifies that modules load content without infinite authentication loops.
 */
import { test, expect } from '@playwright/test';

test.describe('Module Authentication Fix Validation', () => {
  test('fitness module loads without authentication infinite loops', async ({ page }) => {
    console.log('Testing fitness module loading...');
    
    // Navigate directly to fitness module
    await page.goto('/modules/fitness');
    
    // Wait for page to load and stabilize
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any authentication redirects to complete
    await page.waitForTimeout(2000);
    
    // Check that we're not stuck in a loading state
    const pageContent = await page.content();
    
    // We should see actual fitness content, not just generic loading or auth errors
    expect(pageContent).toContain('Fitness'); // Module title should be present
    expect(pageContent).not.toContain('This page could not be found'); // No 404 error
    
    // Verify the page isn't stuck with authentication errors
    const currentUrl = page.url();
    console.log(`Final URL: ${currentUrl}`);
    
    // Should be on the fitness page (either authenticated or handling auth client-side)
    expect(currentUrl).toContain('/modules/fitness');
    
    console.log('✅ Fitness module loads successfully without server-side auth blocking!');
  });

  test('learning module loads without infinite redirects', async ({ page }) => {
    console.log('Testing learning module loading...');
    
    // Navigate directly to learning module
    await page.goto('/modules/learning');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const pageContent = await page.content();
    
    // Should contain learning-specific content
    expect(pageContent).toContain('Learning');
    expect(pageContent).not.toContain('This page could not be found');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/modules/learning');
    
    console.log('✅ Learning module loads successfully!');
  });

  test('home module loads content properly', async ({ page }) => {
    console.log('Testing home module loading...');
    
    // Navigate directly to home module
    await page.goto('/modules/home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const pageContent = await page.content();
    
    // Should contain home projects content
    expect(pageContent).toContain('Home Projects');
    expect(pageContent).not.toContain('This page could not be found');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/modules/home');
    
    console.log('✅ Home module loads successfully!');
  });

  test('no server-side authentication blocking for module pages', async ({ page }) => {
    console.log('Verifying no server-side authentication blocking...');
    
    // Test that we can access any module page without server-side auth failures
    const modules = ['fitness', 'learning', 'home', 'bible', 'work'];
    
    for (const module of modules) {
      console.log(`Testing ${module} module...`);
      
      await page.goto(`/modules/${module}`);
      await page.waitForLoadState('networkidle');
      
      const pageContent = await page.content();
      
      // Should NOT get server-side 404 or redirect errors due to requireAuth
      expect(pageContent).not.toContain('This page could not be found');
      expect(pageContent).not.toContain('NEXT_REDIRECT'); // Server-side redirect error
      
      // Should contain the module name somewhere in the content
      const moduleTitle = module === 'bible' ? 'Bible' : 
                         module === 'work' ? 'Work' :
                         module === 'home' ? 'Home' :
                         module.charAt(0).toUpperCase() + module.slice(1);
      expect(pageContent).toContain(moduleTitle);
      
      console.log(`✅ ${module} module accessible without server-side auth blocking`);
    }
    
    console.log('✅ All modules load without server-side authentication failures!');
  });
});