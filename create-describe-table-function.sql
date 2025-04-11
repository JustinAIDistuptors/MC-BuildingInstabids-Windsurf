-- Function to describe a table's structure
-- This is required for the Supabase MCP server to work properly

CREATE OR REPLACE FUNCTION describe_table(table_name text)
RETURNS TABLE (
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
LANGUAGE sql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
  SELECT 
    column_name::text,
    data_type::text,
    is_nullable::text,
    column_default::text
  FROM 
    information_schema.columns
  WHERE 
    table_schema = 'public' 
    AND table_name = describe_table.table_name
  ORDER BY 
    ordinal_position;
$$;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION describe_table TO authenticated;
GRANT EXECUTE ON FUNCTION describe_table TO anon;
GRANT EXECUTE ON FUNCTION describe_table TO service_role;

-- Comment on the function
COMMENT ON FUNCTION describe_table IS 'Describes the structure of a table in the public schema';
