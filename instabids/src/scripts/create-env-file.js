/**
 * Environment Setup Script
 * 
 * This script creates a .env.local file with Supabase credentials
 * for local development.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Project root directory
const ROOT_DIR = path.resolve(__dirname, '../../');
const ENV_FILE = path.join(ROOT_DIR, '.env.local');

console.log('🚀 InstaBids Environment Setup\n');

// Check if .env.local already exists
if (fs.existsSync(ENV_FILE)) {
  console.log('⚠️ .env.local file already exists. Overwrite? (y/n)');
  rl.question('', (answer) => {
    if (answer.toLowerCase() === 'y') {
      createEnvFile();
    } else {
      console.log('❌ Setup cancelled. Existing .env.local file not modified.');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n📝 Please enter your Supabase credentials:');
  
  rl.question('Supabase URL: ', (supabaseUrl) => {
    rl.question('Supabase Anon Key: ', (supabaseAnonKey) => {
      rl.question('Supabase Service Role Key: ', (supabaseServiceKey) => {
        
        // Create the .env.local content
        const envContent = `
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Other Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;
        
        // Write to file
        fs.writeFileSync(ENV_FILE, envContent.trim());
        
        console.log('\n✅ .env.local file created successfully!');
        console.log(`📁 Location: ${ENV_FILE}`);
        console.log('\n🔄 Restart your development server for changes to take effect.');
        
        rl.close();
      });
    });
  });
}
