# Bidding Domain Storage Guide

This document provides implementation details for storage operations in the Bidding domain.

## Primary Storage Bucket

The Bidding domain owns and manages the `bid-attachments` bucket, which stores all bid-related media and documents including proposals, specifications, cost breakdowns, and supplementary materials.

## Access Patterns

The Bidding domain follows these access patterns for storage:

- **BID_CREATOR_ONLY**: Contractors can only access their own bid attachments
- **BID_RECIPIENT_ONLY**: Homeowners can only access bids submitted for their projects
- **BID_PARTICIPANTS**: Both the contractor who submitted the bid and the homeowner who received it
- **ADMIN_ONLY**: Administrative documents are only accessible by system administrators

## Path Conventions

All bidding storage follows these path conventions:

- Bid Proposals: `bid-attachments/bids/{bidId}/proposals/{timestamp}-{filename}`
- Bid Specifications: `bid-attachments/bids/{bidId}/specifications/{timestamp}-{filename}`
- Cost Breakdowns: `bid-attachments/bids/{bidId}/costs/{timestamp}-{filename}`
- Timeline Documents: `bid-attachments/bids/{bidId}/timelines/{timestamp}-{filename}`
- Reference Images: `bid-attachments/bids/{bidId}/references/{timestamp}-{filename}`
- Bid Card Images: `bid-attachments/bid-cards/{bidCardId}/images/{timestamp}-{filename}`
- Bid Card Documents: `bid-attachments/bid-cards/{bidCardId}/documents/{timestamp}-{filename}`

## Business Rules

The Bidding domain enforces these storage-related business rules:

1. **File Type Restrictions by Category**
   - Proposals: PDF, DOCX only
   - Specifications: PDF, DOCX, XLSX
   - Cost Breakdowns: PDF, XLSX only
   - Timeline Documents: PDF, DOCX, XLSX, MPP (Microsoft Project)
   - Reference Images: JPEG, PNG, WebP only

2. **File Size Limits**
   - Images: Maximum 5MB per file
   - Documents: Maximum 10MB per file
   - Combined bid attachments: Maximum 50MB per bid

3. **Bid Card Requirements**
   - At least one reference image required for bid cards
   - Maximum 10 images per bid card
   - Maximum 5 documents per bid card

4. **Access Control**
   - Contractors can only see their own bids
   - Homeowners can only see bids for their projects
   - Admins can access all bids for moderation purposes

5. **Bid Revision Tracking**
   - Original files are never deleted when revised
   - New versions are stored with a version identifier
   - A complete history of all attachments is maintained

6. **Retention Policy**
   - Winning bid attachments retained for 7 years
   - Rejected bid attachments retained for 1 year
   - Expired bid attachments retained for 6 months
   - Automatically archived after retention period

## Implementation in Sandwich Architecture

The Bidding Storage Service implements the sandwich architecture pattern:

### Guard Layer (Top Bread)

```typescript
// Permission validation
const validateBidAccess = (bidId: string, userId: string, userRole: string): void => {
  // Get bid information to determine ownership/participation
  const bidInfo = getBidInfo(bidId);
  
  if (!bidInfo) {
    throw new NotFoundError('Bid not found');
  }
  
  // Admins have access to all bids
  if (userRole === 'admin') {
    return;
  }
  
  // Contractors can access their own bids
  if (userRole === 'contractor' && bidInfo.contractorId === userId) {
    return;
  }
  
  // Homeowners can access bids for their projects
  if (userRole === 'homeowner' && bidInfo.homeownerId === userId) {
    return;
  }
  
  throw new StoragePermissionError(
    `User ${userId} does not have access to bid ${bidId}`
  );
};

// File validation
const validateBidAttachment = (file: File, category: string): void => {
  // Validate file type based on category
  const allowedTypes = getBidCategoryAllowedTypes(category);
  if (!allowedTypes.includes(file.type)) {
    throw new StorageValidationError(
      `File type ${file.type} is not permitted for ${category}. Allowed types: ${allowedTypes.join(', ')}`
    );
  }
  
  // Validate file size based on category
  const maxSize = getBidCategoryMaxSize(category);
  if (file.size > maxSize) {
    throw new StorageValidationError(
      `File size (${(file.size / 1024 / 1024).toFixed(2)} MB) exceeds maximum allowed for ${category} (${maxSize / 1024 / 1024} MB)`
    );
  }
};
```

### Domain Layer (Filling)

```typescript
// Business rule application
const uploadBidProposal = async (params: UploadBidProposalParams): Promise<string> => {
  const { bidId, file, version } = params;
  
  // Apply business rules
  await checkBidStatus(bidId, ['draft', 'revision_requested']);
  
  // Check total bid size
  await enforceMaxBidSize(bidId, file.size);
  
  // Upload file with versioning
  const path = await storeBidFile(bidId, 'proposals', file, version);
  
  // Record in bid_attachments table
  await recordBidAttachment({
    bidId,
    category: 'proposal',
    filePath: path,
    fileSize: file.size,
    fileType: file.type,
    version
  });
  
  // Publish event
  await eventBus.publish('bid.proposal.uploaded', {
    bidId,
    filePath: path,
    version,
    timestamp: new Date().toISOString()
  });
  
  return getFileUrl(STORAGE_BUCKETS.BID_ATTACHMENTS, path);
};
```

### Persistence Layer (Bottom Bread)

```typescript
// Storage operations
const storeBidFile = async (
  bidId: string, 
  category: string, 
  file: File, 
  version: number
): Promise<string> => {
  // Generate a unique filename with timestamp and version
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  const fileExt = file.name.split('.').pop();
  const fileName = `${timestamp}-v${version}-${file.name}`;
  
  // Construct path according to conventions
  const path = `bids/${bidId}/${category}/${fileName}`;
  
  // Perform upload
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.BID_ATTACHMENTS)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false // Never overwrite existing files to maintain history
    });
  
  if (error) {
    throw new StorageOperationError('Failed to upload bid file', error);
  }
  
  return path;
};
```

## Cross-Domain Access

The Bidding domain provides these storage access intents to other domains:

1. `getBidAttachmentUrl`: Provides access to a bid attachment
   ```typescript
   // Intent handler
   const handleGetBidAttachmentIntent = async (params) => {
     const { bidId, attachmentId, requestingDomain } = params;
     
     // Validate requesting domain access
     validateDomainAccess(requestingDomain, 'bid_attachments');
     
     // Find the attachment
     const attachment = await bidAttachmentRepository.findById(attachmentId);
     
     if (!attachment || attachment.bidId !== bidId) {
       throw new NotFoundError('Bid attachment not found');
     }
     
     // Verify access based on the domain
     if (requestingDomain === 'project' && attachment.category === 'proposal') {
       // Project domain can access proposals for accepted bids
       const bid = await bidRepository.findById(bidId);
       if (bid.status !== 'accepted') {
         throw new AccessDeniedError('Cannot access attachment for non-accepted bid');
       }
     }
     
     // Return the URL
     return getFileUrl(STORAGE_BUCKETS.BID_ATTACHMENTS, attachment.filePath);
   };
   ```

2. `getAcceptedBidAttachments`: Provides all attachments for an accepted bid
   ```typescript
   // Intent handler
   const handleGetAcceptedBidAttachmentsIntent = async (params) => {
     const { bidId, requestingDomain } = params;
     
     // Validate the bid is accepted
     const bid = await bidRepository.findById(bidId);
     
     if (!bid || bid.status !== 'accepted') {
       throw new AccessDeniedError('Bid is not accepted');
     }
     
     // Get all attachments
     const attachments = await bidAttachmentRepository.findByBidId(bidId);
     
     // Return URLs for all attachments
     return attachments.map(attachment => ({
       id: attachment.id,
       category: attachment.category,
       fileName: attachment.fileName,
       fileType: attachment.fileType,
       fileSize: attachment.fileSize,
       url: getFileUrl(STORAGE_BUCKETS.BID_ATTACHMENTS, attachment.filePath)
     }));
   };
   ```

## Storage Events

The Bidding domain publishes these events related to storage:

1. `bid.attachment.uploaded`: When any bid attachment is uploaded
   ```typescript
   // Event data
   {
     bidId: string;
     attachmentId: string;
     category: string;
     filePath: string;
     version: number;
     timestamp: string;
   }
   ```

2. `bid.accepted.attachments`: When a bid is accepted
   ```typescript
   // Event data
   {
     bidId: string;
     projectId: string;
     attachments: Array<{
       id: string;
       category: string;
       filePath: string;
     }>;
     timestamp: string;
   }
   ```

## Implementation Notes

1. **Bid Versioning Flow**
   - Each bid attachment has a version number
   - When a homeowner requests revisions, new versions are uploaded
   - All versions are retained for audit and dispute resolution
   - The latest version is used for display by default

2. **Bid Card vs. Bid Attachments**
   - Bid cards are created by homeowners to solicit bids
   - Bid attachments are submitted by contractors in response
   - Different access patterns apply to each

3. **Accepted Bid Flow**
   - When a bid is accepted, key attachments are made available to the Project domain
   - This creates a seamless transition from bidding to project execution
   - Original files remain in the Bidding domain's bucket for audit

4. **Security Considerations**
   - Strictly enforce access control in the Guard layer
   - Validate all file types to prevent malicious uploads
   - Maintain clear ownership boundaries between homeowner and contractor files
   - Log all access to bid attachments for audit purposes
