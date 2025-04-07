import { User, JobCategory, JobType, GeoLocation } from './interfaces_core.js';

/**
 * Represents a bid card, which is a request for bids from contractors.
 */
export interface BidCard {
  id: string;
  creatorId: string; // User ID of the homeowner or property manager
  jobCategoryId: string;
  jobTypeId: string;
  title: string;
  description?: string;
  location: GeoLocation;
  zipCode: string;
  budgetMin?: number;
  budgetMax?: number;
  timelineStart?: string; // ISO-8601 date
  timelineEnd?: string;   // ISO-8601 date
  bidDeadline?: string;   // ISO-8601 timestamp
  groupBiddingEnabled: boolean;
  status: 'draft' | 'open' | 'review' | 'negotiation' | 'awarded' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
  createdAt: string; // ISO-8601 timestamp
  updatedAt: string; // ISO-8601 timestamp
  visibility: 'public' | 'private' | 'group';
  maxContractorMessages: number;
  homeownerRatingSummary?: any; // TODO: Define a more specific type
  prohibitNegotiation: boolean;
  guidanceForBidders?: string;
  currentRevisionNumber: number;
  hasActiveRevision: boolean;
  lastRevisedAt?: string; // ISO-8601 timestamp
  managedPropertyId?: string; // For property managers
  openToGroupBidding?: boolean;
  jobStartWindowStart?: string; // ISO-8601 timestamp
  jobStartWindowEnd?: string; // ISO-8601 timestamp
  jobSize?: 'small' | 'medium' | 'large' | 'x-large';
  customAnswers?: Record<string, any>; // Answers to custom questions
  intentionTypeId?: string;
  timelineHorizonId?: string;
  groupEligible: boolean;
  priceDriven: boolean;
  minBidsTarget: number;
  maxBidsAllowed: number;
  currentCommitments: number;
  currentBids: number;
  commitmentDurationHours: number;
  acceptanceTimeLimitHours: number;
  currentAcceptedBidId?: string;
  acceptanceExpiresAt?: string; // ISO-8601 timestamp
  previousAcceptedBids: string[];
  projectPhaseId?: string; // For multi-component projects
  isPartOfSuite: boolean;
}

/**
 * Represents media attachments for a bid card (photos, videos, etc.).
 */
export interface BidCardMedia {
    id: string;
    bidCardId: string;
    mediaType: 'photo' | 'video' | 'document' | 'measurement';
    url: string;
    thumbnailUrl?: string;
    description?: string;
    metadata?: Record<string, any>;
    displayOrder: number;
}

/**
 * Represents a contractor's bid on a bid card.
 */
export interface Bid {
    id: string;
    bidCardId: string;
    contractorId: string;
    amount: number;
    isFinalOffer: boolean;
    scopeOfWork: string;
    materialsIncluded?: Record<string, any>;
    timeline?: any; // TODO: Define a more specific type
    valuePropositions: string[];
    additionalNotes?: string;
    status: 'submitted' | 'viewed' | 'shortlisted' | 'accepted' | 'declined' | 'expired' | 'withdrawn';
    createdAt: string; // ISO-8601 timestamp
    updatedAt: string; // ISO-8601 timestamp
    lastUpdatedAt?: string; // ISO-8601 timestamp
    updateCount: number;
    isRetracted: boolean;
    retractionReason?: string;
    hasMessagingAccess: boolean;
    overflowBid: boolean;
    originalBidId?: string;
    bidCardRevisionId?: string;
    isCurrentRevision: boolean;
    projectSuiteId?: string;
    isConditional: boolean;
    conditionalBidIds?: string[];
}

/**
 * Represents a revision to a bid card.
 */
export interface BidCardRevision {
    id: string;
    bidCardId: string;
    revisionNumber: number;
    revisionType: 'minor' | 'major';
    changeSummary: string;
    detailedChanges: Record<string, any>;
    createdAt: string; // ISO-8601 timestamp
    notificationSent: boolean;
    notificationSentAt?: string; // ISO-8601 timestamp
}

/**
 * Represents a specific field change within a bid card revision.
 */
export interface BidCardChangeDetail {
    id: string;
    revisionId: string;
    fieldName: string;
    oldValue?: string;
    newValue?: string;
    changeType: 'added' | 'removed' | 'modified';
}

/**
 * Represents new media added during a bid card revision.
 */
export interface BidCardRevisionMedia {
    id: string;
    revisionId: string;
    mediaId: string;
}

/**
 * Represents a contractor's response to a bid card revision.
 */
export interface BidRevision {
    id: string;
    originalBidId: string;
    bidCardRevisionId: string;
    revisedAmount?: number;
    scopeChanges?: string;
    timelineChanges?: any; // TODO: Define a more specific type
    materialsChanges?: any; // TODO: Define a more specific type
    status: 'pending' | 'submitted' | 'no_change';
    createdAt: string; // ISO-8601 timestamp
    submittedAt?: string; // ISO-8601 timestamp
}

/**
 * Represents a contractor's commitment to submit a bid.
 */
export interface BidCommitment {
    id: string;
    bidCardId: string;
    contractorId: string;
    status: 'committed' | 'completed' | 'expired' | 'cancelled';
    committedAt: string; // ISO-8601 timestamp
    deadline: string; // ISO-8601 timestamp
    reminderSent: boolean;
    reminderSentAt?: string; // ISO-8601 timestamp
}

/**
 * Represents a payment made by a contractor to connect with a homeowner.
 */
export interface ConnectionPayment {
    id: string;
    bidAcceptanceId: string;
    contractorId: string;
    amount: number;
    paymentMethod?: string;
    paymentProcessor?: string;
    transactionId?: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: string; // ISO-8601 timestamp
    completedAt?: string; // ISO-8601 timestamp
    errorMessage?: string;
}

/**
 * Represents the acceptance of a bid by a homeowner.
 */
export interface BidAcceptance {
    id: string;
    bidId: string;
    bidCardId: string;
    acceptedBy: string; // User ID
    acceptedAt: string; // ISO-8601 timestamp
    expiresAt: string; // ISO-8601 timestamp
    connectionFeeAmount: number;
    feeCalculationMethod: string;
    status: 'pending_payment' | 'paid' | 'expired' | 'cancelled';
    expiryNotified: boolean;
    expiryNotificationSentAt?: string; // ISO-8601 timestamp
    fallbackActivatedAt?: string; // ISO-8601 timestamp
    fallbackBidId?: string;
}

/**
 * Represents the release of contact information after a successful connection payment.
 */
export interface ContactRelease {
    id: string;
    bidAcceptanceId: string;
    homeownerContact: Record<string, any>;
    contractorContact: Record<string, any>;
    releasedAt: string; // ISO-8601 timestamp
    viewedByContractor: boolean;
    viewedAt?: string; // ISO-8601 timestamp
}

/**
 * Represents a group of bid cards for group bidding.
 */
export interface BidGroup {
    id: string;
    name: string;
    zipCode: string;
    jobCategoryId?: string;
    bidDeadline?: string; // ISO-8601 timestamp
    jobStartWindowStart?: string; // ISO-8601 timestamp
    jobStartWindowEnd?: string; // ISO-8601 timestamp
    status: 'forming' | 'active' | 'bidding' | 'pending_acceptance' | 'completed' | 'expired';
    createdAt: string; // ISO-8601 timestamp
    createdBy: string; // User ID
    isAutoGenerated: boolean;
}

/**
 * Represents a member of a bid group.
 */
export interface BidGroupMember {
    id: string;
    bidGroupId: string;
    bidCardId: string;
    userId: string;
    joinedAt: string; // ISO-8601 timestamp
    status: 'joined' | 'accepted_group_bid' | 'declined_group_bid' | 'left';
    visibleToGroup: boolean;
}

/**
 * Represents a contractor's bid on a group of projects.
 */
export interface GroupBid {
    id: string;
    bidGroupId: string;
    contractorId: string;
    individualPrice: number;
    groupPrice: number;
    requiredAcceptanceCount?: number;
    requiredAcceptancePercentage?: number;
    acceptanceDeadline: string; // ISO-8601 timestamp
    terms?: string;
    timeline?: any; // TODO: Define a more specific type
    status: 'submitted' | 'partially_accepted' | 'threshold_met' | 'expired' | 'extended';
    createdAt: string; // ISO-8601 timestamp
    updatedAt: string; // ISO-8601 timestamp
}

/**
 * Represents an individual acceptance of a group bid.
 */
export interface GroupBidAcceptance {
    id: string;
    groupBidId: string;
    bidCardId: string;
    userId: string;
    acceptedAt: string; // ISO-8601 timestamp
}

/**
 * Represents a "nudge" sent to encourage group participation.
 */
export interface GroupNudge {
    id: string;
    templateId: string;
    senderId: string;
    recipientId: string;
    bidGroupId: string;
    message: string;
    sentAt: string; // ISO-8601 timestamp
    readAt?: string; // ISO-8601 timestamp
}

/**
 * Represents a template for nudge messages.
 */
export interface NudgeTemplate {
    id: string;
    message: string;
    icon?: string;
    category: 'general' | 'encouragement' | 'deadline';
}

/**
 * Represents an extension to a group bid's deadline.
 */
export interface GroupBidExtension {
    id: string;
    groupBidId: string;
    previousDeadline: string; // ISO-8601 timestamp
    newDeadline: string; // ISO-8601 timestamp
    reason?: string;
    createdAt: string; // ISO-8601 timestamp
    createdBy: string; // User ID
}
