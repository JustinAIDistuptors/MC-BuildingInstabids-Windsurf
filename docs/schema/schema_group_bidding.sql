-- =============================================================================
-- INSTABIDS GROUP BIDDING SYSTEM SCHEMA
-- =============================================================================
-- Priority: P1 - Core competitive advantage
--
-- This schema defines the tables for the group bidding domain,
-- allowing multiple homeowners to combine their projects to receive 
-- better rates and terms from contractors.
--
-- Dependencies:
--   schema_core.sql - Requires core tables
--   schema_user_management.sql - Requires user tables
--   schema_bidding.sql - Requires bidding tables
-- =============================================================================

-- -----------------------------------------------------
-- Table bid_groups
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS bid_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'forming', 'active', 'bidding', 'pending_acceptance', 'completed', 'canceled', 'expired'
    )),
    job_category_id UUID REFERENCES job_categories(id),
    job_type_id UUID REFERENCES job_types(id),
    zip_code VARCHAR(20) NOT NULL,
    location_radius INTEGER, -- In miles or kilometers
    city VARCHAR(100),
    state VARCHAR(50),
    country VARCHAR(50) DEFAULT 'USA',
    min_members INTEGER,
    max_members INTEGER,
    current_members INTEGER NOT NULL DEFAULT 0,
    target_savings_percentage DECIMAL(5,2), -- Target group discount
    actual_savings_percentage DECIMAL(5,2), -- Actual achieved discount
    created_by UUID NOT NULL REFERENCES users(id),
    admin_user_id UUID REFERENCES users(id),
    formation_deadline TIMESTAMP WITH TIME ZONE,
    bid_deadline TIMESTAMP WITH TIME ZONE,
    acceptance_deadline TIMESTAMP WITH TIME ZONE,
    estimated_start_date TIMESTAMP WITH TIME ZONE,
    estimated_end_date TIMESTAMP WITH TIME ZONE,
    is_auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    has_accepted_bid BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_group_bid_id UUID, -- Will be populated later
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table group_joining_criteria
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_joining_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_group_id UUID NOT NULL REFERENCES bid_groups(id),
    criterion_type VARCHAR(50) NOT NULL CHECK (criterion_type IN (
        'budget_range', 'project_size', 'timeframe', 'materials', 'custom'
    )),
    criterion_name VARCHAR(100) NOT NULL,
    min_value DECIMAL(12,2),
    max_value DECIMAL(12,2),
    text_value TEXT,
    boolean_value BOOLEAN,
    date_value TIMESTAMP WITH TIME ZONE,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    criteria_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table bid_group_members
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS bid_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_group_id UUID NOT NULL REFERENCES bid_groups(id),
    bid_card_id UUID NOT NULL REFERENCES bid_cards(id),
    user_id UUID NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'invited', 'pending', 'joined', 'left', 'removed', 'rejected'
    )),
    left_at TIMESTAMP WITH TIME ZONE,
    removal_reason TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_founding_member BOOLEAN NOT NULL DEFAULT FALSE,
    visible_to_group BOOLEAN NOT NULL DEFAULT TRUE,
    has_accepted_group_bid BOOLEAN NOT NULL DEFAULT FALSE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    individual_savings_amount DECIMAL(12,2),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(bid_group_id, bid_card_id)
);

-- -----------------------------------------------------
-- Table group_bids
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_group_id UUID NOT NULL REFERENCES bid_groups(id),
    contractor_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'draft', 'submitted', 'under_review', 'shortlisted', 'accepted', 'threshold_met',
        'rejected', 'expired', 'withdrawn', 'countered'
    )),
    group_price DECIMAL(12,2) NOT NULL, -- Total price for all projects
    individual_price DECIMAL(12,2) NOT NULL, -- Average price per project
    savings_percentage DECIMAL(5,2), -- Discount compared to individual bidding
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    scope_of_work TEXT NOT NULL,
    materials_included BOOLEAN NOT NULL DEFAULT TRUE,
    materials_description TEXT,
    timeline_days INTEGER, -- Estimated days to complete all projects
    start_date TIMESTAMP WITH TIME ZONE,
    required_acceptance_count INTEGER, -- Minimum number of acceptances required
    required_acceptance_percentage INTEGER, -- Or minimum percentage
    current_acceptance_count INTEGER NOT NULL DEFAULT 0,
    acceptance_deadline TIMESTAMP WITH TIME ZONE NOT NULL, -- When bid expires
    notes TEXT,
    terms_and_conditions TEXT,
    is_final_offer BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table group_bid_items
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_bid_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_bid_id UUID NOT NULL REFERENCES group_bids(id),
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL CHECK (item_type IN (
        'labor', 'materials', 'equipment', 'permits', 'subcontractor', 'other'
    )),
    description TEXT,
    quantity DECIMAL(10,2),
    unit_price DECIMAL(12,2),
    total_price DECIMAL(12,2) NOT NULL,
    applies_to_all_projects BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table group_bid_project_specifics
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_bid_project_specifics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_bid_id UUID NOT NULL REFERENCES group_bids(id),
    bid_card_id UUID NOT NULL REFERENCES bid_cards(id),
    specific_price DECIMAL(12,2) NOT NULL, -- Price for this specific project
    specific_scope TEXT, -- Additional scope details for this project
    specific_materials TEXT, -- Material specifics for this project
    timeline_days INTEGER, -- Specific timeline for this project
    start_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(group_bid_id, bid_card_id)
);

-- -----------------------------------------------------
-- Table group_bid_acceptances
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_bid_acceptances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_bid_id UUID NOT NULL REFERENCES group_bids(id),
    bid_card_id UUID NOT NULL REFERENCES bid_cards(id),
    user_id UUID NOT NULL REFERENCES users(id),
    accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    acceptance_amount DECIMAL(12,2) NOT NULL, -- The amount this user accepted
    status VARCHAR(50) NOT NULL DEFAULT 'accepted' CHECK (status IN (
        'accepted', 'canceled', 'refunded', 'payment_pending', 'payment_completed'
    )),
    payment_transaction_id UUID, -- Link to payment once processed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(group_bid_id, bid_card_id)
);

-- -----------------------------------------------------
-- Table group_discussions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_discussions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_group_id UUID NOT NULL REFERENCES bid_groups(id),
    title VARCHAR(255) NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    is_announcement BOOLEAN NOT NULL DEFAULT FALSE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table group_discussion_messages
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_discussion_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    discussion_id UUID NOT NULL REFERENCES group_discussions(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    parent_message_id UUID REFERENCES group_discussion_messages(id),
    media_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table group_invitations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_group_id UUID NOT NULL REFERENCES bid_groups(id),
    bid_card_id UUID REFERENCES bid_cards(id),
    inviter_id UUID NOT NULL REFERENCES users(id),
    invitee_id UUID REFERENCES users(id),
    invitee_email VARCHAR(255),
    token VARCHAR(100) UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending', 'accepted', 'declined', 'expired', 'canceled'
    )),
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT check_invitee_identification CHECK (
        (invitee_id IS NOT NULL) OR (invitee_email IS NOT NULL)
    )
);

-- -----------------------------------------------------
-- Table group_formation_templates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_formation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    job_category_id UUID REFERENCES job_categories(id),
    job_type_id UUID REFERENCES job_types(id),
    min_members INTEGER NOT NULL DEFAULT 3,
    max_members INTEGER NOT NULL DEFAULT 10,
    target_savings_percentage DECIMAL(5,2) NOT NULL,
    formation_days INTEGER NOT NULL, -- Days to allow for formation
    bidding_days INTEGER NOT NULL, -- Days to allow for contractor bidding
    acceptance_days INTEGER NOT NULL, -- Days to allow for homeowner acceptance
    default_criteria JSONB, -- Default joining criteria
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table group_recommendations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_card_id UUID NOT NULL REFERENCES bid_cards(id),
    user_id UUID NOT NULL REFERENCES users(id),
    recommended_group_id UUID NOT NULL REFERENCES bid_groups(id),
    score DECIMAL(5,2) NOT NULL, -- Match score
    reason VARCHAR(255),
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending', 'shown', 'clicked', 'joined', 'dismissed'
    )),
    shown_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(bid_card_id, recommended_group_id)
);

-- -----------------------------------------------------
-- Table group_similar_bids
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_similar_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_bid_card_id UUID NOT NULL REFERENCES bid_cards(id),
    similar_bid_card_id UUID NOT NULL REFERENCES bid_cards(id),
    similarity_score DECIMAL(5,2) NOT NULL, -- Higher means more similar
    dimension_scores JSONB, -- Detailed scores by similarity dimension
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(source_bid_card_id, similar_bid_card_id)
);

-- -----------------------------------------------------
-- Table group_activity_log
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS group_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bid_group_id UUID NOT NULL REFERENCES bid_groups(id),
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'member_joined', 'member_left', 'bid_received', 'bid_accepted', 
        'threshold_met', 'group_activated', 'group_completed', 'group_canceled',
        'announcement', 'settings_changed', 'admin_changed'
    )),
    user_id UUID REFERENCES users(id),
    bid_card_id UUID REFERENCES bid_cards(id),
    group_bid_id UUID REFERENCES group_bids(id),
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Create indexes
-- -----------------------------------------------------
CREATE INDEX idx_bid_groups_status ON bid_groups(status);
CREATE INDEX idx_bid_groups_job_category_id ON bid_groups(job_category_id);
CREATE INDEX idx_bid_groups_job_type_id ON bid_groups(job_type_id);
CREATE INDEX idx_bid_groups_zip_code ON bid_groups(zip_code);
CREATE INDEX idx_bid_groups_created_by ON bid_groups(created_by);
CREATE INDEX idx_bid_groups_formation_deadline ON bid_groups(formation_deadline);
CREATE INDEX idx_bid_groups_bid_deadline ON bid_groups(bid_deadline);

CREATE INDEX idx_group_joining_criteria_bid_group_id ON group_joining_criteria(bid_group_id);
CREATE INDEX idx_group_joining_criteria_criterion_type ON group_joining_criteria(criterion_type);

CREATE INDEX idx_bid_group_members_bid_group_id ON bid_group_members(bid_group_id);
CREATE INDEX idx_bid_group_members_bid_card_id ON bid_group_members(bid_card_id);
CREATE INDEX idx_bid_group_members_user_id ON bid_group_members(user_id);
CREATE INDEX idx_bid_group_members_status ON bid_group_members(status);
CREATE INDEX idx_bid_group_members_is_admin ON bid_group_members(is_admin);
CREATE INDEX idx_bid_group_members_has_accepted_group_bid ON bid_group_members(has_accepted_group_bid);

CREATE INDEX idx_group_bids_bid_group_id ON group_bids(bid_group_id);
CREATE INDEX idx_group_bids_contractor_id ON group_bids(contractor_id);
CREATE INDEX idx_group_bids_status ON group_bids(status);
CREATE INDEX idx_group_bids_acceptance_deadline ON group_bids(acceptance_deadline);

CREATE INDEX idx_group_bid_items_group_bid_id ON group_bid_items(group_bid_id);
CREATE INDEX idx_group_bid_items_item_type ON group_bid_items(item_type);

CREATE INDEX idx_group_bid_project_specifics_group_bid_id ON group_bid_project_specifics(group_bid_id);
CREATE INDEX idx_group_bid_project_specifics_bid_card_id ON group_bid_project_specifics(bid_card_id);

CREATE INDEX idx_group_bid_acceptances_group_bid_id ON group_bid_acceptances(group_bid_id);
CREATE INDEX idx_group_bid_acceptances_bid_card_id ON group_bid_acceptances(bid_card_id);
CREATE INDEX idx_group_bid_acceptances_user_id ON group_bid_acceptances(user_id);
CREATE INDEX idx_group_bid_acceptances_status ON group_bid_acceptances(status);

CREATE INDEX idx_group_discussions_bid_group_id ON group_discussions(bid_group_id);
CREATE INDEX idx_group_discussions_created_by ON group_discussions(created_by);
CREATE INDEX idx_group_discussions_is_announcement ON group_discussions(is_announcement);
CREATE INDEX idx_group_discussions_is_pinned ON group_discussions(is_pinned);

CREATE INDEX idx_group_discussion_messages_discussion_id ON group_discussion_messages(discussion_id);
CREATE INDEX idx_group_discussion_messages_sender_id ON group_discussion_messages(sender_id);
CREATE INDEX idx_group_discussion_messages_parent_message_id ON group_discussion_messages(parent_message_id);

CREATE INDEX idx_group_invitations_bid_group_id ON group_invitations(bid_group_id);
CREATE INDEX idx_group_invitations_bid_card_id ON group_invitations(bid_card_id);
CREATE INDEX idx_group_invitations_inviter_id ON group_invitations(inviter_id);
CREATE INDEX idx_group_invitations_invitee_id ON group_invitations(invitee_id);
CREATE INDEX idx_group_invitations_invitee_email ON group_invitations(invitee_email);
CREATE INDEX idx_group_invitations_token ON group_invitations(token);
CREATE INDEX idx_group_invitations_status ON group_invitations(status);
CREATE INDEX idx_group_invitations_expires_at ON group_invitations(expires_at);

CREATE INDEX idx_group_formation_templates_job_category_id ON group_formation_templates(job_category_id);
CREATE INDEX idx_group_formation_templates_job_type_id ON group_formation_templates(job_type_id);
CREATE INDEX idx_group_formation_templates_is_active ON group_formation_templates(is_active);

CREATE INDEX idx_group_recommendations_bid_card_id ON group_recommendations(bid_card_id);
CREATE INDEX idx_group_recommendations_user_id ON group_recommendations(user_id);
CREATE INDEX idx_group_recommendations_recommended_group_id ON group_recommendations(recommended_group_id);
CREATE INDEX idx_group_recommendations_status ON group_recommendations(status);
CREATE INDEX idx_group_recommendations_score ON group_recommendations(score);

CREATE INDEX idx_group_similar_bids_source_bid_card_id ON group_similar_bids(source_bid_card_id);
CREATE INDEX idx_group_similar_bids_similar_bid_card_id ON group_similar_bids(similar_bid_card_id);
CREATE INDEX idx_group_similar_bids_similarity_score ON group_similar_bids(similarity_score);
CREATE INDEX idx_group_similar_bids_is_recommended ON group_similar_bids(is_recommended);

CREATE INDEX idx_group_activity_log_bid_group_id ON group_activity_log(bid_group_id);
CREATE INDEX idx_group_activity_log_activity_type ON group_activity_log(activity_type);
CREATE INDEX idx_group_activity_log_user_id ON group_activity_log(user_id);
CREATE INDEX idx_group_activity_log_bid_card_id ON group_activity_log(bid_card_id);
CREATE INDEX idx_group_activity_log_group_bid_id ON group_activity_log(group_bid_id);
CREATE INDEX idx_group_activity_log_created_at ON group_activity_log(created_at);

-- -----------------------------------------------------
-- Create RLS Policies for Group Bidding
-- -----------------------------------------------------

-- Bid Groups table policies
ALTER TABLE bid_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY bid_groups_select_public ON bid_groups
    FOR SELECT
    USING (
        status IN ('active', 'forming', 'bidding')
    );
    
CREATE POLICY bid_groups_select_contractors ON bid_groups
    FOR SELECT
    TO authenticated
    USING (
        status IN ('active', 'forming', 'bidding', 'pending_acceptance') AND
        EXISTS (
            SELECT 1 FROM contractors c
            WHERE c.user_id = auth.uid()
        )
    );
    
CREATE POLICY bid_groups_select_members ON bid_groups
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bid_group_members bgm
            WHERE bgm.bid_group_id = id
            AND bgm.user_id = auth.uid()
        )
    );
    
CREATE POLICY bid_groups_update_admin ON bid_groups
    FOR UPDATE
    TO authenticated
    USING (
        created_by = auth.uid() OR
        admin_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM bid_group_members bgm
            WHERE bgm.bid_group_id = id
            AND bgm.user_id = auth.uid()
            AND bgm.is_admin = true
        )
    );

-- Group Bids table policies
ALTER TABLE group_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_bids_select_members ON group_bids
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bid_group_members bgm
            WHERE bgm.bid_group_id = bid_group_id
            AND bgm.user_id = auth.uid()
        ) OR
        contractor_id = auth.uid()
    );
    
CREATE POLICY group_bids_insert_contractors ON group_bids
    FOR INSERT
    TO authenticated
    WITH CHECK (
        contractor_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM contractors c
            WHERE c.user_id = auth.uid()
        )
    );

-- Group Bid Acceptances table policies
ALTER TABLE group_bid_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_bid_acceptances_select_members ON group_bid_acceptances
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bid_group_members bgm
            WHERE bgm.bid_group_id = (
                SELECT bid_group_id FROM group_bids gb WHERE gb.id = group_bid_id
            )
            AND bgm.user_id = auth.uid()
        ) OR
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM group_bids gb
            WHERE gb.id = group_bid_id
            AND gb.contractor_id = auth.uid()
        )
    );

-- Group Discussions table policies
ALTER TABLE group_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_discussions_select_members ON group_discussions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM bid_group_members bgm
            WHERE bgm.bid_group_id = bid_group_id
            AND bgm.user_id = auth.uid()
        )
    );

-- Group Discussion Messages table policies
ALTER TABLE group_discussion_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY group_discussion_messages_select_members ON group_discussion_messages
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM group_discussions gd
            JOIN bid_group_members bgm ON gd.bid_group_id = bgm.bid_group_id
            WHERE gd.id = discussion_id
            AND bgm.user_id = auth.uid()
        )
    );
