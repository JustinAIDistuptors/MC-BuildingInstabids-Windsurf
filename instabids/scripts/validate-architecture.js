/**
 * Architecture validation script for InstaBids
 * 
 * This script checks for architectural rules and best practices that
 * aren't easily verifiable through ESLint.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Track issues for reporting
const issues = [];

/**
 * Validates server/client component boundaries
 * - Client components should not import server-only code
 * - Server components should be the default in app directory
 */
function validateServerClientBoundaries() {
  console.log('Validating server/client component boundaries...');
  
  // Find all client components
  const clientComponents = glob.sync('src/**/*.tsx').filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('"use client"') || content.includes("'use client'");
  });
  
  // Ensure client components don't import server-only modules
  for (const file of clientComponents) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('from "server-only"') || content.includes("from 'server-only'")) {
      issues.push(`Client component ${file} imports server-only code`);
    }
  }
}

/**
 * Validates directory naming convention (kebab-case)
 */
function validateDirectoryNaming() {
  console.log('Validating directory naming conventions...');
  
  const getAllDirs = (dirPath, dirs = []) => {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(dirPath, entry.name);
        // Exclude node_modules and .next
        if (entry.name !== 'node_modules' && entry.name !== '.next') {
          dirs.push({ path: fullPath, name: entry.name });
          getAllDirs(fullPath, dirs);
        }
      }
    }
    
    return dirs;
  };
  
  const allDirs = getAllDirs('src');
  const invalidDirs = allDirs.filter(dir => {
    return !/^[a-z0-9-]+$/.test(dir.name);
  });
  
  for (const dir of invalidDirs) {
    issues.push(`Invalid directory name: ${dir.path} (should be kebab-case)`);
  }
}

/**
 * Validates component organization structure
 * - UI components should be in src/components/ui
 * - Server components should be in src/components/server
 */
function validateComponentOrganization() {
  console.log('Validating component organization...');
  
  // Check if client components are in the right place
  const clientComponents = glob.sync('src/components/**/*.tsx').filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return content.includes('"use client"') || content.includes("'use client'");
  });
  
  for (const file of clientComponents) {
    if (!file.includes('src/components/ui/') && !file.includes('src/app/')) {
      issues.push(`Client component ${file} should be in src/components/ui/ directory`);
    }
  }
  
  // Check if server components are in the right place
  const serverComponents = glob.sync('src/components/**/*.tsx').filter(file => {
    const content = fs.readFileSync(file, 'utf8');
    return !content.includes('"use client"') && !content.includes("'use client'");
  });
  
  for (const file of serverComponents) {
    if (!file.includes('src/components/server/') && !file.includes('src/app/')) {
      issues.push(`Server component ${file} should be in src/components/server/ directory`);
    }
  }
}

/**
 * Validates proper hook naming conventions
 */
function validateHookNaming() {
  console.log('Validating hook naming conventions...');
  
  const hookFiles = glob.sync('src/**/*.ts*').filter(file => {
    const fileName = path.basename(file);
    return fileName.startsWith('use');
  });
  
  for (const file of hookFiles) {
    // Ensure hook files are in hooks directory
    if (!file.includes('/hooks/')) {
      issues.push(`Hook ${file} should be in a hooks directory`);
    }
    
    // Check if hooks use client directive
    const content = fs.readFileSync(file, 'utf8');
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
      issues.push(`Hook ${file} should include 'use client' directive`);
    }
  }
}

// Run validations
try {
  validateServerClientBoundaries();
  validateDirectoryNaming();
  validateComponentOrganization();
  validateHookNaming();
  
  // Report results
  if (issues.length > 0) {
    console.error('\n❌ Architecture validation failed with the following issues:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  } else {
    console.log('\n✅ Architecture validation passed!');
  }
} catch (error) {
  console.error('\n❌ Error running architecture validation:', error);
  process.exit(1);
}
