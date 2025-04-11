-- SQL functions for project operations in Supabase

-- Function to create a new project
CREATE OR REPLACE FUNCTION create_project(
  p_owner_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_status TEXT DEFAULT 'draft',
  p_budget_min NUMERIC DEFAULT NULL,
  p_budget_max NUMERIC DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_timeline_start TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_timeline_end TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL,
  p_image_urls TEXT[] DEFAULT NULL,
  p_is_featured BOOLEAN DEFAULT FALSE,
  p_is_dream_project BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_result JSONB;
BEGIN
  -- Insert the project
  INSERT INTO projects (
    owner_id, title, description, status, 
    budget_min, budget_max, location, 
    timeline_start, timeline_end, category, 
    tags, image_urls, is_featured, is_dream_project
  ) VALUES (
    p_owner_id, p_title, p_description, p_status, 
    p_budget_min, p_budget_max, p_location, 
    p_timeline_start, p_timeline_end, p_category, 
    p_tags, p_image_urls, p_is_featured, p_is_dream_project
  )
  RETURNING id INTO v_project_id;
  
  -- Get the created project
  SELECT jsonb_build_object(
    'id', p.id,
    'owner_id', p.owner_id,
    'title', p.title,
    'description', p.description,
    'status', p.status,
    'budget_min', p.budget_min,
    'budget_max', p.budget_max,
    'location', p.location,
    'timeline_start', p.timeline_start,
    'timeline_end', p.timeline_end,
    'category', p.category,
    'tags', p.tags,
    'image_urls', p.image_urls,
    'is_featured', p.is_featured,
    'is_dream_project', p.is_dream_project,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) INTO v_result
  FROM projects p
  WHERE p.id = v_project_id;
  
  RETURN v_result;
END;
$$;

-- Function to update a project
CREATE OR REPLACE FUNCTION update_project(
  p_project_id UUID,
  p_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_sql TEXT;
  v_owner_id UUID;
BEGIN
  -- Check if the project exists
  SELECT owner_id INTO v_owner_id FROM projects WHERE id = p_project_id;
  
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Project not found');
  END IF;
  
  -- Build dynamic SQL for the update
  v_sql := 'UPDATE projects SET updated_at = NOW()';
  
  -- Add fields to update based on the provided data
  IF p_data ? 'title' THEN
    v_sql := v_sql || ', title = ' || quote_literal(p_data->>'title');
  END IF;
  
  IF p_data ? 'description' THEN
    v_sql := v_sql || ', description = ' || quote_literal(p_data->>'description');
  END IF;
  
  IF p_data ? 'status' THEN
    v_sql := v_sql || ', status = ' || quote_literal(p_data->>'status');
  END IF;
  
  IF p_data ? 'budget_min' THEN
    v_sql := v_sql || ', budget_min = ' || quote_nullable(p_data->>'budget_min');
  END IF;
  
  IF p_data ? 'budget_max' THEN
    v_sql := v_sql || ', budget_max = ' || quote_nullable(p_data->>'budget_max');
  END IF;
  
  IF p_data ? 'location' THEN
    v_sql := v_sql || ', location = ' || quote_nullable(p_data->>'location');
  END IF;
  
  IF p_data ? 'timeline_start' THEN
    v_sql := v_sql || ', timeline_start = ' || quote_nullable(p_data->>'timeline_start');
  END IF;
  
  IF p_data ? 'timeline_end' THEN
    v_sql := v_sql || ', timeline_end = ' || quote_nullable(p_data->>'timeline_end');
  END IF;
  
  IF p_data ? 'category' THEN
    v_sql := v_sql || ', category = ' || quote_nullable(p_data->>'category');
  END IF;
  
  IF p_data ? 'tags' AND jsonb_typeof(p_data->'tags') = 'array' THEN
    v_sql := v_sql || ', tags = ' || quote_nullable(p_data->'tags'::TEXT);
  END IF;
  
  IF p_data ? 'image_urls' AND jsonb_typeof(p_data->'image_urls') = 'array' THEN
    v_sql := v_sql || ', image_urls = ' || quote_nullable(p_data->'image_urls'::TEXT);
  END IF;
  
  IF p_data ? 'is_featured' THEN
    v_sql := v_sql || ', is_featured = ' || (p_data->>'is_featured')::BOOLEAN;
  END IF;
  
  IF p_data ? 'is_dream_project' THEN
    v_sql := v_sql || ', is_dream_project = ' || (p_data->>'is_dream_project')::BOOLEAN;
  END IF;
  
  -- Complete the SQL statement
  v_sql := v_sql || ' WHERE id = ' || quote_literal(p_project_id) || ' RETURNING *';
  
  -- Execute the update
  EXECUTE v_sql INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to delete a project
CREATE OR REPLACE FUNCTION delete_project(
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if the project exists
  SELECT EXISTS(SELECT 1 FROM projects WHERE id = p_project_id) INTO v_exists;
  
  IF NOT v_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Delete the project
  DELETE FROM projects WHERE id = p_project_id;
  
  RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_project TO authenticated;
GRANT EXECUTE ON FUNCTION create_project TO service_role;

GRANT EXECUTE ON FUNCTION update_project TO authenticated;
GRANT EXECUTE ON FUNCTION update_project TO service_role;

GRANT EXECUTE ON FUNCTION delete_project TO authenticated;
GRANT EXECUTE ON FUNCTION delete_project TO service_role;

-- Add comments
COMMENT ON FUNCTION create_project IS 'Creates a new project with the provided details';
COMMENT ON FUNCTION update_project IS 'Updates a project with the provided data';
COMMENT ON FUNCTION delete_project IS 'Deletes a project by ID';
