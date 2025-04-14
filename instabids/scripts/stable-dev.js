/**
 * Stable Development Environment Script
 * 
 * This script ensures a stable development environment by:
 * 1. Killing any running Next.js processes
 * 2. Clearing the Next.js cache
 * 3. Clearing browser cache for localhost
 * 4. Starting the development server with optimized settings
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const http = require('http');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Helper function to log with colors
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to execute commands and log output
function execute(command, options = {}) {
  log(`\n> ${command}`, colors.cyan);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: 'inherit',
      ...options
    });
    return { success: true, output };
  } catch (error) {
    log(`Error executing command: ${error.message}`, colors.red);
    return { success: false, error };
  }
}

// Check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
}

// Find an available port starting from the given port
async function findAvailablePort(startPort) {
  let port = startPort;
  while (await isPortInUse(port)) {
    log(`Port ${port} is in use, trying ${port + 1}...`, colors.yellow);
    port++;
  }
  return port;
}

// Kill processes on a specific port (Windows)
function killProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = result.split('\n');
      
      for (const line of lines) {
        const match = line.match(/(\d+)$/);
        if (match && match[1]) {
          const pid = match[1].trim();
          log(`Killing process with PID ${pid} on port ${port}...`, colors.yellow);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        }
      }
    }
  } catch (error) {
    // No process found on that port, which is fine
  }
}

// Main function
async function main() {
  log('\n========================================', colors.green);
  log(' INSTABIDS STABLE DEVELOPMENT ENVIRONMENT', colors.green + colors.bright);
  log('========================================\n', colors.green);
  
  // Step 1: Kill any running Next.js processes
  log('Step 1: Killing any running Next.js processes...', colors.yellow);
  try {
    // Kill processes on common Next.js ports
    killProcessOnPort(3000);
    killProcessOnPort(3001);
    killProcessOnPort(3002);
    
    if (process.platform === 'win32') {
      execute('taskkill /f /im node.exe /fi "WINDOWTITLE eq next*"', { stdio: 'ignore' });
    } else {
      execute('pkill -f "node.*next"', { stdio: 'ignore' });
    }
    log('✓ Killed any running Next.js processes', colors.green);
  } catch (error) {
    log('No running Next.js processes found', colors.yellow);
  }
  
  // Step 2: Clear Next.js cache
  log('\nStep 2: Clearing Next.js cache...', colors.yellow);
  const nextCacheDir = path.join(process.cwd(), '.next');
  if (fs.existsSync(nextCacheDir)) {
    try {
      if (process.platform === 'win32') {
        execute('rmdir /s /q .next');
      } else {
        execute('rm -rf .next');
      }
      log('✓ Cleared Next.js cache', colors.green);
    } catch (error) {
      log(`Error clearing cache: ${error.message}`, colors.red);
    }
  } else {
    log('No Next.js cache found', colors.yellow);
  }
  
  // Step 3: Clear node_modules/.cache
  log('\nStep 3: Clearing module cache...', colors.yellow);
  const moduleCacheDir = path.join(process.cwd(), 'node_modules', '.cache');
  if (fs.existsSync(moduleCacheDir)) {
    try {
      if (process.platform === 'win32') {
        execute('rmdir /s /q node_modules\\.cache');
      } else {
        execute('rm -rf node_modules/.cache');
      }
      log('✓ Cleared module cache', colors.green);
    } catch (error) {
      log(`Error clearing module cache: ${error.message}`, colors.red);
    }
  } else {
    log('No module cache found', colors.yellow);
  }
  
  // Step 4: Find available port
  log('\nStep 4: Finding available port...', colors.yellow);
  const port = await findAvailablePort(3000);
  log(`✓ Found available port: ${port}`, colors.green);
  
  // Step 5: Start development server with optimized settings
  log('\nStep 5: Starting development server...', colors.yellow);
  log(`\nThe development server will start on http://localhost:${port}`, colors.magenta);
  log('Press Ctrl+C to stop the server\n', colors.magenta);
  
  // Set environment variables to optimize development
  process.env.NODE_ENV = 'development';
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.PORT = port.toString();
  
  // Start the development server
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: port.toString(),
    },
  });
  
  devProcess.on('error', (error) => {
    log(`\nError starting development server: ${error.message}`, colors.red);
    process.exit(1);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\nShutting down development server...', colors.yellow);
    devProcess.kill();
    process.exit(0);
  });
}

// Run the main function
main().catch(error => {
  log(`\nError: ${error.message}`, colors.red);
  process.exit(1);
});
