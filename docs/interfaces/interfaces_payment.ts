import { User, Address } from './interfaces_core.js';
import { Project, ProjectMilestone } from './interfaces_project_management.js';

/**
 * Represents a payment method stored in the system.
 */
export interface PaymentMethod {
    id: string;
    userId: string;
    paymentType: 'credit_card' | 'debit_card' | 'bank_account' | 'paypal' | 'stripe' | 'apple_pay' | 'google_pay' | 'venmo' | 'zelle';
    isDefault: boolean;
    name?: string; // Display name like "Personal Checking" or "Work Credit Card"
    lastFour?: string; // Last 4 digits of card or account
    expiryMonth?: number; // For cards
    expiryYear?: number; // For cards
    cardBrand?: string; // For cards: visa, mastercard, amex, etc.
    billingAddressId?: string;
    billingAddress?: Address;
    processorToken?: string; // Token from payment processor for this method
    processorCustomerId?: string; // Customer ID from processor
    isVerified: boolean;
    verificationMethod?: string;
    isActive: boolean;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    metadata?: Record<string, any>;
}

/**
 * Represents a type of payment transaction with associated fee structure.
 */
export interface PaymentTransactionType {
    id: string;
    typeCode: string;
    name: string;
    description?: string;
    direction: 'in' | 'out' | 'internal';
    feePercentage?: number;
    fixedFee?: number;
    minFee?: number;
    maxFee?: number;
    taxRate?: number;
    isActive: boolean;
    requiresApproval: boolean;
    approvalThreshold?: number;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a payment transaction in the system.
 */
export interface PaymentTransaction {
    id: string;
    userId: string;
    transactionTypeId: string;
    transactionType?: PaymentTransactionType;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partially_refunded' | 'disputed' | 'canceled';
    paymentMethodId?: string;
    paymentMethod?: PaymentMethod;
    referenceNumber?: string;
    description?: string;
    processor: string; // Payment processor used: stripe, paypal, etc.
    processorTransactionId?: string;
    processorFee?: number;
    platformFee?: number;
    taxAmount?: number;
    netAmount: number;
    relatedEntityType?: string;
    relatedEntityId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    invoiceUrl?: string;
    receiptUrl?: string;
    errorMessage?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
    completedAt?: string; // ISO-8601
}

/**
 * Represents a fee configuration for different transaction types.
 */
export interface FeeConfiguration {
    id: string;
    name: string;
    description?: string;
    feeType: 'connection_fee' | 'milestone_payment' | 'subscription' | 'featured_listing' | 'priority_placement' | 'withdraw';
    calculationMethod: 'percentage' | 'fixed' | 'tiered_percentage' | 'tiered_fixed' | 'hybrid';
    percentageRate?: number;
    fixedAmount?: number;
    minAmount?: number;
    maxAmount?: number;
    tierConfig?: Record<string, any>;
    isActive: boolean;
    appliesToUserType?: string; // homeowner, contractor, property_manager, etc.
    appliesToSubscriptionTier?: string; // basic, pro, premium, etc.
    effectiveFrom: string; // ISO-8601
    effectiveTo?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an escrow account for a user.
 */
export interface EscrowAccount {
    id: string;
    userId: string;
    accountNumber: string;
    currentBalance: number;
    pendingBalance: number;
    currency: string;
    status: 'active' | 'suspended' | 'closed';
    lastActivityAt?: string; // ISO-8601
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a transaction in an escrow account.
 */
export interface EscrowTransaction {
    id: string;
    escrowAccountId: string;
    escrowAccount?: EscrowAccount;
    transactionType: 'deposit' | 'withdrawal' | 'milestone_hold' | 'milestone_release' | 'refund' | 'adjustment';
    amount: number;
    currency: string;
    paymentTransactionId?: string;
    paymentTransaction?: PaymentTransaction;
    projectId?: string;
    project?: Project;
    milestoneId?: string;
    milestone?: ProjectMilestone;
    previousBalance: number;
    newBalance: number;
    status: 'pending' | 'completed' | 'failed' | 'reversed';
    description?: string;
    metadata?: Record<string, any>;
    createdAt: string; // ISO-8601
    completedAt?: string; // ISO-8601
}

/**
 * Represents a payment for a project milestone.
 */
export interface MilestonePayment {
    id: string;
    projectId: string;
    project?: Project;
    milestoneId: string;
    milestone?: ProjectMilestone;
    payerId: string; // Homeowner
    payer?: User;
    payeeId: string; // Contractor
    payee?: User;
    amount: number;
    status: 'pending' | 'funded' | 'released' | 'refunded' | 'disputed' | 'canceled';
    escrowTransactionId?: string;
    escrowTransaction?: EscrowTransaction;
    paymentTransactionId?: string;
    paymentTransaction?: PaymentTransaction;
    releaseConditions?: string;
    scheduledReleaseDate?: string; // ISO-8601
    actualReleaseDate?: string; // ISO-8601
    releaseAuthorizedById?: string;
    releaseAuthorizedBy?: User;
    releaseTrigger?: 'manual' | 'automatic' | 'milestone_completion' | 'dispute_resolution' | 'system';
    metadata?: Record<string, any>;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a dispute related to a payment or milestone.
 */
export interface PaymentDispute {
    id: string;
    transactionId?: string;
    transaction?: PaymentTransaction;
    milestonePaymentId?: string;
    milestonePayment?: MilestonePayment;
    disputedById: string;
    disputedBy?: User;
    disputeType: 'milestone_completion' | 'quality_issue' | 'scope_disagreement' | 'timeline_delay' | 'material_difference' | 'payment_amount' | 'other';
    disputeReason: string;
    status: 'opened' | 'under_review' | 'evidence_requested' | 'resolved_favor_payer' | 'resolved_favor_payee' | 'partially_resolved' | 'canceled' | 'escalated';
    evidenceSubmitted: boolean;
    evidenceUrls?: string[];
    resolutionDetails?: string;
    resolvedById?: string;
    resolvedBy?: User;
    resolvedAt?: string; // ISO-8601
    resolutionAmount?: number;
    messages?: PaymentDisputeMessage[];
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a message in a payment dispute.
 */
export interface PaymentDisputeMessage {
    id: string;
    disputeId: string;
    senderId: string;
    sender?: User;
    senderType: 'homeowner' | 'contractor' | 'admin' | 'system';
    message: string;
    mediaUrls?: string[];
    createdAt: string; // ISO-8601
    isInternal: boolean; // For admin/system notes
}

/**
 * Represents a payment schedule for a project.
 */
export interface PaymentSchedule {
    id: string;
    projectId: string;
    project?: Project;
    createdById: string;
    createdBy?: User;
    name: string;
    description?: string;
    status: 'draft' | 'active' | 'completed' | 'canceled';
    totalAmount: number;
    currency: string;
    items?: PaymentScheduleItem[];
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an item in a payment schedule.
 */
export interface PaymentScheduleItem {
    id: string;
    scheduleId: string;
    schedule?: PaymentSchedule;
    milestoneId?: string;
    milestone?: ProjectMilestone;
    amount: number;
    dueDate?: string; // ISO-8601
    paymentTrigger?: 'date' | 'milestone_completion' | 'manual' | 'project_start' | 'project_completion';
    status: 'pending' | 'due' | 'paid' | 'overdue' | 'canceled';
    milestonePaymentId?: string;
    milestonePayment?: MilestonePayment;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a subscription plan available in the system.
 */
export interface SubscriptionPlan {
    id: string;
    name: string;
    description?: string;
    userType: 'contractor' | 'homeowner' | 'property_manager';
    tier: 'basic' | 'pro' | 'premium' | 'enterprise';
    price: number;
    billingInterval: 'monthly' | 'quarterly' | 'annual';
    discountPercentage?: number;
    features: Record<string, any>;
    isActive: boolean;
    maxProjects?: number;
    maxBids?: number;
    connectionFeeDiscount?: number;
    processorPlanId?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a user's subscription to a plan.
 */
export interface UserSubscription {
    id: string;
    userId: string;
    user?: User;
    subscriptionPlanId: string;
    subscriptionPlan?: SubscriptionPlan;
    status: 'active' | 'past_due' | 'canceled' | 'trialing' | 'paused';
    currentPeriodStart: string; // ISO-8601
    currentPeriodEnd: string; // ISO-8601
    cancelAtPeriodEnd: boolean;
    canceledAt?: string; // ISO-8601
    paymentMethodId?: string;
    paymentMethod?: PaymentMethod;
    processorSubscriptionId?: string;
    metadata?: Record<string, any>;
    invoices?: SubscriptionInvoice[];
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents an invoice for a subscription.
 */
export interface SubscriptionInvoice {
    id: string;
    userId: string;
    user?: User;
    subscriptionId: string;
    subscription?: UserSubscription;
    amount: number;
    status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
    dueDate: string; // ISO-8601
    paidAt?: string; // ISO-8601
    paymentTransactionId?: string;
    paymentTransaction?: PaymentTransaction;
    processorInvoiceId?: string;
    invoiceUrl?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a request to withdraw funds from an escrow account.
 */
export interface WithdrawalRequest {
    id: string;
    userId: string;
    user?: User;
    escrowAccountId: string;
    escrowAccount?: EscrowAccount;
    amount: number;
    status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected' | 'canceled';
    bankAccountId?: string;
    bankAccount?: PaymentMethod;
    processorTransferId?: string;
    feeAmount?: number;
    netAmount?: number;
    approvedById?: string;
    approvedBy?: User;
    approvedAt?: string; // ISO-8601
    completedAt?: string; // ISO-8601
    rejectionReason?: string;
    notes?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a promotion code for discounts or free services.
 */
export interface PromotionCode {
    id: string;
    code: string;
    description?: string;
    promotionType: 'discount_percentage' | 'discount_amount' | 'free_months' | 'waived_fee' | 'credit';
    value: number; // Percentage, amount, or number of months
    appliesTo: 'subscription' | 'connection_fee' | 'milestone_fee' | 'featured_listing';
    subscriptionPlanId?: string;
    subscriptionPlan?: SubscriptionPlan;
    maxUses?: number;
    currentUses: number;
    minPurchaseAmount?: number;
    startDate: string; // ISO-8601
    endDate?: string; // ISO-8601
    isActive: boolean;
    oneTimeUse: boolean;
    createdById?: string;
    createdBy?: User;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a user's use of a promotion code.
 */
export interface UserPromotionUse {
    id: string;
    userId: string;
    user?: User;
    promotionId: string;
    promotion?: PromotionCode;
    usedAt: string; // ISO-8601
    transactionId?: string;
    transaction?: PaymentTransaction;
    subscriptionId?: string;
    subscription?: UserSubscription;
    savingsAmount: number;
}

/**
 * Represents a tax rate for a specific region.
 */
export interface TaxRate {
    id: string;
    country: string; // ISO country code
    state?: string; // State/province if applicable
    postalCode?: string; // For more specific tax regions
    taxType: 'sales' | 'vat' | 'gst' | 'hst' | 'pst' | 'qst' | 'other';
    percentage: number;
    name: string;
    description?: string;
    effectiveFrom: string; // ISO-8601
    effectiveTo?: string; // ISO-8601
    isActive: boolean;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a batch of payouts to be processed.
 */
export interface PayoutBatch {
    id: string;
    batchNumber: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
    createdById?: string;
    createdBy?: User;
    processedById?: string;
    processedBy?: User;
    totalAmount: number;
    totalTransactions: number;
    successTransactions: number;
    failedTransactions: number;
    processor: string;
    processorBatchId?: string;
    startedAt?: string; // ISO-8601
    completedAt?: string; // ISO-8601
    errorMessage?: string;
    createdAt: string; // ISO-8601
    updatedAt: string; // ISO-8601
}

/**
 * Represents a user's payment account balance.
 */
export interface PaymentAccountBalance {
    id: string;
    userId: string;
    user?: User;
    balanceType: 'available' | 'pending' | 'reserved' | 'total';
    amount: number;
    currency: string;
    updatedAt: string; // ISO-8601
}

/**
 * Service interface for payment processing operations.
 */
export interface IPaymentService {
    // Payment methods
    createPaymentMethod(userId: string, paymentMethod: Partial<PaymentMethod>): Promise<PaymentMethod>;
    getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
    setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
    deletePaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
    
    // Transactions
    createTransaction(userId: string, transaction: Partial<PaymentTransaction>): Promise<PaymentTransaction>;
    getTransaction(transactionId: string): Promise<PaymentTransaction>;
    getUserTransactions(userId: string, filters?: Record<string, any>): Promise<PaymentTransaction[]>;
    refundTransaction(transactionId: string, amount?: number): Promise<PaymentTransaction>;
    
    // Escrow operations
    getEscrowAccount(userId: string): Promise<EscrowAccount>;
    getEscrowTransactions(userId: string, filters?: Record<string, any>): Promise<EscrowTransaction[]>;
    
    // Milestone payments
    createMilestonePayment(milestonePayment: Partial<MilestonePayment>): Promise<MilestonePayment>;
    releaseMilestonePayment(milestonePaymentId: string, userId: string): Promise<MilestonePayment>;
    disputeMilestonePayment(milestonePaymentId: string, dispute: Partial<PaymentDispute>): Promise<PaymentDispute>;
    
    // Subscription management
    createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<UserSubscription>;
    cancelSubscription(subscriptionId: string, cancelImmediately?: boolean): Promise<UserSubscription>;
    updateSubscription(subscriptionId: string, planId: string): Promise<UserSubscription>;
    getSubscription(userId: string): Promise<UserSubscription>;
    
    // Promotion codes
    validatePromotionCode(code: string, userId: string, appliesTo: string): Promise<PromotionCode>;
    applyPromotionCode(code: string, userId: string, entityId: string, entityType: string): Promise<UserPromotionUse>;
    
    // Withdrawal
    requestWithdrawal(userId: string, amount: number, bankAccountId: string): Promise<WithdrawalRequest>;
    getWithdrawalRequests(userId: string): Promise<WithdrawalRequest[]>;
    
    // Fee calculations
    calculateFees(amount: number, feeType: string, userType: string, tier?: string): Promise<Record<string, number>>;
    calculateTax(amount: number, countryCode: string, stateOrProvince?: string, postalCode?: string): Promise<number>;
}
