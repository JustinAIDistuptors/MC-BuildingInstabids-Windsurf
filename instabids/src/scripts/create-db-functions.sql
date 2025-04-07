-- Create Database Management Functions
-- This script creates Postgres functions that allow our application to manage the database remotely

-- Function to create the profiles table
CREATE OR REPLACE FUNCTION create_profiles_table()
RETURNS TEXT AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('homeowner', 'contractor', 'property-manager', 'labor-contractor', 'admin')),
    avatar_url TEXT,
    company_name TEXT,
    website TEXT,
    phone TEXT,
    bio TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
  );
  
  RETURN 'Profiles table created successfully';
EXCEPTION
  WHEN others THEN
    RETURN 'Error creating profiles table: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the projects table
CREATE OR REPLACE FUNCTION create_projects_table()
RETURNS TEXT AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'canceled')) DEFAULT 'draft',
    property_type TEXT NOT NULL,
    address TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
  );
  
  RETURN 'Projects table created successfully';
EXCEPTION
  WHEN others THEN
    RETURN 'Error creating projects table: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user signup handler
CREATE OR REPLACE FUNCTION create_user_handler()
RETURNS TEXT AS $$
BEGIN
  -- Create function to handle new user signup
  EXECUTE '
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS TRIGGER AS $trigger$
  BEGIN
    INSERT INTO profiles (id, full_name, user_type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>''full_name'', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>''user_type'', ''homeowner'')
    );
    RETURN NEW;
  END;
  $trigger$ LANGUAGE plpgsql;
  ';
  
  -- Create trigger to automatically create profile on signup
  EXECUTE '
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  ';
  
  RETURN 'User handler created successfully';
EXCEPTION
  WHEN others THEN
    RETURN 'Error creating user handler: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to list all tables
CREATE OR REPLACE FUNCTION list_tables()
RETURNS TABLE(table_name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::TEXT
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
  ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = check_table_exists.table_name
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create all required tables
CREATE OR REPLACE FUNCTION setup_database()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  -- Create profiles table
  result := create_profiles_table();
  IF result NOT LIKE 'Profiles table created successfully' THEN
    RETURN result;
  END IF;
  
  -- Create projects table
  result := create_projects_table();
  IF result NOT LIKE 'Projects table created successfully' THEN
    RETURN result;
  END IF;
  
  -- Create user handler
  result := create_user_handler();
  IF result NOT LIKE 'User handler created successfully' THEN
    RETURN result;
  END IF;
  
  RETURN 'Database setup completed successfully';
EXCEPTION
  WHEN others THEN
    RETURN 'Error setting up database: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
