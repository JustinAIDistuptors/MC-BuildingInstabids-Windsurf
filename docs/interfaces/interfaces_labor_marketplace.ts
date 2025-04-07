import { User } from './interfaces_core.js';
import { Project } from './interfaces_project_management.js';

/**
 * Represents a labor helper's profile in the marketplace.
 */
export interface LaborHelper {
    id: string;
    userId: string;
    user?: User;
    profileStatus: 'pending_verification' | 'verified' | 'suspended' | 'inactive' | 'active';
    verificationLevel: 'basic' | 'identity_verified' | 'background_checked' | 'fully_verified';
    backgroundCheckStatus?: 'not_submitted' | 'pending' | 'passed' | 'failed' | 'expired';
    backgroundCheckDate?: string; // ISO-8601
    identityVerified: boolean;
    identityVerifiedDate?: string; // ISO-8601
    skillsVerified: boolean;
    skillsVerifiedDate?: string; // ISO-8601
    verifiedById?: string;
    verifiedBy?: User;
    availabilityStatus: 'available' | 'busy' | 'unavailable' | 'vacation';
    hourlyRateMin?: number;
    hourlyRateMax?: number;
    minimumHours?: number;
    dayRate?: number;
    currentLocationZip?: string;
    maxTravelDistance?: number; // In miles or kilometers
    hasTransportation: boolean;
    hasOwnTools: boolean;
    canPurchaseMaterials: boolean;
    yearsExperience?: number;
    hasLiabilityInsurance: boolean;
    liabilityInsuranceExpiry?: string; // ISO-8601
    insuranceVerificationDocUrl?: string;
    reliabilityScore?: number; // 0.00-5.00
    qualityScore?: number; // 0.00-5.00
    communicationScore?: number; // 0.00-5.00
    overallRating?: number; // 0.00-5.00
    totalCompletedJobs: number;
    totalHoursWorked: number;
    profileViews: number;
    profileCompletionPercentage: number;
    bio?: string;
    profileImageUrl?: string;
    profileVideoUrl?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    skills?: HelperSkill[];
    certifications?: HelperCertification[];
    workHistory?: HelperWorkHistory[];
    availability?: HelperAvailability[];
    unavailableDates?: HelperUnavailableDate[];
    earnedBadges?: HelperEarnedBadge[];
    skillCategories?: HelperSkillCategoryMapping[];
}

/**
 * Represents a specific skill that a labor helper possesses.
 */
export interface HelperSkill {
    id: string;
    helperId: string;
    helper?: LaborHelper;
    skillName: string;
    skillType: 'general_labor' | 'specialized' | 'tools_operation' | 'management' | 'materials_knowledge';
    skillLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsExperience?: number;
    isVerified: boolean;
    verifiedById?: string;
    verifiedBy?: User;
    verificationDate?: string; // ISO-8601
    verificationNote?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a category of skills for organizing helper abilities.
 */
export interface SkillCategory {
    id: string;
    name: string;
    description?: string;
    iconUrl?: string;
    parentCategoryId?: string;
    parentCategory?: SkillCategory;
    subcategories?: SkillCategory[];
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Maps a helper to skill categories with proficiency levels.
 */
export interface HelperSkillCategoryMapping {
    id: string;
    helperId: string;
    helper?: LaborHelper;
    skillCategoryId: string;
    skillCategory?: SkillCategory;
    proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    isPrimary: boolean;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a certification that a labor helper has obtained.
 */
export interface HelperCertification {
    id: string;
    helperId: string;
    helper?: LaborHelper;
    certificationName: string;
    certificationAuthority: string;
    certificationDate: string; // ISO-8601
    expirationDate?: string; // ISO-8601
    certificationNumber?: string;
    verificationStatus: 'pending' | 'verified' | 'rejected' | 'expired';
    documentUrl?: string;
    verifiedById?: string;
    verifiedBy?: User;
    verifiedAt?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a labor helper's work history/experience.
 */
export interface HelperWorkHistory {
    id: string;
    helperId: string;
    helper?: LaborHelper;
    companyName?: string;
    position: string;
    startDate: string; // ISO-8601
    endDate?: string; // ISO-8601
    isCurrent: boolean;
    responsibilities?: string;
    supervisorName?: string;
    supervisorContact?: string;
    canContactSupervisor: boolean;
    verified: boolean;
    verifiedById?: string;
    verifiedBy?: User;
    verifiedAt?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a labor helper's weekly availability.
 */
export interface HelperAvailability {
    id: string;
    helperId: string;
    helper?: LaborHelper;
    dayOfWeek: number; // 0=Sunday, 6=Saturday
    startTime: string; // HH:MM:SS
    endTime: string; // HH:MM:SS
    isRecurring: boolean;
    effectiveFrom?: string; // ISO-8601
    effectiveTo?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents specific dates when a labor helper is unavailable.
 */
export interface HelperUnavailableDate {
    id: string;
    helperId: string;
    helper?: LaborHelper;
    startDate: string; // ISO-8601
    endDate: string; // ISO-8601
    reason?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a job post in the labor marketplace.
 */
export interface LaborJobPost {
    id: string;
    creatorId: string;
    creator?: User;
    creatorType: 'homeowner' | 'contractor';
    projectId?: string;
    project?: Project;
    status: 'draft' | 'open' | 'in_progress' | 'filled' | 'canceled' | 'completed' | 'expired';
    title: string;
    description: string;
    jobType: 'one_time' | 'recurring' | 'multi_day' | 'project_based';
    payType: 'hourly' | 'fixed' | 'daily';
    payRate: number;
    estimatedHours?: number;
    maxHours?: number;
    estimatedDays?: number;
    startDate: string; // ISO-8601
    endDate?: string; // ISO-8601
    requiredHelpersCount: number;
    filledHelpersCount: number;
    locationZip: string;
    locationAddress?: string;
    locationLat?: number;
    locationLng?: number;
    skillCategoryId?: string;
    skillCategory?: SkillCategory;
    requiredSkills?: string[];
    requiredVerificationLevel?: 'basic' | 'identity_verified' | 'background_checked' | 'fully_verified';
    requiredExperienceYears?: number;
    toolsProvided: boolean;
    materialsProvided: boolean;
    transportationRequired: boolean;
    viewCount: number;
    applicationCount: number;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'emergency';
    cancellationReason?: string;
    canceledAt?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    specificRequirements?: JobSpecificRequirement[];
    applications?: LaborJobApplication[];
    assignments?: LaborAssignment[];
}

/**
 * Represents specific requirements for a labor job post.
 */
export interface JobSpecificRequirement {
    id: string;
    jobPostId: string;
    jobPost?: LaborJobPost;
    requirementType: 'certification' | 'equipment' | 'physical' | 'availability' | 'language' | 'custom';
    requirementName: string;
    isRequired: boolean;
    description?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an application from a helper to a labor job post.
 */
export interface LaborJobApplication {
    id: string;
    jobPostId: string;
    jobPost?: LaborJobPost;
    helperId: string;
    helper?: LaborHelper;
    status: 'submitted' | 'viewed' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
    coverLetter?: string;
    requestedPayRate?: number;
    availableStartDate?: string; // ISO-8601
    availableEndDate?: string; // ISO-8601
    totalAvailableHours?: number;
    submissionDate: string; // ISO-8601
    viewedAt?: string; // ISO-8601
    shortlistedAt?: string; // ISO-8601
    rejectedAt?: string; // ISO-8601
    hiredAt?: string; // ISO-8601
    withdrawnAt?: string; // ISO-8601
    rejectionReason?: string;
    withdrawalReason?: string;
    notes?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an assignment of a helper to a labor job.
 */
export interface LaborAssignment {
    id: string;
    jobPostId: string;
    jobPost?: LaborJobPost;
    helperId: string;
    helper?: LaborHelper;
    applicationId?: string;
    application?: LaborJobApplication;
    hiringUserId: string;
    hiringUser?: User;
    status: 'scheduled' | 'in_progress' | 'completed' | 'canceled' | 'no_show' | 'partial';
    payType: 'hourly' | 'fixed' | 'daily';
    payRate: number;
    expectedStartDate: string; // ISO-8601
    expectedEndDate?: string; // ISO-8601
    expectedHours?: number;
    actualStartDate?: string; // ISO-8601
    actualEndDate?: string; // ISO-8601
    actualHours?: number;
    totalPay?: number;
    platformFee?: number;
    helperPayout?: number;
    description?: string;
    specialInstructions?: string;
    toolsProvided: boolean;
    materialsProvided: boolean;
    transportationProvided: boolean;
    canceledById?: string;
    canceledBy?: User;
    cancellationReason?: string;
    canceledAt?: string; // ISO-8601
    cancellationFee?: number;
    supervisorName?: string;
    supervisorPhone?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    checkIns?: AssignmentCheckIn[];
    tasks?: AssignmentTask[];
    reviews?: LaborHelperReview[];
}

/**
 * Represents a check-in/out event for time tracking of an assignment.
 */
export interface AssignmentCheckIn {
    id: string;
    assignmentId: string;
    assignment?: LaborAssignment;
    checkInTime?: string; // ISO-8601
    checkOutTime?: string; // ISO-8601
    hoursLogged?: number;
    breakTimeMinutes?: number;
    locationLat?: number;
    locationLng?: number;
    locationAccuracy?: number;
    photoUrl?: string;
    notes?: string;
    verifiedById?: string;
    verifiedBy?: User;
    verificationStatus?: 'pending' | 'verified' | 'disputed' | 'adjusted' | 'rejected';
    verificationTime?: string; // ISO-8601
    adjustmentReason?: string;
    originalHoursLogged?: number;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a task assigned within a labor assignment.
 */
export interface AssignmentTask {
    id: string;
    assignmentId: string;
    assignment?: LaborAssignment;
    taskName: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    estimatedHours?: number;
    actualHours?: number;
    assignedById?: string;
    assignedBy?: User;
    assignedAt: string; // ISO-8601
    startedAt?: string; // ISO-8601
    completedAt?: string; // ISO-8601
    completionNotes?: string;
    completionPhotoUrl?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a review of a labor helper by a client.
 */
export interface LaborHelperReview {
    id: string;
    assignmentId: string;
    assignment?: LaborAssignment;
    helperId: string;
    helper?: LaborHelper;
    reviewerId: string;
    reviewer?: User;
    reviewerType: 'homeowner' | 'contractor';
    overallRating: number; // 1-5
    reliabilityRating?: number; // 1-5
    qualityRating?: number; // 1-5
    communicationRating?: number; // 1-5
    valueRating?: number; // 1-5
    attitudeRating?: number; // 1-5
    reviewText?: string;
    wouldHireAgain?: boolean;
    reviewDate: string; // ISO-8601
    helperResponse?: string;
    helperResponseDate?: string; // ISO-8601
    hidden: boolean;
    hiddenReason?: string;
    hiddenById?: string;
    hiddenBy?: User;
    flagged: boolean;
    flaggedReason?: string;
    flaggedById?: string;
    flaggedBy?: User;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a review of a client by a labor helper.
 */
export interface ClientReview {
    id: string;
    assignmentId: string;
    assignment?: LaborAssignment;
    clientId: string;
    client?: User;
    clientType: 'homeowner' | 'contractor';
    helperId: string;
    helper?: LaborHelper;
    overallRating: number; // 1-5
    communicationRating?: number; // 1-5
    clarityRating?: number; // 1-5
    paymentPromptnesRating?: number; // 1-5
    workplaceRating?: number; // 1-5
    reviewText?: string;
    wouldWorkAgain?: boolean;
    reviewDate: string; // ISO-8601
    clientResponse?: string;
    clientResponseDate?: string; // ISO-8601
    hidden: boolean;
    hiddenReason?: string;
    hiddenById?: string;
    hiddenBy?: User;
    flagged: boolean;
    flaggedReason?: string;
    flaggedById?: string;
    flaggedBy?: User;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a community-provided verification for a labor helper.
 */
export interface CommunityVerification {
    id: string;
    helperId: string;
    helper?: LaborHelper;
    verifierId: string;
    verifier?: User;
    verifierType: 'contractor' | 'homeowner';
    verificationType: 'general' | 'skill_specific' | 'work_quality' | 'reliability';
    specificSkill?: string;
    verificationText: string;
    relationshipType: 'worked_together' | 'hired_before' | 'professional_connection' | 'personal_connection';
    relationshipDuration?: 'one_time' | 'less_than_month' | 'one_to_six_months' | 'six_to_twelve_months' | 'over_one_year' | 'over_three_years';
    verificationDate: string; // ISO-8601
    isApproved: boolean;
    approvedAt?: string; // ISO-8601
    approvedById?: string;
    approvedBy?: User;
    isDisputed: boolean;
    disputeReason?: string;
    disputedAt?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a dispute between a helper and a client.
 */
export interface HelperDispute {
    id: string;
    assignmentId: string;
    assignment?: LaborAssignment;
    helperId: string;
    helper?: LaborHelper;
    clientId: string;
    client?: User;
    initiatedBy: 'helper' | 'client';
    disputeType: 'hours_worked' | 'payment' | 'job_conditions' | 'expectations' | 'other';
    status: 'opened' | 'under_review' | 'mediation' | 'resolved' | 'closed' | 'escalated';
    disputedAmount?: number;
    disputeDescription: string;
    evidenceUrls?: string[];
    resolutionType?: 'full_helper' | 'partial_helper' | 'full_client' | 'partial_client' | 'mutual_agreement' | 'no_resolution';
    resolutionAmount?: number;
    resolutionDescription?: string;
    resolvedById?: string;
    resolvedBy?: User;
    resolvedAt?: string; // ISO-8601
    closureNote?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    messages?: HelperDisputeMessage[];
}

/**
 * Represents a message in a helper dispute thread.
 */
export interface HelperDisputeMessage {
    id: string;
    disputeId: string;
    dispute?: HelperDispute;
    senderId: string;
    sender?: User;
    senderType: 'helper' | 'client' | 'admin' | 'mediator';
    message: string;
    attachmentUrls?: string[];
    sentAt: string; // ISO-8601
    isSystemMessage: boolean;
    createdAt: string; // ISO-8601
}

/**
 * Represents a team of labor helpers.
 */
export interface LaborTeam {
    id: string;
    name: string;
    leaderId: string;
    leader?: LaborHelper;
    status: 'forming' | 'active' | 'inactive' | 'disbanded';
    description?: string;
    primarySkillCategoryId?: string;
    primarySkillCategory?: SkillCategory;
    specialty?: string;
    minTeamRate?: number;
    baseDayRate?: number;
    hasTransportation: boolean;
    hasTools: boolean;
    memberCount: number;
    maxMembers: number;
    formationDate: string; // ISO-8601
    areaServed?: string;
    photoUrl?: string;
    overallRating?: number;
    totalCompletedJobs: number;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    members?: LaborTeamMember[];
    assignments?: TeamAssignment[];
}

/**
 * Represents a member of a labor team.
 */
export interface LaborTeamMember {
    id: string;
    teamId: string;
    team?: LaborTeam;
    helperId: string;
    helper?: LaborHelper;
    role: 'leader' | 'member' | 'apprentice' | 'specialist';
    status: 'invited' | 'active' | 'inactive' | 'removed';
    joinedDate?: string; // ISO-8601
    invitationStatus?: 'pending' | 'accepted' | 'declined' | 'expired';
    individualRate?: number;
    skillsContributed?: string[];
    notes?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an assignment of a team to a job.
 */
export interface TeamAssignment {
    id: string;
    jobPostId: string;
    jobPost?: LaborJobPost;
    teamId: string;
    team?: LaborTeam;
    status: 'scheduled' | 'in_progress' | 'completed' | 'canceled' | 'partial';
    teamRate: number;
    expectedStartDate: string; // ISO-8601
    expectedEndDate?: string; // ISO-8601
    expectedDays?: number;
    actualStartDate?: string; // ISO-8601
    actualEndDate?: string; // ISO-8601
    actualDays?: number;
    totalPay?: number;
    platformFee?: number;
    teamPayout?: number;
    description?: string;
    specialInstructions?: string;
    canceledById?: string;
    canceledBy?: User;
    cancellationReason?: string;
    canceledAt?: string; // ISO-8601
    cancellationFee?: number;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    memberAssignments?: TeamMemberAssignment[];
}

/**
 * Represents an assignment of a team member to a team job.
 */
export interface TeamMemberAssignment {
    id: string;
    teamAssignmentId: string;
    teamAssignment?: TeamAssignment;
    teamMemberId: string;
    teamMember?: LaborTeamMember;
    helperId: string;
    helper?: LaborHelper;
    role: 'lead' | 'support' | 'specialist' | 'general';
    paySharePercentage?: number;
    expectedPay?: number;
    actualPay?: number;
    status: 'scheduled' | 'checked_in' | 'completed' | 'no_show' | 'canceled';
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a badge type that can be earned by labor helpers.
 */
export interface LaborHelperBadge {
    id: string;
    name: string;
    description?: string;
    category: 'reliability' | 'skill' | 'experience' | 'customer_satisfaction' | 'achievement' | 'verification';
    iconUrl: string;
    criteriaDescription?: string;
    isActive: boolean;
    displayPriority?: number;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a badge earned by a specific labor helper.
 */
export interface HelperEarnedBadge {
    id: string;
    helperId: string;
    helper?: LaborHelper;
    badgeId: string;
    badge?: LaborHelperBadge;
    earnedAt: string; // ISO-8601
    awardedById?: string;
    awardedBy?: User;
    awardReason?: string;
    isFeatured: boolean;
    expiresAt?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Service interface for labor marketplace operations.
 */
export interface ILaborMarketplaceService {
    // Helper Profile Management
    getHelperProfile(helperId: string): Promise<LaborHelper>;
    createHelperProfile(userId: string, profileData: Partial<LaborHelper>): Promise<LaborHelper>;
    updateHelperProfile(helperId: string, updates: Partial<LaborHelper>): Promise<LaborHelper>;
    verifyHelperIdentity(helperId: string, verifiedById: string): Promise<LaborHelper>;
    initiateBackgroundCheck(helperId: string): Promise<{ checkId: string; redirectUrl: string }>;
    
    // Skills and Certifications
    addHelperSkill(helperId: string, skill: Partial<HelperSkill>): Promise<HelperSkill>;
    updateHelperSkill(skillId: string, updates: Partial<HelperSkill>): Promise<HelperSkill>;
    verifyHelperSkill(skillId: string, verifiedById: string, verificationNote?: string): Promise<HelperSkill>;
    addHelperCertification(helperId: string, certification: Partial<HelperCertification>): Promise<HelperCertification>;
    verifyCertification(certificationId: string, verifiedById: string): Promise<HelperCertification>;
    
    // Availability Management
    setHelperAvailability(helperId: string, availabilitySlots: Partial<HelperAvailability>[]): Promise<HelperAvailability[]>;
    addUnavailableDates(helperId: string, unavailableDates: Partial<HelperUnavailableDate>): Promise<HelperUnavailableDate>;
    updateHelperAvailabilityStatus(helperId: string, status: LaborHelper['availabilityStatus']): Promise<LaborHelper>;
    
    // Job Posting
    createJobPost(creatorId: string, jobData: Partial<LaborJobPost>): Promise<LaborJobPost>;
    updateJobPost(jobPostId: string, updates: Partial<LaborJobPost>): Promise<LaborJobPost>;
    cancelJobPost(jobPostId: string, reason: string): Promise<LaborJobPost>;
    addJobRequirement(jobPostId: string, requirement: Partial<JobSpecificRequirement>): Promise<JobSpecificRequirement>;
    
    // Job Applications
    applyToJob(jobPostId: string, helperId: string, applicationData: Partial<LaborJobApplication>): Promise<LaborJobApplication>;
    updateApplicationStatus(applicationId: string, status: LaborJobApplication['status'], note?: string): Promise<LaborJobApplication>;
    getApplicationsForJob(jobPostId: string): Promise<LaborJobApplication[]>;
    
    // Assignments
    createAssignment(jobPostId: string, helperId: string, hiringUserId: string, assignmentData: Partial<LaborAssignment>): Promise<LaborAssignment>;
    updateAssignmentStatus(assignmentId: string, status: LaborAssignment['status']): Promise<LaborAssignment>;
    recordCheckIn(assignmentId: string, checkInData: Partial<AssignmentCheckIn>): Promise<AssignmentCheckIn>;
    recordCheckOut(checkInId: string, checkOutTime: string, hoursLogged: number): Promise<AssignmentCheckIn>;
    verifyCheckIn(checkInId: string, verifiedById: string, verificationStatus: AssignmentCheckIn['verificationStatus']): Promise<AssignmentCheckIn>;
    
    // Tasks
    addAssignmentTask(assignmentId: string, taskData: Partial<AssignmentTask>): Promise<AssignmentTask>;
    updateTaskStatus(taskId: string, status: AssignmentTask['status'], completionNote?: string): Promise<AssignmentTask>;
    
    // Reviews and Ratings
    reviewHelper(assignmentId: string, reviewerId: string, reviewData: Partial<LaborHelperReview>): Promise<LaborHelperReview>;
    reviewClient(assignmentId: string, helperId: string, reviewData: Partial<ClientReview>): Promise<ClientReview>;
    getHelperReviews(helperId: string): Promise<LaborHelperReview[]>;
    getClientReviews(clientId: string): Promise<ClientReview[]>;
    
    // Community Verification
    addCommunityVerification(helperId: string, verifierId: string, verificationData: Partial<CommunityVerification>): Promise<CommunityVerification>;
    approveCommunityVerification(verificationId: string, approvedById: string): Promise<CommunityVerification>;
    disputeCommunityVerification(verificationId: string, disputeReason: string): Promise<CommunityVerification>;
    
    // Disputes
    createDispute(assignmentId: string, initiatorId: string, disputeData: Partial<HelperDispute>): Promise<HelperDispute>;
    updateDisputeStatus(disputeId: string, status: HelperDispute['status']): Promise<HelperDispute>;
    resolveDispute(disputeId: string, resolvedById: string, resolutionData: {
        resolutionType: HelperDispute['resolutionType'];
        resolutionAmount?: number;
        resolutionDescription: string;
    }): Promise<HelperDispute>;
    addDisputeMessage(disputeId: string, senderId: string, senderType: HelperDisputeMessage['senderType'], message: string): Promise<HelperDisputeMessage>;
    
    // Team Management
    createTeam(leaderId: string, teamData: Partial<LaborTeam>): Promise<LaborTeam>;
    updateTeam(teamId: string, updates: Partial<LaborTeam>): Promise<LaborTeam>;
    inviteToTeam(teamId: string, helperId: string, role: LaborTeamMember['role']): Promise<LaborTeamMember>;
    respondToTeamInvitation(invitationId: string, accept: boolean): Promise<LaborTeamMember>;
    assignTeamToJob(teamId: string, jobPostId: string, assignmentData: Partial<TeamAssignment>): Promise<TeamAssignment>;
    assignTeamMember(teamAssignmentId: string, teamMemberId: string, assignmentData: Partial<TeamMemberAssignment>): Promise<TeamMemberAssignment>;
    
    // Badge System
    createBadge(badgeData: Partial<LaborHelperBadge>): Promise<LaborHelperBadge>;
    awardBadge(helperId: string, badgeId: string, awardedById?: string, awardReason?: string): Promise<HelperEarnedBadge>;
    setFeaturedBadge(earnedBadgeId: string, isFeatured: boolean): Promise<HelperEarnedBadge>;
    
    // Search and Discovery
    searchHelpers(filters: {
        skillIds?: string[];
        skillCategoryIds?: string[];
        verificationLevel?: LaborHelper['verificationLevel'];
        locationZip?: string;
        radiusMiles?: number;
        availability?: {
            dayOfWeek: number;
            startTime: string;
            endTime: string;
        }[];
        minRating?: number;
        hasTransportation?: boolean;
        hasTools?: boolean;
        rateRange?: {
            min?: number;
            max?: number;
        };
        completedJobsMin?: number;
        badges?: string[];
    }): Promise<LaborHelper[]>;
    
    getAvailableHelpers(jobPostId: string): Promise<LaborHelper[]>;
    recommendHelpers(jobPostId: string, count?: number): Promise<LaborHelper[]>;
    getRecommendedJobs(helperId: string, count?: number): Promise<LaborJobPost[]>;
    
    // Analytics and Reporting
    getHelperAnalytics(helperId: string): Promise<{
        totalEarnings: number;
        averageRating: number;
        completionRate: number;
        totalHours: number;
        topSkills: {
            skillName: string;
            jobCount: number;
        }[];
        jobsOverTime: {
            period: string;
            count: number;
        }[];
    }>;
    
    getClientAnalytics(clientId: string): Promise<{
        totalSpent: number;
        helperCount: number;
        jobPostCount: number;
        assignmentCount: number;
        averageRating: number;
        jobsByCategory: {
            category: string;
            count: number;
        }[];
    }>;
}
