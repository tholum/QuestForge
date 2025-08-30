#!/usr/bin/env node
/**
 * 404 Detection Test Runner
 * 
 * A simple script to run the 404 detection tests with proper setup
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`🔍 ${message}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, colors.yellow);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  logHeader('Checking Prerequisites');
  
  // Check if package.json exists
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found. Please run this script from the project root.');
  }

  // Check if Playwright is installed
  try {
    await runCommand('npx', ['playwright', '--version']);
    log('✅ Playwright is installed', colors.green);
  } catch (error) {
    log('❌ Playwright not found. Installing...', colors.red);
    await runCommand('npx', ['playwright', 'install']);
  }

  // Check if database exists
  if (!fs.existsSync('prisma/dev.db')) {
    log('⚠️  Database not found. Setting up database...', colors.yellow);
    await runCommand('npm', ['run', 'db:generate']);
    await runCommand('npm', ['run', 'db:push']);
    await runCommand('npm', ['run', 'db:seed']);
  }
}

async function startDevServer() {
  logHeader('Starting Development Server');
  
  return new Promise((resolve) => {
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });

    let started = false;

    server.stdout.on('data', (data) => {
      const output = data.toString();
      
      // Look for indicators that the server is ready
      if (output.includes('Ready') || output.includes('Local:') || output.includes('localhost:3000')) {
        if (!started) {
          log('✅ Development server is ready!', colors.green);
          started = true;
          resolve(server);
        }
      }
    });

    server.stderr.on('data', (data) => {
      const output = data.toString();
      // Don't log everything, just important messages
      if (output.includes('error') || output.includes('Error')) {
        console.error(output);
      }
    });

    // Timeout if server doesn't start
    setTimeout(() => {
      if (!started) {
        log('⚠️  Server startup timeout, but continuing with tests...', colors.yellow);
        started = true;
        resolve(server);
      }
    }, 30000);
  });
}

async function runTests() {
  logHeader('Running 404 Detection Tests');
  
  try {
    await runCommand('npx', ['playwright', 'test', '404-detection.spec.ts']);
    log('✅ Tests completed successfully!', colors.green);
  } catch (error) {
    log('❌ Tests failed. Check the reports for details.', colors.red);
    throw error;
  }
}

async function showResults() {
  logHeader('Test Results');
  
  // Check for reports
  const reportDirs = [
    'test-results/404-reports',
    'playwright-report',
    'test-results/404-screenshots'
  ];

  for (const dir of reportDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      if (files.length > 0) {
        log(`📁 ${dir}: ${files.length} files`, colors.blue);
      }
    }
  }

  // Show latest report
  const reportsDir = 'test-results/404-reports';
  if (fs.existsSync(reportsDir)) {
    const reports = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    
    if (reports.length > 0) {
      const latestReport = path.join(reportsDir, reports[0]);
      log(`📊 Latest report: ${latestReport}`, colors.blue);
      
      try {
        const report = JSON.parse(fs.readFileSync(latestReport, 'utf8'));
        log(`   Total pages: ${report.testRun.totalPages}`, colors.cyan);
        log(`   ✅ Working: ${report.testRun.successfulPages}`, colors.green);
        log(`   ❌ Failed: ${report.testRun.failedPages + report.testRun.notFoundPages}`, colors.red);
      } catch (error) {
        log('   Could not parse report JSON', colors.yellow);
      }
    }
  }

  log('\nTo view the HTML report, run:', colors.blue);
  log('npm run test:e2e:report', colors.cyan);
}

async function main() {
  try {
    log(`${colors.bright}🚀 404 Detection Test Runner${colors.reset}`);
    log('This script will set up and run comprehensive 404 detection tests\n');

    await checkPrerequisites();
    
    const server = await startDevServer();
    
    // Wait a bit for server to fully initialize
    log('⏳ Waiting for server to fully initialize...', colors.yellow);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    try {
      await runTests();
      await showResults();
      
      log('\n✅ 404 Detection tests completed successfully!', colors.green);
      
    } finally {
      // Clean up server
      logHeader('Cleaning Up');
      log('🛑 Stopping development server...', colors.yellow);
      server.kill();
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    log(`\n❌ Test run failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Handle interruption
process.on('SIGINT', () => {
  log('\n🛑 Test run interrupted by user', colors.yellow);
  process.exit(0);
});

main().catch(error => {
  console.error(error);
  process.exit(1);
});