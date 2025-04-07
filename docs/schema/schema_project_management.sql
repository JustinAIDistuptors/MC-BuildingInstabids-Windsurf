-- =============================================================================
-- INSTABIDS PROJECT MANAGEMENT SCHEMA
-- =============================================================================
-- Priority: P1 - Critical for project tracking
--
-- This schema defines the tables for the project management domain,
-- handling the lifecycle of projects after the bidding process.
--
-- Dependencies:
--   schema_core.sql - Requires core tables
--   schema_user_management.sql - Requires user tables
--   schema_bidding.sql - Requires bidding tables
-- =============================================================================

-- -----------------------------------------------------
-- Table projects
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    homeowner_id UUID NOT NULL REFERENCES users(id),
    contractor_id UUID NOT NULL REFERENCES users(id),
    bid_card_id UUID NOT NULL REFERENCES bid_cards(id),
    accepted_bid_id UUID NOT NULL REFERENCES bids(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'planning' 
        CHECK (status IN ('planning', 'scheduled', 'in_progress', 'on_hold', 'completed', 'cancelled', 'dispute')),
    start_date DATE,
    scheduled_completion_date DATE,
    actual_completion_date DATE,
    budget DECIMAL(12,2) NOT NULL,
    final_cost DECIMAL(12,2),
    is_rush BOOLEAN NOT NULL DEFAULT FALSE,
    has_material_delivery BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    location_id UUID REFERENCES addresses(id),
    is_multi_phase BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    project_manager_id UUID REFERENCES users(id),
    is_managed_property BOOLEAN NOT NULL DEFAULT FALSE,
    managed_property_id UUID REFERENCES managed_properties(id),
    has_scheduled_payments BOOLEAN NOT NULL DEFAULT FALSE,
    has_escrow BOOLEAN NOT NULL DEFAULT FALSE,
    bid_accepted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    current_phase_id UUID,
    is_permit_required BOOLEAN NOT NULL DEFAULT FALSE,
    permit_status VARCHAR(50) CHECK (permit_status IN ('not_required', 'pending', 'approved', 'denied')),
    permit_document_urls TEXT[],
    last_status_change_at TIMESTAMP WITH TIME ZONE,
    project_health VARCHAR(20) NOT NULL DEFAULT 'on_track' 
        CHECK (project_health IN ('on_track', 'at_risk', 'delayed', 'completed')),
    homeowner_final_rating DECIMAL(3,2),
    contractor_final_rating DECIMAL(3,2),
    metadata JSONB
);

-- Add foreign key for current_phase_id after project_phases table is created
-- ALTER TABLE projects ADD CONSTRAINT fk_projects_current_phase FOREIGN KEY (current_phase_id) REFERENCES project_phases(id);

-- -----------------------------------------------------
-- Table project_phases
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    phase_number INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' 
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold')),
    start_date DATE,
    end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    budget DECIMAL(12,2) NOT NULL,
    final_cost DECIMAL(12,2),
    depends_on_phase_id UUID REFERENCES project_phases(id),
    completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    contractor_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add the deferred foreign key to projects
ALTER TABLE projects ADD CONSTRAINT fk_projects_current_phase FOREIGN KEY (current_phase_id) REFERENCES project_phases(id) DEFERRABLE INITIALLY DEFERRED;

-- -----------------------------------------------------
-- Table project_milestones
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed', 'cancelled')),
    is_payment_trigger BOOLEAN NOT NULL DEFAULT FALSE,
    payment_amount DECIMAL(12,2),
    payment_released BOOLEAN DEFAULT FALSE,
    payment_released_at TIMESTAMP WITH TIME ZONE,
    requires_verification BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_method VARCHAR(50) CHECK (verification_method IN ('photo', 'inspection', 'self_report')),
    verification_result VARCHAR(50) CHECK (verification_result IN ('pass', 'fail', 'pending_fix')),
    media_urls TEXT[],
    notify_on_complete BOOLEAN NOT NULL DEFAULT TRUE,
    notification_type VARCHAR(20) CHECK (notification_type IN ('email', 'sms', 'push', 'all')),
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_tasks
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    milestone_id UUID REFERENCES project_milestones(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo' 
        CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    assigned_to UUID REFERENCES users(id),
    assigned_by UUID REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    blocked_reason TEXT,
    depends_on UUID[],
    notify_on_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_materials
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    task_id UUID REFERENCES project_tasks(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    estimated_cost DECIMAL(12,2) NOT NULL,
    actual_cost DECIMAL(12,2),
    status VARCHAR(50) NOT NULL DEFAULT 'needed' 
        CHECK (status IN ('needed', 'ordered', 'delivered', 'installed', 'returned')),
    supplier VARCHAR(255),
    purchase_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    received_date TIMESTAMP WITH TIME ZONE,
    purchased_by VARCHAR(50) NOT NULL CHECK (purchased_by IN ('homeowner', 'contractor')),
    notes TEXT,
    tracking_number VARCHAR(100),
    estimated_delivery_window VARCHAR(100),
    receipt_url TEXT,
    image_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_status_updates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_status_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    created_by UUID NOT NULL REFERENCES users(id),
    user_type VARCHAR(50) NOT NULL 
        CHECK (user_type IN ('homeowner', 'contractor', 'project_manager', 'admin')),
    content TEXT NOT NULL,
    media_urls TEXT[],
    status VARCHAR(50) CHECK (status IN ('on_track', 'at_risk', 'delayed', 'issue_identified', 'resolved', 'completed')),
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    requires_response BOOLEAN NOT NULL DEFAULT FALSE,
    response_due_by TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_issues
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    reported_by UUID NOT NULL REFERENCES users(id),
    reporter_type VARCHAR(20) NOT NULL CHECK (reporter_type IN ('homeowner', 'contractor')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'moderate' 
        CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' 
        CHECK (status IN ('open', 'acknowledged', 'in_progress', 'resolved', 'closed')),
    assigned_to UUID REFERENCES users(id),
    media_urls TEXT[],
    impact_description TEXT,
    resolution_plan TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_schedules
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_pattern VARCHAR(50),
    recurring_days INTEGER[],
    recurring_end_date DATE,
    location TEXT,
    notes TEXT,
    requires_homeowner_presence BOOLEAN NOT NULL DEFAULT FALSE,
    requires_contractor_presence BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
    previous_schedule_id UUID REFERENCES project_schedules(id),
    rescheduled_reason TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    calendar_event_id VARCHAR(255),
    reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
    reminder_sent_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------
-- Table project_daily_logs
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_daily_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    created_by UUID NOT NULL REFERENCES users(id),
    log_date DATE NOT NULL,
    work_completed TEXT NOT NULL,
    hours_worked DECIMAL(5,2),
    worker_count INTEGER,
    weather_conditions VARCHAR(100),
    temperature DECIMAL(5,2),
    delays_encountered TEXT,
    materials_delivered TEXT,
    equipment_used TEXT,
    visitor_notes TEXT,
    safety_incidents TEXT,
    inspections TEXT,
    general_notes TEXT,
    media_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_payment_schedules
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue', 'cancelled')),
    milestone_id UUID REFERENCES project_milestones(id),
    invoice_url TEXT,
    receipt_url TEXT,
    payment_method VARCHAR(100),
    payment_date TIMESTAMP WITH TIME ZONE,
    transaction_id VARCHAR(255),
    paid_amount DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_inspections
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('internal', 'city', 'county', 'third_party')),
    scheduled_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    inspector_name VARCHAR(255),
    inspector_company VARCHAR(255),
    inspector_contact VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'passed', 'failed', 'rescheduled', 'cancelled')),
    result VARCHAR(50) CHECK (result IN ('pass', 'conditional_pass', 'fail')),
    notes TEXT,
    report_url TEXT,
    media_urls TEXT[],
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    permit_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_change_orders
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_change_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id),
    requestor_type VARCHAR(20) NOT NULL CHECK (requestor_type IN ('homeowner', 'contractor')),
    status VARCHAR(50) NOT NULL DEFAULT 'requested' 
        CHECK (status IN ('requested', 'in_review', 'approved', 'rejected', 'completed')),
    original_scope TEXT,
    proposed_scope TEXT,
    cost_change DECIMAL(12,2) NOT NULL,
    timeline_impact_days INTEGER NOT NULL DEFAULT 0,
    new_completion_date DATE,
    reason TEXT NOT NULL,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT,
    media_urls TEXT[],
    signature_required BOOLEAN NOT NULL DEFAULT TRUE,
    signed_by_homeowner BOOLEAN NOT NULL DEFAULT FALSE,
    signed_by_contractor BOOLEAN NOT NULL DEFAULT FALSE,
    homeowner_signature_url TEXT,
    contractor_signature_url TEXT,
    homeowner_signed_at TIMESTAMP WITH TIME ZONE,
    contractor_signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_contracts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    document_url TEXT NOT NULL,
    document_type VARCHAR(50) NOT NULL 
        CHECK (document_type IN ('contract', 'proposal', 'addendum', 'change_order', 'warranty', 'other')),
    version_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'sent', 'signed', 'rejected', 'expired')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    signed_by_homeowner BOOLEAN NOT NULL DEFAULT FALSE,
    signed_by_contractor BOOLEAN NOT NULL DEFAULT FALSE,
    homeowner_signature_url TEXT,
    contractor_signature_url TEXT,
    homeowner_signed_at TIMESTAMP WITH TIME ZONE,
    contractor_signed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    templates TEXT[],
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table project_warranties
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS project_warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    warranty_type VARCHAR(50) NOT NULL 
        CHECK (warranty_type IN ('labor', 'materials', 'both', 'limited', 'manufacturer')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    document_url TEXT,
    terms TEXT NOT NULL,
    issued_by UUID NOT NULL REFERENCES users(id),
    coverage_details TEXT NOT NULL,
    exclusions TEXT,
    claim_instructions TEXT,
    transferred BOOLEAN NOT NULL DEFAULT FALSE,
    transferred_to UUID REFERENCES users(id),
    transferred_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table warranty_claims
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS warranty_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warranty_id UUID NOT NULL REFERENCES project_warranties(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    claim_number VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted' 
        CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'work_scheduled', 'work_completed', 'closed')),
    submitted_by UUID NOT NULL REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    media_urls TEXT[],
    inspection_required BOOLEAN NOT NULL DEFAULT FALSE,
    inspection_date TIMESTAMP WITH TIME ZONE,
    inspection_notes TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    scheduled_work_date TIMESTAMP WITH TIME ZONE,
    completed_work_date TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table labor_assignments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS labor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id),
    phase_id UUID REFERENCES project_phases(id),
    task_id UUID REFERENCES project_tasks(id),
    labor_helper_id UUID NOT NULL REFERENCES users(id),
    contractor_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    hourly_rate DECIMAL(8,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' 
        CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(6,2),
    total_amount DECIMAL(10,2),
    rating DECIMAL(3,2),
    review_text TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Create indexes
-- -----------------------------------------------------
CREATE INDEX idx_projects_homeowner ON projects(homeowner_id);
CREATE INDEX idx_projects_contractor ON projects(contractor_id);
CREATE INDEX idx_projects_bid_card ON projects(bid_card_id);
CREATE INDEX idx_projects_accepted_bid ON projects(accepted_bid_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_managed_property ON projects(managed_property_id);

CREATE INDEX idx_project_phases_project ON project_phases(project_id);
CREATE INDEX idx_project_phases_status ON project_phases(status);

CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);
CREATE INDEX idx_project_milestones_phase ON project_milestones(phase_id);
CREATE INDEX idx_project_milestones_due_date ON project_milestones(due_date);

CREATE INDEX idx_project_tasks_project ON project_tasks(project_id);
CREATE INDEX idx_project_tasks_phase ON project_tasks(phase_id);
CREATE INDEX idx_project_tasks_milestone ON project_tasks(milestone_id);
CREATE INDEX idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX idx_project_tasks_status ON project_tasks(status);

CREATE INDEX idx_project_materials_project ON project_materials(project_id);
CREATE INDEX idx_project_materials_phase ON project_materials(phase_id);
CREATE INDEX idx_project_materials_status ON project_materials(status);

CREATE INDEX idx_project_status_updates_project ON project_status_updates(project_id);
CREATE INDEX idx_project_status_updates_created_by ON project_status_updates(created_by);

CREATE INDEX idx_project_issues_project ON project_issues(project_id);
CREATE INDEX idx_project_issues_phase ON project_issues(phase_id);
CREATE INDEX idx_project_issues_status ON project_issues(status);
CREATE INDEX idx_project_issues_severity ON project_issues(severity);

CREATE INDEX idx_project_schedules_project ON project_schedules(project_id);
CREATE INDEX idx_project_schedules_start_time ON project_schedules(start_time);

CREATE INDEX idx_project_daily_logs_project ON project_daily_logs(project_id);
CREATE INDEX idx_project_daily_logs_log_date ON project_daily_logs(log_date);

CREATE INDEX idx_project_payment_schedules_project ON project_payment_schedules(project_id);
CREATE INDEX idx_project_payment_schedules_status ON project_payment_schedules(status);

CREATE INDEX idx_project_inspections_project ON project_inspections(project_id);
CREATE INDEX idx_project_inspections_phase ON project_inspections(phase_id);
CREATE INDEX idx_project_inspections_status ON project_inspections(status);

CREATE INDEX idx_project_change_orders_project ON project_change_orders(project_id);
CREATE INDEX idx_project_change_orders_status ON project_change_orders(status);

CREATE INDEX idx_project_contracts_project ON project_contracts(project_id);
CREATE INDEX idx_project_contracts_status ON project_contracts(status);

CREATE INDEX idx_project_warranties_project ON project_warranties(project_id);

CREATE INDEX idx_warranty_claims_warranty ON warranty_claims(warranty_id);
CREATE INDEX idx_warranty_claims_project ON warranty_claims(project_id);
CREATE INDEX idx_warranty_claims_status ON warranty_claims(status);

CREATE INDEX idx_labor_assignments_project ON labor_assignments(project_id);
CREATE INDEX idx_labor_assignments_labor_helper ON labor_assignments(labor_helper_id);
CREATE INDEX idx_labor_assignments_contractor ON labor_assignments(contractor_id);
CREATE INDEX idx_labor_assignments_status ON labor_assignments(status);
CREATE INDEX idx_labor_assignments_start_time ON labor_assignments(start_time);
