-- =============================================================================
-- INSTABIDS LABOR MARKETPLACE SCHEMA
-- =============================================================================
-- Priority: P1 - Core competitive advantage
--
-- This schema defines the tables for the labor marketplace domain,
-- supporting both Consumer-to-Helper (C2H) and Contractor-to-Helper (B2H) models
-- for on-demand labor assistance.
--
-- Dependencies:
--   schema_core.sql - Requires core tables
--   schema_user_management.sql - Requires user tables
--   schema_project_management.sql - Requires project tables
-- =============================================================================

-- -----------------------------------------------------
-- Table labor_helpers
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_helpers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    profile_status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending_verification', 'verified', 'suspended', 'inactive', 'active'
    )),
    verification_level VARCHAR(50) NOT NULL CHECK (verification_level IN (
        'basic', 'identity_verified', 'background_checked', 'fully_verified'
    )),
    background_check_status VARCHAR(50) CHECK (background_check_status IN (
        'not_submitted', 'pending', 'passed', 'failed', 'expired'
    )),
    background_check_date TIMESTAMP WITH TIME ZONE,
    identity_verified BOOLEAN NOT NULL DEFAULT FALSE,
    identity_verified_date TIMESTAMP WITH TIME ZONE,
    skills_verified BOOLEAN NOT NULL DEFAULT FALSE,
    skills_verified_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id), -- Admin who verified
    availability_status VARCHAR(50) NOT NULL CHECK (availability_status IN (
        'available', 'busy', 'unavailable', 'vacation'
    )),
    hourly_rate_min DECIMAL(10,2),
    hourly_rate_max DECIMAL(10,2),
    minimum_hours INTEGER,
    day_rate DECIMAL(10,2),
    current_location_zip VARCHAR(20),
    max_travel_distance INTEGER, -- In miles or kilometers
    has_transportation BOOLEAN NOT NULL DEFAULT FALSE,
    has_own_tools BOOLEAN NOT NULL DEFAULT FALSE,
    can_purchase_materials BOOLEAN NOT NULL DEFAULT FALSE,
    years_experience INTEGER,
    has_liability_insurance BOOLEAN NOT NULL DEFAULT FALSE,
    liability_insurance_expiry TIMESTAMP WITH TIME ZONE,
    insurance_verification_doc_url TEXT,
    reliability_score DECIMAL(3,2),  -- Algorithm-calculated reliability score (0.00-5.00)
    quality_score DECIMAL(3,2),      -- Algorithm-calculated quality score (0.00-5.00)
    communication_score DECIMAL(3,2), -- Algorithm-calculated communication score (0.00-5.00)
    overall_rating DECIMAL(3,2),     -- Overall average rating (0.00-5.00)
    total_completed_jobs INTEGER NOT NULL DEFAULT 0,
    total_hours_worked DECIMAL(10,2) NOT NULL DEFAULT 0,
    profile_views INTEGER NOT NULL DEFAULT 0,
    profile_completion_percentage INTEGER NOT NULL DEFAULT 0,
    bio TEXT,
    profile_image_url TEXT,
    profile_video_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table helper_skills
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    skill_name VARCHAR(100) NOT NULL,
    skill_type VARCHAR(50) NOT NULL CHECK (skill_type IN (
        'general_labor', 'specialized', 'tools_operation', 'management', 'materials_knowledge'
    )),
    skill_level VARCHAR(50) NOT NULL CHECK (skill_level IN (
        'beginner', 'intermediate', 'advanced', 'expert'
    )),
    years_experience INTEGER,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verification_date TIMESTAMP WITH TIME ZONE,
    verification_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(helper_id, skill_name)
);

-- -----------------------------------------------------
-- Table skill_categories
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    parent_category_id UUID REFERENCES skill_categories(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table helper_skill_category_mappings
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_skill_category_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    skill_category_id UUID NOT NULL REFERENCES skill_categories(id),
    proficiency_level VARCHAR(50) NOT NULL CHECK (proficiency_level IN (
        'beginner', 'intermediate', 'advanced', 'expert'
    )),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(helper_id, skill_category_id)
);

-- -----------------------------------------------------
-- Table helper_certifications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    certification_name VARCHAR(255) NOT NULL,
    certification_authority VARCHAR(255) NOT NULL,
    certification_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE,
    certification_number VARCHAR(100),
    verification_status VARCHAR(50) NOT NULL CHECK (verification_status IN (
        'pending', 'verified', 'rejected', 'expired'
    )),
    document_url TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table helper_work_history
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_work_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    company_name VARCHAR(255),
    position VARCHAR(255) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    responsibilities TEXT,
    supervisor_name VARCHAR(255),
    supervisor_contact VARCHAR(255),
    can_contact_supervisor BOOLEAN NOT NULL DEFAULT FALSE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table helper_availability
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT TRUE,
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_times CHECK (end_time > start_time)
);

-- -----------------------------------------------------
-- Table helper_unavailable_dates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_unavailable_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (end_date > start_date)
);

-- -----------------------------------------------------
-- Table labor_job_posts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_job_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id UUID NOT NULL REFERENCES users(id),
    creator_type VARCHAR(50) NOT NULL CHECK (creator_type IN ('homeowner', 'contractor')),
    project_id UUID REFERENCES projects(id), -- Optional, if related to a project
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'draft', 'open', 'in_progress', 'filled', 'canceled', 'completed', 'expired'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
        'one_time', 'recurring', 'multi_day', 'project_based'
    )),
    pay_type VARCHAR(50) NOT NULL CHECK (pay_type IN (
        'hourly', 'fixed', 'daily'
    )),
    pay_rate DECIMAL(10,2) NOT NULL,
    estimated_hours INTEGER,
    max_hours INTEGER,
    estimated_days INTEGER,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    required_helpers_count INTEGER NOT NULL DEFAULT 1,
    filled_helpers_count INTEGER NOT NULL DEFAULT 0,
    location_zip VARCHAR(20) NOT NULL,
    location_address TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    skill_category_id UUID REFERENCES skill_categories(id),
    required_skills TEXT[], -- Array of specific required skills
    required_verification_level VARCHAR(50) CHECK (required_verification_level IN (
        'basic', 'identity_verified', 'background_checked', 'fully_verified'
    )),
    required_experience_years INTEGER,
    tools_provided BOOLEAN NOT NULL DEFAULT FALSE,
    materials_provided BOOLEAN NOT NULL DEFAULT FALSE,
    transportation_required BOOLEAN NOT NULL DEFAULT FALSE,
    view_count INTEGER NOT NULL DEFAULT 0,
    application_count INTEGER NOT NULL DEFAULT 0,
    urgency_level VARCHAR(50) CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),
    cancellation_reason TEXT,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table job_specific_requirements
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS job_specific_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_post_id UUID NOT NULL REFERENCES labor_job_posts(id),
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN (
        'certification', 'equipment', 'physical', 'availability', 'language', 'custom'
    )),
    requirement_name VARCHAR(255) NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table labor_job_applications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_post_id UUID NOT NULL REFERENCES labor_job_posts(id),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'submitted', 'viewed', 'shortlisted', 'rejected', 'hired', 'withdrawn'
    )),
    cover_letter TEXT,
    requested_pay_rate DECIMAL(10,2),
    available_start_date TIMESTAMP WITH TIME ZONE,
    available_end_date TIMESTAMP WITH TIME ZONE,
    total_available_hours INTEGER,
    submission_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    viewed_at TIMESTAMP WITH TIME ZONE,
    shortlisted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    hired_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    withdrawal_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(job_post_id, helper_id)
);

-- -----------------------------------------------------
-- Table labor_assignments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_post_id UUID NOT NULL REFERENCES labor_job_posts(id),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    application_id UUID REFERENCES labor_job_applications(id),
    hiring_user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'canceled', 'no_show', 'partial'
    )),
    pay_type VARCHAR(50) NOT NULL CHECK (pay_type IN (
        'hourly', 'fixed', 'daily'
    )),
    pay_rate DECIMAL(10,2) NOT NULL,
    expected_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_end_date TIMESTAMP WITH TIME ZONE,
    expected_hours DECIMAL(10,2),
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    actual_hours DECIMAL(10,2),
    total_pay DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    helper_payout DECIMAL(10,2),
    description TEXT,
    special_instructions TEXT,
    tools_provided BOOLEAN NOT NULL DEFAULT FALSE,
    materials_provided BOOLEAN NOT NULL DEFAULT FALSE,
    transportation_provided BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancellation_fee DECIMAL(10,2),
    supervisor_name VARCHAR(255),
    supervisor_phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(job_post_id, helper_id)
);

-- -----------------------------------------------------
-- Table assignment_check_ins
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS assignment_check_ins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES labor_assignments(id),
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    hours_logged DECIMAL(5,2),
    break_time_minutes INTEGER,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    location_accuracy DECIMAL(10,2),
    photo_url TEXT,
    notes TEXT,
    verified_by UUID REFERENCES users(id),
    verification_status VARCHAR(50) CHECK (verification_status IN (
        'pending', 'verified', 'disputed', 'adjusted', 'rejected'
    )),
    verification_time TIMESTAMP WITH TIME ZONE,
    adjustment_reason TEXT,
    original_hours_logged DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_times_check CHECK (
        (check_out_time IS NULL) OR 
        (check_in_time IS NOT NULL AND check_out_time > check_in_time)
    )
);

-- -----------------------------------------------------
-- Table assignment_tasks
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS assignment_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES labor_assignments(id),
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending', 'in_progress', 'completed', 'skipped', 'blocked'
    )),
    priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    completion_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table labor_helper_reviews
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_helper_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES labor_assignments(id),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewer_type VARCHAR(50) NOT NULL CHECK (reviewer_type IN ('homeowner', 'contractor')),
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    reliability_rating INTEGER CHECK (reliability_rating BETWEEN 1 AND 5),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
    attitude_rating INTEGER CHECK (attitude_rating BETWEEN 1 AND 5),
    review_text TEXT,
    would_hire_again BOOLEAN,
    review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    helper_response TEXT,
    helper_response_date TIMESTAMP WITH TIME ZONE,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    hidden_reason TEXT,
    hidden_by UUID REFERENCES users(id),
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flagged_reason TEXT,
    flagged_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(assignment_id, reviewer_id)
);

-- -----------------------------------------------------
-- Table client_reviews
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS client_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES labor_assignments(id),
    client_id UUID NOT NULL REFERENCES users(id),
    client_type VARCHAR(50) NOT NULL CHECK (client_type IN ('homeowner', 'contractor')),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    clarity_rating INTEGER CHECK (clarity_rating BETWEEN 1 AND 5),
    payment_promptness_rating INTEGER CHECK (payment_promptness_rating BETWEEN 1 AND 5),
    workplace_rating INTEGER CHECK (workplace_rating BETWEEN 1 AND 5),
    review_text TEXT,
    would_work_again BOOLEAN,
    review_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    client_response TEXT,
    client_response_date TIMESTAMP WITH TIME ZONE,
    hidden BOOLEAN NOT NULL DEFAULT FALSE,
    hidden_reason TEXT,
    hidden_by UUID REFERENCES users(id),
    flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flagged_reason TEXT,
    flagged_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(assignment_id, helper_id)
);

-- -----------------------------------------------------
-- Table community_verifications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS community_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    verifier_id UUID NOT NULL REFERENCES users(id),
    verifier_type VARCHAR(50) NOT NULL CHECK (verifier_type IN ('contractor', 'homeowner')),
    verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN (
        'general', 'skill_specific', 'work_quality', 'reliability'
    )),
    specific_skill VARCHAR(255),
    verification_text TEXT NOT NULL,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN (
        'worked_together', 'hired_before', 'professional_connection', 'personal_connection'
    )),
    relationship_duration VARCHAR(50) CHECK (relationship_duration IN (
        'one_time', 'less_than_month', 'one_to_six_months', 'six_to_twelve_months', 'over_one_year', 'over_three_years'
    )),
    verification_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),
    is_disputed BOOLEAN NOT NULL DEFAULT FALSE,
    dispute_reason TEXT,
    disputed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(helper_id, verifier_id, verification_type, specific_skill)
);

-- -----------------------------------------------------
-- Table helper_disputes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES labor_assignments(id),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    client_id UUID NOT NULL REFERENCES users(id),
    initiated_by VARCHAR(50) NOT NULL CHECK (initiated_by IN ('helper', 'client')),
    dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN (
        'hours_worked', 'payment', 'job_conditions', 'expectations', 'other'
    )),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'opened', 'under_review', 'mediation', 'resolved', 'closed', 'escalated'
    )),
    disputed_amount DECIMAL(10,2),
    dispute_description TEXT NOT NULL,
    evidence_urls TEXT[],
    resolution_type VARCHAR(50) CHECK (resolution_type IN (
        'full_helper', 'partial_helper', 'full_client', 'partial_client', 'mutual_agreement', 'no_resolution'
    )),
    resolution_amount DECIMAL(10,2),
    resolution_description TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    closure_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table helper_dispute_messages
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES helper_disputes(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('helper', 'client', 'admin', 'mediator')),
    message TEXT NOT NULL,
    attachment_urls TEXT[],
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_system_message BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table labor_teams
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    leader_id UUID NOT NULL REFERENCES labor_helpers(id),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'forming', 'active', 'inactive', 'disbanded'
    )),
    description TEXT,
    primary_skill_category_id UUID REFERENCES skill_categories(id),
    specialty TEXT,
    min_team_rate DECIMAL(10,2),
    base_day_rate DECIMAL(10,2),
    has_transportation BOOLEAN NOT NULL DEFAULT FALSE,
    has_tools BOOLEAN NOT NULL DEFAULT FALSE,
    member_count INTEGER NOT NULL DEFAULT 1,
    max_members INTEGER NOT NULL DEFAULT 10,
    formation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    area_served VARCHAR(255),
    photo_url TEXT,
    overall_rating DECIMAL(3,2),
    total_completed_jobs INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table labor_team_members
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES labor_teams(id),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    role VARCHAR(50) NOT NULL CHECK (role IN ('leader', 'member', 'apprentice', 'specialist')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('invited', 'active', 'inactive', 'removed')),
    joined_date TIMESTAMP WITH TIME ZONE,
    invitation_status VARCHAR(50) CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'expired')),
    individual_rate DECIMAL(10,2),
    skills_contributed TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, helper_id)
);

-- -----------------------------------------------------
-- Table team_assignments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS team_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_post_id UUID NOT NULL REFERENCES labor_job_posts(id),
    team_id UUID NOT NULL REFERENCES labor_teams(id),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'scheduled', 'in_progress', 'completed', 'canceled', 'partial'
    )),
    team_rate DECIMAL(10,2) NOT NULL,
    expected_start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_end_date TIMESTAMP WITH TIME ZONE,
    expected_days INTEGER,
    actual_start_date TIMESTAMP WITH TIME ZONE,
    actual_end_date TIMESTAMP WITH TIME ZONE,
    actual_days INTEGER,
    total_pay DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    team_payout DECIMAL(10,2),
    description TEXT,
    special_instructions TEXT,
    canceled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,
    canceled_at TIMESTAMP WITH TIME ZONE,
    cancellation_fee DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(job_post_id, team_id)
);

-- -----------------------------------------------------
-- Table team_member_assignments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS team_member_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_assignment_id UUID NOT NULL REFERENCES team_assignments(id),
    team_member_id UUID NOT NULL REFERENCES labor_team_members(id),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    role VARCHAR(50) NOT NULL CHECK (role IN ('lead', 'support', 'specialist', 'general')),
    pay_share_percentage DECIMAL(5,2),
    expected_pay DECIMAL(10,2),
    actual_pay DECIMAL(10,2),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'scheduled', 'checked_in', 'completed', 'no_show', 'canceled'
    )),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(team_assignment_id, helper_id)
);

-- -----------------------------------------------------
-- Table labor_helper_badges
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_helper_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'reliability', 'skill', 'experience', 'customer_satisfaction', 'achievement', 'verification'
    )),
    icon_url TEXT NOT NULL,
    criteria_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_priority INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(name, category)
);

-- -----------------------------------------------------
-- Table helper_earned_badges
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS helper_earned_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL REFERENCES labor_helpers(id),
    badge_id UUID NOT NULL REFERENCES labor_helper_badges(id),
    earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    awarded_by UUID REFERENCES users(id),
    award_reason TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(helper_id, badge_id)
);

-- -----------------------------------------------------
-- Create indexes
-- -----------------------------------------------------
CREATE INDEX idx_labor_helpers_user_id ON labor_helpers(user_id);
CREATE INDEX idx_labor_helpers_profile_status ON labor_helpers(profile_status);
CREATE INDEX idx_labor_helpers_verification_level ON labor_helpers(verification_level);
CREATE INDEX idx_labor_helpers_availability_status ON labor_helpers(availability_status);
CREATE INDEX idx_labor_helpers_current_location_zip ON labor_helpers(current_location_zip);
CREATE INDEX idx_labor_helpers_overall_rating ON labor_helpers(overall_rating);

CREATE INDEX idx_helper_skills_helper_id ON helper_skills(helper_id);
CREATE INDEX idx_helper_skills_skill_name ON helper_skills(skill_name);
CREATE INDEX idx_helper_skills_skill_type ON helper_skills(skill_type);
CREATE INDEX idx_helper_skills_skill_level ON helper_skills(skill_level);
CREATE INDEX idx_helper_skills_is_verified ON helper_skills(is_verified);

CREATE INDEX idx_skill_categories_parent_category_id ON skill_categories(parent_category_id);

CREATE INDEX idx_helper_skill_category_mappings_helper_id ON helper_skill_category_mappings(helper_id);
CREATE INDEX idx_helper_skill_category_mappings_skill_category_id ON helper_skill_category_mappings(skill_category_id);
CREATE INDEX idx_helper_skill_category_mappings_is_primary ON helper_skill_category_mappings(is_primary);

CREATE INDEX idx_helper_certifications_helper_id ON helper_certifications(helper_id);
CREATE INDEX idx_helper_certifications_verification_status ON helper_certifications(verification_status);

CREATE INDEX idx_helper_work_history_helper_id ON helper_work_history(helper_id);
CREATE INDEX idx_helper_work_history_is_current ON helper_work_history(is_current);
CREATE INDEX idx_helper_work_history_verified ON helper_work_history(verified);

CREATE INDEX idx_helper_availability_helper_id ON helper_availability(helper_id);
CREATE INDEX idx_helper_availability_day_of_week ON helper_availability(day_of_week);

CREATE INDEX idx_helper_unavailable_dates_helper_id ON helper_unavailable_dates(helper_id);
CREATE INDEX idx_helper_unavailable_dates_date_range ON helper_unavailable_dates(start_date, end_date);

CREATE INDEX idx_labor_job_posts_creator_id ON labor_job_posts(creator_id);
CREATE INDEX idx_labor_job_posts_creator_type ON labor_job_posts(creator_type);
CREATE INDEX idx_labor_job_posts_project_id ON labor_job_posts(project_id);
CREATE INDEX idx_labor_job_posts_status ON labor_job_posts(status);
CREATE INDEX idx_labor_job_posts_job_type ON labor_job_posts(job_type);
CREATE INDEX idx_labor_job_posts_pay_type ON labor_job_posts(pay_type);
CREATE INDEX idx_labor_job_posts_start_date ON labor_job_posts(start_date);
CREATE INDEX idx_labor_job_posts_location_zip ON labor_job_posts(location_zip);
CREATE INDEX idx_labor_job_posts_skill_category_id ON labor_job_posts(skill_category_id);
CREATE INDEX idx_labor_job_posts_required_verification_level ON labor_job_posts(required_verification_level);
CREATE INDEX idx_labor_job_posts_urgency_level ON labor_job_posts(urgency_level);

CREATE INDEX idx_job_specific_requirements_job_post_id ON job_specific_requirements(job_post_id);
CREATE INDEX idx_job_specific_requirements_requirement_type ON job_specific_requirements(requirement_type);

CREATE INDEX idx_labor_job_applications_job_post_id ON labor_job_applications(job_post_id);
CREATE INDEX idx_labor_job_applications_helper_id ON labor_job_applications(helper_id);
CREATE INDEX idx_labor_job_applications_status ON labor_job_applications(status);
CREATE INDEX idx_labor_job_applications_submission_date ON labor_job_applications(submission_date);

CREATE INDEX idx_labor_assignments_job_post_id ON labor_assignments(job_post_id);
CREATE INDEX idx_labor_assignments_helper_id ON labor_assignments(helper_id);
CREATE INDEX idx_labor_assignments_application_id ON labor_assignments(application_id);
CREATE INDEX idx_labor_assignments_hiring_user_id ON labor_assignments(hiring_user_id);
CREATE INDEX idx_labor_assignments_status ON labor_assignments(status);
CREATE INDEX idx_labor_assignments_expected_start_date ON labor_assignments(expected_start_date);

CREATE INDEX idx_assignment_check_ins_assignment_id ON assignment_check_ins(assignment_id);
CREATE INDEX idx_assignment_check_ins_verification_status ON assignment_check_ins(verification_status);

CREATE INDEX idx_assignment_tasks_assignment_id ON assignment_tasks(assignment_id);
CREATE INDEX idx_assignment_tasks_status ON assignment_tasks(status);
CREATE INDEX idx_assignment_tasks_priority ON assignment_tasks(priority);

CREATE INDEX idx_labor_helper_reviews_assignment_id ON labor_helper_reviews(assignment_id);
CREATE INDEX idx_labor_helper_reviews_helper_id ON labor_helper_reviews(helper_id);
CREATE INDEX idx_labor_helper_reviews_reviewer_id ON labor_helper_reviews(reviewer_id);
CREATE INDEX idx_labor_helper_reviews_overall_rating ON labor_helper_reviews(overall_rating);

CREATE INDEX idx_client_reviews_assignment_id ON client_reviews(assignment_id);
CREATE INDEX idx_client_reviews_client_id ON client_reviews(client_id);
CREATE INDEX idx_client_reviews_helper_id ON client_reviews(helper_id);
CREATE INDEX idx_client_reviews_overall_rating ON client_reviews(overall_rating);

CREATE INDEX idx_community_verifications_helper_id ON community_verifications(helper_id);
CREATE INDEX idx_community_verifications_verifier_id ON community_verifications(verifier_id);
CREATE INDEX idx_community_verifications_verification_type ON community_verifications(verification_type);
CREATE INDEX idx_community_verifications_is_approved ON community_verifications(is_approved);

CREATE INDEX idx_helper_disputes_assignment_id ON helper_disputes(assignment_id);
CREATE INDEX idx_helper_disputes_helper_id ON helper_disputes(helper_id);
CREATE INDEX idx_helper_disputes_client_id ON helper_disputes(client_id);
CREATE INDEX idx_helper_disputes_status ON helper_disputes(status);

CREATE INDEX idx_helper_dispute_messages_dispute_id ON helper_dispute_messages(dispute_id);
CREATE INDEX idx_helper_dispute_messages_sender_id ON helper_dispute_messages(sender_id);

CREATE INDEX idx_labor_teams_leader_id ON labor_teams(leader_id);
CREATE INDEX idx_labor_teams_status ON labor_teams(status);
CREATE INDEX idx_labor_teams_primary_skill_category_id ON labor_teams(primary_skill_category_id);

CREATE INDEX idx_labor_team_members_team_id ON labor_team_members(team_id);
CREATE INDEX idx_labor_team_members_helper_id ON labor_team_members(helper_id);
CREATE INDEX idx_labor_team_members_status ON labor_team_members(status);

CREATE INDEX idx_team_assignments_job_post_id ON team_assignments(job_post_id);
CREATE INDEX idx_team_assignments_team_id ON team_assignments(team_id);
CREATE INDEX idx_team_assignments_status ON team_assignments(status);

CREATE INDEX idx_team_member_assignments_team_assignment_id ON team_member_assignments(team_assignment_id);
CREATE INDEX idx_team_member_assignments_team_member_id ON team_member_assignments(team_member_id);
CREATE INDEX idx_team_member_assignments_helper_id ON team_member_assignments(helper_id);
CREATE INDEX idx_team_member_assignments_status ON team_member_assignments(status);

CREATE INDEX idx_labor_helper_badges_category ON labor_helper_badges(category);
CREATE INDEX idx_labor_helper_badges_is_active ON labor_helper_badges(is_active);

CREATE INDEX idx_helper_earned_badges_helper_id ON helper_earned_badges(helper_id);
CREATE INDEX idx_helper_earned_badges_badge_id ON helper_earned_badges(badge_id);
CREATE INDEX idx_helper_earned_badges_is_featured ON helper_earned_badges(is_featured);

-- -----------------------------------------------------
-- Row Level Security Policies
-- -----------------------------------------------------

-- Labor Helpers table
ALTER TABLE labor_helpers ENABLE ROW LEVEL SECURITY;

CREATE POLICY labor_helpers_public_search ON labor_helpers
    FOR SELECT
    USING (
        profile_status = 'active' AND 
        verification_level IN ('identity_verified', 'background_checked', 'fully_verified')
    );

CREATE POLICY labor_helpers_own_profile ON labor_helpers
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

-- Helper Skills table
ALTER TABLE helper_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY helper_skills_public_view ON helper_skills
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM labor_helpers lh 
            WHERE lh.id = helper_id AND 
            lh.profile_status = 'active'
        )
    );

CREATE POLICY helper_skills_own ON helper_skills
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM labor_helpers lh 
            WHERE lh.id = helper_id AND 
            lh.user_id = auth.uid()
        )
    );

-- Labor Job Posts
ALTER TABLE labor_job_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY labor_job_posts_own ON labor_job_posts
    FOR ALL
    TO authenticated
    USING (creator_id = auth.uid());

CREATE POLICY labor_job_posts_public_view ON labor_job_posts
    FOR SELECT
    USING (status IN ('open', 'in_progress'));

-- Labor Job Applications
ALTER TABLE labor_job_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY labor_job_applications_job_owner ON labor_job_applications
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM labor_job_posts ljp
            WHERE ljp.id = job_post_id AND ljp.creator_id = auth.uid()
        )
    );

CREATE POLICY labor_job_applications_helper ON labor_job_applications
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM labor_helpers lh
            WHERE lh.id = helper_id AND lh.user_id = auth.uid()
        )
    );
