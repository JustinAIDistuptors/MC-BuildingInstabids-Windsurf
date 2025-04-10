/**
 * Simple script to run the setup-messaging-tables.ts with environment variables
 * Usage: node setup-db.js <SUPABASE_URL> <SUPABASE_ANON_KEY> <SUPABASE_SERVICE_ROLE_KEY>
 */

const { spawn } = require('child_process');
const path = require('path');

// Get command line arguments
const [supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey] = process.argv.slice(2);

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('❌ Missing required arguments');
  console.log('Usage: node setup-db.js <SUPABASE_URL> <SUPABASE_ANON_KEY> <SUPABASE_SERVICE_ROLE_KEY>');
  process.exit(1);
}

// Set environment variables for the child process
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey
};

// Run the setup script
const setupProcess = spawn('npx', ['ts-node', './src/scripts/setup-messaging-tables.ts'], {
  env,
  stdio: 'inherit',
  shell: true
});

setupProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Setup completed successfully');
  } else {
    console.error(`\n❌ Setup failed with code ${code}`);
  }
});
