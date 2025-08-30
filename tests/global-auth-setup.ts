/**
 * Global authentication setup for Playwright tests
 * Creates a shared authentication state to prevent rate limiting
 */
import { chromium } from '@playwright/test';
import { DEFAULT_TEST_CREDENTIALS, loginUser } from './helpers/auth';
import fs from 'fs';
import path from 'path';

const AUTH_STATE_FILE = path.join(__dirname, 'auth-state.json');

export default async function globalAuthSetup() {
  console.log('🔐 Setting up shared authentication state...');

  try {
    // Delete any existing auth state file
    if (fs.existsSync(AUTH_STATE_FILE)) {
      fs.unlinkSync(AUTH_STATE_FILE);
    }

    // Create a new browser and page
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login once for all tests to use
    console.log('🔑 Performing global login for test suite...');
    await loginUser(page, DEFAULT_TEST_CREDENTIALS);

    // Save the authentication state
    await context.storageState({ path: AUTH_STATE_FILE });
    console.log(`✅ Authentication state saved to ${AUTH_STATE_FILE}`);

    await browser.close();

    console.log('✅ Global authentication setup completed!');
  } catch (error) {
    console.error('❌ Global authentication setup failed:', error);
    throw error;
  }
}