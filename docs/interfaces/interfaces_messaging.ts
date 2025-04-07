import { User } from './interfaces_core.js';
import { BidCard, Bid } from './interfaces_bidding.js';
import { Project } from './interfaces_project_management.js';

/**
 * Represents a conversation between two or more users.
 */
export interface Conversation {
    id: string;
    title?: string;
    type: 'direct' | 'bid_discussion' | 'project_discussion' | 'group' | 'system';
    participantIds: string[]; // Array of user IDs
    bidCardId?: string; // For bid discussions
    bidId?: string; // For bid discussions
    projectId?: string; // For project discussions
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    lastMessageAt?: string; // ISO-8601
    metadata?: Record<string, any>;
    isArchived: boolean;
    archivedAt?: string; // ISO-8601
    createdBy: string; // User ID
}

/**
 * Represents a message within a conversation.
 */
export interface Message {
    id: string;
    conversationId: string;
    senderId: string; // User ID
    content: string;
    messageType: 'text' | 'media' | 'file' | 'system' | 'template';
    mediaUrls?: string[];
    fileUrls?: string[];
    replyToMessageId?: string;
    isEdited: boolean;
    editedAt?: string; // ISO-8601
    status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
    metadata?: Record<string, any>;
    templateId?: string;
    templateData?: Record<string, any>;
    isPrivate: boolean; // For admin/staff-only messages
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    deletedAt?: string; // ISO-8601
    isDeleted: boolean;
}

/**
 * Represents the read status of a message for a particular user.
 */
export interface MessageReadStatus {
    id: string;
    messageId: string;
    userId: string;
    readAt: string; // ISO-8601
    readOnDeviceId?: string;
    readOnPlatform?: 'web' | 'ios' | 'android';
}

/**
 * Represents a template for system or common messages.
 */
export interface MessageTemplate {
    id: string;
    name: string;
    templateType: 'system' | 'greeting' | 'question' | 'update' | 'reminder' | 'custom';
    content: string;
    variables: string[]; // List of variables that can be replaced, e.g., {{userName}}
    isActive: boolean;
    category?: string;
    metadata?: Record<string, any>;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a user's conversation preferences.
 */
export interface ConversationPreference {
    id: string;
    userId: string;
    conversationId: string;
    isMuted: boolean;
    mutedUntil?: string; // ISO-8601
    isPinned: boolean;
    pinnedAt?: string; // ISO-8601
    notificationLevel: 'all' | 'mentions' | 'none';
    customNotificationSound?: string;
    nicknames?: Record<string, string>; // User ID to nickname mapping
    themeColor?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a user's overall messaging preferences.
 */
export interface UserMessagingPreference {
    id: string;
    userId: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    soundEnabled: boolean;
    defaultNotificationLevel: 'all' | 'mentions' | 'none';
    doNotDisturbStart?: string; // 24-hour format, e.g., "22:00"
    doNotDisturbEnd?: string; // 24-hour format, e.g., "07:00"
    doNotDisturbDays?: number[]; // 0-6 (Sunday-Saturday)
    customMessageSounds?: Record<string, string>; // Message type to sound mapping
    showReadReceipts: boolean;
    showTypingIndicator: boolean;
    showDeliveryStatus: boolean;
    autoArchiveDays?: number; // Auto-archive after X days of inactivity
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a draft message being composed by a user.
 */
export interface MessageDraft {
    id: string;
    userId: string;
    conversationId: string;
    content: string;
    mediaUrls?: string[];
    fileUrls?: string[];
    replyToMessageId?: string;
    lastUpdatedAt: string; // ISO-8601
    metadata?: Record<string, any>;
}

/**
 * Represents a notification for a user.
 */
export interface Notification {
    id: string;
    userId: string;
    type: 'message' | 'bid' | 'project' | 'payment' | 'system' | 'reminder';
    title: string;
    content: string;
    isRead: boolean;
    readAt?: string; // ISO-8601
    linkUrl?: string;
    conversationId?: string;
    messageId?: string;
    bidCardId?: string;
    bidId?: string;
    projectId?: string;
    paymentId?: string;
    priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
    expiresAt?: string; // ISO-8601
    metadata?: Record<string, any>;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a scheduled notification to be sent in the future.
 */
export interface ScheduledNotification {
    id: string;
    userIds: string[]; // Array of user IDs
    type: 'message' | 'bid' | 'project' | 'payment' | 'system' | 'reminder';
    title: string;
    content: string;
    scheduledAt: string; // ISO-8601
    sentAt?: string; // ISO-8601
    isCancelled: boolean;
    cancelledAt?: string; // ISO-8601
    linkUrl?: string;
    priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
    metadata?: Record<string, any>;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    createdBy?: string; // User ID
}

/**
 * Represents a user's typing status in a conversation.
 */
export interface TypingIndicator {
    id: string;
    conversationId: string;
    userId: string;
    startedAt: string; // ISO-8601
    expiresAt: string; // ISO-8601, typically a few seconds after startedAt
}

/**
 * Represents a reaction to a message.
 */
export interface MessageReaction {
    id: string;
    messageId: string;
    userId: string;
    reaction: string; // Emoji or predefined reaction type
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a user's message delivery status.
 */
export interface MessageDeliveryStatus {
    id: string;
    messageId: string;
    userId: string;
    status: 'delivered' | 'failed';
    deliveredAt?: string; // ISO-8601
    failureReason?: string;
    retryCount?: number;
    deviceInfo?: Record<string, any>;
}

/**
 * Represents a participant in a group conversation.
 */
export interface ConversationParticipant {
    id: string;
    conversationId: string;
    userId: string;
    role: 'owner' | 'admin' | 'member' | 'readonly' | 'temporary';
    joinedAt: string; // ISO-8601
    invitedBy?: string; // User ID
    leftAt?: string; // ISO-8601
    isActive: boolean;
    lastViewedAt?: string; // ISO-8601
    lastReadMessageId?: string;
}

/**
 * Represents an automated conversation trigger.
 */
export interface ConversationTrigger {
    id: string;
    name: string;
    eventType: 'bid_created' | 'bid_accepted' | 'project_milestone' | 'payment_received' | 'custom';
    conversationType: 'direct' | 'bid_discussion' | 'project_discussion' | 'group' | 'system';
    initialMessageTemplateId: string;
    conditions?: Record<string, any>; // Conditions for triggering
    isActive: boolean;
    metadata?: Record<string, any>;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    createdBy: string; // User ID
}

/**
 * Represents a support ticket created by a user.
 */
export interface SupportTicket {
    id: string;
    userId: string;
    subject: string;
    description: string;
    category: 'general' | 'account' | 'billing' | 'technical' | 'dispute' | 'other';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'new' | 'open' | 'pending' | 'resolved' | 'closed';
    assignedToId?: string; // Support agent User ID
    conversationId?: string; // Associated conversation for ticket discussion
    relatedEntityType?: 'project' | 'bid' | 'payment';
    relatedEntityId?: string;
    mediaUrls?: string[];
    fileUrls?: string[];
    resolution?: string;
    resolvedAt?: string; // ISO-8601
    closedAt?: string; // ISO-8601
    reopenedAt?: string; // ISO-8601
    reopenReason?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an action taken on a support ticket.
 */
export interface TicketActivity {
    id: string;
    ticketId: string;
    actorId: string; // User ID
    actorType: 'user' | 'agent' | 'system';
    activityType: 'create' | 'update' | 'assign' | 'comment' | 'status_change' | 'resolution';
    previousValue?: string;
    newValue?: string;
    comment?: string;
    mediaUrls?: string[];
    fileUrls?: string[];
    isInternal: boolean; // Only visible to support staff
    createdAt: string; // ISO-8601
}

/**
 * Represents a canned response for support tickets.
 */
export interface CannedResponse {
    id: string;
    title: string;
    content: string;
    categories: string[];
    tags: string[];
    isActive: boolean;
    createdBy: string; // User ID
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}
