-- =============================================================================
-- INSTABIDS MESSAGING SYSTEM SCHEMA
-- =============================================================================
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

-- Priority: P1 - Critical for user communication
--
-- This schema defines the tables for the messaging domain,
-- handling conversations, messages, notifications, and support tickets.
--
-- Dependencies:
--   schema_core.sql - Requires core tables
--   schema_user_management.sql - Requires user tables
-- =============================================================================

-- -----------------------------------------------------
-- Table conversations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('direct', 'bid_discussion', 'project_discussion', 'group', 'system')),
    participant_ids UUID[] NOT NULL,
    bid_card_id UUID REFERENCES bid_cards(id),
    bid_id UUID REFERENCES bids(id),
    project_id UUID REFERENCES projects(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES users(id)
);

-- -----------------------------------------------------
-- Table messages
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(50) NOT NULL CHECK (message_type IN ('text', 'media', 'file', 'system', 'template')),
    media_urls TEXT[],
    file_urls TEXT[],
    reply_to_message_id UUID REFERENCES messages(id),
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    edited_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
    metadata JSONB,
    template_id UUID,
    template_data JSONB,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------
-- Table message_read_statuses
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS message_read_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id),
    user_id UUID NOT NULL REFERENCES users(id),
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_on_device_id VARCHAR(255),
    read_on_platform VARCHAR(50) CHECK (read_on_platform IN ('web', 'ios', 'android')),
    UNIQUE(message_id, user_id)
);

-- -----------------------------------------------------
-- Table message_templates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('system', 'greeting', 'question', 'update', 'reminder', 'custom')),
    content TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    category VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table conversation_preferences
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    is_muted BOOLEAN NOT NULL DEFAULT FALSE,
    muted_until TIMESTAMP WITH TIME ZONE,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_at TIMESTAMP WITH TIME ZONE,
    notification_level VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (notification_level IN ('all', 'mentions', 'none')),
    custom_notification_sound VARCHAR(255),
    nicknames JSONB,
    theme_color VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, conversation_id)
);

-- -----------------------------------------------------
-- Table user_messaging_preferences
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_messaging_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) UNIQUE,
    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_notification_level VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (default_notification_level IN ('all', 'mentions', 'none')),
    do_not_disturb_start VARCHAR(5),
    do_not_disturb_end VARCHAR(5),
    do_not_disturb_days INTEGER[],
    custom_message_sounds JSONB,
    show_read_receipts BOOLEAN NOT NULL DEFAULT TRUE,
    show_typing_indicator BOOLEAN NOT NULL DEFAULT TRUE,
    show_delivery_status BOOLEAN NOT NULL DEFAULT TRUE,
    auto_archive_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table message_drafts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS message_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    content TEXT NOT NULL,
    media_urls TEXT[],
    file_urls TEXT[],
    reply_to_message_id UUID REFERENCES messages(id),
    last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB,
    UNIQUE(user_id, conversation_id)
);

-- -----------------------------------------------------
-- Table notifications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'bid', 'project', 'payment', 'system', 'reminder')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    link_url TEXT,
    conversation_id UUID REFERENCES conversations(id),
    message_id UUID REFERENCES messages(id),
    bid_card_id UUID REFERENCES bid_cards(id),
    bid_id UUID REFERENCES bids(id),
    project_id UUID REFERENCES projects(id),
    payment_id UUID,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table scheduled_notifications
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_ids UUID[] NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('message', 'bid', 'project', 'payment', 'system', 'reminder')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    link_url TEXT,
    priority_level VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'urgent')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- -----------------------------------------------------
-- Table typing_indicators
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(conversation_id, user_id)
);

-- -----------------------------------------------------
-- Table message_reactions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id),
    user_id UUID NOT NULL REFERENCES users(id),
    reaction VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(message_id, user_id, reaction)
);

-- -----------------------------------------------------
-- Table message_delivery_statuses
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS message_delivery_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('delivered', 'failed')),
    delivered_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    device_info JSONB,
    UNIQUE(message_id, user_id)
);

-- -----------------------------------------------------
-- Table conversation_participants
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'readonly', 'temporary')),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    last_read_message_id UUID REFERENCES messages(id),
    UNIQUE(conversation_id, user_id)
);

-- -----------------------------------------------------
-- Table conversation_triggers
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('bid_created', 'bid_accepted', 'project_milestone', 'payment_received', 'custom')),
    conversation_type VARCHAR(50) NOT NULL CHECK (conversation_type IN ('direct', 'bid_discussion', 'project_discussion', 'group', 'system')),
    initial_message_template_id UUID NOT NULL REFERENCES message_templates(id),
    conditions JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id)
);

-- -----------------------------------------------------
-- Table support_tickets
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('general', 'account', 'billing', 'technical', 'dispute', 'other')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'open', 'pending', 'resolved', 'closed')),
    assigned_to_id UUID REFERENCES users(id),
    conversation_id UUID REFERENCES conversations(id),
    related_entity_type VARCHAR(50) CHECK (related_entity_type IN ('project', 'bid', 'payment')),
    related_entity_id UUID,
    media_urls TEXT[],
    file_urls TEXT[],
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    reopened_at TIMESTAMP WITH TIME ZONE,
    reopen_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table ticket_activities
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id),
    actor_id UUID NOT NULL REFERENCES users(id),
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('user', 'agent', 'system')),
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('create', 'update', 'assign', 'comment', 'status_change', 'resolution')),
    previous_value TEXT,
    new_value TEXT,
    comment TEXT,
    media_urls TEXT[],
    file_urls TEXT[],
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Table canned_responses
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS canned_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    categories TEXT[],
    tags TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------
-- Create indexes
-- -----------------------------------------------------
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_participant_ids ON conversations USING GIN (participant_ids);
CREATE INDEX idx_conversations_bid_card_id ON conversations(bid_card_id);
CREATE INDEX idx_conversations_bid_id ON conversations(bid_id);
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_message_type ON messages(message_type);
CREATE INDEX idx_messages_reply_to_message_id ON messages(reply_to_message_id);
CREATE INDEX idx_messages_template_id ON messages(template_id);

CREATE INDEX idx_message_read_statuses_message_id ON message_read_statuses(message_id);
CREATE INDEX idx_message_read_statuses_user_id ON message_read_statuses(user_id);

CREATE INDEX idx_message_templates_template_type ON message_templates(template_type);
CREATE INDEX idx_message_templates_is_active ON message_templates(is_active);
CREATE INDEX idx_message_templates_category ON message_templates(category);

CREATE INDEX idx_conversation_preferences_user_id ON conversation_preferences(user_id);
CREATE INDEX idx_conversation_preferences_conversation_id ON conversation_preferences(conversation_id);
CREATE INDEX idx_conversation_preferences_is_pinned ON conversation_preferences(is_pinned);

CREATE INDEX idx_user_messaging_preferences_user_id ON user_messaging_preferences(user_id);

CREATE INDEX idx_message_drafts_user_id ON message_drafts(user_id);
CREATE INDEX idx_message_drafts_conversation_id ON message_drafts(conversation_id);
CREATE INDEX idx_message_drafts_last_updated_at ON message_drafts(last_updated_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_conversation_id ON notifications(conversation_id);
CREATE INDEX idx_notifications_message_id ON notifications(message_id);
CREATE INDEX idx_notifications_bid_card_id ON notifications(bid_card_id);
CREATE INDEX idx_notifications_bid_id ON notifications(bid_id);
CREATE INDEX idx_notifications_project_id ON notifications(project_id);
CREATE INDEX idx_notifications_priority_level ON notifications(priority_level);

CREATE INDEX idx_scheduled_notifications_scheduled_at ON scheduled_notifications(scheduled_at);
CREATE INDEX idx_scheduled_notifications_user_ids ON scheduled_notifications USING GIN (user_ids);
CREATE INDEX idx_scheduled_notifications_is_cancelled ON scheduled_notifications(is_cancelled);
CREATE INDEX idx_scheduled_notifications_type ON scheduled_notifications(type);

CREATE INDEX idx_typing_indicators_conversation_id ON typing_indicators(conversation_id);
CREATE INDEX idx_typing_indicators_user_id ON typing_indicators(user_id);
CREATE INDEX idx_typing_indicators_expires_at ON typing_indicators(expires_at);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX idx_message_reactions_reaction ON message_reactions(reaction);

CREATE INDEX idx_message_delivery_statuses_message_id ON message_delivery_statuses(message_id);
CREATE INDEX idx_message_delivery_statuses_user_id ON message_delivery_statuses(user_id);
CREATE INDEX idx_message_delivery_statuses_status ON message_delivery_statuses(status);

CREATE INDEX idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_role ON conversation_participants(role);
CREATE INDEX idx_conversation_participants_is_active ON conversation_participants(is_active);

CREATE INDEX idx_conversation_triggers_event_type ON conversation_triggers(event_type);
CREATE INDEX idx_conversation_triggers_conversation_type ON conversation_triggers(conversation_type);
CREATE INDEX idx_conversation_triggers_is_active ON conversation_triggers(is_active);
CREATE INDEX idx_conversation_triggers_initial_message_template_id ON conversation_triggers(initial_message_template_id);

CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_category ON support_tickets(category);
CREATE INDEX idx_support_tickets_assigned_to_id ON support_tickets(assigned_to_id);
CREATE INDEX idx_support_tickets_conversation_id ON support_tickets(conversation_id);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);

CREATE INDEX idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);
CREATE INDEX idx_ticket_activities_actor_id ON ticket_activities(actor_id);
CREATE INDEX idx_ticket_activities_activity_type ON ticket_activities(activity_type);
CREATE INDEX idx_ticket_activities_is_internal ON ticket_activities(is_internal);

CREATE INDEX idx_canned_responses_created_by ON canned_responses(created_by);
CREATE INDEX idx_canned_responses_is_active ON canned_responses(is_active);
CREATE INDEX idx_canned_responses_categories ON canned_responses USING GIN (categories);
CREATE INDEX idx_canned_responses_tags ON canned_responses USING GIN (tags);
