-- =============================================================================
-- INSTABIDS USER MANAGEMENT SCHEMA
-- =============================================================================
-- Priority: P0 - Critical for core system development
--
-- This schema defines the user profile tables for different user types:
-- homeowners, contractors, property managers, and labor helpers.
-- 
-- Dependencies:
--   schema_core.sql - Requires the core users table
--
-- Extension Points:
--   - Rating systems are designed for future AI enhancement
--   - Verification systems support progressive levels of verification
--   - Profile data is extensible through metadata fields
-- =============================================================================

-- -----------------------------------------------------------------------------
-- HOMEOWNER PROFILES
-- -----------------------------------------------------------------------------

-- Homeowner profiles
CREATE TABLE homeowners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id UUID REFERENCES user_addresses(id),
  property_details JSONB DEFAULT '{}'::jsonb,       -- Details about primary property
  preferred_contact_method TEXT DEFAULT 'email',    -- 'email', 'phone', 'sms'
  preferred_contact_times JSONB,                    -- Time preferences for contact
  rating DECIMAL(3,2),                              -- AI-generated homeowner rating
  rating_count INTEGER DEFAULT 0,                   -- Number of ratings received
  desirability_score DECIMAL(3,2),                  -- For contractor-facing metrics
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure uniqueness of user_id
  UNIQUE(user_id),
  
  -- Ensure preferred_contact_method values are valid
  CONSTRAINT homeowners_contact_method_check CHECK (preferred_contact_method IN (
    'email', 'phone', 'sms', 'app'
  ))
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_homeowners_user_id ON homeowners(user_id);

-- Create index on rating for sorting
CREATE INDEX idx_homeowners_rating ON homeowners(rating);

-- Homeowner reviews (from contractors)
CREATE TABLE homeowner_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  homeowner_id UUID NOT NULL REFERENCES homeowners(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),   -- Always a contractor
  project_id UUID NOT NULL,                         -- Reference to completed project
  rating DECIMAL(3,2) NOT NULL,                     -- 1-5 star rating
  review_text TEXT,
  cooperation_score DECIMAL(3,2),                   -- How easy to work with
  payment_promptness DECIMAL(3,2),                  -- How quickly they paid
  communication_score DECIMAL(3,2),                 -- How well they communicated
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visible_to_homeowner BOOLEAN DEFAULT false,       -- Whether homeowner can see it
  
  -- Ensure rating is valid
  CONSTRAINT homeowner_reviews_rating_check CHECK (rating BETWEEN 1.0 AND 5.0)
);

-- Create index on homeowner_id for faster lookups
CREATE INDEX idx_homeowner_reviews_homeowner_id ON homeowner_reviews(homeowner_id);

-- Create index on project_id for faster lookups
CREATE INDEX idx_homeowner_reviews_project_id ON homeowner_reviews(project_id);

-- -----------------------------------------------------------------------------
-- CONTRACTOR PROFILES
-- -----------------------------------------------------------------------------

-- Contractor profiles
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  contact_person TEXT,
  business_address_id UUID REFERENCES user_addresses(id),
  business_phone TEXT,
  business_email TEXT,
  services TEXT[],                                  -- Array of service types offered
  service_areas JSONB,                              -- Service area details
  license_info JSONB DEFAULT '{}'::jsonb,           -- License information by state/type
  insurance_info JSONB DEFAULT '{}'::jsonb,         -- Insurance coverage details
  verification_status TEXT DEFAULT 'pending',       -- 'pending', 'verified', 'rejected'
  verification_method TEXT DEFAULT 'ai',            -- 'ai', 'manual', 'community'
  google_rating DECIMAL(3,2),                       -- Rating from Google
  internal_rating DECIMAL(3,2),                     -- Platform-specific rating
  rating_count INTEGER DEFAULT 0,
  job_completion_rate DECIMAL(5,2),                 -- % of jobs completed successfully
  jobs_completed INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'basic',           -- 'basic', 'pro', 'premium'
  gc_experience BOOLEAN DEFAULT false,              -- Has General Contractor experience
  gc_projects_completed INTEGER DEFAULT 0,          -- Number of GC projects completed
  can_coordinate_trades BOOLEAN DEFAULT false,      -- Can coordinate multiple trades
  completion_tier TEXT DEFAULT 'starter',           -- Based on job completion volume
  metadata JSONB DEFAULT '{}'::jsonb,               -- Extensible metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure uniqueness of user_id
  UNIQUE(user_id),
  
  -- Ensure verification_status values are valid
  CONSTRAINT contractors_status_check CHECK (verification_status IN (
    'pending', 'verified', 'rejected', 'expired'
  ))
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_contractors_user_id ON contractors(user_id);

-- Create index on service_areas for geographic queries
CREATE INDEX idx_contractors_service_areas ON contractors USING GIN (service_areas);

-- Create index on services for service-type queries
CREATE INDEX idx_contractors_services ON contractors USING GIN (services);

-- Create index on internal_rating for sorting
CREATE INDEX idx_contractors_rating ON contractors(internal_rating);

-- Contractor portfolio items
CREATE TABLE contractor_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_urls TEXT[] NOT NULL,                       -- Array of image/video URLs
  job_type TEXT,                                    -- Reference to job_types
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT false,                -- Featured on profile?
  
  -- Create index on contractor_id for faster lookups
  CONSTRAINT contractor_portfolio_contractor_idx UNIQUE(contractor_id, title)
);

-- Create index on contractor_id for faster lookups
CREATE INDEX idx_contractor_portfolio_contractor_id ON contractor_portfolio(contractor_id);

-- Create index on job_type for filtering
CREATE INDEX idx_contractor_portfolio_job_type ON contractor_portfolio(job_type);

-- Contractor verification details
CREATE TABLE verification_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  check_type TEXT NOT NULL,                         -- 'google_listing', 'website', 'business_name', 'license', 'insurance'
  status TEXT NOT NULL DEFAULT 'pending',           -- 'pending', 'verified', 'failed'
  verification_data JSONB,                          -- Data collected during verification
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  verification_source TEXT,                         -- 'ai', 'manual', 'community'
  
  -- Ensure status values are valid
  CONSTRAINT verification_checks_status_check CHECK (status IN (
    'pending', 'verified', 'failed', 'expired'
  ))
);

-- Create index on contractor_id for faster lookups
CREATE INDEX idx_verification_checks_contractor_id ON verification_checks(contractor_id);

-- Create index on check_type for filtering
CREATE INDEX idx_verification_checks_type ON verification_checks(check_type);

-- Contractor verification documents
CREATE TABLE verification_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,                      -- 'license', 'insurance', 'certification', etc.
  document_url TEXT NOT NULL,                       -- URL to stored document
  verification_status TEXT DEFAULT 'pending',       -- 'pending', 'verified', 'rejected'
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,                      -- When document expires
  
  -- Ensure document_type values are valid
  CONSTRAINT verification_documents_type_check CHECK (document_type IN (
    'license', 'insurance', 'certification', 'photo_id', 'business_registration', 'other'
  ))
);

-- Create index on contractor_id for faster lookups
CREATE INDEX idx_verification_documents_contractor_id ON verification_documents(contractor_id);

-- Create index on document_type for filtering
CREATE INDEX idx_verification_documents_type ON verification_documents(document_type);

-- Contractor reviews (from homeowners)
CREATE TABLE contractor_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),   -- Homeowner who wrote review
  project_id UUID NOT NULL,                         -- Reference to completed project
  source TEXT NOT NULL DEFAULT 'platform',          -- 'platform' or 'google'
  rating DECIMAL(3,2) NOT NULL,                     -- 1-5 star rating
  review_text TEXT,
  job_type TEXT,
  job_size TEXT,                                    -- 'small', 'medium', 'large'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  visible_to_public BOOLEAN DEFAULT true,
  
  -- Ensure rating is valid
  CONSTRAINT contractor_reviews_rating_check CHECK (rating BETWEEN 1.0 AND 5.0)
);

-- Create index on contractor_id for faster lookups
CREATE INDEX idx_contractor_reviews_contractor_id ON contractor_reviews(contractor_id);

-- Create index on project_id for faster lookups
CREATE INDEX idx_contractor_reviews_project_id ON contractor_reviews(project_id);

-- Contractor confidence scores (AI-generated)
CREATE TABLE contractor_confidence_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contractor_id UUID NOT NULL REFERENCES contractors(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  job_size TEXT NOT NULL,                           -- 'small', 'medium', 'large'
  confidence_score DECIMAL(3,2) NOT NULL,
  factors JSONB NOT NULL,                           -- Store the factors that went into the calculation
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,                           -- Score should be recalculated periodically
  
  -- Ensure score is valid
  CONSTRAINT contractor_confidence_score_check CHECK (confidence_score BETWEEN 1.0 AND 5.0)
);

-- Create index on contractor_id for faster lookups
CREATE INDEX idx_contractor_confidence_contractor_id ON contractor_confidence_scores(contractor_id);

-- Create index on job_type for filtering
CREATE INDEX idx_contractor_confidence_job_type ON contractor_confidence_scores(job_type, job_size);

-- -----------------------------------------------------------------------------
-- PROPERTY MANAGER PROFILES
-- -----------------------------------------------------------------------------

-- Property manager profiles
CREATE TABLE property_managers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  business_address_id UUID REFERENCES user_addresses(id),
  business_phone TEXT,
  business_email TEXT,
  business_details JSONB DEFAULT '{}'::jsonb,
  rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  verification_status TEXT DEFAULT 'pending',       -- 'pending', 'verified', 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure uniqueness of user_id
  UNIQUE(user_id)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_property_managers_user_id ON property_managers(user_id);

-- Create index on company_name for searches
CREATE INDEX idx_property_managers_company ON property_managers(company_name);

-- Create index on rating for sorting
CREATE INDEX idx_property_managers_rating ON property_managers(rating);

-- Managed properties
CREATE TABLE managed_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_manager_id UUID NOT NULL REFERENCES property_managers(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  address_id UUID REFERENCES user_addresses(id),
  property_type TEXT NOT NULL,                      -- 'apartment_building', 'condo_complex', 'office_building'
  unit_count INTEGER,
  property_details JSONB DEFAULT '{}'::jsonb,
  primary_contact_name TEXT,
  primary_contact_phone TEXT,
  primary_contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure property_type values are valid
  CONSTRAINT managed_properties_type_check CHECK (property_type IN (
    'apartment_building', 'condo_complex', 'office_building', 'retail', 'industrial', 'mixed_use', 'single_family', 'other'
  ))
);

-- Create index on property_manager_id for faster lookups
CREATE INDEX idx_managed_properties_manager_id ON managed_properties(property_manager_id);

-- Create index on address_id for location queries
CREATE INDEX idx_managed_properties_address ON managed_properties(address_id);

-- -----------------------------------------------------------------------------
-- LABOR HELPER PROFILES
-- -----------------------------------------------------------------------------

-- Labor helper profiles
CREATE TABLE labor_helpers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image TEXT,
  hourly_rate DECIMAL(10,2) NOT NULL,
  minimum_hours DECIMAL(4,1) DEFAULT 1.0,
  maximum_travel_distance INTEGER,                 -- miles
  has_vehicle BOOLEAN DEFAULT false,
  verification_level TEXT NOT NULL DEFAULT 'basic', -- 'basic', 'background_checked', 'identity_verified'
  is_active BOOLEAN DEFAULT true,
  average_rating DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  jobs_completed INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),                    -- % of accepted jobs completed
  response_time_avg INTEGER,                       -- Average minutes to respond
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure uniqueness of user_id
  UNIQUE(user_id),
  
  -- Ensure verification_level values are valid
  CONSTRAINT labor_helpers_verification_check CHECK (verification_level IN (
    'basic', 'background_checked', 'identity_verified', 'expert_verified'
  ))
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_labor_helpers_user_id ON labor_helpers(user_id);

-- Create index on hourly_rate for filtering
CREATE INDEX idx_labor_helpers_rate ON labor_helpers(hourly_rate);

-- Create index on average_rating for sorting
CREATE INDEX idx_labor_helpers_rating ON labor_helpers(average_rating);

-- Helper skills
CREATE TABLE helper_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES labor_helpers(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  related_trade TEXT,                               -- e.g., 'plumbing', 'electrical', 'carpentry'
  years_experience INTEGER,
  expertise_level TEXT NOT NULL,                    -- 'beginner', 'intermediate', 'expert'
  is_verified BOOLEAN DEFAULT false,
  verification_method TEXT,                         -- 'credential', 'contractor_endorsed', 'self_reported'
  
  -- Ensure expertise_level values are valid
  CONSTRAINT helper_skills_level_check CHECK (expertise_level IN (
    'beginner', 'intermediate', 'expert', 'master'
  ))
);

-- Create index on helper_id for faster lookups
CREATE INDEX idx_helper_skills_helper_id ON helper_skills(helper_id);

-- Create index on skill_name for filtering
CREATE INDEX idx_helper_skills_name ON helper_skills(skill_name);

-- Create index on related_trade for filtering
CREATE INDEX idx_helper_skills_trade ON helper_skills(related_trade);

-- Helper availability
CREATE TABLE helper_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES labor_helpers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,                     -- 0-6 (Sunday-Saturday)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_recurring BOOLEAN DEFAULT true,
  specific_date DATE,                               -- Only set if is_recurring = false
  
  -- Ensure day_of_week is valid
  CONSTRAINT helper_availability_day_check CHECK (day_of_week BETWEEN 0 AND 6)
);

-- Create index on helper_id for faster lookups
CREATE INDEX idx_helper_availability_helper_id ON helper_availability(helper_id);

-- Create index on day_of_week for filtering
CREATE INDEX idx_helper_availability_day ON helper_availability(day_of_week);

-- Labor helper reviews
CREATE TABLE labor_helper_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  helper_id UUID NOT NULL REFERENCES labor_helpers(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  job_id UUID NOT NULL,                            -- Reference to completed labor job
  rating DECIMAL(3,2) NOT NULL,
  review_text TEXT,
  timeliness_rating DECIMAL(3,2),
  skill_rating DECIMAL(3,2),
  communication_rating DECIMAL(3,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure rating is valid
  CONSTRAINT labor_helper_reviews_rating_check CHECK (rating BETWEEN 1.0 AND 5.0)
);

-- Create index on helper_id for faster lookups
CREATE INDEX idx_labor_helper_reviews_helper_id ON labor_helper_reviews(helper_id);

-- Create index on job_id for faster lookups
CREATE INDEX idx_labor_helper_reviews_job_id ON labor_helper_reviews(job_id);

-- -----------------------------------------------------------------------------
-- COMMUNITY VERIFICATION
-- -----------------------------------------------------------------------------

-- Community endorsements table
CREATE TABLE community_endorsements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endorser_id UUID NOT NULL REFERENCES users(id),
  endorsee_id UUID NOT NULL REFERENCES users(id),
  endorsement_type TEXT NOT NULL,                   -- 'skill', 'reliability', 'quality', etc.
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Prevent self-endorsements
  CONSTRAINT community_endorsements_no_self_check CHECK (endorser_id != endorsee_id),
  
  -- Ensure each user can only endorse each skill once
  UNIQUE(endorser_id, endorsee_id, endorsement_type)
);

-- Create index on endorser_id for faster lookups
CREATE INDEX idx_community_endorsements_endorser ON community_endorsements(endorser_id);

-- Create index on endorsee_id for faster lookups
CREATE INDEX idx_community_endorsements_endorsee ON community_endorsements(endorsee_id);

-- Create index on endorsement_type for filtering
CREATE INDEX idx_community_endorsements_type ON community_endorsements(endorsement_type);

-- Community trust score
CREATE TABLE community_trust_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trust_score DECIMAL(5,2) NOT NULL,                -- Overall trust score
  score_components JSONB NOT NULL,                  -- Breakdown of what contributes to score
  calculation_version TEXT NOT NULL,                -- Algorithm version used
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_calculation_at TIMESTAMPTZ,                  -- When score should be recalculated
  
  -- Ensure uniqueness of user_id
  UNIQUE(user_id),
  
  -- Ensure trust_score is valid
  CONSTRAINT community_trust_scores_check CHECK (trust_score BETWEEN 0.0 AND 100.0)
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_community_trust_scores_user_id ON community_trust_scores(user_id);

-- Create index on trust_score for sorting
CREATE INDEX idx_community_trust_scores_score ON community_trust_scores(trust_score);

-- Community verification badges
CREATE TABLE community_verification_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,                         -- 'basic_verified', 'silver_verified', 'gold_verified'
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requirements_met JSONB NOT NULL,                  -- How the badge was earned
  is_active BOOLEAN DEFAULT true,
  
  -- Ensure uniqueness of user_id and badge_type
  UNIQUE(user_id, badge_type),
  
  -- Ensure badge_type values are valid
  CONSTRAINT community_verification_badges_type_check CHECK (badge_type IN (
    'basic_verified', 'silver_verified', 'gold_verified', 'platinum_verified'
  ))
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_community_verification_badges_user_id ON community_verification_badges(user_id);

-- Create index on badge_type for filtering
CREATE INDEX idx_community_verification_badges_type ON community_verification_badges(badge_type);

-- -----------------------------------------------------------------------------
-- SUPABASE RLS POLICIES
-- -----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE homeowners ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeowner_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_confidence_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE managed_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE helper_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_helper_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_verification_badges ENABLE ROW LEVEL SECURITY;

-- Homeowner policies
CREATE POLICY homeowners_read_own ON homeowners
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY homeowners_read_for_bidding ON homeowners
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM bids b
    JOIN bid_cards bc ON b.bid_card_id = bc.id
    WHERE b.contractor_id = auth.uid() AND bc.creator_id = homeowners.user_id
  ));

-- Contractor policies
CREATE POLICY contractors_read_own ON contractors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY contractors_read_public ON contractors
  FOR SELECT USING (true);

CREATE POLICY contractors_update_own ON contractors
  FOR UPDATE USING (auth.uid() = user_id);

-- Property manager policies
CREATE POLICY property_managers_read_own ON property_managers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY property_managers_read_public ON property_managers
  FOR SELECT USING (true);

-- Labor helper policies
CREATE POLICY labor_helpers_read_own ON labor_helpers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY labor_helpers_read_public ON labor_helpers
  FOR SELECT USING (true);

-- Review policies
CREATE POLICY contractor_reviews_read_all ON contractor_reviews
  FOR SELECT USING (visible_to_public OR auth.uid() = contractor_id);

CREATE POLICY homeowner_reviews_read_contractor ON homeowner_reviews
  FOR SELECT USING (auth.uid() = reviewer_id);

-- -----------------------------------------------------------------------------
-- DATABASE TRIGGERS
-- -----------------------------------------------------------------------------

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_homeowners_timestamp
BEFORE UPDATE ON homeowners
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_contractors_timestamp
BEFORE UPDATE ON contractors
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_property_managers_timestamp
BEFORE UPDATE ON property_managers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_managed_properties_timestamp
BEFORE UPDATE ON managed_properties
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_labor_helpers_timestamp
BEFORE UPDATE ON labor_helpers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Trigger function to update user ratings
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate new average rating
  SELECT AVG(rating), COUNT(*)
  INTO avg_rating, review_count
  FROM contractor_reviews
  WHERE contractor_id = NEW.contractor_id;
  
  -- Update contractor record
  UPDATE contractors
  SET 
    internal_rating = avg_rating,
    rating_count = review_count,
    updated_at = NOW()
  WHERE id = NEW.contractor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the rating update trigger
CREATE TRIGGER update_contractor_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON contractor_reviews
FOR EACH ROW EXECUTE FUNCTION update_contractor_rating();

-- Similar triggers for other user types
CREATE OR REPLACE FUNCTION update_homeowner_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate new average rating
  SELECT AVG(rating), COUNT(*)
  INTO avg_rating, review_count
  FROM homeowner_reviews
  WHERE homeowner_id = NEW.homeowner_id;
  
  -- Update homeowner record
  UPDATE homeowners
  SET 
    rating = avg_rating,
    rating_count = review_count,
    updated_at = NOW()
  WHERE id = NEW.homeowner_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the rating update trigger
CREATE TRIGGER update_homeowner_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON homeowner_reviews
FOR EACH ROW EXECUTE FUNCTION update_homeowner_rating();

-- Apply similar trigger for labor helpers
CREATE OR REPLACE FUNCTION update_labor_helper_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate new average rating
  SELECT AVG(rating), COUNT(*)
  INTO avg_rating, review_count
  FROM labor_helper_reviews
  WHERE helper_id = NEW.helper_id;
  
  -- Update labor helper record
  UPDATE labor_helpers
  SET 
    average_rating = avg_rating,
    rating_count = review_count,
    updated_at = NOW()
  WHERE id = NEW.helper_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the rating update trigger
CREATE TRIGGER update_labor_helper_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON labor_helper_reviews
FOR EACH ROW EXECUTE FUNCTION update_labor_helper_rating();
