# Payment Domain Storage Guide

This guide documents the storage implementation for the InstaBids Payment domain, which handles secure storage for payment-related documents including invoices, receipts, contracts, and financial records.

## Storage Overview

The Payment domain utilizes the Supabase Storage service for storing documents related to payments and project finances. It handles both payment-specific documents and project-level financial documents with appropriate access controls and business rules.

## Bucket Structure

### Primary Bucket: `contracts-legal`

This bucket stores all legal and financial documents related to payments and projects. It follows a logical hierarchical structure based on the relationships between entities:

```
contracts-legal/
├── payments/
│   └── {paymentId}/
│       ├── invoice/
│       │   └── {timestamp}-{filename}
│       ├── receipt/
│       │   └── {timestamp}-{filename}
│       ├── contract/
│       │   └── {timestamp}-{filename}
│       ├── statement/
│       │   └── {timestamp}-{filename}
│       ├── dispute/
│       │   └── {timestamp}-{filename}
│       └── other/
│           └── {timestamp}-{filename}
└── projects/
    └── {projectId}/
        └── financial/
            ├── estimate/
            │   └── {timestamp}-{filename}
            ├── quote/
            │   └── {timestamp}-{filename}
            ├── milestone/
            │   ├── {milestoneName}/
            │   │   └── {timestamp}-{filename}
            │   └── {timestamp}-{filename}
            ├── change_order/
            │   └── {timestamp}-{filename}
            └── other/
                └── {timestamp}-{filename}
```

## Access Patterns

The Payment domain implements these access patterns:

### Payment Participant Pattern
- Each user can only access payments they are involved in
- Homeowners can access documents for payments they make
- Contractors can access documents for payments they receive
- Admins and financial managers can access all payment documents

### Project Financial Access Pattern
- Project participants can access financial documents for their projects
- Role-based permissions determine which types of documents users can upload/view
- Contractors can upload estimates, quotes, and change orders
- Homeowners have limited ability to upload financial documents
- Financial managers have full access to all project financial documents

### Document Type Authorization Pattern
- Different user roles can only upload certain document types
- Contractors can upload invoices, contracts, and estimates
- Homeowners can upload receipts and dispute documents
- Document types are strictly validated and categorized

### Payment Status Enforcement Pattern
- Document operations are restricted based on payment status
- Critical documents (invoices, receipts) cannot be deleted once payment is processed
- Dispute documents can only be uploaded for certain payment statuses
- Completed payments have stricter access controls

## Business Rules

### Document Upload Rules

1. **User Authentication and Authorization**
   - Only authenticated users can upload documents
   - Users must be participants in the associated payment or project
   - Different roles have permissions for different document types

2. **File Validation**
   - File types are restricted based on document type:
     - Invoices, receipts, statements: pdf, docx, xlsx, jpg, png (max 10MB)
     - Contracts, disputes: pdf, docx only (max 25MB)
     - Estimates, quotes, change orders: pdf, docx, xlsx (max 10MB)
     - Other: multiple formats (max 15MB)

3. **Document Uniqueness**
   - Only one document of critical types (invoice, receipt, contract) allowed per payment
   - Existing documents must be deleted before uploading new ones

4. **Status-Based Restrictions**
   - No uploads to payments with status 'closed' or 'cancelled'
   - Dispute documents can only be uploaded for payments with status 'processing', 'held', or 'completed'
   - Estimates can only be uploaded for projects with status 'planning'
   - Change orders can only be uploaded for projects with status 'active'

### Document Deletion Rules

1. **User Authorization**
   - Only the original uploader or an admin can delete documents
   - Role-based restrictions apply to document type deletions
   - Critical documents cannot be deleted once payment is processed

2. **Status-Based Restrictions**
   - No deletions for payments with status 'completed', 'settled', or 'closed'
   - Receipts and invoices cannot be deleted for payments with status 'processing'

### Payment Completion Rules

1. **Document Requirements**
   - Certain document types (invoice, receipt) must exist before marking a payment as completed
   - Optional documents are verified as needed based on payment type
   - Only administrators, financial managers, or system processes can mark payments as completed

2. **Retention Policy**
   - Completed payments have different retention policies for documents
   - Completed payment documents are marked for longer-term retention
   - Retention metadata is updated during payment completion

## Path Conventions

### Payment Document Paths

All payment document paths follow this convention:
```
payments/{paymentId}/{documentType}/{timestamp}-{filename}
```

Where:
- `{paymentId}`: Unique identifier for the payment
- `{documentType}`: One of 'invoice', 'receipt', 'contract', 'statement', 'dispute', or 'other'
- `{timestamp}`: ISO date string with special characters removed
- `{filename}`: Original filename including extension

### Project Financial Document Paths

All project financial document paths follow this convention:
```
projects/{projectId}/financial/{documentType}[/{milestoneName}]/{timestamp}-{filename}
```

Where:
- `{projectId}`: Unique identifier for the project
- `{documentType}`: One of 'estimate', 'quote', 'milestone', 'change_order', or 'other'
- `{milestoneName}`: Optional identifier for milestone-specific documents
- `{timestamp}`: ISO date string with special characters removed
- `{filename}`: Original filename including extension

### Example Paths

```
payments/payment-123/invoice/20250315T123045Z-final-invoice.pdf
payments/payment-123/receipt/20250315T124530Z-payment-receipt.pdf
projects/project-789/financial/estimate/20250315T130012Z-initial-estimate.pdf
projects/project-789/financial/milestone/foundation/20250315T133045Z-foundation-complete.pdf
```

## Security Considerations

### Access Control

The Payment Storage Service follows the sandwich architecture pattern:

1. **Guard Layer (Top)**
   - Validates user authentication
   - Checks payment or project participation
   - Enforces role-based document type restrictions
   - Validates file types and sizes

2. **Domain Layer (Middle)**
   - Implements business rules
   - Enforces payment/project status rules
   - Manages document uniqueness requirements
   - Handles completion requirements

3. **Persistence Layer (Bottom)**
   - Handles actual storage operations
   - Generates unique paths
   - Manages upload/delete operations
   - Creates storage URLs

### Potential Vulnerabilities

1. **Path Traversal Attacks**
   - Prevented by not using user-supplied path components directly
   - All path segments are validated and sanitized

2. **Metadata Leakage**
   - Sensitive metadata is stripped from financial documents
   - Document metadata is stored separately from files

3. **Unauthorized Access**
   - All requests are validated through guard layer
   - Role-based access enforced for document types
   - Multiple validation steps before storage operations

## Integration Points

### Project Domain
- Project details and participant information
- Project status validation for document operations
- Financial document requirements for milestones

### User Domain
- User roles and permissions
- Authentication and authorization information
- User relationships to payments and projects

### Bidding Domain
- Bid details that may require financial documentation
- Conversion of bids to contracts with associated documents

### Milestone Domain
- Milestone-specific financial documents
- Payment linkage to project milestones

## Implementation Details

### Storage Service Pattern

The `PaymentStorageService` class implements:

```typescript
// Public methods (API)
uploadPaymentDocument(params)
uploadFinancialDocument(params)
getPaymentDocumentUrl(documentId)
getFinancialDocumentUrl(documentId)
listPaymentDocuments(paymentId)
listFinancialDocuments(projectId, documentType?)
deletePaymentDocument(documentId)
handlePaymentCompleted(paymentId)

// Private methods for implementation layers
// Guard Layer
validatePaymentAccess(paymentId)
validateProjectFinancialAccess(projectId)
validateDocumentFile(file, documentType)
validateUserPaymentDocumentAccess(documentType, isDelete)
validateUserFinancialDocumentAccess(documentType, isDelete)

// Domain Layer
getPaymentInfo(paymentId)
getProjectInfo(projectId)
validatePaymentStatus(paymentId, documentType, isDelete)
validateProjectStatus(projectId, documentType)
checkDuplicateDocumentType(paymentId, documentType)
checkRequiredDocuments(paymentId)
isProcessedPayment(payment)

// Persistence Layer
persistPaymentDocument(paymentId, documentType, file)
persistFinancialDocument(projectId, documentType, milestone, file)
getFileUrl(bucket, path)
```

## Error Handling

The Payment Storage Service defines and uses several error types:

- `StorageValidationError`: For file type/size validation errors
- `StoragePermissionError`: For access control violations
- `StorageBusinessRuleError`: For business rule violations
- `StorageOperationError`: For persistence layer failures
- `NotFoundError`: For resources that don't exist

Each error includes a descriptive message to aid in troubleshooting and client feedback.

## Testing Strategy

Testing the Payment Storage Service requires coverage of:

1. **Guard Layer Tests**
   - Access control validation
   - File validation
   - Role-based permission checks

2. **Domain Layer Tests**
   - Business rule enforcement
   - Status-based restrictions
   - Document uniqueness enforcement

3. **Persistence Layer Tests**
   - File uploads and downloads
   - Path generation
   - URL generation

4. **Integration Tests**
   - End-to-end document workflow
   - Cross-domain interactions
   - Payment completion process

## Examples

### Using the Storage Service

```typescript
// Create service with current user context
const paymentStorage = new PaymentStorageService({
  currentUser: {
    id: contractorId,
    role: 'contractor'
  }
});

// Upload an invoice
const invoiceUrl = await paymentStorage.uploadPaymentDocument({
  paymentId: 'payment-123',
  file: invoiceFile, // File object from input
  documentType: 'invoice',
  metadata: { invoiceNumber: 'INV-2025-001' }
});

// List all documents for a payment
const documents = await paymentStorage.listPaymentDocuments('payment-123');

// Get URL for a specific document
const documentUrl = await paymentStorage.getPaymentDocumentUrl('doc-456');

// Upload a project estimate
const estimateUrl = await paymentStorage.uploadFinancialDocument({
  projectId: 'project-789',
  file: estimateFile,
  documentType: 'estimate'
});

// Mark payment as completed
await paymentStorage.handlePaymentCompleted('payment-123');
