-- =============================================================================
-- MVP IMPLEMENTATION NOTE
-- =============================================================================
-- For the MVP implementation, Row Level Security (RLS) policies have been 
-- temporarily removed to reduce complexity and avoid potential bugs.
-- 
-- In the implementation files (instabids_overlord/schema_migrations/*.sql),
-- the RLS policies are omitted. Security will be enforced at the application level.
-- 
-- In a future update, once the MVP is stable, RLS policies can be added back
-- following the patterns defined in this reference schema.
-- =============================================================================

-- ======================================================================
-- DREAM PROJECTS & CONVERSION SCHEMA
-- ======================================================================
-- This schema defines the database structure for the Dream Projects and 
-- Conversion domain of InstaBids. Dream Projects are aspirational home 
-- improvement concepts that homeowners can create, save, and eventually 
-- convert into actual projects for bidding.
-- ======================================================================

-- Create schema for dream projects domain
CREATE SCHEMA IF NOT EXISTS dream_projects;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- DREAM PROJECTS TABLE
-- Stores the main dream project information
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'converted', 'archived')),
    budget_min DECIMAL(12, 2),
    budget_max DECIMAL(12, 2),
    desired_start_date DATE,
    desired_completion_date DATE,
    property_id UUID REFERENCES properties.properties(id),
    room_type VARCHAR(100),
    project_size VARCHAR(50) CHECK (project_size IN ('small', 'medium', 'large', 'custom')),
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    published_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    converted_at TIMESTAMP WITH TIME ZONE,
    converted_project_id UUID,
    conversion_source VARCHAR(50),
    metadata JSONB,
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(room_type, '')), 'C')
    ) STORED
);

-- Create index for full-text search
CREATE INDEX dream_projects_search_idx ON dream_projects.dream_projects USING GIN (search_vector);

-- Create index for querying by owner
CREATE INDEX dream_projects_owner_id_idx ON dream_projects.dream_projects (owner_id);

-- Create index for status queries
CREATE INDEX dream_projects_status_idx ON dream_projects.dream_projects (status);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT IMAGES
-- Stores images associated with dream projects
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_project_id UUID NOT NULL REFERENCES dream_projects.dream_projects(id) ON DELETE CASCADE,
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    uploaded_by UUID NOT NULL REFERENCES auth.users(id),
    metadata JSONB
);

-- Create index for querying images by dream project
CREATE INDEX dream_project_images_project_id_idx ON dream_projects.dream_project_images (dream_project_id);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT INSPIRATIONS
-- Stores inspiration sources associated with dream projects
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_inspirations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_project_id UUID NOT NULL REFERENCES dream_projects.dream_projects(id) ON DELETE CASCADE,
    inspiration_type VARCHAR(50) NOT NULL CHECK (inspiration_type IN ('image', 'url', 'project', 'product', 'note')),
    title VARCHAR(255),
    description TEXT,
    external_url VARCHAR(1000),
    storage_path VARCHAR(500),
    reference_id UUID,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    metadata JSONB
);

-- Create index for querying inspirations by dream project
CREATE INDEX dream_project_inspirations_project_id_idx ON dream_projects.dream_project_inspirations (dream_project_id);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT FEATURES
-- Stores features or requirements associated with dream projects
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_project_id UUID NOT NULL REFERENCES dream_projects.dream_projects(id) ON DELETE CASCADE,
    feature_type VARCHAR(50) NOT NULL CHECK (feature_type IN ('must_have', 'nice_to_have', 'avoid')),
    description TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Create index for querying features by dream project
CREATE INDEX dream_project_features_project_id_idx ON dream_projects.dream_project_features (dream_project_id);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT COLLABORATORS
-- Stores collaborators (family members, friends) who can view or edit dream projects
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_project_id UUID NOT NULL REFERENCES dream_projects.dream_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    permission_level VARCHAR(50) NOT NULL CHECK (permission_level IN ('view', 'edit', 'admin')),
    invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'revoked')),
    UNIQUE (dream_project_id, user_id)
);

-- Create index for querying collaborations by user
CREATE INDEX dream_project_collaborators_user_id_idx ON dream_projects.dream_project_collaborators (user_id);

-- Create index for querying collaborators by dream project
CREATE INDEX dream_project_collaborators_project_id_idx ON dream_projects.dream_project_collaborators (dream_project_id);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT CONVERSION ATTEMPTS
-- Tracks attempts to convert dream projects into actual projects, including those that did not succeed
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_conversion_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_project_id UUID NOT NULL REFERENCES dream_projects.dream_projects(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('started', 'completed', 'abandoned')),
    conversion_step VARCHAR(100),
    created_project_id UUID,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    abandonment_reason TEXT,
    conversion_source VARCHAR(50),
    conversion_path JSONB,
    session_data JSONB,
    metadata JSONB
);

-- Create index for querying conversion attempts by dream project
CREATE INDEX dream_project_conversion_attempts_project_id_idx ON dream_projects.dream_project_conversion_attempts (dream_project_id);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT RECOMMENDATIONS
-- Stores contractor recommendations for dream projects based on AI analysis
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_project_id UUID NOT NULL REFERENCES dream_projects.dream_projects(id) ON DELETE CASCADE,
    contractor_id UUID NOT NULL REFERENCES auth.users(id),
    recommendation_score DECIMAL(5, 2) NOT NULL,
    recommendation_reason TEXT,
    matching_criteria JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'contacted')),
    contacted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE (dream_project_id, contractor_id)
);

-- Create index for querying recommendations by dream project
CREATE INDEX dream_project_recommendations_project_id_idx ON dream_projects.dream_project_recommendations (dream_project_id);

-- Create index for querying recommendations by contractor
CREATE INDEX dream_project_recommendations_contractor_id_idx ON dream_projects.dream_project_recommendations (contractor_id);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT TEMPLATES
-- Stores predefined templates for common dream project types
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    room_type VARCHAR(100),
    typical_duration_days INTEGER,
    typical_budget_min DECIMAL(12, 2),
    typical_budget_max DECIMAL(12, 2),
    complexity_level VARCHAR(50) CHECK (complexity_level IN ('simple', 'moderate', 'complex')),
    required_specialties TEXT[],
    common_features JSONB,
    template_content JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    usage_count INTEGER NOT NULL DEFAULT 0
);

-- Create index for template category
CREATE INDEX dream_project_templates_category_idx ON dream_projects.dream_project_templates (category);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT AI ANALYSIS
-- Stores AI analysis of dream projects for understanding, enhancement, and conversion
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_project_id UUID NOT NULL REFERENCES dream_projects.dream_projects(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    analysis_version VARCHAR(50) NOT NULL,
    analysis_data JSONB NOT NULL,
    confidence_score DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_current BOOLEAN NOT NULL DEFAULT true
);

-- Create index for querying analysis by dream project
CREATE INDEX dream_project_ai_analysis_project_id_idx ON dream_projects.dream_project_ai_analysis (dream_project_id);

-- ---------------------------------------------------------------------------
-- DREAM PROJECT LIKED BY USERS
-- Tracks users who have liked or saved public dream projects (for inspiration)
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.dream_project_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dream_project_id UUID NOT NULL REFERENCES dream_projects.dream_projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (dream_project_id, user_id)
);

-- Create index for querying likes by user
CREATE INDEX dream_project_likes_user_id_idx ON dream_projects.dream_project_likes (user_id);

-- Create index for querying likes by project
CREATE INDEX dream_project_likes_project_id_idx ON dream_projects.dream_project_likes (dream_project_id);

-- ---------------------------------------------------------------------------
-- CONVERSION ANALYTICS
-- Stores aggregated analytics related to dream project conversions
-- ---------------------------------------------------------------------------
CREATE TABLE dream_projects.conversion_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    conversion_source VARCHAR(100),
    conversion_count INTEGER NOT NULL DEFAULT 0,
    view_count INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5, 2),
    avg_conversion_time_minutes INTEGER,
    avg_steps_to_conversion INTEGER,
    top_conversion_paths JSONB,
    top_abandonment_reasons JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (period_start, period_end, conversion_source)
);

-- ---------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
-- Define who can access which dream projects
-- ---------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE dream_projects.dream_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_conversion_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.dream_project_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_projects.conversion_analytics ENABLE ROW LEVEL SECURITY;

-- Dream Projects: Owners can do anything with their own projects
CREATE POLICY dream_projects_owner_policy 
    ON dream_projects.dream_projects
    FOR ALL
    TO authenticated
    USING (owner_id = auth.uid());

-- Dream Projects: Collaborators can view projects they're invited to
CREATE POLICY dream_projects_collaborator_view_policy
    ON dream_projects.dream_projects
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM dream_projects.dream_project_collaborators
            WHERE dream_project_id = id
            AND user_id = auth.uid()
        )
    );

-- Dream Projects: Public projects can be viewed by anyone
CREATE POLICY dream_projects_public_view_policy
    ON dream_projects.dream_projects
    FOR SELECT
    TO authenticated
    USING (is_public = true);

-- Dream Project Images: Owners can do anything with their own projects' images
CREATE POLICY dream_project_images_owner_policy 
    ON dream_projects.dream_project_images
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM dream_projects.dream_projects
            WHERE id = dream_project_id
            AND owner_id = auth.uid()
        )
    );

-- Similar policies for other tables would follow the same pattern
-- Allowing owners full access, collaborators access based on permission level,
-- and others access only to public content

-- Conversion Analytics: Only admins can access
CREATE POLICY conversion_analytics_admin_policy
    ON dream_projects.conversion_analytics
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- ---------------------------------------------------------------------------
-- FUNCTIONS AND TRIGGERS
-- ---------------------------------------------------------------------------

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION dream_projects.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dream_projects table
CREATE TRIGGER update_dream_projects_updated_at
    BEFORE UPDATE ON dream_projects.dream_projects
    FOR EACH ROW
    EXECUTE FUNCTION dream_projects.update_updated_at_column();

-- Increment template usage count when used
CREATE OR REPLACE FUNCTION dream_projects.increment_template_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.metadata->>'template_id' IS NOT NULL THEN
        UPDATE dream_projects.dream_project_templates
        SET usage_count = usage_count + 1
        WHERE id = (NEW.metadata->>'template_id')::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dream_projects table
CREATE TRIGGER increment_template_usage_trigger
    AFTER INSERT ON dream_projects.dream_projects
    FOR EACH ROW
    EXECUTE FUNCTION dream_projects.increment_template_usage();

-- Set converted_at timestamp when status changes to 'converted'
CREATE OR REPLACE FUNCTION dream_projects.set_converted_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'converted' AND OLD.status != 'converted' THEN
        NEW.converted_at = now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for dream_projects table
CREATE TRIGGER set_converted_timestamp_trigger
    BEFORE UPDATE ON dream_projects.dream_projects
    FOR EACH ROW
    EXECUTE FUNCTION dream_projects.set_converted_timestamp();

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------

-- Public dream projects view (for browsing inspiration)
CREATE OR REPLACE VIEW dream_projects.public_dream_projects AS
SELECT 
    dp.id,
    dp.title,
    dp.description,
    dp.budget_min,
    dp.budget_max,
    dp.room_type,
    dp.project_size,
    dp.created_at,
    dp.updated_at,
    dp.owner_id,
    u.display_name as owner_name,
    (SELECT COUNT(*) FROM dream_projects.dream_project_likes WHERE dream_project_id = dp.id) as like_count,
    (SELECT storage_path FROM dream_projects.dream_project_images 
     WHERE dream_project_id = dp.id AND is_primary = true 
     LIMIT 1) as primary_image_path
FROM 
    dream_projects.dream_projects dp
JOIN 
    auth.users u ON dp.owner_id = u.id
WHERE 
    dp.is_public = true
    AND dp.status = 'published';

-- Conversion funnel view for analytics
CREATE OR REPLACE VIEW dream_projects.conversion_funnel AS
SELECT
    date_trunc('day', dp.created_at) as date,
    COUNT(*) as dreams_created,
    COUNT(CASE WHEN dp.status = 'published' THEN 1 END) as dreams_published,
    COUNT(CASE WHEN dpca.status = 'started' THEN 1 END) as conversion_started,
    COUNT(CASE WHEN dpca.status = 'completed' THEN 1 END) as conversion_completed,
    COUNT(CASE WHEN dp.status = 'converted' THEN 1 END) as dreams_converted
FROM
    dream_projects.dream_projects dp
LEFT JOIN
    dream_projects.dream_project_conversion_attempts dpca ON dp.id = dpca.dream_project_id
GROUP BY
    date_trunc('day', dp.created_at);
