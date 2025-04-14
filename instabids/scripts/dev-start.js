/**
 * Enhanced development server startup script
 * This script ensures a clean development environment by:
 * 1. Clearing the Next.js cache
 * 2. Verifying all dependencies are installed
 * 3. Starting the development server with proper configuration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = 5000;
const NEXT_CACHE_DIR = path.join(__dirname, '..', '.next');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function executeCommand(command) {
  try {
    log(`Executing: ${command}`, colors.dim);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Failed to execute: ${command}`, colors.red);
    log(error.message, colors.red);
    return false;
  }
}

// Main execution
async function main() {
  log('🚀 Starting enhanced development server...', colors.bright + colors.cyan);
  
  // Step 1: Clear Next.js cache
  log('\n🧹 Clearing Next.js cache...', colors.yellow);
  if (fs.existsSync(NEXT_CACHE_DIR)) {
    try {
      fs.rmSync(NEXT_CACHE_DIR, { recursive: true, force: true });
      log('✅ Cache cleared successfully', colors.green);
    } catch (error) {
      log('⚠️ Warning: Failed to clear cache, but continuing anyway', colors.yellow);
      log(error.message, colors.dim);
    }
  } else {
    log('✅ No cache to clear', colors.green);
  }
  
  // Step 2: Verify dependencies
  log('\n📦 Verifying dependencies...', colors.yellow);
  if (!executeCommand('node scripts/verify-dependencies.js')) {
    log('❌ Dependency verification failed', colors.red);
    process.exit(1);
  }
  
  // Step 3: Start development server
  log('\n🌐 Starting Next.js development server...', colors.yellow);
  log(`🔗 Server will be available at http://localhost:${PORT}`, colors.bright + colors.green);
  
  // Execute the Next.js dev command with the specified port
  executeCommand(`next dev -p ${PORT}`);
}

// Run the main function
main().catch((error) => {
  log(`❌ Fatal error: ${error.message}`, colors.bright + colors.red);
  process.exit(1);
});
