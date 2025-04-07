/**
 * Create Mock Profiles for InstaBids
 * 
 * This script creates demo users for each role in the InstaBids platform:
 * - Homeowner
 * - Contractor
 * - Property Manager
 * - Labor Contractor
 * - Admin
 * 
 * These accounts can be used for testing and demo purposes.
 */

const { createUser } = require('../lib/supabase/db-admin');

// Mock users to create
const mockUsers = [
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

async function createMockProfiles() {
  console.log('🧪 Creating Mock Profiles for InstaBids 🧪');
  console.log('----------------------------------------');
  
  for (const user of mockUsers) {
    console.log(`\nCreating ${user.userType} account: ${user.email}`);
    
    try {
      const result = await createUser(user);
      
      if (result.success) {
        console.log(`✅ Successfully created ${user.userType} account!`);
        console.log(`   User ID: ${result.user.id}`);
      } else {
        console.log(`❌ Failed to create ${user.userType} account: ${result.error?.message}`);
        
        // Check if user already exists
        if (result.error?.message?.includes('already exists')) {
          console.log('   Account already exists, skipping...');
        }
      }
    } catch (error) {
      console.error(`❌ Error creating ${user.userType} account:`, error.message);
    }
  }
  
  console.log('\n✅ Mock profile creation complete!');
  console.log('\n📝 Login Credentials Summary:');
  console.log('---------------------------');
  
  for (const user of mockUsers) {
    console.log(`${user.userType}:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Password: ${user.password}`);
    console.log('');
  }
}

// Execute the function
createMockProfiles().catch(console.error);
