/**
 * Global test setup for Playwright E2E tests
 * 
 * This runs once before all tests to ensure the test environment is ready
 */
import { chromium, FullConfig } from '@playwright/test';
import { seedE2EData } from './setup/seed-e2e-data';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global test setup...');

  try {
    // Seed test data
    await seedE2EData();

    // Optional: Warm up the server by making a request
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      console.log('🔥 Warming up the application...');
      await page.goto('http://localhost:3000', { timeout: 30000 });
      await page.waitForLoadState('networkidle');
      console.log('✅ Application is ready');
    } catch (error) {
      console.log('⚠️ Could not warm up application, but continuing with tests:', error.message);
    } finally {
      await browser.close();
    }

    console.log('✅ Global test setup completed successfully!');

  } catch (error) {
    console.error('❌ Global test setup failed:', error);
    throw error;
  }
}

export default globalSetup;