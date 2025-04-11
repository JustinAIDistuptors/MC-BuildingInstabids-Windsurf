-- SQL script to completely disable RLS on ALL tables in ALL schemas

-- Disable RLS on all tables in the public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
        RAISE NOTICE 'Disabled RLS on public table: %', r.tablename;
    END LOOP;
END $$;

-- Disable RLS on all tables in the storage schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'storage'
    ) LOOP
        EXECUTE format('ALTER TABLE storage.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
        RAISE NOTICE 'Disabled RLS on storage table: %', r.tablename;
    END LOOP;
END $$;

-- Disable RLS on all tables in the auth schema
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'auth'
    ) LOOP
        EXECUTE format('ALTER TABLE auth.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
        RAISE NOTICE 'Disabled RLS on auth table: %', r.tablename;
    END LOOP;
END $$;

-- Specifically disable RLS on key storage tables
ALTER TABLE IF EXISTS storage.buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS storage.migrations DISABLE ROW LEVEL SECURITY;

-- Drop all policies from storage tables
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop policies from storage.buckets
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'buckets'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.buckets;', r.policyname);
        RAISE NOTICE 'Dropped policy % from storage.buckets', r.policyname;
    END LOOP;

    -- Drop policies from storage.objects
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', r.policyname);
        RAISE NOTICE 'Dropped policy % from storage.objects', r.policyname;
    END LOOP;
END $$;

-- Create the projectmedia bucket if it doesn't exist (with no RLS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'projectmedia'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('projectmedia', 'projectmedia', true);
    RAISE NOTICE 'Created projectmedia bucket with public access';
  END IF;
END $$;

-- Drop all RLS policies on all schema tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy: % on table %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- List all remaining policies (should be empty for all schemas)
SELECT 
    schemaname, 
    tablename, 
    policyname
FROM 
    pg_policies
ORDER BY 
    tablename;
