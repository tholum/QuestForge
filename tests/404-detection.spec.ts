/**
 * Comprehensive 404 Detection Test Suite
 * 
 * This test systematically navigates through ALL pages in the Goal Assistant application
 * to detect 404 issues, missing pages, or broken routes.
 */
import { test, expect, Page } from '@playwright/test';
import { loginUser, logoutUser, ensureAuthenticated } from './helpers/auth';
import fs from 'fs';
import path from 'path';

interface PageTestResult {
  url: string;
  status: 'success' | 'error' | '404';
  httpStatus?: number;
  errorMessage?: string;
  screenshot?: string;
  hasContent?: boolean;
  contentPreview?: string;
}

interface Test404Report {
  testRun: {
    timestamp: string;
    totalPages: number;
    successfulPages: number;
    failedPages: number;
    notFoundPages: number;
  };
  results: PageTestResult[];
  workingPages: string[];
  pagesWithIssues: string[];
}

// Define all pages to test
const PAGE_CATEGORIES = {
  // Core Application Pages
  corePages: [
    '/',
    '/dashboard',
    '/goals', 
    '/progress',
    '/settings',
    '/profile',
    '/analytics',
    '/achievements', 
    '/calendar',
    '/modules'
  ],

  // Module Pages
  modulePages: [
    '/modules/fitness',
    '/modules/learning', 
    '/modules/home',
    '/modules/bible',
    '/modules/work'
  ],

  // Auth Pages (public)
  authPages: [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password'
  ]
};

// All pages combined
const ALL_PAGES = [
  ...PAGE_CATEGORIES.corePages,
  ...PAGE_CATEGORIES.modulePages,
  ...PAGE_CATEGORIES.authPages
];

/**
 * Test a single page for 404 issues
 */
async function testPageFor404(page: Page, url: string): Promise<PageTestResult> {
  console.log(`Testing page: ${url}`);
  
  const result: PageTestResult = {
    url,
    status: 'success'
  };

  try {
    // Navigate to the page
    const response = await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    result.httpStatus = response?.status();

    // Check for HTTP 404 status
    if (response?.status() === 404) {
      result.status = '404';
      result.errorMessage = `HTTP 404 status returned`;
      return result;
    }

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });

    // Check page content for 404 indicators
    const pageText = await page.textContent('body');
    result.hasContent = !!pageText && pageText.trim().length > 0;
    result.contentPreview = pageText?.substring(0, 200) + '...';

    // Check for common 404 indicators in page content
    const has404Content = pageText && (
      pageText.toLowerCase().includes('404') ||
      pageText.toLowerCase().includes('page not found') ||
      pageText.toLowerCase().includes('not found') ||
      pageText.toLowerCase().includes('page does not exist') ||
      pageText.toLowerCase().includes('route not found')
    );

    if (has404Content) {
      result.status = '404';
      result.errorMessage = 'Page contains 404 content';
      
      // Take screenshot of 404 page
      const screenshotPath = `test-results/404-screenshots/${url.replace(/[\/\\?%*:|"<>]/g, '-')}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = screenshotPath;
      
      return result;
    }

    // Check if page has essential UI elements (not completely empty)
    const hasEssentialElements = await page.evaluate(() => {
      // Look for common UI elements that indicate a working page
      const selectors = [
        'main', 'header', 'nav', 'h1', 'h2', '.container',
        '[data-testid]', 'button', 'form', '.page', '.content'
      ];
      
      return selectors.some(selector => {
        const elements = document.querySelectorAll(selector);
        return elements.length > 0;
      });
    });

    if (!hasEssentialElements && (!pageText || pageText.trim().length < 50)) {
      result.status = 'error';
      result.errorMessage = 'Page appears to be empty or has minimal content';
      
      // Take screenshot for debugging
      const screenshotPath = `test-results/404-screenshots/${url.replace(/[\/\\?%*:|"<>]/g, '-')}-empty.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = screenshotPath;
    }

  } catch (error) {
    result.status = 'error';
    result.errorMessage = `Navigation failed: ${error.message}`;
    
    // Take screenshot of error state
    try {
      const screenshotPath = `test-results/404-screenshots/${url.replace(/[\/\\?%*:|"<>]/g, '-')}-error.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      result.screenshot = screenshotPath;
    } catch (screenshotError) {
      console.log(`Failed to take screenshot for ${url}:`, screenshotError.message);
    }
  }

  return result;
}

/**
 * Generate comprehensive report
 */
function generateReport(results: PageTestResult[]): Test404Report {
  const workingPages = results
    .filter(r => r.status === 'success')
    .map(r => r.url);

  const pagesWithIssues = results
    .filter(r => r.status !== 'success')
    .map(r => r.url);

  const report: Test404Report = {
    testRun: {
      timestamp: new Date().toISOString(),
      totalPages: results.length,
      successfulPages: workingPages.length,
      failedPages: results.filter(r => r.status === 'error').length,
      notFoundPages: results.filter(r => r.status === '404').length
    },
    results,
    workingPages,
    pagesWithIssues
  };

  return report;
}

/**
 * Save report to file
 */
async function saveReport(report: Test404Report): Promise<void> {
  const reportsDir = 'test-results/404-reports';
  
  // Ensure directory exists
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportsDir, `404-detection-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 404 Detection Report Generated:');
  console.log(`   Report saved to: ${reportPath}`);
  console.log(`   Total pages tested: ${report.testRun.totalPages}`);
  console.log(`   Working pages: ${report.testRun.successfulPages}`);
  console.log(`   Pages with 404 issues: ${report.testRun.notFoundPages}`);
  console.log(`   Pages with errors: ${report.testRun.failedPages}`);
  
  if (report.pagesWithIssues.length > 0) {
    console.log('\n❌ Pages with Issues:');
    report.pagesWithIssues.forEach(url => {
      const result = report.results.find(r => r.url === url);
      console.log(`   - ${url}: ${result?.errorMessage}`);
    });
  }
}

// Test suite setup
test.describe('404 Detection Test Suite', () => {
  
  test.beforeAll(async () => {
    // Ensure screenshot directory exists
    const screenshotDir = 'test-results/404-screenshots';
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Core Application Pages - 404 Detection', async ({ page }) => {
    console.log('\n🔍 Testing Core Application Pages for 404 Issues...');
    
    // Login first for authenticated pages
    await loginUser(page);
    
    const results: PageTestResult[] = [];

    for (const url of PAGE_CATEGORIES.corePages) {
      const result = await testPageFor404(page, url);
      results.push(result);
      
      // Add small delay to prevent overwhelming the server
      await page.waitForTimeout(500);
    }

    // Generate report for core pages
    const report = generateReport(results);
    
    // Save detailed report
    await saveReport({
      ...report,
      testRun: {
        ...report.testRun,
        timestamp: new Date().toISOString() + ' - Core Pages'
      }
    });

    // Assertions
    const failedPages = results.filter(r => r.status !== 'success');
    
    if (failedPages.length > 0) {
      console.log('\n❌ Failed Core Pages:');
      failedPages.forEach(result => {
        console.log(`   ${result.url}: ${result.errorMessage}`);
      });
    }

    // Expect all core pages to be working
    expect(failedPages.length).toBe(0);
  });

  test('Module Pages - 404 Detection', async ({ page }) => {
    console.log('\n🔍 Testing Module Pages for 404 Issues...');
    
    // Ensure authenticated
    await ensureAuthenticated(page);
    
    const results: PageTestResult[] = [];

    for (const url of PAGE_CATEGORIES.modulePages) {
      const result = await testPageFor404(page, url);
      results.push(result);
      
      await page.waitForTimeout(500);
    }

    const report = generateReport(results);
    await saveReport({
      ...report,
      testRun: {
        ...report.testRun,
        timestamp: new Date().toISOString() + ' - Module Pages'
      }
    });

    const failedPages = results.filter(r => r.status !== 'success');
    
    if (failedPages.length > 0) {
      console.log('\n❌ Failed Module Pages:');
      failedPages.forEach(result => {
        console.log(`   ${result.url}: ${result.errorMessage}`);
      });
    }

    expect(failedPages.length).toBe(0);
  });

  test('Authentication Pages - 404 Detection', async ({ page }) => {
    console.log('\n🔍 Testing Authentication Pages for 404 Issues...');
    
    // Logout first to test public auth pages
    await logoutUser(page);
    
    const results: PageTestResult[] = [];

    for (const url of PAGE_CATEGORIES.authPages) {
      const result = await testPageFor404(page, url);
      results.push(result);
      
      await page.waitForTimeout(500);
    }

    const report = generateReport(results);
    await saveReport({
      ...report,
      testRun: {
        ...report.testRun,
        timestamp: new Date().toISOString() + ' - Auth Pages'
      }
    });

    const failedPages = results.filter(r => r.status !== 'success');
    
    if (failedPages.length > 0) {
      console.log('\n❌ Failed Auth Pages:');
      failedPages.forEach(result => {
        console.log(`   ${result.url}: ${result.errorMessage}`);
      });
    }

    expect(failedPages.length).toBe(0);
  });

  test('Comprehensive All Pages Test', async ({ page }) => {
    console.log('\n🔍 Running Comprehensive Test on All Pages...');
    
    const allResults: PageTestResult[] = [];

    // Test auth pages first (logged out)
    await logoutUser(page);
    
    console.log('Testing auth pages...');
    for (const url of PAGE_CATEGORIES.authPages) {
      const result = await testPageFor404(page, url);
      allResults.push(result);
      await page.waitForTimeout(300);
    }

    // Login and test protected pages
    await loginUser(page);
    
    console.log('Testing core pages...');
    for (const url of PAGE_CATEGORIES.corePages) {
      const result = await testPageFor404(page, url);
      allResults.push(result);
      await page.waitForTimeout(300);
    }

    console.log('Testing module pages...');
    for (const url of PAGE_CATEGORIES.modulePages) {
      const result = await testPageFor404(page, url);
      allResults.push(result);
      await page.waitForTimeout(300);
    }

    // Generate comprehensive report
    const report = generateReport(allResults);
    await saveReport({
      ...report,
      testRun: {
        ...report.testRun,
        timestamp: new Date().toISOString() + ' - Comprehensive Test'
      }
    });

    // Log final summary
    console.log('\n📋 FINAL TEST SUMMARY');
    console.log('======================');
    console.log(`Total Pages Tested: ${allResults.length}`);
    console.log(`✅ Working Pages: ${report.workingPages.length}`);
    console.log(`❌ Pages with 404: ${allResults.filter(r => r.status === '404').length}`);
    console.log(`⚠️  Pages with Errors: ${allResults.filter(r => r.status === 'error').length}`);
    
    if (report.workingPages.length > 0) {
      console.log('\n✅ Working Pages:');
      report.workingPages.forEach(url => console.log(`   - ${url}`));
    }

    if (report.pagesWithIssues.length > 0) {
      console.log('\n❌ Pages with Issues:');
      report.pagesWithIssues.forEach(url => {
        const result = allResults.find(r => r.url === url);
        console.log(`   - ${url}: ${result?.errorMessage}`);
      });
    }

    // This test is informational - we'll use soft assertions 
    // so we get the full report even if some pages fail
    const failedPages = allResults.filter(r => r.status !== 'success');
    
    // Create soft expectations for each failed page to see all issues
    failedPages.forEach(result => {
      expect.soft(result.status).toBe('success', `Page ${result.url} failed: ${result.errorMessage}`);
    });
    
    // Final hard assertion for the overall test
    const criticalFailures = failedPages.filter(result => 
      // Only fail the test for truly critical pages
      PAGE_CATEGORIES.corePages.includes(result.url) || 
      PAGE_CATEGORIES.authPages.includes(result.url)
    );
    
    expect(criticalFailures.length).toBe(0, 
      `Critical pages failed: ${criticalFailures.map(r => r.url).join(', ')}`
    );
  });
});