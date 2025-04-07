/**
 * InstaBids Database Setup Script
 * 
 * This script establishes the core database schema for InstaBids following
 * the domain-driven design approach outlined in our architectural documentation.
 * 
 * Run with: node scripts/setup-database.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Admin Client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Execute database setup
 */
async function setupDatabase() {
  console.log('Starting InstaBids database setup...');
  
  try {
    // 1. Create database schemas
    await createSchemas();
    
    // 2. Create tables in each schema
    await createCoreTables();
    
    // 3. Setup RLS policies
    await setupRowLevelSecurity();

    console.log('✅ Database setup completed successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Create schemas for domain separation
 */
async function createSchemas() {
  console.log('Creating schemas...');
  
  const schemas = ['users', 'bidding', 'projects', 'messaging'];
  
  for (const schema of schemas) {
    console.log(`Creating schema: ${schema}`);
    const { error } = await supabase.rpc('create_schema_if_not_exists', { 
      schema_name: schema 
    });
    
    if (error) throw error;
  }
}

/**
 * Create core tables in each schema
 */
async function createCoreTables() {
  console.log('Creating core tables...');
  
  // Users Schema Tables
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS users.profiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      username TEXT UNIQUE,
      display_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      type TEXT CHECK (type IN ('homeowner', 'contractor', 'helper', 'admin')),
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
  `);
  
  // Projects Schema Tables
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS projects.details (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT,
      owner_id UUID REFERENCES users.profiles(id) NOT NULL,
      status TEXT CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'cancelled')) DEFAULT 'draft',
      budget_min DECIMAL(10,2),
      budget_max DECIMAL(10,2),
      location TEXT,
      location_coordinates POINT,
      start_date TIMESTAMP WITH TIME ZONE,
      end_date TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
  `);
  
  // Bidding Schema Tables
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS bidding.submissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects.details(id) NOT NULL,
      contractor_id UUID REFERENCES users.profiles(id) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      estimated_duration INTEGER,
      duration_unit TEXT CHECK (duration_unit IN ('hours', 'days', 'weeks', 'months')),
      status TEXT CHECK (status IN ('submitted', 'accepted', 'rejected', 'withdrawn')) DEFAULT 'submitted',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      UNIQUE(project_id, contractor_id)
    );
  `);
  
  // Messaging Schema Tables
  await executeSQL(`
    CREATE TABLE IF NOT EXISTS messaging.conversations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES projects.details(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
    
    CREATE TABLE IF NOT EXISTS messaging.participants (
      conversation_id UUID REFERENCES messaging.conversations(id) NOT NULL,
      user_id UUID REFERENCES users.profiles(id) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      PRIMARY KEY (conversation_id, user_id)
    );
    
    CREATE TABLE IF NOT EXISTS messaging.messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id UUID REFERENCES messaging.conversations(id) NOT NULL,
      user_id UUID REFERENCES users.profiles(id) NOT NULL,
      content TEXT NOT NULL,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );
  `);
}

/**
 * Setup Row Level Security policies
 */
async function setupRowLevelSecurity() {
  console.log('Setting up Row Level Security policies...');
  
  // Enable RLS on all tables
  const tables = [
    'users.profiles',
    'projects.details',
    'bidding.submissions',
    'messaging.conversations',
    'messaging.participants',
    'messaging.messages'
  ];
  
  for (const table of tables) {
    await executeSQL(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
  }
  
  // User profiles policies
  await executeSQL(`
    -- Everyone can view profiles
    CREATE POLICY "Public profiles are viewable by everyone" 
    ON users.profiles FOR SELECT USING (true);
    
    -- Users can update their own profiles
    CREATE POLICY "Users can update their own profiles" 
    ON users.profiles FOR UPDATE USING (auth.uid() = id);
  `);
  
  // Project details policies
  await executeSQL(`
    -- Everyone can view projects
    CREATE POLICY "Projects are viewable by everyone"
    ON projects.details FOR SELECT USING (true);
    
    -- Only project owners can update their projects
    CREATE POLICY "Project owners can update their projects"
    ON projects.details FOR UPDATE USING (auth.uid() = owner_id);
    
    -- Only project owners can delete their projects
    CREATE POLICY "Project owners can delete their projects"
    ON projects.details FOR DELETE USING (auth.uid() = owner_id);
    
    -- Any authenticated user can create projects
    CREATE POLICY "Authenticated users can create projects"
    ON projects.details FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  `);
  
  // Bidding submissions policies
  await executeSQL(`
    -- Project owners and bid creators can view bids
    CREATE POLICY "Project owners and bid creators can view bids"
    ON bidding.submissions FOR SELECT USING (
      auth.uid() IN (
        SELECT owner_id FROM projects.details WHERE id = project_id
      ) OR auth.uid() = contractor_id
    );
    
    -- Contractors can create bids
    CREATE POLICY "Contractors can create bids"
    ON bidding.submissions FOR INSERT WITH CHECK (
      auth.uid() = contractor_id AND
      auth.uid() IN (
        SELECT id FROM users.profiles WHERE type = 'contractor'
      )
    );
    
    -- Contractors can update their own bids
    CREATE POLICY "Contractors can update their own bids"
    ON bidding.submissions FOR UPDATE USING (
      auth.uid() = contractor_id AND
      status = 'submitted'
    );
  `);
  
  // Messaging policies
  await executeSQL(`
    -- Participants can view conversations
    CREATE POLICY "Participants can view conversations"
    ON messaging.conversations FOR SELECT USING (
      auth.uid() IN (
        SELECT user_id FROM messaging.participants 
        WHERE conversation_id = id
      )
    );
    
    -- Participants can view messages
    CREATE POLICY "Participants can view messages"
    ON messaging.messages FOR SELECT USING (
      auth.uid() IN (
        SELECT user_id FROM messaging.participants 
        WHERE conversation_id = messaging.messages.conversation_id
      )
    );
    
    -- Participants can send messages
    CREATE POLICY "Participants can send messages"
    ON messaging.messages FOR INSERT WITH CHECK (
      auth.uid() = user_id AND
      auth.uid() IN (
        SELECT user_id FROM messaging.participants 
        WHERE conversation_id = messaging.messages.conversation_id
      )
    );
  `);
}

/**
 * Execute SQL with error handling
 */
async function executeSQL(sql) {
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) throw error;
}

// Run the setup
setupDatabase();
