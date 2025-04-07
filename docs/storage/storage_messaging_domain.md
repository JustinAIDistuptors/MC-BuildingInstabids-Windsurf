# Messaging Domain Storage Guide

This guide documents the storage implementation for the InstaBids Messaging domain, which manages secure storage of message attachments between homeowners, contractors, and other platform users.

## Storage Overview

The Messaging domain utilizes the Supabase Storage service for storing message attachments, including images, documents, voice recordings, and other files shared in conversations.

## Bucket Structure

### Primary Bucket: `messaging-attachments`

This bucket stores all attachments related to messages within conversations. It follows a logical hierarchical structure based on the relationships between entities:

```
messaging-attachments/
└── conversations/
    └── {conversationId}/
        └── messages/
            └── {messageId}/
                ├── image/
                │   └── {timestamp}-{filename}
                ├── document/
                │   └── {timestamp}-{filename}
                ├── voice/
                │   └── {timestamp}-{filename}
                └── other/
                    └── {timestamp}-{filename}
```

## Access Patterns

The Messaging domain implements these access patterns:

### Conversation Participant Pattern
- Each user can only access conversations they are a participant in
- Access is determined by checking if user ID is in conversation's participant list
- Applies to all conversation-related data, including attachments

### Message Sender Pattern
- Only the sender of a message can add/delete attachments to their own messages
- Admins can also manage attachments for moderation purposes

### Time-limited Modification Pattern
- Attachments can only be added or removed within a specified time window (24 hours)
- After this window, messages and their attachments become immutable

### Retention Policy Pattern
- Standard retention: Attachments follow platform default retention policy
- Archived retention: Attachments are marked for longer-term storage
- Legal hold: Attachments are preserved indefinitely during legal proceedings

## Business Rules

### Attachment Upload Rules

1. **User Authentication and Authorization**
   - Only authenticated users can upload attachments
   - User must be a participant in the conversation
   - User must be the sender of the message

2. **File Validation**
   - File types are restricted based on category:
     - Images: jpeg, png, gif, webp (max 5MB)
     - Documents: pdf, docx, xlsx, csv, txt (max 10MB)
     - Voice: mp3, mp4, ogg, webm (max 3MB)
     - Other: zip, json, etc. (max 15MB)

3. **Attachment Limits**
   - Maximum 10 attachments per message
   - Message age limit: Attachments cannot be added to messages older than 24 hours

4. **Conversation Status Rules**
   - Attachments can only be added to conversations in 'active' or 'pending' status
   - Archived, blocked, or deleted conversations cannot receive new attachments

### Attachment Deletion Rules

1. **User Authorization**
   - Only the original message sender can delete an attachment
   - Administrators can delete any attachment for moderation
   - Message age limit: Attachments cannot be deleted from messages older than 24 hours

2. **Retention Compliance**
   - Attachments under legal hold cannot be deleted
   - Deletion is prevented for conversations marked for compliance requirements

## Path Conventions

### Attachment Paths

All attachment paths follow this convention:
```
conversations/{conversationId}/messages/{messageId}/{category}/{timestamp}-{filename}
```

Where:
- `{conversationId}`: Unique identifier for the conversation
- `{messageId}`: Unique identifier for the message
- `{category}`: One of 'image', 'document', 'voice', or 'other'
- `{timestamp}`: ISO date string with special characters removed
- `{filename}`: Original filename including extension

### Example Paths

```
conversations/conv-123/messages/msg-456/image/20250315T123045Z-family-photo.jpg
conversations/conv-123/messages/msg-789/document/20250315T124530Z-contract.pdf
conversations/conv-123/messages/msg-567/voice/20250315T130012Z-voice-message.mp3
```

## Security Considerations

### Access Control

The Messaging Storage Service follows the sandwich architecture pattern:

1. **Guard Layer (Top)**
   - Validates user authentication
   - Checks conversation participation
   - Enforces message ownership rules
   - Validates file types and sizes

2. **Domain Layer (Middle)**
   - Implements business rules
   - Enforces time windows for modifications
   - Manages attachment counts and limits
   - Handles retention policies

3. **Persistence Layer (Bottom)**
   - Handles actual storage operations
   - Generates unique paths
   - Manages upload/delete operations

### Potential Vulnerabilities

1. **Path Traversal Attacks**
   - Prevented by not using user-supplied path components directly
   - All path segments are validated before construction

2. **Metadata Leakage**
   - Sensitive metadata is stripped from files before storage
   - EXIF data from images is not preserved in storage
   
3. **Unauthorized Access**
   - All requests are validated through guard layer
   - Cross-conversation access is prevented by path structure
   - Access checked at multiple levels (conversation, message)

## Integration Points

### User Domain
- User profiles and authentication status
- User relationships and blocking status

### Project Domain
- Project-related conversations
- Documentation sharing between project participants

### Bid Domain
- Bid discussions and attachments
- Proposal review and feedback

## Implementation Details

### Storage Service Pattern

The `MessagingStorageService` class implements:

```typescript
// Public methods (API)
uploadMessageAttachment(params)
getMessageAttachmentUrl(attachmentId)
listMessageAttachments(messageId)
deleteMessageAttachment(attachmentId)
handleConversationArchived(conversationId)

// Private methods for implementation layers
// Guard Layer
validateConversationAccess(conversationId)
validateMessageAccess(messageId)
validateAttachmentFile(file, category)

// Domain Layer
getConversationInfo(conversationId)
validateConversationStatus(conversationId)
validateMessageAge(messageId)
enforceMessageAttachmentLimit(messageId)
recordMessageAttachment(attachmentData)
publishMessageAttachmentUploadedEvent(messageId, path, category)

// Persistence Layer
persistMessageAttachment(conversationId, messageId, category, file)
getFileUrl(bucket, path)
```

## Error Handling

The Messaging Storage Service defines and uses several error types:

- `StorageValidationError`: For file type/size validation errors
- `StoragePermissionError`: For access control violations
- `StorageBusinessRuleError`: For business rule violations
- `StorageOperationError`: For persistence layer failures
- `NotFoundError`: For resources that don't exist

Each error includes a descriptive message to aid in troubleshooting and client feedback.

## Testing Strategy

Testing the Messaging Storage Service requires coverage of:

1. **Guard Layer Tests**
   - Access control validation
   - File validation
   - Permission checks

2. **Domain Layer Tests**
   - Business rule enforcement
   - Event publication
   - Storage limit enforcement

3. **Persistence Layer Tests**
   - File uploads and downloads
   - Path generation
   - Error handling

4. **Integration Tests**
   - End-to-end attachment lifecycle
   - Cross-domain interactions
   - Event handling

## Examples

### Using the Storage Service

```typescript
// Create service with current user context
const messagingStorage = new MessagingStorageService({
  currentUser: {
    id: currentUserId,
    role: 'homeowner' // or 'contractor', 'admin', etc.
  }
});

// Upload an attachment
const fileUrl = await messagingStorage.uploadMessageAttachment({
  conversationId: 'conv-123',
  messageId: 'msg-456',
  file: imageFile, // File object from input or drag-drop
  category: 'image',
  metadata: { description: 'Kitchen remodel progress photo' }
});

// List all attachments for a message
const attachments = await messagingStorage.listMessageAttachments('msg-456');

// Get URL for a specific attachment
const attachmentUrl = await messagingStorage.getMessageAttachmentUrl('att-789');

// Delete an attachment
await messagingStorage.deleteMessageAttachment('att-789');
