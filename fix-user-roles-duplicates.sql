-- Fix duplicate user_roles entries

-- First, let's see all duplicates
SELECT user_id, COUNT(*) 
FROM user_roles 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- Create a temporary table with the correct roles
CREATE TEMP TABLE correct_user_roles AS
SELECT DISTINCT ON (user_id) user_id, role
FROM user_roles
ORDER BY user_id, created_at DESC; -- Keep the most recent role for each user

-- Delete all existing roles
DELETE FROM user_roles;

-- Insert the correct roles back
INSERT INTO user_roles (user_id, role)
SELECT user_id, role FROM correct_user_roles;

-- Add a unique constraint to prevent future duplicates
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Verify the fix
SELECT * FROM user_roles ORDER BY role;