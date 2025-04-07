# Project Domain Storage Guide

This document provides implementation details for storage operations in the Project Management domain.

## Primary Storage Bucket

The Project domain owns and manages the `project-media` bucket, which stores all project-related media and documents.

## Access Patterns

The project domain follows these access patterns for storage:

- **PROJECT_PARTICIPANTS**: Homeowners and assigned contractors can access project media
- **CONTRACTOR_ONLY**: Some technical documents are only accessible to contractors
- **HOMEOWNER_ONLY**: Some sensitive documents are only accessible to homeowners
- **ADMIN_ONLY**: Administrative documents are only accessible to system administrators

## Path Conventions

All project storage follows these path conventions:

- Project Photos: `project-media/projects/{projectId}/photos/{timestamp}-{filename}`
- Before/After Images: `project-media/projects/{projectId}/before-after/{timestamp}-{filename}`
- Project Documents: `project-media/projects/{projectId}/documents/{documentType}/{timestamp}-{filename}`
- Project Specifications: `project-media/projects/{projectId}/specifications/{timestamp}-{filename}`
- Project Plans: `project-media/projects/{projectId}/plans/{timestamp}-{filename}`
- Inspection Images: `project-media/projects/{projectId}/inspections/{inspectionId}/{timestamp}-{filename}`

## Business Rules

The project domain enforces these storage-related business rules:

1. **Phase-Specific Storage**: Some categories are only available during specific project phases
   - Example: Completion photos can only be uploaded during the completion phase

2. **File Count Limits**: Maximum number of files per category
   - Photos: 50 per project
   - Documents: 30 per project
   - Specifications: 10 per project

3. **File Type Restrictions**:
   - Photos: jpg, png, gif, webp only
   - Documents: pdf, docx, doc only
   - Specifications: pdf, docx, xlsx only

4. **File Size Limits**:
   - Photos: Maximum 10MB per file
   - Documents: Maximum 20MB per file

5. **Retention Policy**:
   - Project media retained for 7 years after project completion
   - Automatically archived after 2 years of inactivity

## Implementation in Sandwich Architecture

The Project Storage Service implements the sandwich architecture pattern:

### Guard Layer (Top Bread)

```typescript
// Permission validation
const validateProjectAccess = (projectId: string, userId: string): void => {
  // Check if user has access to this project
  if (!hasProjectAccess(projectId, userId)) {
    throw new StoragePermissionError(
      `User ${userId} does not have access to project ${projectId}`
    );
  }
};

// File validation
const validateFileUpload = (file: File, category: string): void => {
  // Validate file type
  if (!isPermittedFileType(file.type, category)) {
    throw new StorageValidationError(
      `File type ${file.type} is not permitted for ${category}`
    );
  }
  
  // Validate file size
  if (file.size > getMaxFileSizeForCategory(category)) {
    throw new StorageValidationError(
      `File size ${file.size} exceeds maximum allowed for ${category}`
    );
  }
};
```

### Domain Layer (Filling)

```typescript
// Business rule application
const applyStorageBusinessRules = async (params: UploadParams): Promise<void> => {
  const { projectId, file, category } = params;
  
  // Check project phase for phase-specific categories
  if (isPhaseSpecificCategory(category)) {
    const currentPhase = await getProjectPhase(projectId);
    if (!canUploadToPhase(category, currentPhase)) {
      throw new BusinessRuleError(
        `Cannot upload to ${category} during ${currentPhase} phase`
      );
    }
  }
  
  // Check file count limits
  const currentCount = await getFileCountForCategory(projectId, category);
  const maxAllowed = getMaxFilesForCategory(category);
  
  if (currentCount >= maxAllowed) {
    throw new BusinessRuleError(
      `Maximum number of files (${maxAllowed}) reached for ${category}`
    );
  }
};
```

### Persistence Layer (Bottom Bread)

```typescript
// Storage operations
const uploadProjectFile = async (params: UploadParams): Promise<string> => {
  const { projectId, file, category } = params;
  
  // Construct path according to conventions
  const path = constructStoragePath(projectId, category, file.name);
  
  // Perform upload
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.PROJECT_MEDIA)
    .upload(path, file);
  
  if (error) {
    throw new StorageOperationError('Failed to upload file', error);
  }
  
  // Return access URL
  return getPublicUrl(STORAGE_BUCKETS.PROJECT_MEDIA, path);
};
```

## Cross-Domain Access

The Project domain provides these storage access intents to other domains:

1. `getProjectMediaUrl`: Provides public URL for project media files
   ```typescript
   // Intent handler
   const handleGetProjectMediaUrl = async (params) => {
     const { projectId, category, fileName, requestingDomain } = params;
     
     // Validate access from requesting domain
     validateDomainAccess(requestingDomain, projectId);
     
     // Return the URL
     return getProjectMediaUrl(projectId, category, fileName);
   };
   ```

2. `listProjectMedia`: Lists available files in a project category
   ```typescript
   // Intent handler
   const handleListProjectMedia = async (params) => {
     const { projectId, category, requestingDomain } = params;
     
     // Validate access from requesting domain
     validateDomainAccess(requestingDomain, projectId);
     
     // Return the file list
     return listProjectMediaFiles(projectId, category);
   };
   ```

## Storage Events

The Project domain publishes these events related to storage:

1. `project.media.uploaded`: When new media is uploaded
   ```typescript
   // Event data
   {
     projectId: string;
     category: string;
     fileName: string;
     uploadedBy: string;
     fileSize: number;
     fileType: string;
     mediaUrl: string;
     timestamp: string;
   }
   ```

2. `project.media.deleted`: When media is deleted
   ```typescript
   // Event data
   {
     projectId: string;
     category: string;
     fileName: string;
     deletedBy: string;
     timestamp: string;
   }
   ```

## Supabase Storage Implementation

The Project domain uses Supabase Storage with these settings:

1. Bucket Configuration:
   ```javascript
   const createProjectMediaBucket = async () => {
     const { data, error } = await supabase.storage.createBucket('project-media', {
       public: false,
       fileSizeLimit: 20971520, // 20MB max file size
       allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.*']
     });
     
     if (error) {
       console.error('Error creating project-media bucket:', error);
     } else {
       console.log('Created project-media bucket:', data);
     }
   };
   ```

2. RLS Policies:
   ```sql
   -- Allow project participants to read
   CREATE POLICY "Project participants can view project media"
   ON storage.objects FOR SELECT
   USING (
     bucket_id = 'project-media' AND
     EXISTS (
       SELECT 1 FROM projects p
       JOIN project_participants pp ON p.id = pp.project_id
       WHERE 
         (storage.foldername(name))[1] = 'projects' AND
         (storage.foldername(name))[2] = p.id::text AND
         pp.user_id = auth.uid()
     )
   );
   
   -- Allow project owners to insert
   CREATE POLICY "Project owners can upload project media"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'project-media' AND
     EXISTS (
       SELECT 1 FROM projects p
       WHERE 
         (storage.foldername(name))[1] = 'projects' AND
         (storage.foldername(name))[2] = p.id::text AND
         p.owner_id = auth.uid()
     )
   );
