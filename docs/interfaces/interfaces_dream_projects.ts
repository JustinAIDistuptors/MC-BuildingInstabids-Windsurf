/**
 * Dream Projects & Conversion Domain Interfaces
 * 
 * This file defines the TypeScript interfaces for the Dream Projects and Conversion
 * domain of the InstaBids platform. Dream Projects are aspirational home improvement
 * concepts that homeowners can create, save, and eventually convert into actual projects
 * for bidding.
 */

// =========================================================================
// Type Definitions
// =========================================================================

/**
 * Type alias for UUID string
 */
export type UUID = string;

// =========================================================================
// Core Dream Project Interfaces
// =========================================================================

/**
 * Status of a dream project
 */
export type DreamProjectStatus = 'draft' | 'published' | 'converted' | 'archived';

/**
 * Project size classification
 */
export type ProjectSize = 'small' | 'medium' | 'large' | 'custom';

/**
 * Main dream project entity
 */
export interface DreamProject {
  id: UUID;
  ownerId: UUID;
  title: string;
  description?: string;
  status: DreamProjectStatus;
  budgetMin?: number;
  budgetMax?: number;
  desiredStartDate?: Date;
  desiredCompletionDate?: Date;
  propertyId?: UUID;
  roomType?: string;
  projectSize?: ProjectSize;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  convertedAt?: Date;
  convertedProjectId?: UUID;
  conversionSource?: string;
  metadata?: Record<string, any>;
  images?: DreamProjectImage[];
  features?: DreamProjectFeature[];
  inspirations?: DreamProjectInspiration[];
  collaborators?: DreamProjectCollaborator[];
}

/**
 * Dream project creation parameters
 */
export interface CreateDreamProjectParams {
  title: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  desiredStartDate?: Date;
  desiredCompletionDate?: Date;
  propertyId?: UUID;
  roomType?: string;
  projectSize?: ProjectSize;
  isPublic?: boolean;
  templateId?: UUID;
}

/**
 * Dream project update parameters
 */
export interface UpdateDreamProjectParams {
  title?: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  desiredStartDate?: Date;
  desiredCompletionDate?: Date;
  propertyId?: UUID;
  roomType?: string;
  projectSize?: ProjectSize;
  isPublic?: boolean;
  status?: DreamProjectStatus;
  metadata?: Record<string, any>;
}

// =========================================================================
// Dream Project Image Interfaces
// =========================================================================

/**
 * Dream project image entity
 */
export interface DreamProjectImage {
  id: UUID;
  dreamProjectId: UUID;
  storagePath: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  width?: number;
  height?: number;
  isPrimary: boolean;
  sortOrder: number;
  caption?: string;
  createdAt: Date;
  uploadedBy: UUID;
  metadata?: Record<string, any>;
}

/**
 * Dream project image upload parameters
 */
export interface UploadDreamProjectImageParams {
  dreamProjectId: UUID;
  file: File;
  isPrimary?: boolean;
  sortOrder?: number;
  caption?: string;
  metadata?: Record<string, any>;
}

/**
 * Dream project image update parameters
 */
export interface UpdateDreamProjectImageParams {
  isPrimary?: boolean;
  sortOrder?: number;
  caption?: string;
  metadata?: Record<string, any>;
}

// =========================================================================
// Dream Project Feature Interfaces
// =========================================================================

/**
 * Feature type for dream projects
 */
export type FeatureType = 'must_have' | 'nice_to_have' | 'avoid';

/**
 * Dream project feature entity
 */
export interface DreamProjectFeature {
  id: UUID;
  dreamProjectId: UUID;
  featureType: FeatureType;
  description: string;
  sortOrder: number;
  createdAt: Date;
  createdBy: UUID;
}

/**
 * Dream project feature creation parameters
 */
export interface CreateDreamProjectFeatureParams {
  dreamProjectId: UUID;
  featureType: FeatureType;
  description: string;
  sortOrder?: number;
}

/**
 * Dream project feature update parameters
 */
export interface UpdateDreamProjectFeatureParams {
  featureType?: FeatureType;
  description?: string;
  sortOrder?: number;
}

// =========================================================================
// Dream Project Inspiration Interfaces
// =========================================================================

/**
 * Inspiration type for dream projects
 */
export type InspirationType = 'image' | 'url' | 'project' | 'product' | 'note';

/**
 * Dream project inspiration entity
 */
export interface DreamProjectInspiration {
  id: UUID;
  dreamProjectId: UUID;
  inspirationType: InspirationType;
  title?: string;
  description?: string;
  externalUrl?: string;
  storagePath?: string;
  referenceId?: UUID;
  sortOrder: number;
  createdAt: Date;
  createdBy: UUID;
  metadata?: Record<string, any>;
}

/**
 * Dream project inspiration creation parameters
 */
export interface CreateDreamProjectInspirationParams {
  dreamProjectId: UUID;
  inspirationType: InspirationType;
  title?: string;
  description?: string;
  externalUrl?: string;
  storagePath?: string;
  referenceId?: UUID;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

/**
 * Dream project inspiration update parameters
 */
export interface UpdateDreamProjectInspirationParams {
  title?: string;
  description?: string;
  externalUrl?: string;
  sortOrder?: number;
  metadata?: Record<string, any>;
}

// =========================================================================
// Dream Project Collaboration Interfaces
// =========================================================================

/**
 * Permission level for collaborators
 */
export type PermissionLevel = 'view' | 'edit' | 'admin';

/**
 * Collaboration status
 */
export type CollaborationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

/**
 * Dream project collaborator entity
 */
export interface DreamProjectCollaborator {
  id: UUID;
  dreamProjectId: UUID;
  userId: UUID;
  permissionLevel: PermissionLevel;
  invitedAt: Date;
  invitedBy: UUID;
  acceptedAt?: Date;
  status: CollaborationStatus;
  userDetails?: {
    displayName: string;
    email: string;
    profilePictureUrl?: string;
  };
}

/**
 * Dream project collaboration invitation parameters
 */
export interface InviteCollaboratorParams {
  dreamProjectId: UUID;
  email: string;
  permissionLevel: PermissionLevel;
  message?: string;
}

/**
 * Update collaborator permission parameters
 */
export interface UpdateCollaboratorPermissionParams {
  collaboratorId: UUID;
  permissionLevel: PermissionLevel;
}

// =========================================================================
// Dream Project Conversion Interfaces
// =========================================================================

/**
 * Conversion attempt status
 */
export type ConversionStatus = 'started' | 'completed' | 'abandoned';

/**
 * Dream project conversion attempt entity
 */
export interface DreamProjectConversionAttempt {
  id: UUID;
  dreamProjectId: UUID;
  userId: UUID;
  status: ConversionStatus;
  conversionStep?: string;
  createdProjectId?: UUID;
  startedAt: Date;
  completedAt?: Date;
  abandonmentReason?: string;
  conversionSource?: string;
  conversionPath?: Record<string, any>;
  sessionData?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Parameters to start dream project conversion
 */
export interface StartConversionParams {
  dreamProjectId: UUID;
  conversionSource?: string;
  metadata?: Record<string, any>;
}

/**
 * Parameters to update conversion progress
 */
export interface UpdateConversionProgressParams {
  conversionId: UUID;
  conversionStep?: string;
  sessionData?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Parameters to complete dream project conversion
 */
export interface CompleteConversionParams {
  conversionId: UUID;
  createdProjectId: UUID;
  conversionPath?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Parameters to abandon dream project conversion
 */
export interface AbandonConversionParams {
  conversionId: UUID;
  abandonmentReason?: string;
  conversionStep?: string;
  metadata?: Record<string, any>;
}

// =========================================================================
// Dream Project Template Interfaces
// =========================================================================

/**
 * Complexity level of a project
 */
export type ComplexityLevel = 'simple' | 'moderate' | 'complex';

/**
 * Dream project template entity
 */
export interface DreamProjectTemplate {
  id: UUID;
  title: string;
  description?: string;
  category: string;
  roomType?: string;
  typicalDurationDays?: number;
  typicalBudgetMin?: number;
  typicalBudgetMax?: number;
  complexityLevel?: ComplexityLevel;
  requiredSpecialties?: string[];
  commonFeatures?: Record<string, any>;
  templateContent: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: UUID;
  usageCount: number;
  previewImageUrl?: string;
}

/**
 * Dream project template creation parameters
 */
export interface CreateDreamProjectTemplateParams {
  title: string;
  description?: string;
  category: string;
  roomType?: string;
  typicalDurationDays?: number;
  typicalBudgetMin?: number;
  typicalBudgetMax?: number;
  complexityLevel?: ComplexityLevel;
  requiredSpecialties?: string[];
  commonFeatures?: Record<string, any>;
  templateContent: Record<string, any>;
  isActive?: boolean;
  previewImageUrl?: string;
}

/**
 * Dream project template update parameters
 */
export interface UpdateDreamProjectTemplateParams {
  title?: string;
  description?: string;
  category?: string;
  roomType?: string;
  typicalDurationDays?: number;
  typicalBudgetMin?: number;
  typicalBudgetMax?: number;
  complexityLevel?: ComplexityLevel;
  requiredSpecialties?: string[];
  commonFeatures?: Record<string, any>;
  templateContent?: Record<string, any>;
  isActive?: boolean;
  previewImageUrl?: string;
}

// =========================================================================
// Dream Project Recommendation Interfaces
// =========================================================================

/**
 * Recommendation status
 */
export type RecommendationStatus = 'active' | 'dismissed' | 'contacted';

/**
 * Dream project contractor recommendation entity
 */
export interface DreamProjectRecommendation {
  id: UUID;
  dreamProjectId: UUID;
  contractorId: UUID;
  recommendationScore: number;
  recommendationReason?: string;
  matchingCriteria?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  status: RecommendationStatus;
  contactedAt?: Date;
  contractorDetails?: {
    displayName: string;
    profilePictureUrl?: string;
    specialties: string[];
    rating: number;
    completedProjectsCount: number;
  };
}

/**
 * Parameters to update recommendation status
 */
export interface UpdateRecommendationStatusParams {
  recommendationId: UUID;
  status: RecommendationStatus;
}

// =========================================================================
// Dream Project AI Analysis Interfaces
// =========================================================================

/**
 * Dream project AI analysis entity
 */
export interface DreamProjectAIAnalysis {
  id: UUID;
  dreamProjectId: UUID;
  analysisType: string;
  analysisVersion: string;
  analysisData: Record<string, any>;
  confidenceScore?: number;
  createdAt: Date;
  updatedAt: Date;
  isCurrent: boolean;
}

/**
 * Dream project analysis request parameters
 */
export interface AnalyzeDreamProjectParams {
  dreamProjectId: UUID;
  analysisType: string;
}

// =========================================================================
// Dream Project Service Interface
// =========================================================================

/**
 * Dream project service interface
 */
export interface DreamProjectService {
  // Dream Project Management
  createDreamProject(params: CreateDreamProjectParams): Promise<DreamProject>;
  getDreamProject(id: UUID): Promise<DreamProject>;
  updateDreamProject(id: UUID, params: UpdateDreamProjectParams): Promise<DreamProject>;
  listUserDreamProjects(userId: UUID, status?: DreamProjectStatus): Promise<DreamProject[]>;
  publishDreamProject(id: UUID): Promise<DreamProject>;
  archiveDreamProject(id: UUID): Promise<DreamProject>;
  deleteDreamProject(id: UUID): Promise<void>;
  
  // Dream Project Images
  uploadDreamProjectImage(params: UploadDreamProjectImageParams): Promise<DreamProjectImage>;
  updateDreamProjectImage(id: UUID, params: UpdateDreamProjectImageParams): Promise<DreamProjectImage>;
  deleteDreamProjectImage(id: UUID): Promise<void>;
  
  // Dream Project Features
  addDreamProjectFeature(params: CreateDreamProjectFeatureParams): Promise<DreamProjectFeature>;
  updateDreamProjectFeature(id: UUID, params: UpdateDreamProjectFeatureParams): Promise<DreamProjectFeature>;
  deleteDreamProjectFeature(id: UUID): Promise<void>;
  
  // Dream Project Inspirations
  addDreamProjectInspiration(params: CreateDreamProjectInspirationParams): Promise<DreamProjectInspiration>;
  updateDreamProjectInspiration(id: UUID, params: UpdateDreamProjectInspirationParams): Promise<DreamProjectInspiration>;
  deleteDreamProjectInspiration(id: UUID): Promise<void>;
  
  // Collaboration
  inviteCollaborator(params: InviteCollaboratorParams): Promise<DreamProjectCollaborator>;
  acceptCollaborationInvitation(invitationId: UUID): Promise<DreamProjectCollaborator>;
  declineCollaborationInvitation(invitationId: UUID): Promise<void>;
  revokeCollaborationInvitation(invitationId: UUID): Promise<void>;
  updateCollaboratorPermission(params: UpdateCollaboratorPermissionParams): Promise<DreamProjectCollaborator>;
  removeCollaborator(collaboratorId: UUID): Promise<void>;
  
  // Conversion Process
  startConversion(params: StartConversionParams): Promise<DreamProjectConversionAttempt>;
  updateConversionProgress(params: UpdateConversionProgressParams): Promise<DreamProjectConversionAttempt>;
  completeConversion(params: CompleteConversionParams): Promise<DreamProject>;
  abandonConversion(params: AbandonConversionParams): Promise<DreamProjectConversionAttempt>;
  
  // Templates
  listDreamProjectTemplates(category?: string): Promise<DreamProjectTemplate[]>;
  getDreamProjectTemplate(id: UUID): Promise<DreamProjectTemplate>;
  createDreamProjectFromTemplate(templateId: UUID, params: CreateDreamProjectParams): Promise<DreamProject>;
  
  // Recommendations
  getDreamProjectRecommendations(dreamProjectId: UUID): Promise<DreamProjectRecommendation[]>;
  updateRecommendationStatus(params: UpdateRecommendationStatusParams): Promise<DreamProjectRecommendation>;
  
  // AI Analysis
  analyzeDreamProject(params: AnalyzeDreamProjectParams): Promise<DreamProjectAIAnalysis>;
  getDreamProjectAnalysis(dreamProjectId: UUID, analysisType?: string): Promise<DreamProjectAIAnalysis[]>;
  
  // Public Gallery
  listPublicDreamProjects(category?: string, roomType?: string, limit?: number, offset?: number): Promise<DreamProject[]>;
  likeDreamProject(dreamProjectId: UUID): Promise<void>;
  unlikeDreamProject(dreamProjectId: UUID): Promise<void>;
}

// =========================================================================
// Analytics Interfaces
// =========================================================================

/**
 * Conversion analytics period
 */
export interface ConversionAnalyticsPeriod {
  periodStart: Date;
  periodEnd: Date;
  conversionSource?: string;
  conversionCount: number;
  viewCount: number;
  conversionRate: number;
  avgConversionTimeMinutes?: number;
  avgStepsToConversion?: number;
  topConversionPaths?: Record<string, any>;
  topAbandonmentReasons?: Record<string, any>;
}

/**
 * Dream project conversion analytics service interface
 */
export interface DreamProjectAnalyticsService {
  getConversionAnalytics(startDate: Date, endDate: Date, source?: string): Promise<ConversionAnalyticsPeriod[]>;
  getConversionFunnel(startDate: Date, endDate: Date): Promise<any>;
  getPopularTemplates(limit?: number): Promise<DreamProjectTemplate[]>;
  getTopAbandonmentReasons(startDate: Date, endDate: Date): Promise<Record<string, number>>;
}
