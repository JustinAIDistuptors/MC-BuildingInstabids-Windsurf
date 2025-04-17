/**
 * Supabase Database Administration Utility
 * 
 * This utility provides functions to:
 * 1. Check table existence
 * 2. Create tables
 * 3. View table data
 * 4. Run migrations
 * 5. Debug database issues
 * 
 * It uses Postgres functions we've created in Supabase to directly
 * manage the database remotely.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Check if a table exists in Supabase using our custom function
 * @param {string} tableName - Name of the table to check
 * @returns {Promise<boolean>} - True if table exists, false otherwise
 */
async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase.rpc('check_table_exists', {
      table_name: tableName
    });
    
    if (error) {
      console.error(`Error checking if table '${tableName}' exists:`, error.message);
      return false;
    }
    
    if (data) {
      console.log(`Table '${tableName}' exists.`);
    } else {
      console.log(`Table '${tableName}' does not exist.`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error checking if table '${tableName}' exists:`, error.message);
    // Fall back to the REST API if RPC fails
    try {
      const { error } = await supabase.from(tableName).select('*').limit(1);
      
      if (error && error.message.includes('does not exist')) {
        console.log(`Table '${tableName}' does not exist.`);
        return false;
      }
      
      console.log(`Table '${tableName}' exists.`);
      return true;
    } catch (err) {
      return false;
    }
  }
}

/**
 * List all tables in the database using our custom function
 * @returns {Promise<string[]>} - Array of table names
 */
async function listTables() {
  try {
    const { data, error } = await supabase.rpc('list_tables');
    
    if (error) {
      console.error('Error listing tables:', error.message);
      return [];
    }
    
    return data.map(item => item.table_name);
  } catch (error) {
    console.error('Error listing tables:', error.message);
    
    // Fall back to checking known tables
    const knownTables = [
      'profiles',
      'projects',
      'project_attachments',
      'bids',
      'bid_attachments',
      'messages',
      'reviews',
      'contractor_specialties'
    ];
    
    const existingTables = [];
    
    for (const tableName of knownTables) {
      const exists = await checkTableExists(tableName);
      if (exists) {
        existingTables.push(tableName);
      }
    }
    
    return existingTables;
  }
}

/**
 * Create the profiles table using our custom function
 * @returns {Promise<string>} - Message indicating success or failure
 */
async function createProfilesTable() {
  try {
    const { data, error } = await supabase.rpc('create_profiles_table');
    
    if (error) {
      console.error('Error creating profiles table:', error.message);
      return error.message;
    }
    
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error creating profiles table:', error.message);
    return error.message;
  }
}

/**
 * Create the projects table using our custom function
 * @returns {Promise<string>} - Message indicating success or failure
 */
async function createProjectsTable() {
  try {
    const { data, error } = await supabase.rpc('create_projects_table');
    
    if (error) {
      console.error('Error creating projects table:', error.message);
      return error.message;
    }
    
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error creating projects table:', error.message);
    return error.message;
  }
}

/**
 * Create the user signup handler using our custom function
 * @returns {Promise<string>} - Message indicating success or failure
 */
async function createUserHandler() {
  try {
    const { data, error } = await supabase.rpc('create_user_handler');
    
    if (error) {
      console.error('Error creating user handler:', error.message);
      return error.message;
    }
    
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error creating user handler:', error.message);
    return error.message;
  }
}

/**
 * Setup the database by creating all required tables using our main function
 * @returns {Promise<string>} - Message indicating success or failure
 */
async function setupDatabase() {
  console.log('🔧 InstaBids Database Setup 🔧');
  console.log('------------------------------');
  
  try {
    // First check if we can use our custom function
    const { data, error } = await supabase.rpc('setup_database');
    
    if (error) {
      console.error('Error setting up database using function:', error.message);
      console.log('Falling back to manual setup...');
      
      // Call each function individually
      const profilesResult = await createProfilesTable();
      console.log('Profiles table setup:', profilesResult);
      
      const projectsResult = await createProjectsTable();
      console.log('Projects table setup:', projectsResult);
      
      const handlerResult = await createUserHandler();
      console.log('User handler setup:', handlerResult);
      
      return 'Database setup completed with manual steps';
    }
    
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error setting up database:', error.message);
    return error.message;
  }
}

/**
 * View data in a table
 * @param {string} tableName - Name of the table to view
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<object[]>} - Array of records
 */
async function viewTableData(tableName, limit = 10) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit);
      
    if (error) {
      console.error(`Error viewing data in table '${tableName}':`, error.message);
      return [];
    }
    
    console.log(`Data in table '${tableName}' (${data.length} records):`);
    console.log(data);
    
    return data;
  } catch (error) {
    console.error(`Error viewing data in table '${tableName}':`, error.message);
    return [];
  }
}

/**
 * Create a user in Supabase and add a profile
 * @param {object} userData - User data including email, password, fullName, userType
 * @returns {Promise<object>} - Created user data
 */
async function createUser({ email, password, fullName, userType }) {
  try {
    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        user_type: userType
      }
    });
    
    if (authError) {
      console.error('Error creating user in Auth:', authError.message);
      return { success: false, error: authError };
    }
    
    const userId = authData.user.id;
    
    // 2. Check if trigger created the profile
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    // 3. If trigger didn't work, manually create profile
    if (profileError || !profile) {
      const { data: manualProfile, error: manualError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          full_name: fullName,
          user_type: userType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
        
      if (manualError) {
        console.error('Error creating profile:', manualError.message);
        return { success: false, error: manualError, user: authData.user };
      }
      
      profile = manualProfile[0];
    }
    
    return { 
      success: true, 
      user: authData.user,
      profile
    };
  } catch (error) {
    console.error('Error creating user:', error.message);
    return { success: false, error };
  }
}

/**
 * Get user profile by email
 * @param {string} email - User email
 * @returns {Promise<object|null>} - User profile or null if not found
 */
async function getUserByEmail(email) {
  try {
    // First get the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError.message);
      return null;
    }
    
    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      console.log(`User with email '${email}' not found.`);
      return null;
    }
    
    // Then get their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError.message);
      return { user, profile: null };
    }
    
    return { user, profile };
  } catch (error) {
    console.error('Error getting user by email:', error.message);
    return null;
  }
}

// Export all the utility functions
module.exports = {
  checkTableExists,
  createProfilesTable,
  createProjectsTable,
  createUserHandler,
  listTables,
  viewTableData,
  createUser,
  getUserByEmail,
  setupDatabase,
  supabase
};
