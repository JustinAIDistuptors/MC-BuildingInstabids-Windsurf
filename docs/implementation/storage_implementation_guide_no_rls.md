# InstaBids Storage Implementation (No RLS Version)

This document provides an overview of the InstaBids storage implementation without Row Level Security (RLS), following the Domain-Driven Agent Architecture (DDAA) and sandwich pattern.

## Important Note

This implementation has been configured without Row Level Security (RLS) policies. Instead, all access control and permission checks are handled programmatically at the application level through the Guard layer of each domain's sandwich architecture.

## Overview

The storage implementation for InstaBids uses Supabase Storage as its backend and implements a comprehensive domain-specific approach where each domain owns and manages its own storage buckets, with cross-domain access occurring through intent-based messaging.

## Architecture Without RLS

Since we're not using RLS policies, the sandwich architecture becomes even more important:

1. **Guard Layer (Top Bread)**
   - Handles **ALL** permission and access control logic
   - Validates users can access specific storage resources
   - Ensures file types and sizes are within limits
   - Performs explicit authorization checks before storage operations

2. **Domain Logic Layer (Filling)**
   - Implements domain-specific business rules
   - Manages storage-related workflows
   - Coordinates cross-domain storage access

3. **Persistence Layer (Bottom Bread)**
   - Handles basic storage operations via Supabase
   - Constructs storage paths following conventions
   - Manages storage metadata

## Key Components

The implementation includes:

1. **Shared Constants** (`src/shared/constants/storage.ts`)
   - Centralized definition of all buckets, paths, and file constraints

2. **Domain-Specific Storage Services**
   - Project domain implemented as reference: `src/domains/project/services/project-storage-service.ts`
   - Other domains to follow the same pattern
   - **Authorization handled in Guard layer without RLS**

3. **Documentation**
   - Central storage reference: `overwatch-memory/storage_bucket_reference.md`
   - Domain-specific guides: `docs/storage/storage_project_domain.md`
   - Domain agent examples: `docs/architecture/ddaa/project_agent_prompt_example.md`

4. **Utility Scripts**
   - Bucket creation: `scripts/create-storage-buckets.js`
   - Environment verification: `scripts/verify-environment-setup.js`

## Buckets and Domains

Each domain owns specific storage buckets:

| Domain | Primary Bucket | Purpose |
|--------|---------------|---------|
| User | `user-assets` | User profiles, verification documents |
| Project | `project-media` | Project photos, documents, specifications |
| Bidding | `bid-attachments` | Bid proposals, specifications, quotes |
| Contracts | `contracts-legal` | Legal agreements, contracts, receipts |
| Messaging | `messaging-attachments` | Files shared in conversations |
| Property | `property-documents` | Property plans, surveys, documents |
| Verification | `verification-documents` | Identity verification documents |

## Security Without RLS

Since RLS is not being used, security is enforced through:

1. **Explicit Guard Layer Checks**
   ```typescript
   // Example of programmatic access control in the Guard Layer
   private validateProjectAccess(userId: string, projectId: string): void {
     // Query database to check if user has access to this project
     const hasAccess = this.projectAccessService.checkAccess(userId, projectId);
     
     if (!hasAccess) {
       throw new StoragePermissionError(
         `User ${userId} does not have access to project ${projectId}`
       );
     }
   }
   ```

2. **Service Key Use**
   - Application uses service role keys for storage operations
   - All authorization logic must be in the application code
   - No reliance on database-level permissions

3. **Domain Boundary Enforcement**
   - Each domain is responsible for its own bucket
   - Cross-domain access happens via explicit Intent interfaces
   - Never allow direct bucket access across domains

## Setup and Usage

### Initial Setup

1. Create the necessary environment variables in `.env`:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key  # Important for no-RLS setup
   PROJECT_ID=your-project-id
   ```

2. Run the environment verification script:
   ```
   node scripts/verify-environment-setup.js
   ```

3. Create the required storage buckets:
   ```
   node scripts/create-storage-buckets.js
   ```

### Implementing Domain Storage Services

To implement storage for a new domain:

1. Create the domain-specific storage service following the Project domain as an example
2. Implement comprehensive access control in the Guard layer
3. Create a domain-specific storage guide document
4. Update the domain agent prompt to include storage information
5. Implement unit and integration tests with security focus
6. Update the storage implementation checklist

### Using Storage Services

Example usage in domain code:

```typescript
// Initialize the storage service
const projectStorage = new ProjectStorageService({
  currentUser: { id: 'user-123', role: 'contractor' },
  projectId: 'project-456'
});

// Upload a file (using the sandwich pattern internally)
// Guard layer will check access permissions programmatically
const fileUrl = await projectStorage.uploadProjectFile({
  file: myFile,
  category: 'photos',
  metadata: { description: 'Kitchen before renovation' }
});

// List files
const photoFiles = await projectStorage.listProjectFiles('photos');
```

## Cross-Domain Storage Access

Storage access across domains should use the intent pattern:

```typescript
// Intent request from Project domain to User domain
const profileImage = await userAgent.fulfillIntent('getUserProfileImage', {
  userId: 'user-123',
  requestingDomain: 'project'
});
```

## Implementation Status

The foundational components are now complete, and the Project domain has been implemented as a reference. See the `storage_implementation_checklist.md` file for a detailed status of all components.

## Next Steps

1. Complete the remaining domain storage services
2. Ensure comprehensive access control in each domain's Guard layer
3. Create and run tests focused on authorization and security
4. Implement cross-domain integration tests
5. Complete domain agent implementations

## Security Considerations Without RLS

Since we're not using RLS, pay special attention to:

1. **Always validate user permissions** before any storage operation
2. **Never trust client input** for bucket or file paths
3. **Sanitize all filenames and paths** to prevent injection
4. **Implement comprehensive logging** for audit purposes
5. **Regularly test access control logic** against security breaches
6. **Use service role with caution** - it bypasses database security

## Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Domain-Driven Agent Architecture](docs/architecture/ddaa/README.md)
- [Storage Implementation Checklist](docs/implementation/storage_implementation_checklist.md)
