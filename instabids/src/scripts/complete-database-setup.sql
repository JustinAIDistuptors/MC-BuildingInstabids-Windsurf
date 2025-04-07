-- Complete database setup script for InstaBids
-- Copy and paste this entire script into the Supabase SQL Editor
-- This will create all needed tables, functions, and test users

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
CREATE POLICY "Service role can manage all profiles"
    ON profiles
    USING (auth.role() = 'service_role');

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_type TEXT NOT NULL,
    budget DECIMAL(12,2),
    location TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
    ON projects
    FOR SELECT
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
CREATE POLICY "Users can create their own projects"
    ON projects
    FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
    ON projects
    FOR UPDATE
    USING (auth.uid() = owner_id);
    
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
    ON projects
    FOR DELETE
    USING (auth.uid() = owner_id);
    
DROP POLICY IF EXISTS "Service role can manage all projects" ON projects;
CREATE POLICY "Service role can manage all projects"
    ON projects
    USING (auth.role() = 'service_role');

-- Create trigger function for user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, user_type)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'user_type', 'homeowner')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to create profiles for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create the check_table_exists function
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = check_table_exists.table_name
    ) INTO exists;
    
    RETURN exists;
END;
$$;

-- Create the create_profiles_table function
CREATE OR REPLACE FUNCTION create_profiles_table()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT,
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
    CREATE POLICY "Users can view their own profile"
        ON profiles
        FOR SELECT
        USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
    CREATE POLICY "Users can update their own profile"
        ON profiles
        FOR UPDATE
        USING (auth.uid() = id);
    
    DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
    CREATE POLICY "Service role can manage all profiles"
        ON profiles
        USING (auth.role() = 'service_role');
    
    RETURN 'Profiles table created successfully';
END;
$$;

-- Create the create_projects_table function
CREATE OR REPLACE FUNCTION create_projects_table()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        project_type TEXT NOT NULL,
        budget DECIMAL(12,2),
        location TEXT,
        start_date DATE,
        end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
    CREATE POLICY "Users can view their own projects"
        ON projects
        FOR SELECT
        USING (auth.uid() = owner_id);
    
    DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
    CREATE POLICY "Users can create their own projects"
        ON projects
        FOR INSERT
        WITH CHECK (auth.uid() = owner_id);
    
    DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
    CREATE POLICY "Users can update their own projects"
        ON projects
        FOR UPDATE
        USING (auth.uid() = owner_id);
        
    DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
    CREATE POLICY "Users can delete their own projects"
        ON projects
        FOR DELETE
        USING (auth.uid() = owner_id);
        
    DROP POLICY IF EXISTS "Service role can manage all projects" ON projects;
    CREATE POLICY "Service role can manage all projects"
        ON projects
        USING (auth.role() = 'service_role');
    
    RETURN 'Projects table created successfully';
END;
$$;

-- Create helper to create users programmatically
CREATE OR REPLACE FUNCTION create_test_user(
    email text,
    password text,
    full_name text,
    user_type text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id uuid;
BEGIN
    -- Create user in auth.users
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
    )
    VALUES (
        (SELECT instance_id FROM auth.instances LIMIT 1),
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        email,
        crypt(password, gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object('full_name', full_name, 'user_type', user_type),
        now(),
        now()
    )
    RETURNING id INTO user_id;
    
    -- User has been created via the trigger function
    
    RETURN 'Test user created with ID: ' || user_id::text;
EXCEPTION WHEN unique_violation THEN
    RETURN 'User already exists with email: ' || email;
WHEN OTHERS THEN
    RETURN 'Error creating test user: ' || SQLERRM;
END;
$$;

-- Create all test users
SELECT create_test_user('homeowner@instabids.com', 'Password123!', 'Henry Homeowner', 'homeowner');
SELECT create_test_user('contractor@instabids.com', 'Password123!', 'Carl Contractor', 'contractor');
SELECT create_test_user('property@instabids.com', 'Password123!', 'Patty PropertyManager', 'property-manager');
SELECT create_test_user('labor@instabids.com', 'Password123!', 'Larry LaborContractor', 'labor-contractor');
SELECT create_test_user('admin@instabids.com', 'Password123!', 'Adam Admin', 'admin');
