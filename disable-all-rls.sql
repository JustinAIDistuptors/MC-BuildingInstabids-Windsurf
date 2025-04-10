-- SQL script to disable RLS on all tables in the database

-- Disable RLS on messages table
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Disable RLS on attachments table
ALTER TABLE public.attachments DISABLE ROW LEVEL SECURITY;

-- Disable RLS on all other tables in public schema only
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN ('messages', 'attachments')
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', r.tablename);
        RAISE NOTICE 'Disabled RLS on table: %', r.tablename;
    END LOOP;
END $$;

-- Drop all RLS policies on public schema tables only
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy: % on table %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- List all remaining policies (should be empty for public schema)
SELECT 
    schemaname, 
    tablename, 
    policyname
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename;
