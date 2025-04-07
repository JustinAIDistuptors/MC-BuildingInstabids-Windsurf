# InstaBids Storage Implementation

This document provides an overview of the InstaBids storage implementation, which follows the Domain-Driven Agent Architecture (DDAA) and sandwich pattern.

## Overview

The storage implementation for InstaBids uses Supabase Storage as its backend and implements a comprehensive domain-specific approach where each domain owns and manages its own storage buckets, with cross-domain access occurring through intent-based messaging.

## Architecture

The storage implementation follows the sandwich architecture pattern:

1. **Guard Layer (Top Bread)**
   - Validates permissions and access rights
   - Ensures file types and sizes are within limits
   - Protects against unauthorized access

2. **Domain Logic Layer (Filling)**
   - Implements domain-specific business rules
   - Manages storage-related workflows
   - Coordinates cross-domain storage access

3. **Persistence Layer (Bottom Bread)**
   - Handles actual storage operations via Supabase
   - Constructs storage paths following conventions
   - Manages storage metadata

## Key Components

The implementation includes:

1. **Shared Constants** (`src/shared/constants/storage.ts`)
   - Centralized definition of all buckets, paths, and file constraints

2. **Domain-Specific Storage Services**
   - Project domain implemented as reference: `src/domains/project/services/project-storage-service.ts`
   - Other domains to follow the same pattern

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

## Setup and Usage

### Initial Setup

1. Create the necessary environment variables in `.env`:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key
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
2. Create a domain-specific storage guide document
3. Update the domain agent prompt to include storage information
4. Implement unit and integration tests
5. Update the storage implementation checklist

### Using Storage Services

Example usage in domain code:

```typescript
// Initialize the storage service
const projectStorage = new ProjectStorageService({
  currentUser: { id: 'user-123', role: 'contractor' },
  projectId: 'project-456'
});

// Upload a file (using the sandwich pattern internally)
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
2. Implement RLS policies for secure access
3. Create and run tests for each domain
4. Implement cross-domain integration tests
5. Complete domain agent implementations

## Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Domain-Driven Agent Architecture](docs/architecture/ddaa/README.md)
- [Storage Implementation Checklist](docs/implementation/storage_implementation_checklist.md)
