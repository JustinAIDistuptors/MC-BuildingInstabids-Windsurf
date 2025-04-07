/**
 * Social Sharing & Referrals Domain Interfaces
 * 
 * This file defines the TypeScript interfaces for the social sharing and referral system
 * within the InstaBids platform, enabling users to share content, refer other users,
 * and earn rewards through social interactions.
 */

import { UUID } from '../types/common';
import { User } from './interfaces_core';

// =============================================
// Social Sharing Interfaces
// =============================================

/**
 * Supported social media platforms for sharing
 */
export enum SocialPlatform {
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  LINKEDIN = 'linkedin',
  INSTAGRAM = 'instagram',
  PINTEREST = 'pinterest',
  TIKTOK = 'tiktok',
  EMAIL = 'email',
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
  MESSENGER = 'messenger',
  COPY_LINK = 'copy_link',
}

/**
 * Entity types that can be shared
 */
export enum ShareableEntityType {
  PROJECT = 'project',
  BID = 'bid',
  PROFILE = 'profile',
  DREAM_PROJECT = 'dream_project',
  TESTIMONIAL = 'testimonial',
  MILESTONE = 'milestone',
  GROUP_BID = 'group_bid',
}

/**
 * Configuration for a specific sharing feature
 */
export interface SocialShareSettings {
  id: UUID;
  featureName: string;
  isEnabled: boolean;
  shareTitleTemplate: string;
  shareDescriptionTemplate: string;
  shareImageUrl?: string;
  platformsConfig: Record<SocialPlatform, PlatformConfig>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Configuration for a specific social platform
 */
export interface PlatformConfig {
  enabled: boolean;
  apiKey?: string;
  defaultMessage?: string;
  characterLimit?: number;
  requiresAuth: boolean;
  imageSupport: boolean;
  shareEndpoint?: string;
  customParameters?: Record<string, string>;
}

/**
 * Record of a social share action
 */
export interface SocialShare {
  id: UUID;
  userId: UUID;
  entityType: ShareableEntityType;
  entityId: UUID;
  platform: SocialPlatform;
  shareUrl: string;
  customMessage?: string;
  shareData?: Record<string, any>;
  utmParameters?: UtmParameters;
  clickCount: number;
  conversionCount: number;
  createdAt: Date;
}

/**
 * UTM tracking parameters
 */
export interface UtmParameters {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

/**
 * Record of a click on a shared link
 */
export interface ShareClick {
  id: UUID;
  shareId: UUID;
  ipAddress?: string;
  userAgent?: string;
  referrerUrl?: string;
  isUnique: boolean;
  converted: boolean;
  conversionType?: string;
  conversionEntityId?: UUID;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  createdAt: Date;
}

/**
 * Sharing configuration for a project
 */
export interface ProjectSharingOptions {
  projectId: UUID;
  sharingEnabled: boolean;
  publicViewEnabled: boolean;
  socialPlatforms: Record<SocialPlatform, boolean>;
  customTitle?: string;
  customDescription?: string;
  customImageUrl?: string;
  showBudget: boolean;
  showTimeline: boolean;
  showContractorInfo: boolean;
  requireApproval: boolean;
  lastUpdatedBy?: UUID;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OAuth credentials for social media platforms
 */
export interface SocialIntegrationCredentials {
  id: UUID;
  userId: UUID;
  platform: SocialPlatform;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scope?: string;
  platformUserId?: string;
  platformUsername?: string;
  isActive: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User testimonial about a project or contractor
 */
export interface Testimonial {
  id: UUID;
  userId: UUID;
  projectId?: UUID;
  content: string;
  rating: number; // 1-5
  status: TestimonialStatus;
  isFeatured: boolean;
  isPublic: boolean;
  moderationNotes?: string;
  moderatedBy?: UUID;
  moderatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Status of a testimonial
 */
export enum TestimonialStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

// =============================================
// Referral Program Interfaces
// =============================================

/**
 * Types of rewards that can be given to users
 */
export enum RewardType {
  CREDIT = 'credit',
  PERCENTAGE_DISCOUNT = 'percentage_discount',
  FIXED_DISCOUNT = 'fixed_discount',
  FREE_SERVICE = 'free_service',
  PREMIUM_FEATURES = 'premium_features',
  CASH = 'cash',
}

/**
 * Configuration for a referral program
 */
export interface ReferralProgram {
  id: UUID;
  name: string;
  description?: string;
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
  maxReferralsPerUser?: number;
  referrerRewardType: RewardType;
  referrerRewardAmount?: number;
  referrerRewardDetails?: Record<string, any>;
  refereeRewardType?: RewardType;
  refereeRewardAmount?: number;
  refereeRewardDetails?: Record<string, any>;
  expiryDays?: number;
  termsAndConditions?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Unique referral code generated for a user
 */
export interface ReferralCode {
  id: UUID;
  userId: UUID;
  programId: UUID;
  code: string;
  isActive: boolean;
  usageCount: number;
  maxUses?: number;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * Status of a referral
 */
export enum ReferralStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REWARDED = 'rewarded',
  CANCELLED = 'cancelled',
}

/**
 * Status of a reward
 */
export enum RewardStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

/**
 * Record of a successful referral between users
 */
export interface Referral {
  id: UUID;
  programId: UUID;
  referrerId: UUID;
  refereeId: UUID;
  referralCodeId: UUID;
  status: ReferralStatus;
  referrerRewardStatus?: RewardStatus;
  refereeRewardStatus?: RewardStatus;
  qualifyingEvent?: string;
  qualifyingEventDate?: Date;
  referrerRewardAmount?: number;
  refereeRewardAmount?: number;
  referrerRewardDetails?: Record<string, any>;
  refereeRewardDetails?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User role in a referral (referrer or referee)
 */
export enum ReferralRole {
  REFERRER = 'referrer',
  REFEREE = 'referee',
}

/**
 * Reward issued to a user through the referral program
 */
export interface ReferralReward {
  id: UUID;
  referralId: UUID;
  userId: UUID;
  userRole: ReferralRole;
  rewardType: RewardType;
  amount?: number;
  status: ReferralRewardStatus;
  issuedAt: Date;
  redeemedAt?: Date;
  expiresAt?: Date;
  redemptionContext?: Record<string, any>;
  transactionId?: UUID;
  notes?: string;
}

/**
 * Status of a referral reward
 */
export enum ReferralRewardStatus {
  ISSUED = 'issued',
  REDEEMED = 'redeemed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

/**
 * Aggregated referral performance for leaderboards
 */
export interface ReferralLeaderboard {
  id: UUID;
  userId: UUID;
  totalReferrals: number;
  successfulReferrals: number;
  totalRewardsEarned: number;
  rank?: number;
  month: number; // 1-12
  year: number;
  lastReferralAt?: Date;
  updatedAt: Date;
}

// =============================================
// Analytics Interfaces
// =============================================

/**
 * Performance metrics for a referral program
 */
export interface ReferralProgramPerformance {
  programId: UUID;
  programName: string;
  totalReferrals: number;
  completedReferrals: number;
  rewardedReferrals: number;
  uniqueReferrers: number;
  uniqueReferees: number;
  totalReferrerRewards: number;
  totalRefereeRewards: number;
  totalRewardCost: number;
  avgDaysToQualification: number;
}

/**
 * Social activity metrics for a user
 */
export interface UserSocialActivity {
  userId: UUID;
  email: string;
  firstName: string;
  lastName: string;
  totalShares: number;
  platformsUsed: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  referralsMade: number;
  successfulReferrals: number;
  totalRewardsEarned: number;
  lastShareDate?: Date;
  lastReferralDate?: Date;
}

// =============================================
// Service Interfaces
// =============================================

/**
 * Service for managing social sharing functionality
 */
export interface SocialSharingService {
  /**
   * Generate a sharing URL for a specific entity
   */
  generateShareUrl(
    userId: UUID,
    entityType: ShareableEntityType,
    entityId: UUID,
    platform: SocialPlatform,
    customMessage?: string
  ): Promise<string>;

  /**
   * Record a sharing action
   */
  recordShare(
    userId: UUID,
    entityType: ShareableEntityType,
    entityId: UUID,
    platform: SocialPlatform,
    shareUrl: string,
    customMessage?: string
  ): Promise<SocialShare>;

  /**
   * Record a click on a shared link
   */
  recordShareClick(
    shareId: UUID,
    ipAddress?: string,
    userAgent?: string,
    referrerUrl?: string,
    utmParams?: UtmParameters
  ): Promise<ShareClick>;

  /**
   * Record a conversion from a shared link
   */
  recordShareConversion(
    clickId: UUID,
    conversionType: string,
    conversionEntityId?: UUID
  ): Promise<ShareClick>;

  /**
   * Get sharing options for a project
   */
  getProjectSharingOptions(projectId: UUID): Promise<ProjectSharingOptions>;

  /**
   * Update sharing options for a project
   */
  updateProjectSharingOptions(
    projectId: UUID,
    options: Partial<ProjectSharingOptions>,
    updatedBy: UUID
  ): Promise<ProjectSharingOptions>;

  /**
   * Get social integration credentials for a user
   */
  getUserSocialCredentials(
    userId: UUID,
    platform: SocialPlatform
  ): Promise<SocialIntegrationCredentials | null>;

  /**
   * Store or update social integration credentials for a user
   */
  storeSocialCredentials(
    userId: UUID,
    platform: SocialPlatform,
    credentials: Partial<SocialIntegrationCredentials>
  ): Promise<SocialIntegrationCredentials>;

  /**
   * Revoke social integration credentials for a user
   */
  revokeSocialCredentials(userId: UUID, platform: SocialPlatform): Promise<boolean>;

  /**
   * Get shares for a specific entity
   */
  getSharesByEntity(
    entityType: ShareableEntityType,
    entityId: UUID
  ): Promise<SocialShare[]>;

  /**
   * Get sharing statistics for a specific entity
   */
  getEntitySharingStats(
    entityType: ShareableEntityType,
    entityId: UUID
  ): Promise<{
    totalShares: number;
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    sharesByPlatform: Record<SocialPlatform, number>;
  }>;
}

/**
 * Service for managing testimonials
 */
export interface TestimonialService {
  /**
   * Create a new testimonial
   */
  createTestimonial(
    userId: UUID,
    content: string,
    rating: number,
    projectId?: UUID
  ): Promise<Testimonial>;

  /**
   * Get testimonials for a specific project
   */
  getProjectTestimonials(projectId: UUID): Promise<Testimonial[]>;

  /**
   * Get testimonials by a specific user
   */
  getUserTestimonials(userId: UUID): Promise<Testimonial[]>;

  /**
   * Moderate a testimonial
   */
  moderateTestimonial(
    testimonialId: UUID,
    status: TestimonialStatus,
    moderatorId: UUID,
    moderationNotes?: string
  ): Promise<Testimonial>;

  /**
   * Feature or unfeature a testimonial
   */
  setTestimonialFeatured(
    testimonialId: UUID,
    isFeatured: boolean
  ): Promise<Testimonial>;

  /**
   * Get featured testimonials
   */
  getFeaturedTestimonials(limit?: number): Promise<Testimonial[]>;
}

/**
 * Service for managing referral programs
 */
export interface ReferralService {
  /**
   * Create a new referral program
   */
  createReferralProgram(program: Omit<ReferralProgram, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReferralProgram>;

  /**
   * Get active referral programs
   */
  getActiveReferralPrograms(): Promise<ReferralProgram[]>;

  /**
   * Generate a referral code for a user
   */
  generateReferralCode(
    userId: UUID,
    programId: UUID,
    maxUses?: number
  ): Promise<ReferralCode>;

  /**
   * Get referral codes for a user
   */
  getUserReferralCodes(userId: UUID): Promise<ReferralCode[]>;

  /**
   * Apply a referral code
   */
  applyReferralCode(
    code: string,
    refereeId: UUID
  ): Promise<Referral>;

  /**
   * Track a qualifying event for a referral
   */
  trackQualifyingEvent(
    referralId: UUID,
    eventType: string,
    eventDate?: Date
  ): Promise<Referral>;

  /**
   * Issue rewards for a completed referral
   */
  issueReferralRewards(referralId: UUID): Promise<{
    referrerReward?: ReferralReward;
    refereeReward?: ReferralReward;
  }>;

  /**
   * Get referrals made by a user
   */
  getUserReferrals(userId: UUID): Promise<Referral[]>;

  /**
   * Get users referred by a specific user
   */
  getReferredUsers(referrerId: UUID): Promise<{
    referee: User;
    referral: Referral;
  }[]>;

  /**
   * Get rewards for a user
   */
  getUserRewards(userId: UUID): Promise<ReferralReward[]>;

  /**
   * Redeem a reward
   */
  redeemReward(
    rewardId: UUID,
    redemptionContext?: Record<string, any>
  ): Promise<ReferralReward>;

  /**
   * Get referral leaderboard for a specific period
   */
  getReferralLeaderboard(
    month: number,
    year: number,
    limit?: number
  ): Promise<ReferralLeaderboard[]>;

  /**
   * Get performance metrics for a referral program
   */
  getReferralProgramPerformance(
    programId: UUID
  ): Promise<ReferralProgramPerformance>;

  /**
   * Get social activity metrics for a user
   */
  getUserSocialActivity(userId: UUID): Promise<UserSocialActivity>;
}
