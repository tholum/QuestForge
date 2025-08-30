#!/usr/bin/env node
/**
 * Test Readiness Checker
 * 
 * Quick script to check if the environment is ready for 404 detection tests
 */

const fs = require('fs');
const { spawn } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(path, description) {
  if (fs.existsSync(path)) {
    log(`✅ ${description}`, colors.green);
    return true;
  } else {
    log(`❌ ${description} - Missing: ${path}`, colors.red);
    return false;
  }
}

async function checkCommand(command, description) {
  return new Promise((resolve) => {
    const child = spawn(command, ['--version'], { stdio: 'pipe', shell: true });
    
    let hasOutput = false;
    child.stdout.on('data', () => { hasOutput = true; });
    child.stderr.on('data', () => { hasOutput = true; });
    
    child.on('close', (code) => {
      if (code === 0 || hasOutput) {
        log(`✅ ${description}`, colors.green);
        resolve(true);
      } else {
        log(`❌ ${description}`, colors.red);
        resolve(false);
      }
    });

    child.on('error', () => {
      log(`❌ ${description}`, colors.red);
      resolve(false);
    });
  });
}

async function main() {
  log('🔍 Checking 404 Detection Test Readiness\n', colors.blue);
  
  let allGood = true;
  
  // Check project structure
  log('📁 Project Structure:', colors.blue);
  allGood &= checkFile('package.json', 'Package.json exists');
  allGood &= checkFile('playwright.config.ts', 'Playwright config exists');
  allGood &= checkFile('tests/404-detection.spec.ts', '404 detection test file exists');
  allGood &= checkFile('tests/helpers/auth.ts', 'Auth helper exists');
  allGood &= checkFile('tests/global-setup.ts', 'Global setup exists');
  
  // Check database
  log('\n🗄️ Database:', colors.blue);
  allGood &= checkFile('prisma/schema.prisma', 'Prisma schema exists');
  allGood &= checkFile('prisma/dev.db', 'Development database exists');
  
  // Check dependencies
  log('\n📦 Dependencies:', colors.blue);
  allGood &= await checkCommand('npm', 'npm is installed');
  allGood &= await checkCommand('npx playwright', 'Playwright is installed');
  
  // Check if packages are installed
  const hasNodeModules = fs.existsSync('node_modules');
  if (hasNodeModules) {
    log(`✅ Node modules installed`, colors.green);
  } else {
    log(`❌ Node modules not installed - run 'npm install'`, colors.red);
    allGood = false;
  }
  
  // Check if Prisma client is generated
  const hasPrismaClient = fs.existsSync('node_modules/.prisma/client');
  if (hasPrismaClient) {
    log(`✅ Prisma client generated`, colors.green);
  } else {
    log(`❌ Prisma client not generated - run 'npm run db:generate'`, colors.red);
    allGood = false;
  }
  
  // Summary
  log('\n📋 Summary:', colors.blue);
  if (allGood) {
    log('✅ All checks passed! Ready to run 404 detection tests.', colors.green);
    log('\nTo run the tests:', colors.blue);
    log('npm run test:e2e:404', colors.yellow);
    log('OR', colors.blue);
    log('./tests/run-404-detection.js', colors.yellow);
  } else {
    log('❌ Some checks failed. Please address the issues above before running tests.', colors.red);
    log('\nCommon fixes:', colors.blue);
    log('npm install                 # Install dependencies', colors.yellow);
    log('npm run db:generate         # Generate Prisma client', colors.yellow);
    log('npm run db:push             # Setup database', colors.yellow);
    log('npm run db:seed             # Seed test data', colors.yellow);
    log('npx playwright install      # Install browser drivers', colors.yellow);
  }
  
  process.exit(allGood ? 0 : 1);
}

main().catch(console.error);