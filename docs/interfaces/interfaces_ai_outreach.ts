/**
 * AI Outreach & Automation Domain Interfaces
 * 
 * This file defines the TypeScript interfaces for the AI Outreach & Automation domain,
 * which handles contractor discovery, outreach, and conversion processes.
 */

import { UUID } from '../types/common';

// ----------------------
// ENUMS & CONSTANTS
// ----------------------

/**
 * Campaign status options
 */
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Message content type options
 */
export enum ContentType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP'
}

/**
 * Prospect status options
 */
export enum ProspectStatus {
  NEW = 'NEW',
  VERIFIED = 'VERIFIED',
  CONTACTED = 'CONTACTED',
  RESPONDED = 'RESPONDED',
  CONVERTED = 'CONVERTED',
  REJECTED = 'REJECTED',
  INVALID = 'INVALID'
}

/**
 * Message delivery status options
 */
export enum DeliveryStatus {
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  BOUNCED = 'BOUNCED'
}

/**
 * Response types
 */
export enum ResponseType {
  EMAIL_REPLY = 'EMAIL_REPLY',
  FORM_SUBMISSION = 'FORM_SUBMISSION',
  CALL = 'CALL',
  SMS_REPLY = 'SMS_REPLY',
  WEBSITE_VISIT = 'WEBSITE_VISIT'
}

/**
 * Response resolution status
 */
export enum ResponseResolution {
  PENDING = 'PENDING',
  RESPONDED = 'RESPONDED',
  ESCALATED = 'ESCALATED',
  CLOSED = 'CLOSED',
  CONVERTED = 'CONVERTED'
}

/**
 * Sentiment analysis results
 */
export enum Sentiment {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  NEUTRAL = 'NEUTRAL'
}

/**
 * Onboarding status for converted prospects
 */
export enum OnboardingStatus {
  STARTED = 'STARTED',
  PROFILE_CREATED = 'PROFILE_CREATED',
  VERIFICATION_STARTED = 'VERIFICATION_STARTED',
  VERIFICATION_COMPLETED = 'VERIFICATION_COMPLETED',
  FIRST_BID = 'FIRST_BID',
  FIRST_PROJECT = 'FIRST_PROJECT'
}

/**
 * Discovery task status
 */
export enum DiscoveryTaskStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Discovery result processing status
 */
export enum ProcessingStatus {
  NEW = 'NEW',
  PROCESSED = 'PROCESSED',
  DUPLICATE = 'DUPLICATE',
  INVALID = 'INVALID',
  MERGED = 'MERGED'
}

// ----------------------
// BASE INTERFACES
// ----------------------

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: UUID;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base audit fields
 */
export interface AuditFields {
  createdBy: UUID;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------
// ENTITY INTERFACES
// ----------------------

/**
 * Target audience definition
 */
export interface TargetAudience extends BaseEntity, AuditFields {
  name: string;
  description?: string;
  criteria: TargetCriteria;
}

/**
 * Campaign definition
 */
export interface Campaign extends BaseEntity, AuditFields {
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  targetAudienceId: UUID;
  messageTemplateId?: UUID;
  goals?: CampaignGoals;
  budget?: number;
  targetAudience?: TargetAudience;
  messageTemplate?: MessageTemplate;
  metrics?: CampaignMetrics[];
}

/**
 * Message template
 */
export interface MessageTemplate extends BaseEntity, AuditFields {
  name: string;
  description?: string;
  contentType: ContentType;
  subject?: string;
  content: string;
  variables?: Record<string, any>;
  personalizationConfig?: PersonalizationConfig;
  versions?: MessageTemplateVersion[];
}

/**
 * Message template version
 */
export interface MessageTemplateVersion extends BaseEntity {
  templateId: UUID;
  versionNumber: number;
  content: string;
  subject?: string;
  variables?: Record<string, any>;
  personalizationConfig?: PersonalizationConfig;
  createdBy: UUID;
  createdAt: Date;
}

/**
 * Contractor prospect
 */
export interface ContractorProspect extends BaseEntity {
  externalId?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  locationData?: LocationData;
  source: string;
  sourceUrl?: string;
  discoveryDate: Date;
  enrichmentData?: Record<string, any>;
  qualityScore?: number;
  status: ProspectStatus;
  tags?: string[];
  notes?: string;
}

/**
 * Outreach message
 */
export interface OutreachMessage extends BaseEntity {
  campaignId: UUID;
  prospectId: UUID;
  templateId: UUID;
  templateVersionId?: UUID;
  channel: ContentType;
  personalizedContent: string;
  subject?: string;
  scheduledTime: Date;
  sentTime?: Date;
  deliveryStatus: DeliveryStatus;
  openedTime?: Date;
  clickTime?: Date;
  responseTime?: Date;
  metadata?: Record<string, any>;
  campaign?: Campaign;
  prospect?: ContractorProspect;
  template?: MessageTemplate;
  templateVersion?: MessageTemplateVersion;
  responses?: ProspectResponse[];
}

/**
 * Prospect response
 */
export interface ProspectResponse extends BaseEntity {
  messageId: UUID;
  prospectId: UUID;
  responseType: ResponseType;
  content?: string;
  sentiment?: Sentiment;
  receivedTime: Date;
  analyzedTime?: Date;
  analysisResults?: Record<string, any>;
  handledBy?: UUID;
  resolution?: ResponseResolution;
  notes?: string;
  message?: OutreachMessage;
  prospect?: ContractorProspect;
}

/**
 * Prospect conversion
 */
export interface ProspectConversion extends BaseEntity {
  prospectId: UUID;
  userId: UUID;
  campaignId?: UUID;
  conversionDate: Date;
  conversionSource: string;
  attributionData?: Record<string, any>;
  onboardingStatus: OnboardingStatus;
  lifetimeValue?: number;
  prospect?: ContractorProspect;
  campaign?: Campaign;
}

/**
 * Discovery task
 */
export interface DiscoveryTask extends BaseEntity, AuditFields {
  name: string;
  status: DiscoveryTaskStatus;
  sourceType: string;
  sourceParameters: Record<string, any>;
  filterCriteria?: Record<string, any>;
  maxResults?: number;
  scheduledTime: Date;
  startTime?: Date;
  completionTime?: Date;
  resultsSummary?: DiscoveryResultsSummary;
  results?: DiscoveryResult[];
}

/**
 * Discovery result
 */
export interface DiscoveryResult extends BaseEntity {
  taskId: UUID;
  prospectId?: UUID;
  rawData: Record<string, any>;
  matchConfidence?: number;
  processingStatus: ProcessingStatus;
  notes?: string;
  task?: DiscoveryTask;
  prospect?: ContractorProspect;
}

/**
 * AI content generation record
 */
export interface AIContentGeneration extends BaseEntity, AuditFields {
  requestType: string;
  parameters: Record<string, any>;
  prompt: string;
  rawOutput?: string;
  processedOutput?: string;
  approved?: boolean;
  approvedBy?: UUID;
  approvedAt?: Date;
  usageLocation?: string;
  usageId?: UUID;
}

/**
 * Campaign metrics
 */
export interface CampaignMetrics extends BaseEntity {
  campaignId: UUID;
  metricDate: Date;
  prospectsContacted: number;
  messagesSent: number;
  messagesDelivered: number;
  messagesOpened: number;
  linkClicks: number;
  responsesReceived: number;
  positiveResponses: number;
  negativeResponses: number;
  neutralResponses: number;
  conversions: number;
  cost?: number;
  additionalMetrics?: Record<string, any>;
  campaign?: Campaign;
}

/**
 * AI model configuration
 */
export interface AIModel extends BaseEntity, AuditFields {
  name: string;
  provider: string;
  modelIdentifier: string;
  version: string;
  purpose: string;
  configuration: Record<string, any>;
  isActive: boolean;
  performanceMetrics?: Record<string, any>;
}

/**
 * Learning data for AI training
 */
export interface LearningData extends BaseEntity {
  dataType: string;
  content: Record<string, any>;
  labels?: Record<string, any>;
  source: string;
  qualityScore?: number;
  usedCount: number;
  isValidated: boolean;
  validatedBy?: UUID;
  validatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ----------------------
// SUPPORTING TYPE DEFINITIONS
// ----------------------

/**
 * Target criteria for audience targeting
 */
export interface TargetCriteria {
  location?: LocationCriteria;
  specialties?: string[];
  companySize?: CompanySizeCriteria;
  projectTypes?: string[];
  keywords?: string[];
  exclusions?: ExclusionCriteria;
  customAttributes?: Record<string, any>;
}

/**
 * Location targeting criteria
 */
export interface LocationCriteria {
  regions?: string[];
  states?: string[];
  cities?: string[];
  postalCodes?: string[];
  radius?: {
    lat: number;
    lng: number;
    radiusKm: number;
  };
}

/**
 * Company size criteria
 */
export interface CompanySizeCriteria {
  minEmployees?: number;
  maxEmployees?: number;
  revenueRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Exclusion criteria
 */
export interface ExclusionCriteria {
  competitors?: string[];
  blacklistedDomains?: string[];
  previouslyContacted?: boolean;
  previouslyRejected?: boolean;
}

/**
 * Campaign goals
 */
export interface CampaignGoals {
  targetContractorCount?: number;
  conversionRateTarget?: number;
  timeframeInDays?: number;
  costPerAcquisitionTarget?: number;
  qualityThreshold?: number;
  regionPriorities?: Record<string, number>;
  specialtyDistribution?: Record<string, number>;
}

/**
 * Location data
 */
export interface LocationData {
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  addressLine1?: string;
  addressLine2?: string;
  region?: string;
  serviceRadius?: number;
}

/**
 * Personalization configuration
 */
export interface PersonalizationConfig {
  useAI: boolean;
  variablesMappings?: Record<string, string>;
  tonality?: string;
  contextualData?: string[];
  personalizationLevel?: 'basic' | 'medium' | 'advanced';
  domainSpecificKnowledge?: Record<string, any>;
  fallbackStrategies?: Record<string, string>;
}

/**
 * Discovery results summary
 */
export interface DiscoveryResultsSummary {
  totalFound: number;
  processedCount: number;
  duplicatesCount: number;
  invalidCount: number;
  averageQualityScore?: number;
  specialtyDistribution?: Record<string, number>;
  locationDistribution?: Record<string, number>;
  processingTimeSeconds?: number;
}

// ----------------------
// SERVICE INTERFACES
// ----------------------

/**
 * Campaign service interface
 */
export interface CampaignService {
  /**
   * Create a new campaign
   */
  createCampaign(campaign: CampaignCreateDTO): Promise<Campaign>;
  
  /**
   * Update an existing campaign
   */
  updateCampaign(id: UUID, updates: CampaignUpdateDTO): Promise<Campaign>;
  
  /**
   * Get a campaign by ID
   */
  getCampaign(id: UUID): Promise<Campaign | null>;
  
  /**
   * Find campaigns by various criteria
   */
  findCampaigns(criteria: CampaignSearchCriteria): Promise<PaginatedResult<Campaign>>;
  
  /**
   * Change a campaign's status
   */
  changeCampaignStatus(id: UUID, status: CampaignStatus): Promise<Campaign>;
  
  /**
   * Get campaign performance metrics
   */
  getCampaignMetrics(id: UUID, dateRange?: DateRange): Promise<CampaignPerformanceDTO>;
  
  /**
   * Delete a campaign
   */
  deleteCampaign(id: UUID): Promise<void>;
}

/**
 * Target audience service interface
 */
export interface TargetAudienceService {
  /**
   * Create a new target audience
   */
  createTargetAudience(audience: TargetAudienceCreateDTO): Promise<TargetAudience>;
  
  /**
   * Update an existing target audience
   */
  updateTargetAudience(id: UUID, updates: TargetAudienceUpdateDTO): Promise<TargetAudience>;
  
  /**
   * Get a target audience by ID
   */
  getTargetAudience(id: UUID): Promise<TargetAudience | null>;
  
  /**
   * Find target audiences by name or criteria
   */
  findTargetAudiences(search?: string): Promise<TargetAudience[]>;
  
  /**
   * Delete a target audience
   */
  deleteTargetAudience(id: UUID): Promise<void>;
  
  /**
   * Estimate the size of a target audience
   */
  estimateAudienceSize(criteria: TargetCriteria): Promise<AudienceSizeEstimateDTO>;
}

/**
 * Message template service interface
 */
export interface MessageTemplateService {
  /**
   * Create a new message template
   */
  createTemplate(template: MessageTemplateCreateDTO): Promise<MessageTemplate>;
  
  /**
   * Update an existing template
   */
  updateTemplate(id: UUID, updates: MessageTemplateUpdateDTO): Promise<MessageTemplate>;
  
  /**
   * Get a template by ID
   */
  getTemplate(id: UUID, includeVersions?: boolean): Promise<MessageTemplate | null>;
  
  /**
   * Find templates by various criteria
   */
  findTemplates(criteria: TemplateSearchCriteria): Promise<MessageTemplate[]>;
  
  /**
   * Create a new version of a template
   */
  createTemplateVersion(templateId: UUID, version: TemplateVersionCreateDTO): Promise<MessageTemplateVersion>;
  
  /**
   * Get a specific template version
   */
  getTemplateVersion(templateId: UUID, versionNumber: number): Promise<MessageTemplateVersion | null>;
  
  /**
   * Get template performance metrics
   */
  getTemplatePerformance(id: UUID): Promise<TemplatePerformanceDTO>;
  
  /**
   * Preview a personalized template
   */
  previewPersonalization(templateId: UUID, prospectData: any): Promise<PersonalizationPreviewDTO>;
  
  /**
   * Delete a template
   */
  deleteTemplate(id: UUID): Promise<void>;
}

/**
 * Prospect service interface
 */
export interface ProspectService {
  /**
   * Create a new prospect
   */
  createProspect(prospect: ProspectCreateDTO): Promise<ContractorProspect>;
  
  /**
   * Update an existing prospect
   */
  updateProspect(id: UUID, updates: ProspectUpdateDTO): Promise<ContractorProspect>;
  
  /**
   * Get a prospect by ID
   */
  getProspect(id: UUID): Promise<ContractorProspect | null>;
  
  /**
   * Find prospects by various criteria
   */
  findProspects(criteria: ProspectSearchCriteria): Promise<PaginatedResult<ContractorProspect>>;
  
  /**
   * Change a prospect's status
   */
  changeProspectStatus(id: UUID, status: ProspectStatus): Promise<ContractorProspect>;
  
  /**
   * Enrich a prospect with additional data
   */
  enrichProspect(id: UUID, sources?: string[]): Promise<ContractorProspect>;
  
  /**
   * Get a prospect's outreach history
   */
  getProspectOutreachHistory(id: UUID): Promise<OutreachMessage[]>;
  
  /**
   * Get a prospect's response history
   */
  getProspectResponseHistory(id: UUID): Promise<ProspectResponse[]>;
  
  /**
   * Track a prospect conversion
   */
  trackConversion(conversion: ConversionCreateDTO): Promise<ProspectConversion>;
  
  /**
   * Delete a prospect
   */
  deleteProspect(id: UUID): Promise<void>;
}

/**
 * Outreach message service interface
 */
export interface OutreachService {
  /**
   * Create a new outreach message
   */
  createOutreachMessage(message: OutreachMessageCreateDTO): Promise<OutreachMessage>;
  
  /**
   * Schedule a batch of outreach messages
   */
  scheduleBatchOutreach(batchParams: BatchOutreachDTO): Promise<BatchOutreachResultDTO>;
  
  /**
   * Send a message immediately
   */
  sendImmediately(messageId: UUID): Promise<OutreachMessage>;
  
  /**
   * Update message delivery status
   */
  updateDeliveryStatus(messageId: UUID, status: DeliveryStatus, metadata?: any): Promise<OutreachMessage>;
  
  /**
   * Track message opens
   */
  trackOpen(messageId: UUID, metadata?: any): Promise<OutreachMessage>;
  
  /**
   * Track message clicks
   */
  trackClick(messageId: UUID, linkUrl: string, metadata?: any): Promise<OutreachMessage>;
  
  /**
   * Record a response to a message
   */
  recordResponse(response: ResponseCreateDTO): Promise<ProspectResponse>;
  
  /**
   * Get messages by various criteria
   */
  findMessages(criteria: MessageSearchCriteria): Promise<PaginatedResult<OutreachMessage>>;
  
  /**
   * Cancel a scheduled message
   */
  cancelMessage(messageId: UUID): Promise<OutreachMessage>;
}

/**
 * Discovery service interface
 */
export interface DiscoveryService {
  /**
   * Create a new discovery task
   */
  createDiscoveryTask(task: DiscoveryTaskCreateDTO): Promise<DiscoveryTask>;
  
  /**
   * Start a discovery task
   */
  startDiscoveryTask(taskId: UUID): Promise<DiscoveryTask>;
  
  /**
   * Get a discovery task by ID
   */
  getDiscoveryTask(taskId: UUID): Promise<DiscoveryTask | null>;
  
  /**
   * Find discovery tasks by various criteria
   */
  findDiscoveryTasks(criteria: DiscoveryTaskSearchCriteria): Promise<PaginatedResult<DiscoveryTask>>;
  
  /**
   * Get results for a discovery task
   */
  getDiscoveryResults(taskId: UUID): Promise<PaginatedResult<DiscoveryResult>>;
  
  /**
   * Process a discovery result into a prospect
   */
  processDiscoveryResult(resultId: UUID, action: ProcessingAction): Promise<ContractorProspect | null>;
  
  /**
   * Cancel a discovery task
   */
  cancelDiscoveryTask(taskId: UUID): Promise<DiscoveryTask>;
}

/**
 * AI content service interface
 */
export interface AIContentService {
  /**
   * Generate content with AI
   */
  generateContent(request: ContentGenerationRequest): Promise<AIContentGeneration>;
  
  /**
   * Get an AI content generation by ID
   */
  getContentGeneration(id: UUID): Promise<AIContentGeneration | null>;
  
  /**
   * Approve AI-generated content
   */
  approveContent(id: UUID): Promise<AIContentGeneration>;
  
  /**
   * Find AI content generations by various criteria
   */
  findContentGenerations(criteria: ContentGenerationSearchCriteria): Promise<PaginatedResult<AIContentGeneration>>;
  
  /**
   * Get available AI models for a specific purpose
   */
  getAvailableModels(purpose: string): Promise<AIModel[]>;
  
  /**
   * Analyze message sentiment
   */
  analyzeSentiment(text: string): Promise<SentimentAnalysisResult>;
}

/**
 * Analytics service interface
 */
export interface AnalyticsService {
  /**
   * Get campaign performance metrics
   */
  getCampaignPerformance(campaignId: UUID, dateRange?: DateRange): Promise<CampaignPerformanceDTO>;
  
  /**
   * Get performance metrics across all campaigns
   */
  getOverallPerformance(dateRange?: DateRange): Promise<OverallPerformanceDTO>;
  
  /**
   * Get template performance comparison
   */
  compareTemplatePerformance(templateIds: UUID[]): Promise<TemplateComparisonDTO>;
  
  /**
   * Get conversion funnel analytics
   */
  getConversionFunnel(filters?: ConversionFunnelFilters): Promise<ConversionFunnelDTO>;
  
  /**
   * Get prospect quality distribution
   */
  getProspectQualityDistribution(): Promise<QualityDistributionDTO>;
  
  /**
   * Get geographic performance data
   */
  getGeographicPerformance(): Promise<GeographicPerformanceDTO>;
  
  /**
   * Get channel performance comparison
   */
  getChannelPerformance(dateRange?: DateRange): Promise<ChannelPerformanceDTO>;
}

// ----------------------
// DTO INTERFACES
// ----------------------

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Date range for queries
 */
export interface DateRange {
  startDate: Date;
  endDate: Date;
}

/**
 * Campaign creation DTO
 */
export interface CampaignCreateDTO {
  name: string;
  description?: string;
  status: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  targetAudienceId: UUID;
  messageTemplateId?: UUID;
  goals?: CampaignGoals;
  budget?: number;
}

/**
 * Campaign update DTO
 */
export interface CampaignUpdateDTO {
  name?: string;
  description?: string;
  status?: CampaignStatus;
  startDate?: Date;
  endDate?: Date;
  targetAudienceId?: UUID;
  messageTemplateId?: UUID;
  goals?: CampaignGoals;
  budget?: number;
}

/**
 * Campaign search criteria
 */
export interface CampaignSearchCriteria {
  status?: CampaignStatus[];
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  targetAudienceId?: UUID;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Campaign performance DTO
 */
export interface CampaignPerformanceDTO {
  campaign: {
    id: UUID;
    name: string;
    status: CampaignStatus;
  };
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    prospectsContacted: number;
    messagesSent: number;
    messagesDelivered: number;
    messagesOpened: number;
    linkClicks: number;
    responsesReceived: number;
    conversions: number;
    cost?: number;
  };
  rates: {
    deliveryRate: number;
    openRate: number;
    clickThroughRate: number;
    responseRate: number;
    conversionRate: number;
    costPerAcquisition?: number;
  };
  responseBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  timeSeriesData: {
    date: Date;
    messagesSent: number;
    messagesOpened: number;
    responses: number;
    conversions: number;
  }[];
}

/**
 * Target audience creation DTO
 */
export interface TargetAudienceCreateDTO {
  name: string;
  description?: string;
  criteria: TargetCriteria;
}

/**
 * Target audience update DTO
 */
export interface TargetAudienceUpdateDTO {
  name?: string;
  description?: string;
  criteria?: TargetCriteria;
}

/**
 * Audience size estimate DTO
 */
export interface AudienceSizeEstimateDTO {
  estimatedTotal: number;
  breakdowns: {
    byRegion?: Record<string, number>;
    bySpecialty?: Record<string, number>;
    byCompanySize?: Record<string, number>;
  };
  precision: 'low' | 'medium' | 'high';
  dataTimestamp: Date;
}

/**
 * Message template creation DTO
 */
export interface MessageTemplateCreateDTO {
  name: string;
  description?: string;
  contentType: ContentType;
  subject?: string;
  content: string;
  variables?: Record<string, any>;
  personalizationConfig?: PersonalizationConfig;
}

/**
 * Message template update DTO
 */
export interface MessageTemplateUpdateDTO {
  name?: string;
  description?: string;
  subject?: string;
  content?: string;
  variables?: Record<string, any>;
  personalizationConfig?: PersonalizationConfig;
}

/**
 * Template search criteria
 */
export interface TemplateSearchCriteria {
  contentType?: ContentType[];
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Template version creation DTO
 */
export interface TemplateVersionCreateDTO {
  content: string;
  subject?: string;
  variables?: Record<string, any>;
  personalizationConfig?: PersonalizationConfig;
}

/**
 * Template performance DTO
 */
export interface TemplatePerformanceDTO {
  template: {
    id: UUID;
    name: string;
    contentType: ContentType;
  };
  usage: {
    totalMessages: number;
    activeCampaigns: number;
  };
  performance: {
    deliveryRate: number;
    openRate: number;
    clickThroughRate: number;
    responseRate: number;
    conversionRate: number;
  };
  responseBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  compareToAverage: {
    openRate: number;
    clickThroughRate: number;
    responseRate: number;
    conversionRate: number;
  };
}

/**
 * Personalization preview DTO
 */
export interface PersonalizationPreviewDTO {
  original: {
    content: string;
    subject?: string;
  };
  personalized: {
    content: string;
    subject?: string;
  };
  usedVariables: string[];
  personalizationScore: number;
  aiModels?: {
    name: string;
    version: string;
  }[];
}

/**
 * Prospect creation DTO
 */
export interface ProspectCreateDTO {
  externalId?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  locationData?: LocationData;
  source: string;
  sourceUrl?: string;
  enrichmentData?: Record<string, any>;
  tags?: string[];
  notes?: string;
}

/**
 * Prospect update DTO
 */
export interface ProspectUpdateDTO {
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  locationData?: LocationData;
  status?: ProspectStatus;
  enrichmentData?: Record<string, any>;
  tags?: string[];
  notes?: string;
}

/**
 * Prospect search criteria
 */
export interface ProspectSearchCriteria {
  status?: ProspectStatus[];
  source?: string[];
  specialties?: string[];
  qualityScoreMin?: number;
  qualityScoreMax?: number;
  location?: {
    city?: string;
    state?: string;
    postalCode?: string;
    radius?: {
      lat: number;
      lng: number;
      radiusKm: number;
    };
  };
  discoveredAfter?: Date;
  discoveredBefore?: Date;
  tags?: string[];
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Conversion creation DTO
 */
export interface ConversionCreateDTO {
  prospectId: UUID;
  userId: UUID;
  campaignId?: UUID;
  conversionSource: string;
  attributionData?: Record<string, any>;
  onboardingStatus: OnboardingStatus;
}

/**
 * Outreach message creation DTO
 */
export interface OutreachMessageCreateDTO {
  campaignId: UUID;
  prospectId: UUID;
  templateId: UUID;
  templateVersionId?: UUID;
  channel: ContentType;
  subject?: string;
  scheduledTime: Date;
  personalizedContent?: string; // Optional if using template personalization
  metadata?: Record<string, any>;
}

/**
 * Batch outreach DTO
 */
export interface BatchOutreachDTO {
  campaignId: UUID;
  templateId: UUID;
  templateVersionId?: UUID;
  channel: ContentType;
  prospectIds: UUID[];
  scheduledTime: Date;
  personalizeMessages: boolean;
  throttlingParams?: {
    messagesPerMinute?: number;
    maxMessagesPerDay?: number;
  };
}

/**
 * Batch outreach result DTO
 */
export interface BatchOutreachResultDTO {
  totalRequested: number;
  totalScheduled: number;
  failedScheduling: {
    prospectId: UUID;
    reason: string;
  }[];
  scheduledMessages: UUID[];
  batchId: UUID;
  estimatedCompletionTime: Date;
}

/**
 * Message search criteria
 */
export interface MessageSearchCriteria {
  campaignId?: UUID;
  prospectId?: UUID;
  templateId?: UUID;
  channel?: ContentType[];
  deliveryStatus?: DeliveryStatus[];
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  sentAfter?: Date;
  sentBefore?: Date;
  hasResponse?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Response creation DTO
 */
export interface ResponseCreateDTO {
  messageId: UUID;
  prospectId: UUID;
  responseType: ResponseType;
  content?: string;
  receivedTime: Date;
  sentiment?: Sentiment;
  metadata?: Record<string, any>;
}

/**
 * Discovery task creation DTO
 */
export interface DiscoveryTaskCreateDTO {
  name: string;
  sourceType: string;
  sourceParameters: Record<string, any>;
  filterCriteria?: Record<string, any>;
  maxResults?: number;
  scheduledTime?: Date;
}

/**
 * Discovery task search criteria
 */
export interface DiscoveryTaskSearchCriteria {
  status?: DiscoveryTaskStatus[];
  sourceType?: string[];
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
  createdBy?: UUID;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Processing action for discovery results
 */
export enum ProcessingAction {
  PROCESS = 'PROCESS',
  MERGE = 'MERGE',
  REJECT = 'REJECT',
  REVISIT_LATER = 'REVISIT_LATER',
  DELETE = 'DELETE'
}

/**
 * Content generation request
 */
export interface ContentGenerationRequest {
  requestType: string;
  parameters: Record<string, any>;
  prompt: string;
  modelId?: UUID;
  useExistingContent?: {
    contentId: UUID;
    preserveStructure: boolean;
  };
  approvalRequired?: boolean;
}

/**
 * Content generation search criteria
 */
export interface ContentGenerationSearchCriteria {
  requestType?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  approved?: boolean;
  createdBy?: UUID;
  approvedBy?: UUID;
  usageLocation?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Sentiment analysis result
 */
export interface SentimentAnalysisResult {
  text: string;
  sentiment: Sentiment;
  confidenceScore: number;
  keyPhrases?: string[];
  entities?: {
    text: string;
    type: string;
    sentiment?: Sentiment;
  }[];
  intentionality?: {
    isQuestion: boolean;
    isRequest: boolean;
    needsHumanAttention: boolean;
    urgency: 'low' | 'medium' | 'high';
  };
  analysisMetadata: {
    modelUsed: string;
    processingTimeMs: number;
    version: string;
  };
}

/**
 * Overall performance DTO
 */
export interface OverallPerformanceDTO {
  dateRange: {
    start: Date;
    end: Date;
  };
  summary: {
    totalCampaigns: number;
    totalProspectsContacted: number;
    totalMessagesSent: number;
    totalMessagesDelivered: number;
    totalMessagesOpened: number;
    totalResponses: number;
    totalConversions: number;
    totalCost?: number;
  };
  rates: {
    averageDeliveryRate: number;
    averageOpenRate: number;
    averageResponseRate: number;
    averageConversionRate: number;
    averageCostPerAcquisition?: number;
  };
  channelBreakdown: Record<ContentType, number>;
  trends: {
    date: Date;
    messagesSent: number;
    openRate: number;
    responseRate: number;
    conversionRate: number;
  }[];
  topPerformingCampaigns: {
    id: UUID;
    name: string;
    conversionRate: number;
    messagesSent: number;
    conversions: number;
  }[];
}

/**
 * Template comparison DTO
 */
export interface TemplateComparisonDTO {
  templates: {
    id: UUID;
    name: string;
    contentType: ContentType;
    messagesSent: number;
    openRate: number;
    clickThroughRate: number;
    responseRate: number;
    conversionRate: number;
    costPerAcquisition?: number;
  }[];
  averages: {
    openRate: number;
    clickThroughRate: number;
    responseRate: number;
    conversionRate: number;
    costPerAcquisition?: number;
  };
  significantDifferences: {
    templateId: UUID;
    metric: string;
    percentageDifference: number;
    isPositive: boolean;
  }[];
  recommendedTemplate?: UUID;
}

/**
 * Conversion funnel filters
 */
export interface ConversionFunnelFilters {
  campaigns?: UUID[];
  dateRange?: DateRange;
  channels?: ContentType[];
  specialties?: string[];
  locations?: LocationCriteria;
  sources?: string[];
}

/**
 * Conversion funnel DTO
 */
export interface ConversionFunnelDTO {
  stages: {
    name: string;
    count: number;
    percentage: number;
    dropOffPercentage: number;
  }[];
  breakdowns: {
    byChannel?: Record<ContentType, number[]>;
    byCampaign?: Record<string, number[]>;
    byLocation?: Record<string, number[]>;
  };
  conversionTimeMetrics: {
    averageDaysToConversion: number;
    medianDaysToConversion: number;
    quickestConversionDays: number;
    slowestConversionDays: number;
  };
  trends: {
    date: Date;
    stageData: Record<string, number>;
  }[];
}

/**
 * Quality distribution DTO
 */
export interface QualityDistributionDTO {
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  averageScore: number;
  medianScore: number;
  qualityTrend: {
    date: Date;
    averageScore: number;
    newProspectsCount: number;
  }[];
  scoreCorrelations: {
    factor: string;
    correlationStrength: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
  breakdowns: {
    bySource: Record<string, number>;
    bySpecialty: Record<string, number>;
  };
}

/**
 * Geographic performance DTO
 */
export interface GeographicPerformanceDTO {
  regions: {
    name: string;
    prospectsCount: number;
    messagesCount: number;
    openRate: number;
    responseRate: number;
    conversionRate: number;
    averageQualityScore: number;
  }[];
  states: {
    name: string;
    prospectsCount: number;
    messagesCount: number;
    openRate: number;
    responseRate: number;
    conversionRate: number;
    averageQualityScore: number;
  }[];
  cities: {
    name: string;
    prospectsCount: number;
    messagesCount: number;
    openRate: number;
    responseRate: number;
    conversionRate: number;
    averageQualityScore: number;
  }[];
  heatmapData?: {
    latitude: number;
    longitude: number;
    weight: number;
    metric: string;
  }[];
  topPerformingLocations: {
    name: string;
    level: 'region' | 'state' | 'city';
    conversionRate: number;
    prospectsCount: number;
  }[];
}

/**
 * Channel performance DTO
 */
export interface ChannelPerformanceDTO {
  channels: {
    type: ContentType;
    messagesSent: number;
    deliveryRate: number;
    openRate: number;
    responseRate: number;
    conversionRate: number;
    costPerMessage?: number;
    costPerAcquisition?: number;
  }[];
  comparisons: {
    metric: string;
    values: Record<ContentType, number>;
    bestChannel: ContentType;
  }[];
  timeOfDay: {
    hour: number;
    channelData: Record<ContentType, {
      messagesSent: number;
      openRate: number;
    }>;
  }[];
  recommendations: {
    channel: ContentType;
    reason: string;
    idealTimeRanges?: string[];
    projectedImprovement?: number;
  }[];
}
