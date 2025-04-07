import { User, Address, GeoLocation } from './interfaces_core.js';

/**
 * Represents a homeowner user.
 * Extends the base User interface.
 */
export interface Homeowner extends User {
  addressId?: string;
  propertyDetails?: Record<string, any>; // Details about primary property
  preferredContactMethod?: 'email' | 'phone' | 'sms' | 'app';
  preferredContactTimes?: {
    monday?: string[];
    tuesday?: string[];
    wednesday?: string[];
    thursday?: string[];
    friday?: string[];
    saturday?: string[];
    sunday?: string[];
  };
  rating?: number; // AI-generated homeowner rating
  ratingCount?: number;
  desirabilityScore?: number; // For contractor-facing metrics
}

/**
 * Represents a review of a homeowner by a contractor.
 */
export interface HomeownerReview {
  id: string;
  homeownerId: string;
  reviewerId: string; // Contractor who wrote the review
  projectId: string;
  rating: number; // 1-5 stars
  reviewText?: string;
  cooperationScore?: number;
  paymentPromptness?: number;
  communicationScore?: number;
  createdAt: string; // ISO 8601 timestamp
  visibleToHomeowner: boolean;
}

/**
 * Represents a contractor user.
 * Extends the base User interface.
 */
export interface Contractor extends User {
  businessName: string;
  contactPerson?: string;
  businessAddressId?: string;
  businessPhone?: string;
  businessEmail?: string;
  services: string[]; // Array of service types offered
  serviceAreas?: any; // TODO: Define a more specific type
  licenseInfo?: Record<string, any>; // License information by state/type
  insuranceInfo?: Record<string, any>; // Insurance coverage details
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
  verificationMethod?: 'ai' | 'manual' | 'community';
  googleRating?: number;
  internalRating?: number;
  ratingCount?: number;
  jobCompletionRate?: number;
  jobsCompleted?: number;
  subscriptionTier?: 'basic' | 'pro' | 'premium';
  gcExperience?: boolean; // Has General Contractor experience
  gcProjectsCompleted?: number;
  canCoordinateTrades?: boolean;
  completionTier?: 'starter' | 'bronze' | 'silver' | 'gold' | 'platinum';
  metadata?: Record<string, any>; // Extensible metadata
}

/**
 * Represents a portfolio item for a contractor.
 */
export interface ContractorPortfolioItem {
    id: string;
    contractorId: string;
    title: string;
    description?: string;
    mediaUrls: string[];
    jobType?: string;
    completedAt?: string; // ISO-8601
    isFeatured?: boolean;
}

/**
 * Represents a verification check performed on a contractor.
 */
export interface VerificationCheck {
    id: string;
    contractorId: string;
    checkType: 'google_listing' | 'website' | 'business_name' | 'license' | 'insurance';
    status: 'pending' | 'verified' | 'failed' | 'expired';
    verificationData?: Record<string, any>;
    checkedAt: string; // ISO-8601
    verifiedAt?: string; // ISO-8601
    notes?: string;
    verificationSource?: 'ai' | 'manual' | 'community';
}

/**
 * Represents a document submitted for verification.
 */
export interface VerificationDocument {
    id: string;
    contractorId: string;
    documentType: 'license' | 'insurance' | 'certification' | 'photo_id' | 'business_registration' | 'other';
    documentUrl: string;
    verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
    uploadedAt: string; // ISO-8601
    verifiedAt?: string; // ISO-8601
    expirationDate?: string; // ISO-8601
}

/**
 * Represents a review of a contractor by a homeowner.
 */
export interface ContractorReview {
    id: string;
    contractorId: string;
    reviewerId: string;
    projectId: string;
    source: 'platform' | 'google';
    rating: number;
    reviewText?: string;
    jobType?: string;
    jobSize?: 'small' | 'medium' | 'large';
    createdAt: string; // ISO-8601
    visibleToPublic: boolean;
}

/**
 * Represents an AI-generated confidence score for a contractor.
 */
export interface ContractorConfidenceScore {
    id: string;
    contractorId: string;
    jobType: string;
    jobSize: 'small' | 'medium' | 'large';
    confidenceScore: number;
    factors: Record<string, any>;
    calculatedAt: string; // ISO-8601
    expiresAt?: string; // ISO-8601
}

/**
 * Represents a property manager user.
 * Extends the base User interface.
 */
export interface PropertyManager extends User {
    companyName: string;
    businessAddressId?: string;
    businessPhone?: string;
    businessEmail?: string;
    businessDetails?: Record<string, any>;
    rating?: number;
    ratingCount?: number;
    verificationStatus?: 'pending' | 'verified' | 'rejected';
}

/**
 * Represents a property managed by a property manager.
 */
export interface ManagedProperty {
    id: string;
    propertyManagerId: string;
    propertyName: string;
    addressId?: string;
    propertyType: 'apartment_building' | 'condo_complex' | 'office_building' | 'retail' | 'industrial' | 'mixed_use' | 'single_family' | 'other';
    unitCount?: number;
    propertyDetails?: Record<string, any>;
    primaryContactName?: string;
    primaryContactPhone?: string;
    primaryContactEmail?: string;
}

/**
 * Represents a labor helper user.
 * Extends the base User interface.
 */
export interface LaborHelper extends User {
    displayName: string;
    bio?: string;
    profileImage?: string;
    hourlyRate: number;
    minimumHours: number;
    maximumTravelDistance?: number;
    hasVehicle: boolean;
    verificationLevel: 'basic' | 'background_checked' | 'identity_verified' | 'expert_verified';
    isActive: boolean;
    averageRating?: number;
    ratingCount?: number;
    jobsCompleted?: number;
    completionRate?: number;
    responseTimeAvg?: number;
}

/**
 * Represents a skill possessed by a labor helper.
 */
export interface HelperSkill {
    id: string;
    helperId: string;
    skillName: string;
    relatedTrade?: string;
    yearsExperience?: number;
    expertiseLevel: 'beginner' | 'intermediate' | 'expert' | 'master';
    isVerified: boolean;
    verificationMethod?: 'credential' | 'contractor_endorsed' | 'self_reported';
}

/**
 * Represents the availability of a labor helper.
 */
export interface HelperAvailability {
    id: string;
    helperId: string;
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    isRecurring: boolean;
    specificDate?: string; // ISO-8601 format, only if not recurring
}

/**
 * Represents a review of a labor helper.
 */
export interface LaborHelperReview {
    id: string;
    helperId: string;
    reviewerId: string;
    jobId: string;
    rating: number;
    reviewText?: string;
    timelinessRating?: number;
    skillRating?: number;
    communicationRating?: number;
    createdAt: string; // ISO-8601
}

/**
 * Represents a community endorsement for a user.
 */
export interface CommunityEndorsement {
    id: string;
    endorserId: string;
    endorseeId: string;
    endorsementType: 'skill' | 'reliability' | 'quality' | 'other';
    comment?: string;
    createdAt: string; // ISO-8601
}

/**
 * Represents a community-generated trust score for a user.
 */
export interface CommunityTrustScore {
    id: string;
    userId: string;
    trustScore: number;
    scoreComponents: Record<string, any>;
    calculationVersion: string;
    calculatedAt: string; // ISO-8601
    nextCalculationAt?: string; // ISO-8601
}

/**
 * Represents a community verification badge earned by a user.
 */
export interface CommunityVerificationBadge {
    id: string;
    userId: string;
    badgeType: 'basic_verified' | 'silver_verified' | 'gold_verified' | 'platinum_verified';
    earnedAt: string; // ISO-8601
    requirementsMet: Record<string, any>;
    isActive: boolean;
}
