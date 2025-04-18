-- Permanent fix for user_roles management

-- First, fix existing duplicates (same as previous script)
-- Create a temporary table with the correct roles
CREATE TEMP TABLE IF NOT EXISTS correct_user_roles AS
SELECT DISTINCT ON (user_id) user_id, role
FROM user_roles
ORDER BY user_id, created_at DESC; -- Keep the most recent role for each user

-- Delete all existing roles
DELETE FROM user_roles;

-- Insert the correct roles back
INSERT INTO user_roles (user_id, role)
SELECT user_id, role FROM correct_user_roles;

-- Add a unique constraint to prevent future duplicates
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Create or replace function to manage user roles
CREATE OR REPLACE FUNCTION manage_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is an update to an existing user_id, the unique constraint will handle it
  -- This function mainly handles the automatic role assignment for new users
  
  -- For new users, check if they already have a role
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.user_id) THEN
    -- Determine the appropriate role based on user activity
    IF EXISTS (SELECT 1 FROM contractor_profiles WHERE user_id = NEW.user_id) THEN
      -- User has a contractor profile, set role to contractor
      NEW.role := 'contractor';
    ELSIF EXISTS (SELECT 1 FROM projects WHERE owner_id = NEW.user_id::TEXT) THEN
      -- User has created projects, set role to homeowner
      NEW.role := 'homeowner';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run before insert or update
DROP TRIGGER IF EXISTS before_user_role_change ON user_roles;
CREATE TRIGGER before_user_role_change
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION manage_user_role();

-- Create function to get or create user role
CREATE OR REPLACE FUNCTION get_or_create_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Check if user already has a role
  SELECT role INTO v_role FROM user_roles WHERE user_id = p_user_id;
  
  IF v_role IS NULL THEN
    -- Determine role based on user activity
    IF EXISTS (SELECT 1 FROM contractor_profiles WHERE user_id = p_user_id) THEN
      v_role := 'contractor';
    ELSIF EXISTS (SELECT 1 FROM projects WHERE owner_id = p_user_id::TEXT) THEN
      v_role := 'homeowner';
    ELSE
      v_role := 'homeowner'; -- Default to homeowner
    END IF;
    
    -- Insert the new role
    INSERT INTO user_roles (user_id, role) VALUES (p_user_id, v_role);
  END IF;
  
  RETURN v_role;
END;
$$ LANGUAGE plpgsql;

-- Drop existing function before creating new one
DROP FUNCTION IF EXISTS get_user_role(UUID);

-- Update the getUserRole function to call this database function
CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN get_or_create_user_role(p_user_id);
END;
$$ LANGUAGE plpgsql;