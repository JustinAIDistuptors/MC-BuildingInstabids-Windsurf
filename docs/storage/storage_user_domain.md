# User Domain Storage Guide

This document provides implementation details for storage operations in the User Management domain.

## Primary Storage Bucket

The User domain owns and manages the `user-assets` bucket, which stores user-related media and documents, including profile images, verification documents, and settings data.

## Access Patterns

The User domain follows these access patterns for storage:

- **PUBLIC_READ**: Profile images are publicly readable once approved
- **PRIVATE**: Verification documents are strictly private to the user and admins
- **ADMIN_ONLY**: Some sensitive user documents are only accessible by administrators

## Path Conventions

All user storage follows these path conventions:

- User Avatars: `user-assets/profiles/{userId}/avatar/{timestamp}-{filename}`
- User Covers: `user-assets/profiles/{userId}/cover/{timestamp}-{filename}`
- User Verification Documents: `verification-documents/users/{userId}/{documentType}/{timestamp}-{filename}`
- User Credentials: `verification-documents/users/{userId}/credentials/{credentialType}/{timestamp}-{filename}`
- User Signatures: `user-assets/profiles/{userId}/signatures/{timestamp}-{filename}`

## Business Rules

The User domain enforces these storage-related business rules:

1. **Avatar Requirements**
   - Maximum dimensions: 1024x1024 pixels
   - Minimum dimensions: 200x200 pixels
   - Formats: JPEG, PNG, WebP only
   - Maximum file size: 2MB

2. **Verification Document Requirements**
   - Document types: ID, license, certification, insurance, business registration
   - Formats: JPEG, PNG, PDF only
   - Maximum file size: 10MB per document
   - Required for contractor accounts

3. **Rate Limiting**
   - Users can upload a maximum of 5 profile images per day
   - Verification document uploads limited to 10 per day

4. **Content Moderation**
   - All profile images are subject to automated content screening
   - Administrator approval may be required for certain images

5. **Retention Policy**
   - Profile images retained indefinitely while account is active
   - Verification documents retained for 1 year after account closure
   - Automated deletion after retention period expires

## Implementation in Sandwich Architecture

The User Storage Service implements the sandwich architecture pattern:

### Guard Layer (Top Bread)

```typescript
// Permission validation
const validateUserAccess = (targetUserId: string, requestingUserId: string): void => {
  // Allow access to own resources
  if (targetUserId === requestingUserId) {
    return;
  }
  
  // Check if user has admin permissions
  if (isAdminUser(requestingUserId)) {
    return;
  }
  
  throw new StoragePermissionError(
    `User ${requestingUserId} does not have access to ${targetUserId}'s files`
  );
};

// File validation
const validateAvatarUpload = (file: File): void => {
  // Validate file type
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new StorageValidationError(
      `File type ${file.type} is not permitted for avatars`
    );
  }
  
  // Validate file size
  if (file.size > FILE_SIZE_LIMITS.avatar) {
    throw new StorageValidationError(
      `File size ${file.size} exceeds maximum allowed for avatars (${FILE_SIZE_LIMITS.avatar} bytes)`
    );
  }
  
  // Image dimensions validation would happen here in a real implementation
  // This would require reading the image data and checking dimensions
};
```

### Domain Layer (Filling)

```typescript
// Business rule application
const uploadUserAvatar = async (
  userId: string, 
  file: File,
  options?: { moderationBypass?: boolean }
): Promise<string> => {
  // Apply business rules
  await checkUserUploadQuota(userId, 'avatar');
  
  // Check if content moderation is required
  const requiresModeration = !options?.moderationBypass && requiresContentModeration(file);
  
  // Upload file
  const fileUrl = await userStorageRepository.uploadAvatar(userId, file);
  
  // Create record in user_profile_images table
  await userProfileRepository.addProfileImage({
    userId,
    imageUrl: fileUrl,
    status: requiresModeration ? 'pending_review' : 'active'
  });
  
  // If moderation is required, queue for review
  if (requiresModeration) {
    await moderationQueue.add({
      type: 'user_avatar',
      userId,
      fileUrl,
      timestamp: new Date()
    });
  }
  
  // Publish event
  await eventBus.publish('user.avatar.updated', {
    userId,
    avatarUrl: fileUrl,
    requiresModeration,
    timestamp: new Date()
  });
  
  return fileUrl;
};
```

### Persistence Layer (Bottom Bread)

```typescript
// Storage operations
const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  // Generate a unique filename with timestamp
  const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
  const fileExt = file.name.split('.').pop();
  const fileName = `${timestamp}-avatar.${fileExt}`;
  
  // Construct path according to conventions
  const path = STORAGE_PATHS.userAvatar(userId);
  
  // Perform upload
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.USER_ASSETS)
    .upload(`${path}/${fileName}`, file, {
      cacheControl: '3600',
      upsert: true
    });
  
  if (error) {
    throw new StorageOperationError('Failed to upload avatar', error);
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKETS.USER_ASSETS)
    .getPublicUrl(`${path}/${fileName}`);
  
  return urlData.publicUrl;
};
```

## Cross-Domain Access

The User domain provides these storage access intents to other domains:

1. `getUserAvatar`: Provides access to a user's avatar
   ```typescript
   // Intent handler
   const handleGetUserAvatar = async (params) => {
     const { userId, requestingDomain } = params;
     
     // No special permissions needed for avatars - they're public
     // Just log the access for auditing
     logger.info(`Domain ${requestingDomain} accessed avatar for user ${userId}`);
     
     // Return the avatar URL - construct from conventions
     return getUserAvatarUrl(userId);
   };
   ```

2. `getUserVerificationStatus`: Checks if a user has verified documents
   ```typescript
   // Intent handler
   const handleGetUserVerificationStatus = async (params) => {
     const { userId, verificationType, requestingDomain } = params;
     
     // Check if this domain is allowed to access verification status
     validateDomainAccess(requestingDomain, 'verification_status');
     
     // Return verification status - not the documents themselves
     return getUserVerificationStatus(userId, verificationType);
   };
   ```

## Storage Events

The User domain publishes these events related to storage:

1. `user.avatar.updated`: When a user uploads a new avatar
   ```typescript
   // Event data
   {
     userId: string;
     avatarUrl: string;
     requiresModeration: boolean;
     timestamp: string;
   }
   ```

2. `user.document.verified`: When a verification document is approved
   ```typescript
   // Event data
   {
     userId: string;
     documentType: string;
     verificationId: string;
     timestamp: string;
   }
   ```

## Implementation Notes

1. **Public vs. Private Content**
   - Avatar images need to be publicly accessible (with the correct URL)
   - Verification documents must never be publicly accessible
   - Use appropriate storage patterns for each type

2. **Content Moderation Flow**
   - New uploads may be marked as "pending_review"
   - A moderator (or automated system) reviews the content
   - Upon approval, status is updated to "active"
   - Rejected content is deleted with a notification to the user

3. **Resource Management**
   - Implement clean-up jobs for temporary verification documents
   - Track storage usage per user for quota management
   - Regularly audit access patterns to user assets

4. **Security Considerations**
   - Never expose verification document URLs to other users
   - Apply strong validation on uploads to prevent abuse
   - Implement rate limiting to prevent upload abuse
   - Log all access to sensitive documents
