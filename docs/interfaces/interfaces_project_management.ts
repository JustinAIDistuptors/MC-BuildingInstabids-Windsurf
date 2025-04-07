import { User, Address, GeoLocation } from './interfaces_core.js';
import { BidCard, Bid } from './interfaces_bidding.js';

/**
 * Represents a project in the system.
 * Projects are created after a bid is accepted.
 */
export interface Project {
    id: string;
    homeownerId: string;
    contractorId: string;
    bidCardId: string;
    acceptedBidId: string;
    title: string;
    description?: string;
    status: 'planning' | 'scheduled' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled' | 'dispute';
    startDate?: string; // ISO-8601
    scheduledCompletionDate?: string; // ISO-8601
    actualCompletionDate?: string; // ISO-8601
    budget: number;
    finalCost?: number;
    isRush: boolean;
    hasMaterialDelivery: boolean;
    notes?: string;
    locationId?: string;
    isMultiPhase: boolean;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    projectManagerId?: string; // Assigned PM if applicable
    isManagedProperty: boolean;
    managedPropertyId?: string;
    hasScheduledPayments: boolean;
    hasEscrow: boolean;
    bidAcceptedAt: string; // ISO-8601
    currentPhaseId?: string;
    isPermitRequired: boolean;
    permitStatus?: 'not_required' | 'pending' | 'approved' | 'denied';
    permitDocumentUrls?: string[];
    lastStatusChangeAt?: string; // ISO-8601
    projectHealth: 'on_track' | 'at_risk' | 'delayed' | 'completed';
    homeownerFinalRating?: number;
    contractorFinalRating?: number;
    metadata?: Record<string, any>;
}

/**
 * Represents a phase within a multi-phase project.
 */
export interface ProjectPhase {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    phaseNumber: number;
    status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
    startDate?: string; // ISO-8601
    endDate?: string; // ISO-8601
    actualStartDate?: string; // ISO-8601
    actualEndDate?: string; // ISO-8601
    budget: number;
    finalCost?: number;
    dependsOnPhaseId?: string; // Previous phase that must be completed first
    completionPercentage: number;
    contractorId?: string; // Can be different from parent project
    notes?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a milestone in a project.
 */
export interface ProjectMilestone {
    id: string;
    projectId: string;
    phaseId?: string;
    title: string;
    description?: string;
    dueDate: string; // ISO-8601
    completedDate?: string; // ISO-8601
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
    isPaymentTrigger: boolean;
    paymentAmount?: number;
    paymentReleased?: boolean;
    paymentReleasedAt?: string; // ISO-8601
    requiresVerification: boolean;
    verifiedBy?: string; // User ID
    verifiedAt?: string; // ISO-8601
    verificationMethod?: 'photo' | 'inspection' | 'self_report';
    verificationResult?: 'pass' | 'fail' | 'pending_fix';
    mediaUrls?: string[];
    notifyOnComplete: boolean;
    notificationType?: 'email' | 'sms' | 'push' | 'all';
    order: number;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a task in a project.
 */
export interface ProjectTask {
    id: string;
    projectId: string;
    phaseId?: string;
    milestoneId?: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'critical';
    assignedTo?: string; // User ID
    assignedBy?: string; // User ID
    dueDate?: string; // ISO-8601
    estimatedHours?: number;
    actualHours?: number;
    completedAt?: string; // ISO-8601
    completedBy?: string; // User ID
    blockedReason?: string;
    dependsOn?: string[]; // Array of task IDs
    notifyOnComplete?: boolean;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents materials needed for a project.
 */
export interface ProjectMaterial {
    id: string;
    projectId: string;
    phaseId?: string;
    taskId?: string;
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    actualCost?: number;
    status: 'needed' | 'ordered' | 'delivered' | 'installed' | 'returned';
    supplier?: string;
    purchaseDate?: string; // ISO-8601
    deliveryDate?: string; // ISO-8601
    receivedDate?: string; // ISO-8601
    purchasedBy: string; // 'homeowner' or 'contractor'
    notes?: string;
    trackingNumber?: string;
    estimatedDeliveryWindow?: string;
    receiptUrl?: string;
    imageUrls?: string[];
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a status update for a project.
 */
export interface ProjectStatusUpdate {
    id: string;
    projectId: string;
    phaseId?: string;
    createdBy: string; // User ID
    userType: 'homeowner' | 'contractor' | 'project_manager' | 'admin';
    content: string;
    mediaUrls?: string[];
    status?: 'on_track' | 'at_risk' | 'delayed' | 'issue_identified' | 'resolved' | 'completed';
    isPublic: boolean; // Visible to both parties
    requiresResponse: boolean;
    responseDueBy?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an issue or problem in a project.
 */
export interface ProjectIssue {
    id: string;
    projectId: string;
    phaseId?: string;
    reportedBy: string; // User ID
    reporterType: 'homeowner' | 'contractor';
    title: string;
    description: string;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
    assignedTo?: string; // User ID
    mediaUrls?: string[];
    impactDescription?: string;
    resolutionPlan?: string;
    resolutionNotes?: string;
    resolvedAt?: string; // ISO-8601
    resolvedBy?: string; // User ID
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a schedule entry for a project.
 */
export interface ProjectSchedule {
    id: string;
    projectId: string;
    phaseId?: string;
    title: string;
    description?: string;
    startTime: string; // ISO-8601 with time
    endTime: string; // ISO-8601 with time
    isAllDay: boolean;
    isRecurring: boolean;
    recurringPattern?: string; // e.g., 'daily', 'weekly', 'biweekly', 'monthly'
    recurringDays?: number[]; // 0-6 (Sunday-Saturday)
    recurringEndDate?: string; // ISO-8601
    location?: string;
    notes?: string;
    requiresHomeownerPresence: boolean;
    requiresContractorPresence: boolean;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'rescheduled';
    previousScheduleId?: string;
    rescheduledReason?: string;
    createdBy: string; // User ID
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    calendarEventId?: string;
    reminderSent: boolean;
    reminderSentAt?: string; // ISO-8601
}

/**
 * Represents a daily log entry for a project.
 */
export interface ProjectDailyLog {
    id: string;
    projectId: string;
    phaseId?: string;
    createdBy: string; // User ID
    logDate: string; // ISO-8601 date
    workCompleted: string;
    hoursWorked?: number;
    workerCount?: number;
    weatherConditions?: string;
    temperature?: number;
    delaysEncountered?: string;
    materialsDelivered?: string;
    equipmentUsed?: string;
    visitorNotes?: string;
    safetyIncidents?: string;
    inspections?: string;
    generalNotes?: string;
    mediaUrls?: string[];
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a payment schedule for a project.
 */
export interface ProjectPaymentSchedule {
    id: string;
    projectId: string;
    name: string;
    description?: string;
    amount: number;
    dueDate?: string; // ISO-8601
    status: 'pending' | 'invoiced' | 'paid' | 'overdue' | 'cancelled';
    milestoneId?: string;
    invoiceUrl?: string;
    receiptUrl?: string;
    paymentMethod?: string;
    paymentDate?: string; // ISO-8601
    transactionId?: string;
    paidAmount?: number;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an inspection for a project.
 */
export interface ProjectInspection {
    id: string;
    projectId: string;
    phaseId?: string;
    inspectionType: 'internal' | 'city' | 'county' | 'third_party';
    scheduledDate?: string; // ISO-8601
    completedDate?: string; // ISO-8601
    inspectorName?: string;
    inspectorCompany?: string;
    inspectorContact?: string;
    status: 'scheduled' | 'passed' | 'failed' | 'rescheduled' | 'cancelled';
    result?: 'pass' | 'conditional_pass' | 'fail';
    notes?: string;
    reportUrl?: string;
    mediaUrls?: string[];
    followUpRequired: boolean;
    followUpDate?: string; // ISO-8601
    permitId?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a change order for a project.
 */
export interface ProjectChangeOrder {
    id: string;
    projectId: string;
    phaseId?: string;
    title: string;
    description: string;
    requestedBy: string; // User ID
    requestorType: 'homeowner' | 'contractor';
    status: 'requested' | 'in_review' | 'approved' | 'rejected' | 'completed';
    originalScope?: string;
    proposedScope?: string;
    costChange: number;
    timelineImpactDays: number;
    newCompletionDate?: string; // ISO-8601
    reason: string;
    approvedBy?: string; // User ID
    approvedAt?: string; // ISO-8601
    rejectedReason?: string;
    mediaUrls?: string[];
    signatureRequired: boolean;
    signedByHomeowner: boolean;
    signedByContractor: boolean;
    homeownerSignatureUrl?: string;
    contractorSignatureUrl?: string;
    homeownerSignedAt?: string; // ISO-8601
    contractorSignedAt?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a contract document for a project.
 */
export interface ProjectContract {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    documentUrl: string;
    documentType: 'contract' | 'proposal' | 'addendum' | 'change_order' | 'warranty' | 'other';
    versionNumber: number;
    status: 'draft' | 'sent' | 'signed' | 'rejected' | 'expired';
    createdBy: string; // User ID
    createdAt: string; // ISO-8601
    expiresAt?: string; // ISO-8601
    signedByHomeowner: boolean;
    signedByContractor: boolean;
    homeownerSignatureUrl?: string;
    contractorSignatureUrl?: string;
    homeownerSignedAt?: string; // ISO-8601
    contractorSignedAt?: string; // ISO-8601
    rejectionReason?: string;
    templates?: string[];
    updatedAt: string; // ISO-8601
}

/**
 * Represents a warranty for a completed project.
 */
export interface ProjectWarranty {
    id: string;
    projectId: string;
    title: string;
    description: string;
    warrantyType: 'labor' | 'materials' | 'both' | 'limited' | 'manufacturer';
    startDate: string; // ISO-8601
    endDate: string; // ISO-8601
    documentUrl?: string;
    terms: string;
    issuedBy: string; // User ID
    coverageDetails: string;
    exclusions?: string;
    claimInstructions?: string;
    transferred: boolean;
    transferredTo?: string; // User ID
    transferredAt?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a warranty claim for a project.
 */
export interface WarrantyClaim {
    id: string;
    warrantyId: string;
    projectId: string;
    claimNumber: string;
    title: string;
    description: string;
    status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'work_scheduled' | 'work_completed' | 'closed';
    submittedBy: string; // User ID
    submittedAt: string; // ISO-8601
    mediaUrls?: string[];
    inspectionRequired: boolean;
    inspectionDate?: string; // ISO-8601
    inspectionNotes?: string;
    approvedBy?: string; // User ID
    approvedAt?: string; // ISO-8601
    rejectionReason?: string;
    scheduledWorkDate?: string; // ISO-8601
    completedWorkDate?: string; // ISO-8601
    completionNotes?: string;
    closedAt?: string; // ISO-8601
    updatedAt: string; // ISO-8601
}
