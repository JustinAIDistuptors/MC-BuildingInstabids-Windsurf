-- Function to execute arbitrary SQL queries safely
-- This is required for the Supabase MCP server to work properly

CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Execute the query and capture the results as JSON
  EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE,
      'query', sql_query
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql TO anon;
GRANT EXECUTE ON FUNCTION execute_sql TO service_role;

-- Comment on the function
COMMENT ON FUNCTION execute_sql IS 'Executes arbitrary SQL queries and returns results as JSONB. Use with caution as this has elevated privileges.';
