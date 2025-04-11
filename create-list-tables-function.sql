-- Function to list all tables in the public schema
-- This is required for the Supabase MCP server to work properly

CREATE OR REPLACE FUNCTION list_tables()
RETURNS TABLE (table_name text)
LANGUAGE sql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
  SELECT table_name::text 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
  ORDER BY table_name;
$$;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION list_tables TO authenticated;
GRANT EXECUTE ON FUNCTION list_tables TO anon;
GRANT EXECUTE ON FUNCTION list_tables TO service_role;

-- Comment on the function
COMMENT ON FUNCTION list_tables IS 'Lists all tables in the public schema';
