/**
 * Create Test Accounts for InstaBids
 * 
 * This script creates test accounts for all user types in the InstaBids platform:
 * - Homeowner
 * - Contractor
 * - Property Manager
 * - Labor Contractor
 * - Admin
 * 
 * It uses the Supabase Admin API to create pre-verified accounts
 * and ensures profiles are created in the database.
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase admin client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test accounts to create
const testAccounts = [
  {
    email: 'homeowner@instabids.com',
    password: 'Password123!',
    fullName: 'Henry Homeowner',
    userType: 'homeowner'
  },
  {
    email: 'contractor@instabids.com',
    password: 'Password123!',
    fullName: 'Carl Contractor',
    userType: 'contractor'
  },
  {
    email: 'property@instabids.com',
    password: 'Password123!',
    fullName: 'Patty PropertyManager',
    userType: 'property-manager'
  },
  {
    email: 'labor@instabids.com',
    password: 'Password123!',
    fullName: 'Larry LaborContractor',
    userType: 'labor-contractor'
  },
  {
    email: 'admin@instabids.com',
    password: 'Password123!',
    fullName: 'Adam Admin',
    userType: 'admin'
  }
];

/**
 * Create a user with the admin API and ensure profile exists
 */
async function createTestUser(userData) {
  const { email, password, fullName, userType } = userData;
  console.log(`Creating ${userType} account: ${email}...`);
  
  try {
    // Check if user already exists first
    const { data: existingUser } = await supabase
      .auth
      .admin
      .listUsers({ filter: `email.eq.${email}` });
    
    let userId;
    
    if (existingUser?.users && existingUser.users.length > 0) {
      userId = existingUser.users[0].id;
      console.log(`  User already exists with ID: ${userId}`);
    } else {
      // Create user with admin API - email already confirmed
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          user_type: userType
        }
      });
      
      if (error) {
        throw error;
      }
      
      userId = data.user.id;
      console.log(`  Created user with ID: ${userId}`);
    }
    
    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (existingProfile) {
      console.log(`  Profile already exists for user ${userId}`);
    } else {
      // Create profile manually
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: fullName,
          user_type: userType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
      
      if (profileError) {
        throw profileError;
      }
      
      console.log(`  Created profile for user ${userId}`);
    }
    
    return {
      success: true,
      userId
    };
  } catch (error) {
    console.error(`  ❌ Error creating account: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create all test accounts
 */
async function createAllTestAccounts() {
  console.log('🔑 Creating Test Accounts for InstaBids 🔑');
  console.log('==========================================');
  
  const results = [];
  
  for (const account of testAccounts) {
    const result = await createTestUser(account);
    results.push({
      ...account,
      success: result.success,
      userId: result.userId,
      error: result.error
    });
    
    // Add a newline between accounts
    console.log('');
  }
  
  // Print summary
  console.log('📋 Account Creation Summary');
  console.log('==========================');
  
  const successful = results.filter(r => r.success).length;
  console.log(`✅ Successfully created/verified ${successful} of ${testAccounts.length} accounts\n`);
  
  console.log('📝 Test Account Credentials:');
  console.log('---------------------------');
  results.forEach(account => {
    const status = account.success ? '✅' : '❌';
    console.log(`${status} ${account.userType}:`);
    console.log(`   Email: ${account.email}`);
    console.log(`   Password: ${account.password}`);
    if (account.userId) {
      console.log(`   User ID: ${account.userId}`);
    }
    console.log('');
  });
}

// Run the script
createAllTestAccounts()
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
