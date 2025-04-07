/**
 * InstaBids Setup Script
 * 
 * This script:
 * 1. Installs required dependencies
 * 2. Sets up environment variables
 * 3. Creates the database schema
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Project root directory
const ROOT_DIR = path.resolve(__dirname, '../../');

console.log('🚀 Starting InstaBids setup process...\n');

try {
  // 1. Install required dependencies
  console.log('📦 Installing required dependencies...');
  
  const dependencies = [
    '@supabase/auth-helpers-nextjs',
    '@supabase/supabase-js',
    'zod'
  ];
  
  execSync(`npm install ${dependencies.join(' ')}`, { 
    cwd: ROOT_DIR,
    stdio: 'inherit' 
  });
  
  console.log('✅ Dependencies installed successfully\n');
  
  // 2. Check for environment variables
  console.log('🔐 Setting up environment variables...');
  
  const envPath = path.join(ROOT_DIR, '.env.local');
  const envExamplePath = path.join(ROOT_DIR, '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('Creating .env.local file...');
    
    // Generate example env file if it doesn't exist
    if (!fs.existsSync(envExamplePath)) {
      const exampleEnv = `
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Other Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;
      
      fs.writeFileSync(envExamplePath, exampleEnv.trim());
      console.log('Created .env.example file with required variables');
    }
    
    console.log('\n⚠️ IMPORTANT: You need to create a .env.local file with your Supabase credentials');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Fill in your Supabase URL, anon key, and service role key');
    console.log('\nYou can find these values in your Supabase project settings.\n');
  } else {
    console.log('✅ .env.local file already exists\n');
  }
  
  // 3. Reminder about running the database schema script
  console.log('📊 Database Schema Setup:');
  console.log('To set up the database schema, run:');
  console.log('npx tsx src/scripts/execute-schema.ts');
  console.log('\nThis will create all the required tables in your Supabase database.\n');
  
  console.log('🎉 Setup process completed!');
  console.log('Next steps:');
  console.log('1. Ensure your .env.local file has the correct Supabase credentials');
  console.log('2. Run the database schema script');
  console.log('3. Start the development server with: npm run dev\n');
  
} catch (error) {
  console.error('❌ Error during setup:', error.message);
  process.exit(1);
}
