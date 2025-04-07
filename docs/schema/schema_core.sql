-- =============================================================================
-- INSTABIDS CORE DATABASE SCHEMA
-- =============================================================================
-- Priority: P0 - Critical for core system development
--
-- This schema defines the foundational tables required by all domains,
-- including user management, authentication, and shared lookup tables.
-- 
-- Dependencies:
--   None - This is the foundation for all other schemas
--
-- Extension Points:
--   - User profiles are extensible through domain-specific tables
--   - Location model supports future geospatial features
--   - Status tracking follows consistent patterns across all domains
-- =============================================================================

-- -----------------------------------------------------------------------------
-- DATABASE CONFIGURATION
-- -----------------------------------------------------------------------------

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "postgis";        -- For geospatial features
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- For encryption functions

-- -----------------------------------------------------------------------------
-- USER MANAGEMENT TABLES
-- -----------------------------------------------------------------------------

-- Core users table - foundational entity for all user types
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,                       -- Stored securely using pgcrypto
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'active', 'suspended', 'deleted'
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  locale TEXT DEFAULT 'en-US',
  metadata JSONB DEFAULT '{}'::jsonb,       -- Extensible user metadata
  
  -- Ensure status values are valid
  CONSTRAINT users_status_check CHECK (status IN ('pending', 'active', 'suspended', 'deleted'))
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on phone for faster lookups
CREATE INDEX idx_users_phone ON users(phone);

-- Create index on status for filtering active users
CREATE INDEX idx_users_status ON users(status);

-- Create index on created_at for reporting and analytics
CREATE INDEX idx_users_created_at ON users(created_at);

-- User types junction table - allows users to have multiple roles
CREATE TABLE user_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                        -- 'homeowner', 'contractor', 'property_manager', 'admin', 'labor_helper'
  is_primary BOOLEAN DEFAULT false,          -- Is this the user's primary type?
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure type values are valid
  CONSTRAINT user_types_type_check CHECK (type IN (
    'homeowner', 'contractor', 'property_manager', 'admin', 'labor_helper'
  )),
  
  -- Ensure uniqueness of user_id and type combinations
  UNIQUE(user_id, type)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_types_user_id ON user_types(user_id);

-- Create index on type for filtering by user type
CREATE INDEX idx_user_types_type ON user_types(type);

-- User authentication table - stores refresh tokens and auth sessions
CREATE TABLE user_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token TEXT UNIQUE,
  token_expires_at TIMESTAMPTZ,
  device_info JSONB DEFAULT '{}'::jsonb,     -- Information about the device used for login
  ip_address TEXT,                           -- IP address of the authentication request
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  
  -- Create index on user_id for faster lookups
  CONSTRAINT user_auth_user_idx UNIQUE(user_id, refresh_token)
);

-- Create index on token for faster lookups
CREATE INDEX idx_user_auth_token ON user_auth(refresh_token);

-- Create index on revoked status
CREATE INDEX idx_user_auth_revoked ON user_auth(revoked);

-- User addresses table - reusable across domains for location information
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_type TEXT NOT NULL,                -- 'home', 'work', 'billing', 'mailing', etc.
  is_primary BOOLEAN DEFAULT false,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'US',
  latitude DECIMAL(10, 8),                  -- For geospatial features
  longitude DECIMAL(11, 8),                 -- For geospatial features
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified BOOLEAN DEFAULT false,           -- Has this address been verified?
  
  -- Ensure address_type values are valid
  CONSTRAINT user_addresses_type_check CHECK (address_type IN (
    'home', 'work', 'billing', 'mailing', 'service'
  ))
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);

-- Create spatial index for geolocation queries
CREATE INDEX idx_user_addresses_location ON user_addresses USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Create index on zip code for regional queries
CREATE INDEX idx_user_addresses_zip ON user_addresses(zip_code);

-- User notification preferences - controls communication channels
CREATE TABLE user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,                     -- 'email', 'sms', 'push', 'in_app'
  notification_type TEXT NOT NULL,           -- 'bid_updates', 'messages', 'payment_updates', etc.
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure channel values are valid
  CONSTRAINT user_notif_channel_check CHECK (channel IN (
    'email', 'sms', 'push', 'in_app'
  )),
  
  -- Ensure uniqueness of user_id, channel, and notification_type
  UNIQUE(user_id, channel, notification_type)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_user_notif_prefs_user_id ON user_notification_preferences(user_id);

-- -----------------------------------------------------------------------------
-- LOCATION TABLES
-- -----------------------------------------------------------------------------

-- ZIP codes table - used for geographic queries and matching
CREATE TABLE zip_codes (
  code TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timezone TEXT,
  dst BOOLEAN,
  country TEXT DEFAULT 'US'
);

-- Create spatial index for geolocation queries
CREATE INDEX idx_zip_codes_location ON zip_codes USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Create index on state for regional queries
CREATE INDEX idx_zip_codes_state ON zip_codes(state);

-- Service areas table - defines regions where contractors operate
CREATE TABLE service_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                        -- Human-readable name (e.g., "Bay Area")
  zip_codes TEXT[] NOT NULL,                 -- Array of ZIP codes in this service area
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on zip_codes for containment queries
CREATE INDEX idx_service_areas_zip_codes ON service_areas USING GIN(zip_codes);

-- -----------------------------------------------------------------------------
-- COMMON LOOKUP TABLES
-- -----------------------------------------------------------------------------

-- System settings table - global configuration values
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,           -- Can this be exposed to client apps?
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on setting_key for faster lookups
CREATE INDEX idx_system_settings_key ON system_settings(setting_key);

-- Tags table - reusable across domains for categorization
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,                    -- Domain or feature this tag belongs to
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, category)
);

-- Create index on category for filtering
CREATE INDEX idx_tags_category ON tags(category);

-- Job categories table - top level job categorization
CREATE TABLE job_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                                 -- Icon reference or URL
  display_order INTEGER DEFAULT 0,
  parent_category_id UUID REFERENCES job_categories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on parent_category_id for hierarchical queries
CREATE INDEX idx_job_categories_parent ON job_categories(parent_category_id);

-- Job types table - specific job types within categories
CREATE TABLE job_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES job_categories(id),
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,                                 -- Icon reference or URL
  estimated_duration_days INTEGER,           -- Typical duration for this job type
  complexity_level TEXT,                     -- 'simple', 'moderate', 'complex'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure each job type has a unique name within its category
  UNIQUE(category_id, name)
);

-- Create index on category_id for faster lookups
CREATE INDEX idx_job_types_category ON job_types(category_id);

-- -----------------------------------------------------------------------------
-- TRACKING AND ANALYTICS TABLES
-- -----------------------------------------------------------------------------

-- Audit log table - system-wide action tracking
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),         -- Can be NULL for system actions
  action TEXT NOT NULL,                      -- The action performed
  entity_type TEXT NOT NULL,                 -- The type of entity affected
  entity_id UUID NOT NULL,                   -- The ID of the entity affected
  change_data JSONB,                         -- The data that was changed
  ip_address TEXT,                           -- Origin IP of the action
  user_agent TEXT,                           -- Browser/client info
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for user activity queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);

-- Create index on entity_type and entity_id for entity history queries
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Create index on action for filtering by action type
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Create index on created_at for time-based queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Feature flags table - controls feature availability
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_key TEXT UNIQUE NOT NULL,             -- Unique identifier for the flag
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  user_group_filters JSONB,                  -- Rules for which users see this feature
  percentage_rollout INTEGER,                -- 0-100 value for gradual rollout
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on flag_key for faster lookups
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key);

-- -----------------------------------------------------------------------------
-- SUPABASE RLS POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE zip_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY users_read_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_read_public ON users
  FOR SELECT USING (true);

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- User types policies
CREATE POLICY user_types_read_own ON user_types
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_types_read_admin ON user_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_types ut
      WHERE ut.user_id = auth.uid() AND ut.type = 'admin'
    )
  );

-- User addresses policies
CREATE POLICY user_addresses_read_own ON user_addresses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_addresses_insert_own ON user_addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_addresses_update_own ON user_addresses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_addresses_delete_own ON user_addresses
  FOR DELETE USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY user_notif_prefs_read_own ON user_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_notif_prefs_insert_own ON user_notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_notif_prefs_update_own ON user_notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Lookup table policies (public read access)
CREATE POLICY zip_codes_read_all ON zip_codes
  FOR SELECT USING (true);

CREATE POLICY service_areas_read_all ON service_areas
  FOR SELECT USING (true);

CREATE POLICY job_categories_read_all ON job_categories
  FOR SELECT USING (true);

CREATE POLICY job_types_read_all ON job_types
  FOR SELECT USING (true);

CREATE POLICY tags_read_all ON tags
  FOR SELECT USING (true);

-- System settings policies
CREATE POLICY system_settings_read_public ON system_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY system_settings_read_admin ON system_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_types ut
      WHERE ut.user_id = auth.uid() AND ut.type = 'admin'
    )
  );

-- Feature flags policies
CREATE POLICY feature_flags_read_all ON feature_flags
  FOR SELECT USING (true);

-- -----------------------------------------------------------------------------
-- DATABASE TRIGGERS
-- -----------------------------------------------------------------------------

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables with updated_at column
CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_addresses_timestamp
BEFORE UPDATE ON user_addresses
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_service_areas_timestamp
BEFORE UPDATE ON service_areas
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_system_settings_timestamp
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_feature_flags_timestamp
BEFORE UPDATE ON feature_flags
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id, change_data
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    CASE
      WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
    END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply the audit logging trigger to critical tables
CREATE TRIGGER users_audit_log
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

CREATE TRIGGER user_types_audit_log
AFTER INSERT OR UPDATE OR DELETE ON user_types
FOR EACH ROW EXECUTE FUNCTION log_audit_event();

-- -----------------------------------------------------------------------------
-- INITIAL DATA
-- -----------------------------------------------------------------------------

-- Initial job categories
INSERT INTO job_categories (name, display_name, description, icon, display_order)
VALUES
  ('one_off', 'One-Time Project', 'Single occurrence projects with a defined scope and end', 'clock', 1),
  ('ongoing', 'Ongoing Service', 'Recurring projects that happen on a schedule', 'repeat', 2),
  ('repair', 'Repair', 'Fixing or restoring something that is damaged or broken', 'tools', 3),
  ('maintenance', 'Maintenance', 'Regular upkeep to prevent issues', 'wrench', 4),
  ('consultation', 'Consultation', 'Professional advice and planning', 'clipboard', 5);

-- Initial feature flags
INSERT INTO feature_flags (flag_key, description, enabled)
VALUES
  ('group_bidding', 'Enable group bidding functionality', true),
  ('labor_marketplace', 'Enable labor-only marketplace', false),
  ('dream_projects', 'Enable dream projects functionality', true),
  ('ai_general_contractor', 'Enable AI general contractor features', false),
  ('social_sharing', 'Enable social sharing features', true);
