#!/usr/bin/env node

/**
 * Safe Development Server Startup Script
 * 
 * This script attempts to start the development server with Turbopack first,
 * then falls back to webpack if Turbopack encounters HMR module factory errors.
 * 
 * Usage: npm run dev:safe
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class SafeDevServer {
  constructor() {
    this.maxRetries = 2;
    this.retryCount = 0;
    this.currentServer = null;
    this.restartTimeout = null;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: '🚀',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async checkPort(port = 3000) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  async killExistingServer(port = 3000) {
    return new Promise((resolve) => {
      exec(`lsof -ti:${port}`, (error, stdout) => {
        if (stdout.trim()) {
          const pid = stdout.trim();
          exec(`kill -9 ${pid}`, () => {
            this.log(`Killed existing server on port ${port}`);
            setTimeout(resolve, 1000);
          });
        } else {
          resolve();
        }
      });
    });
  }

  async startTurbopack() {
    this.log('Starting development server with Turbopack...');
    
    const turbopack = spawn('npm', ['run', 'dev'], { 
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env },
      cwd: process.cwd()
    });

    // Monitor for specific error patterns
    let hasModuleFactoryError = false;
    let startupComplete = false;
    let startupTimer = null;

    turbopack.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // Check for successful startup
      if (output.includes('Ready in') || output.includes('Local:')) {
        startupComplete = true;
        if (startupTimer) clearTimeout(startupTimer);
        this.log('Turbopack development server started successfully!', 'success');
      }
    });

    turbopack.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      
      // Check for HMR module factory errors
      if (output.includes('module factory is not available') ||
          output.includes('deleted in an HMR update') ||
          output.includes('Module') && output.includes('instantiated')) {
        hasModuleFactoryError = true;
        this.log('HMR module factory error detected!', 'warn');
      }
    });

    // Set timeout for startup detection
    startupTimer = setTimeout(() => {
      if (!startupComplete) {
        this.log('Turbopack startup timeout - may have failed silently', 'warn');
      }
    }, 30000);

    return new Promise((resolve, reject) => {
      turbopack.on('error', (error) => {
        this.log(`Turbopack failed to start: ${error.message}`, 'error');
        reject(error);
      });

      turbopack.on('exit', (code) => {
        if (startupTimer) clearTimeout(startupTimer);
        
        if (code !== 0) {
          if (hasModuleFactoryError) {
            this.log('Turbopack exited due to HMR module factory issues', 'warn');
            reject(new Error('HMR_MODULE_FACTORY_ERROR'));
          } else {
            this.log(`Turbopack exited with code ${code}`, 'error');
            reject(new Error(`Turbopack failed with exit code ${code}`));
          }
        } else {
          resolve();
        }
      });

      // Store reference for potential cleanup
      this.currentServer = turbopack;

      // Monitor for runtime HMR errors after startup
      if (startupComplete) {
        setTimeout(() => {
          if (hasModuleFactoryError && this.retryCount < this.maxRetries) {
            this.log('Runtime HMR errors detected, attempting restart...', 'warn');
            turbopack.kill();
            this.retryWithWebpack();
          }
        }, 5000);
      }
    });
  }

  async startWebpack() {
    this.log('Starting development server with Webpack fallback...');
    
    const webpack = spawn('npm', ['run', 'dev:webpack'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, DISABLE_TURBOPACK: 'true' },
      cwd: process.cwd()
    });

    let startupComplete = false;
    let startupTimer = null;

    webpack.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      if (output.includes('Ready in') || output.includes('Local:')) {
        startupComplete = true;
        if (startupTimer) clearTimeout(startupTimer);
        this.log('Webpack development server started successfully!', 'success');
      }
    });

    webpack.stderr.on('data', (data) => {
      process.stderr.write(data);
    });

    startupTimer = setTimeout(() => {
      if (!startupComplete) {
        this.log('Webpack startup timeout', 'warn');
      }
    }, 45000);

    return new Promise((resolve, reject) => {
      webpack.on('error', (error) => {
        this.log(`Webpack also failed: ${error.message}`, 'error');
        reject(error);
      });

      webpack.on('exit', (code) => {
        if (startupTimer) clearTimeout(startupTimer);
        
        if (code !== 0) {
          this.log(`Webpack exited with code ${code}`, 'error');
          reject(new Error(`Webpack failed with exit code ${code}`));
        } else {
          resolve();
        }
      });

      this.currentServer = webpack;
    });
  }

  async retryWithWebpack() {
    if (this.retryCount >= this.maxRetries) {
      this.log('Maximum retries reached. Please check the application logs.', 'error');
      process.exit(1);
    }

    this.retryCount++;
    this.log(`Retry attempt ${this.retryCount}/${this.maxRetries}`, 'info');

    // Clean up existing server
    if (this.currentServer) {
      this.currentServer.kill();
      this.currentServer = null;
    }

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clear .next cache to prevent cached issues
    const nextDir = path.join(process.cwd(), '.next');
    if (fs.existsSync(nextDir)) {
      this.log('Clearing .next cache...', 'info');
      exec('rm -rf .next', (error) => {
        if (error) {
          this.log('Failed to clear .next cache', 'warn');
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    try {
      await this.startWebpack();
    } catch (error) {
      this.log('All fallback attempts failed!', 'error');
      this.showTroubleshootingTips();
      process.exit(1);
    }
  }

  showTroubleshootingTips() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 TROUBLESHOOTING TIPS');
    console.log('='.repeat(60));
    console.log('1. Try manually clearing the cache:');
    console.log('   rm -rf .next && rm -rf node_modules/.cache');
    console.log('');
    console.log('2. Restart with webpack only:');
    console.log('   npm run dev:webpack');
    console.log('');
    console.log('3. Check for Node.js version compatibility:');
    console.log('   node --version (should be >= 18)');
    console.log('');
    console.log('4. Clear npm/yarn cache:');
    console.log('   npm cache clean --force');
    console.log('');
    console.log('5. This is a known Next.js 15 + Turbopack issue.');
    console.log('   Track progress: https://github.com/vercel/next.js/issues');
    console.log('='.repeat(60));
  }

  async start() {
    this.log('Safe Development Server Starting...', 'info');
    
    // Check if port is available
    const portAvailable = await this.checkPort();
    if (!portAvailable) {
      await this.killExistingServer();
    }

    try {
      await this.startTurbopack();
    } catch (error) {
      if (error.message === 'HMR_MODULE_FACTORY_ERROR') {
        this.log('Detected HMR module factory errors, switching to Webpack...', 'warn');
        await this.retryWithWebpack();
      } else {
        this.log('Turbopack failed, falling back to Webpack...', 'warn');
        await this.retryWithWebpack();
      }
    }

    // Setup graceful shutdown
    process.on('SIGINT', () => {
      this.log('Shutting down development server...', 'info');
      if (this.currentServer) {
        this.currentServer.kill();
      }
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.log('Received SIGTERM, shutting down gracefully...', 'info');
      if (this.currentServer) {
        this.currentServer.kill();
      }
      process.exit(0);
    });
  }
}

// Start the safe development server
const safeDevServer = new SafeDevServer();
safeDevServer.start().catch((error) => {
  console.error('Failed to start development server:', error);
  process.exit(1);
});