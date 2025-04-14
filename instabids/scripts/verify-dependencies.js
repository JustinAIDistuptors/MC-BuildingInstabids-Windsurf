#!/usr/bin/env node

/**
 * Dependency Verification Script
 * 
 * This script checks that all required dependencies for UI components are installed.
 * It helps prevent build errors caused by missing packages.
 * 
 * Usage:
 *   node scripts/verify-dependencies.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Component dependencies mapping
const COMPONENT_DEPENDENCIES = {
  'avatar': ['@radix-ui/react-avatar'],
  'button': [],
  'card': [],
  'label': ['@radix-ui/react-label'],
  'select': ['@radix-ui/react-select'],
  'switch': ['@radix-ui/react-switch'],
  'tabs': ['@radix-ui/react-tabs'],
  'textarea': [],
  'toast': ['@radix-ui/react-toast'],
  'alert': [],
  'messaging': [
    '@radix-ui/react-avatar',
    '@radix-ui/react-label',
    '@radix-ui/react-select',
    '@radix-ui/react-switch',
    'lucide-react'
  ]
};

// Get installed packages
function getInstalledPackages() {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')
    );
    
    return {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
  } catch (error) {
    console.error('Error reading package.json:', error.message);
    process.exit(1);
  }
}

// Check if component files exist
function findUsedComponents() {
  const componentsDir = path.join(process.cwd(), 'src', 'components');
  const uiComponentsDir = path.join(componentsDir, 'ui');
  const usedComponents = [];
  
  // Check UI components
  if (fs.existsSync(uiComponentsDir)) {
    fs.readdirSync(uiComponentsDir).forEach(file => {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        const componentName = path.basename(file, path.extname(file));
        usedComponents.push(componentName);
      }
    });
  }
  
  // Check for messaging component
  const messagingDir = path.join(componentsDir, 'messaging');
  if (fs.existsSync(messagingDir)) {
    usedComponents.push('messaging');
  }
  
  return usedComponents;
}

// Main verification function
function verifyDependencies() {
  console.log('🔍 Verifying component dependencies...');
  
  const installedPackages = getInstalledPackages();
  const usedComponents = findUsedComponents();
  
  let missingDependencies = [];
  
  // Check dependencies for each used component
  usedComponents.forEach(component => {
    const dependencies = COMPONENT_DEPENDENCIES[component] || [];
    
    dependencies.forEach(dependency => {
      if (!installedPackages[dependency]) {
        missingDependencies.push({ component, dependency });
      }
    });
  });
  
  // Report results
  if (missingDependencies.length === 0) {
    console.log('✅ All component dependencies are installed!');
    return true;
  } else {
    console.error('❌ Missing dependencies detected:');
    
    missingDependencies.forEach(({ component, dependency }) => {
      console.error(`   - ${dependency} (required by ${component})`);
    });
    
    console.log('\nInstall missing dependencies with:');
    console.log(`npm install ${missingDependencies.map(d => d.dependency).join(' ')}`);
    
    return false;
  }
}

// Run verification
const success = verifyDependencies();
process.exit(success ? 0 : 1);
