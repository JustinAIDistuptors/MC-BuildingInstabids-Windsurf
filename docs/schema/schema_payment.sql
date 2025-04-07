-- =============================================================================
-- INSTABIDS PAYMENT AND FEE PROCESSING SCHEMA
-- =============================================================================
-- Priority: P0 - Critical for core system functionality
--
-- This schema defines the tables for the payment domain,
-- handling all financial transactions, escrow, fee calculations,
-- payment methods, and milestone-based payment releases.
--
-- Dependencies:
--   schema_core.sql - Requires core tables
--   schema_user_management.sql - Requires user tables 
--   schema_bidding.sql - Requires bidding system tables
--   schema_project_management.sql - Requires project milestone tables
-- =============================================================================

-- -----------------------------------------------------
-- Table payment_methods
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN (
        'credit_card', 'debit_card', 'bank_account', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'venmo', 'zelle'
    )),
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    name VARCHAR(255), -- Display name like "Personal Checking" or "Work Credit Card"
    last_four VARCHAR(4), -- Last 4 digits of card or account
    expiry_month INTEGER, -- For cards
    expiry_year INTEGER, -- For cards
    card_brand VARCHAR(50), -- For cards: visa, mastercard, amex, etc.
    billing_address_id UUID REFERENCES addresses(id),
    processor_token TEXT, -- Token from payment processor for this method
    processor_customer_id TEXT, -- Customer ID from processor
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_method VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB,
    UNIQUE(user_id, payment_type, last_four)
);

-- -----------------------------------------------------
-- Table payment_transaction_types
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transaction_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('in', 'out', 'internal')),
    fee_percentage DECIMAL(5,2),
    fixed_fee DECIMAL(10,2),
    min_fee DECIMAL(10,2),
    max_fee DECIMAL(10,2),
    tax_rate DECIMAL(5,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approval_threshold DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed common transaction types
INSERT INTO payment_transaction_types 
    (type_code, name, direction, fee_percentage, fixed_fee, min_fee, max_fee, is_active)
VALUES
    ('connection_fee', 'Contractor Connection Fee', 'in', 7.5, 0.00, 10.00, 500.00, true),
    ('milestone_payment', 'Project Milestone Payment', 'out', 2.5, 0.00, 5.00, 250.00, true), 
    ('milestone_release', 'Milestone Release to Contractor', 'internal', 0.0, 0.00, 0.00, 0.00, true),
    ('refund', 'Payment Refund', 'out', 0.0, 0.00, 0.00, 0.00, true),
    ('chargeback', 'Payment Chargeback', 'out', 0.0, 15.00, 15.00, 15.00, true),
    ('escrow_deposit', 'Escrow Account Deposit', 'in', 0.0, 0.00, 0.00, 0.00, true),
    ('escrow_withdrawal', 'Escrow Account Withdrawal', 'out', 0.0, 0.00, 0.00, 0.00, true),
    ('subscription_fee', 'Contractor Subscription Fee', 'in', 0.0, 0.00, 0.00, 0.00, true),
    ('featured_listing', 'Featured Bid Card Listing', 'in', 0.0, 19.99, 19.99, 19.99, true),
    ('priority_placement', 'Priority Placement Fee', 'in', 0.0, 9.99, 9.99, 9.99, true);

-- -----------------------------------------------------
-- Table payment_transactions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    transaction_type_id UUID NOT NULL REFERENCES payment_transaction_types(id),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded', 'disputed', 'canceled'
    )),
    payment_method_id UUID REFERENCES payment_methods(id),
    reference_number VARCHAR(255), -- External reference number
    description TEXT,
    processor VARCHAR(50) NOT NULL, -- Payment processor used: stripe, paypal, etc.
    processor_transaction_id VARCHAR(255), -- Transaction ID from the processor
    processor_fee DECIMAL(10,2), -- Fee charged by payment processor
    platform_fee DECIMAL(10,2), -- Fee charged by InstaBids
    tax_amount DECIMAL(10,2),
    net_amount DECIMAL(12,2) NOT NULL, -- Amount after fees
    related_entity_type VARCHAR(50), -- bid, project, milestone, etc.
    related_entity_id UUID, -- ID of related entity
    metadata JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    invoice_url TEXT,
    receipt_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------
-- Table fee_configurations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS fee_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN (
        'connection_fee', 'milestone_payment', 'subscription', 'featured_listing', 'priority_placement', 'withdraw'
    )),
    calculation_method VARCHAR(50) NOT NULL CHECK (calculation_method IN (
        'percentage', 'fixed', 'tiered_percentage', 'tiered_fixed', 'hybrid'
    )),
    percentage_rate DECIMAL(5,2),
    fixed_amount DECIMAL(10,2),
    min_amount DECIMAL(10,2),
    max_amount DECIMAL(10,2),
    tier_config JSONB, -- For tiered fee structures
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    applies_to_user_type VARCHAR(50), -- homeowner, contractor, property_manager, etc.
    applies_to_subscription_tier VARCHAR(50), -- basic, pro, premium, etc.
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    effective_to TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed default fee configurations
INSERT INTO fee_configurations 
    (name, description, fee_type, calculation_method, percentage_rate, fixed_amount, min_amount, max_amount, applies_to_user_type)
VALUES
    ('Standard Connection Fee', 'Standard fee charged to contractors for connecting with homeowners', 'connection_fee', 'percentage', 7.5, 0.00, 10.00, 500.00, 'contractor'),
    ('Premium Connection Fee', 'Reduced fee for premium contractors', 'connection_fee', 'percentage', 6.0, 0.00, 10.00, 400.00, 'contractor'),
    ('Standard Milestone Payment Fee', 'Fee for processing milestone payments', 'milestone_payment', 'percentage', 2.5, 0.00, 5.00, 250.00, 'homeowner'),
    ('Featured Listing Fee', 'Fee for featuring a bid card', 'featured_listing', 'fixed', 0.00, 19.99, 19.99, 19.99, 'homeowner'),
    ('Priority Placement Fee', 'Fee for priority placement in search results', 'priority_placement', 'fixed', 0.00, 9.99, 9.99, 9.99, 'contractor'),
    ('Basic Subscription', 'Monthly subscription for basic tier contractors', 'subscription', 'fixed', 0.00, 29.99, 29.99, 29.99, 'contractor'),
    ('Pro Subscription', 'Monthly subscription for pro tier contractors', 'subscription', 'fixed', 0.00, 49.99, 49.99, 49.99, 'contractor'),
    ('Premium Subscription', 'Monthly subscription for premium tier contractors', 'subscription', 'fixed', 0.00, 99.99, 99.99, 99.99, 'contractor');

-- -----------------------------------------------------
-- Table escrow_accounts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS escrow_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    account_number VARCHAR(50) NOT NULL UNIQUE,
    current_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    pending_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'suspended', 'closed')),
    last_activity_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, currency)
);

-- -----------------------------------------------------
-- Table escrow_transactions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS escrow_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    escrow_account_id UUID NOT NULL REFERENCES escrow_accounts(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'deposit', 'withdrawal', 'milestone_hold', 'milestone_release', 'refund', 'adjustment'
    )),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    project_id UUID, -- Reference to projects table
    milestone_id UUID, -- Reference to project_milestones table
    previous_balance DECIMAL(12,2) NOT NULL,
    new_balance DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending', 'completed', 'failed', 'reversed'
    )),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- -----------------------------------------------------
-- Table milestone_payments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS milestone_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL, -- Reference to projects table
    milestone_id UUID NOT NULL, -- Reference to project_milestones table
    payer_id UUID NOT NULL REFERENCES users(id), -- Homeowner
    payee_id UUID NOT NULL REFERENCES users(id), -- Contractor
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'pending', 'funded', 'released', 'refunded', 'disputed', 'canceled'
    )),
    escrow_transaction_id UUID REFERENCES escrow_transactions(id),
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    release_conditions TEXT,
    scheduled_release_date TIMESTAMP WITH TIME ZONE,
    actual_release_date TIMESTAMP WITH TIME ZONE,
    release_authorized_by UUID REFERENCES users(id),
    release_trigger VARCHAR(50) CHECK (release_trigger IN (
        'manual', 'automatic', 'milestone_completion', 'dispute_resolution', 'system'
    )),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table payment_disputes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES payment_transactions(id),
    milestone_payment_id UUID REFERENCES milestone_payments(id),
    disputed_by UUID NOT NULL REFERENCES users(id),
    dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN (
        'milestone_completion', 'quality_issue', 'scope_disagreement', 'timeline_delay', 
        'material_difference', 'payment_amount', 'other'
    )),
    dispute_reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN (
        'opened', 'under_review', 'evidence_requested', 'resolved_favor_payer', 'resolved_favor_payee', 
        'partially_resolved', 'canceled', 'escalated'
    )),
    evidence_submitted BOOLEAN NOT NULL DEFAULT FALSE,
    evidence_urls TEXT[],
    resolution_details TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_amount DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table payment_dispute_messages
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES payment_disputes(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('homeowner', 'contractor', 'admin', 'system')),
    message TEXT NOT NULL,
    media_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    is_internal BOOLEAN NOT NULL DEFAULT FALSE -- For admin/system notes
);

-- -----------------------------------------------------
-- Table payment_schedules
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL, -- Reference to projects table
    created_by UUID NOT NULL REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'canceled')),
    total_amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table payment_schedule_items
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_schedule_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES payment_schedules(id),
    milestone_id UUID, -- Reference to project_milestones table
    amount DECIMAL(12,2) NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    payment_trigger VARCHAR(50) CHECK (payment_trigger IN (
        'date', 'milestone_completion', 'manual', 'project_start', 'project_completion'
    )),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'due', 'paid', 'overdue', 'canceled')),
    milestone_payment_id UUID REFERENCES milestone_payments(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table subscription_plans
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_type VARCHAR(50) NOT NULL CHECK (user_type IN ('contractor', 'homeowner', 'property_manager')),
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('basic', 'pro', 'premium', 'enterprise')),
    price DECIMAL(10,2) NOT NULL,
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'quarterly', 'annual')),
    discount_percentage DECIMAL(5,2),
    features JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_projects INTEGER,
    max_bids INTEGER,
    connection_fee_discount DECIMAL(5,2),
    processor_plan_id VARCHAR(255), -- External plan ID in payment processor
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed default subscription plans
INSERT INTO subscription_plans 
    (name, description, user_type, tier, price, billing_interval, features, max_projects, max_bids, connection_fee_discount)
VALUES
    ('Contractor Basic', 'Essential features for small contractors', 'contractor', 'basic', 29.99, 'monthly', 
     '{"bid_alerts": true, "profile_page": true, "messaging": true, "analytics_basic": true}', 
     10, 25, 0),
    ('Contractor Pro', 'Advanced features for growing contractors', 'contractor', 'pro', 49.99, 'monthly',
     '{"bid_alerts": true, "profile_page": true, "messaging": true, "analytics_basic": true, "analytics_advanced": true, "priority_support": true, "featured_profile": true}',
     25, 100, 10),
    ('Contractor Premium', 'Complete solution for established contractors', 'contractor', 'premium', 99.99, 'monthly',
     '{"bid_alerts": true, "profile_page": true, "messaging": true, "analytics_basic": true, "analytics_advanced": true, "priority_support": true, "featured_profile": true, "ai_recommendations": true, "white_label": true, "dedicated_account_manager": true}',
     null, null, 20),
    ('Property Manager Basic', 'Essential tools for property managers', 'property_manager', 'basic', 39.99, 'monthly',
     '{"managed_properties": 5, "project_management": true, "contractor_network": true}',
     20, 50, 0);

-- -----------------------------------------------------
-- Table user_subscriptions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    payment_method_id UUID REFERENCES payment_methods(id),
    processor_subscription_id VARCHAR(255), -- External subscription ID in payment processor
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table subscription_invoices
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    subscription_id UUID NOT NULL REFERENCES user_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    payment_transaction_id UUID REFERENCES payment_transactions(id),
    processor_invoice_id VARCHAR(255), -- External invoice ID in payment processor
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table withdrawal_requests
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    escrow_account_id UUID NOT NULL REFERENCES escrow_accounts(id),
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'canceled')),
    bank_account_id UUID REFERENCES payment_methods(id),
    processor_transfer_id VARCHAR(255),
    fee_amount DECIMAL(10,2),
    net_amount DECIMAL(12,2),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table promotion_codes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS promotion_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN (
        'discount_percentage', 'discount_amount', 'free_months', 'waived_fee', 'credit'
    )),
    value DECIMAL(10,2) NOT NULL, -- Percentage, amount, or number of months
    applies_to VARCHAR(50) NOT NULL CHECK (applies_to IN (
        'subscription', 'connection_fee', 'milestone_fee', 'featured_listing'
    )),
    subscription_plan_id UUID REFERENCES subscription_plans(id),
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    min_purchase_amount DECIMAL(10,2),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    one_time_use BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table user_promotion_uses
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_promotion_uses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    promotion_id UUID NOT NULL REFERENCES promotion_codes(id),
    used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    transaction_id UUID REFERENCES payment_transactions(id),
    subscription_id UUID REFERENCES user_subscriptions(id),
    savings_amount DECIMAL(10,2) NOT NULL,
    UNIQUE(user_id, promotion_id) -- For one-time-use promotions
);

-- -----------------------------------------------------
-- Table tax_rates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tax_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country VARCHAR(2) NOT NULL, -- ISO country code
    state VARCHAR(50), -- State/province if applicable
    postal_code VARCHAR(20), -- For more specific tax regions
    tax_type VARCHAR(50) NOT NULL CHECK (tax_type IN ('sales', 'vat', 'gst', 'hst', 'pst', 'qst', 'other')),
    percentage DECIMAL(6,3) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    effective_to TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table payout_batches
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payout_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),
    created_by UUID REFERENCES users(id),
    processed_by UUID REFERENCES users(id),
    total_amount DECIMAL(12,2) NOT NULL,
    total_transactions INTEGER NOT NULL,
    success_transactions INTEGER NOT NULL DEFAULT 0,
    failed_transactions INTEGER NOT NULL DEFAULT 0,
    processor VARCHAR(50) NOT NULL,
    processor_batch_id VARCHAR(255),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table payment_account_balances
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_account_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    balance_type VARCHAR(50) NOT NULL CHECK (balance_type IN ('available', 'pending', 'reserved', 'total')),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, balance_type, currency)
);

-- -----------------------------------------------------
-- Create indexes
-- -----------------------------------------------------
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);

CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_payment_transactions_related_entity ON payment_transactions(related_entity_type, related_entity_id);
CREATE INDEX idx_payment_transactions_transaction_type_id ON payment_transactions(transaction_type_id);

CREATE INDEX idx_fee_configurations_fee_type ON fee_configurations(fee_type);
CREATE INDEX idx_fee_configurations_is_active ON fee_configurations(is_active);
CREATE INDEX idx_fee_configurations_applies_to_user_type ON fee_configurations(applies_to_user_type);

CREATE INDEX idx_escrow_accounts_user_id ON escrow_accounts(user_id);
CREATE INDEX idx_escrow_accounts_status ON escrow_accounts(status);

CREATE INDEX idx_escrow_transactions_escrow_account_id ON escrow_transactions(escrow_account_id);
CREATE INDEX idx_escrow_transactions_project_id ON escrow_transactions(project_id);
CREATE INDEX idx_escrow_transactions_milestone_id ON escrow_transactions(milestone_id);
CREATE INDEX idx_escrow_transactions_status ON escrow_transactions(status);

CREATE INDEX idx_milestone_payments_project_id ON milestone_payments(project_id);
CREATE INDEX idx_milestone_payments_milestone_id ON milestone_payments(milestone_id);
CREATE INDEX idx_milestone_payments_payer_id ON milestone_payments(payer_id);
CREATE INDEX idx_milestone_payments_payee_id ON milestone_payments(payee_id);
CREATE INDEX idx_milestone_payments_status ON milestone_payments(status);

CREATE INDEX idx_payment_disputes_transaction_id ON payment_disputes(transaction_id);
CREATE INDEX idx_payment_disputes_milestone_payment_id ON payment_disputes(milestone_payment_id);
CREATE INDEX idx_payment_disputes_disputed_by ON payment_disputes(disputed_by);
CREATE INDEX idx_payment_disputes_status ON payment_disputes(status);

CREATE INDEX idx_payment_schedules_project_id ON payment_schedules(project_id);
CREATE INDEX idx_payment_schedules_status ON payment_schedules(status);

CREATE INDEX idx_payment_schedule_items_schedule_id ON payment_schedule_items(schedule_id);
CREATE INDEX idx_payment_schedule_items_milestone_id ON payment_schedule_items(milestone_id);
CREATE INDEX idx_payment_schedule_items_status ON payment_schedule_items(status);
CREATE INDEX idx_payment_schedule_items_due_date ON payment_schedule_items(due_date);

CREATE INDEX idx_subscription_plans_user_type ON subscription_plans(user_type);
CREATE INDEX idx_subscription_plans_tier ON subscription_plans(tier);
CREATE INDEX idx_subscription_plans_is_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_billing_interval ON subscription_plans(billing_interval);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_subscription_plan_id ON user_subscriptions(subscription_plan_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_current_period_end ON user_subscriptions(current_period_end);

CREATE INDEX idx_subscription_invoices_user_id ON subscription_invoices(user_id);
CREATE INDEX idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);
CREATE INDEX idx_subscription_invoices_status ON subscription_invoices(status);
CREATE INDEX idx_subscription_invoices_due_date ON subscription_invoices(due_date);

CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_escrow_account_id ON withdrawal_requests(escrow_account_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);

CREATE INDEX idx_promotion_codes_code ON promotion_codes(code);
CREATE INDEX idx_promotion_codes_is_active ON promotion_codes(is_active);
CREATE INDEX idx_promotion_codes_start_date ON promotion_codes(start_date);
CREATE INDEX idx_promotion_codes_end_date ON promotion_codes(end_date);
CREATE INDEX idx_promotion_codes_applies_to ON promotion_codes(applies_to);

CREATE INDEX idx_user_promotion_uses_user_id ON user_promotion_uses(user_id);
CREATE INDEX idx_user_promotion_uses_promotion_id ON user_promotion_uses(promotion_id);

CREATE INDEX idx_tax_rates_country_state_postal ON tax_rates(country, state, postal_code);
CREATE INDEX idx_tax_rates_is_active ON tax_rates(is_active);

CREATE INDEX idx_payout_batches_status ON payout_batches(status);
CREATE INDEX idx_payout_batches_created_at ON payout_batches(created_at);

CREATE INDEX idx_payment_account_balances_user_id ON payment_account_balances(user_id);
CREATE INDEX idx_payment_account_balances_balance_type ON payment_account_balances(balance_type);

-- -----------------------------------------------------
-- Create RLS Policies for Payment Tables
-- -----------------------------------------------------

-- Payment Methods RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_methods_user_own 
    ON payment_methods 
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid());
    
CREATE POLICY payment_methods_admin_all 
    ON payment_methods 
    FOR ALL
    TO admin
    USING (true);

-- Payment Transactions RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_transactions_user_own 
    ON payment_transactions 
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
CREATE POLICY payment_transactions_admin_all 
    ON payment_transactions 
    FOR ALL
    TO admin
    USING (true);

-- Escrow Accounts RLS
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY escrow_accounts_user_own 
    ON escrow_accounts 
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
CREATE POLICY escrow_accounts_admin_all 
    ON escrow_accounts 
    FOR ALL
    TO admin
    USING (true);

-- Milestone Payments RLS
ALTER TABLE milestone_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY milestone_payments_payer_select 
    ON milestone_payments 
    FOR SELECT
    TO authenticated
    USING (payer_id = auth.uid());

CREATE POLICY milestone_payments_payee_select 
    ON milestone_payments 
    FOR SELECT
    TO authenticated
    USING (payee_id = auth.uid());
    
CREATE POLICY milestone_payments_admin_all 
    ON milestone_payments 
    FOR ALL
    TO admin
    USING (true);

-- User Subscriptions RLS
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_subscriptions_user_own 
    ON user_subscriptions 
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
    
CREATE POLICY user_subscriptions_admin_all 
    ON user_subscriptions 
    FOR ALL
    TO admin
    USING (true);
