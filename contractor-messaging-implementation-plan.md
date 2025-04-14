# Contractor Messaging System Implementation Plan

## Overview

This document outlines the implementation plan for the contractor messaging system in InstaBids. The system will allow homeowners to message up to 5 contractors bidding on their projects, with the following key features:

1. **Anonymized Contractor Identities**: Contractors are identified only by aliases (A, B, C, etc.)
2. **Group Messaging**: Homeowners can message all contractors at once
3. **Individual Messaging**: Homeowners can message specific contractors
4. **File Sharing**: Support for images and documents in messages
5. **Identity Protection**: Real contact information is only shared after project award and payment

## Current State (as of April 11, 2025)

Based on direct examination of the Supabase database:

1. **Existing Tables**:
   - `messages` table exists but contains no data yet
   - `attachments` table exists but contains no data yet
   - `projects` table exists with 1 project
   - `profiles` table exists with 1 user (homeowner)
   - `bids` table exists but contains no data yet

2. **Missing Components**:
   - No contractor alias system
   - No group messaging capability
   - No way to anonymize contractor identities

## Implementation Plan

### Phase 1: Database Schema Updates

**Estimated Time**: 1-2 days

#### Tasks:

1. Create SQL script for table modifications:
   - Add `message_type` column to `messages` table
   - Add `contractor_alias` column to `messages` table
   - Create `message_recipients` table for group messages
   - Create `contractor_aliases` table for consistent aliases

2. Execute SQL in Supabase:
   - Run the script in Supabase SQL editor
   - Verify all tables and columns were created successfully

3. Test schema changes:
   - Insert test data to verify constraints
   - Verify indexes are working correctly

#### SQL Script:

```sql
-- Add message_type to distinguish between individual and group messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) NOT NULL DEFAULT 'individual';

-- Add contractor_alias to store the anonymized contractor identity (A, B, C, etc.)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS contractor_alias VARCHAR(5);

-- Create a new table for group messages
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create a contractor_aliases table to maintain consistent aliases per project
CREATE TABLE IF NOT EXISTS public.contractor_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  contractor_id UUID NOT NULL REFERENCES auth.users(id),
  alias VARCHAR(5) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, contractor_id),
  UNIQUE(project_id, alias)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON public.message_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_contractor_aliases_project_id ON public.contractor_aliases(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_aliases_contractor_id ON public.contractor_aliases(contractor_id);
```

#### Tests:

1. **Schema Verification Test**:
   ```javascript
   // Test to verify all tables and columns exist
   async function verifySchema() {
     // Check messages table has new columns
     const { data: messagesColumns } = await supabase
       .from('messages')
       .select('message_type, contractor_alias')
       .limit(1);
     
     // Check message_recipients table exists
     const { error: recipientsError } = await supabase
       .from('message_recipients')
       .select('id')
       .limit(1);
     
     // Check contractor_aliases table exists
     const { error: aliasesError } = await supabase
       .from('contractor_aliases')
       .select('id')
       .limit(1);
     
     // Log results
     console.log('Schema verification results:');
     console.log('- messages table new columns:', messagesColumns ? 'Success' : 'Failed');
     console.log('- message_recipients table:', !recipientsError ? 'Success' : 'Failed');
     console.log('- contractor_aliases table:', !aliasesError ? 'Success' : 'Failed');
   }
   ```

### Phase 2: Service Layer Implementation

**Estimated Time**: 2-3 days

#### Tasks:

1. Implement contractor alias assignment:
   - Create function to assign aliases (A-E) to contractors
   - Ensure consistent aliases per project

2. Develop group messaging functionality:
   - Create function to send messages to all contractors
   - Handle recipient tracking for group messages

3. Update existing message retrieval functions:
   - Modify to support both individual and group messages
   - Include alias information in message data

4. Add file attachment handling:
   - Implement file upload to Supabase storage
   - Associate attachments with messages

#### Implementation:

```typescript
// src/lib/supabase/messaging.ts

// Assign contractor aliases for a project (A, B, C, D, E)
export async function assignContractorAliases(projectId: string): Promise<boolean> {
  try {
    // Get all contractors who have bid on this project
    const { data: contractors, error } = await supabase
      .from('bids')
      .select('contractor_id')
      .eq('project_id', projectId)
      .limit(5); // Limit to 5 contractors
    
    if (error) throw error;
    if (!contractors || contractors.length === 0) return false;
    
    // Generate aliases (A, B, C, D, E)
    const aliases = ['A', 'B', 'C', 'D', 'E'];
    
    // Assign aliases to contractors
    for (let i = 0; i < contractors.length; i++) {
      const { error: insertError } = await supabase
        .from('contractor_aliases')
        .insert({
          project_id: projectId,
          contractor_id: contractors[i].contractor_id,
          alias: aliases[i]
        });
      
      if (insertError) throw insertError;
    }
    
    return true;
  } catch (error) {
    console.error('Error assigning contractor aliases:', error);
    return false;
  }
}

// Get contractor alias for a specific contractor on a project
export async function getContractorAlias(
  projectId: string, 
  contractorId: string
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('contractor_aliases')
      .select('alias')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .single();
    
    if (error) throw error;
    return data?.alias || 'Unknown';
  } catch (error) {
    console.error('Error getting contractor alias:', error);
    return 'Unknown';
  }
}

// Send a message to all contractors for a project
export async function sendGroupMessage(
  projectId: string,
  content: string,
  files?: File[]
): Promise<boolean> {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    // Get all contractors for this project
    const { data: contractors, error: contractorsError } = await supabase
      .from('bids')
      .select('contractor_id')
      .eq('project_id', projectId)
      .limit(5);
    
    if (contractorsError) throw contractorsError;
    if (!contractors || contractors.length === 0) return false;
    
    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        project_id: projectId,
        sender_id: user.id,
        recipient_id: null, // No specific recipient for group messages
        content: content,
        message_type: 'group'
      })
      .select()
      .single();
    
    if (messageError) throw messageError;
    
    // Add all contractors as recipients
    for (const contractor of contractors) {
      const { error: recipientError } = await supabase
        .from('message_recipients')
        .insert({
          message_id: message.id,
          recipient_id: contractor.contractor_id
        });
      
      if (recipientError) throw recipientError;
    }
    
    // Handle file uploads if provided
    if (files && files.length > 0) {
      await handleFileAttachments(message.id, files);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending group message:', error);
    return false;
  }
}

// Helper function to handle file attachments
async function handleFileAttachments(messageId: string, files: File[]): Promise<boolean> {
  try {
    for (const file of files) {
      // Upload file to storage
      const filePath = `message-attachments/${messageId}/${file.name}`;
      const { error: fileError } = await supabase.storage
        .from('media')
        .upload(filePath, file);
      
      if (fileError) throw fileError;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
      
      // Add attachment record
      const { error: attachmentError } = await supabase
        .from('attachments')
        .insert({
          message_id: messageId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_url: publicUrl
        });
      
      if (attachmentError) throw attachmentError;
    }
    
    return true;
  } catch (error) {
    console.error('Error handling file attachments:', error);
    return false;
  }
}

// Get messages for a project, including group messages
export async function getProjectMessages(
  projectId: string,
  contractorId?: string
): Promise<Array<{
  id: string;
  senderId: string;
  senderAlias?: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isGroup: boolean;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
  }>;
}>> {
  try {
    // Implementation details...
    // This will need to fetch both individual and group messages
  } catch (error) {
    console.error('Error getting project messages:', error);
    return [];
  }
}
```

#### Tests:

1. **Alias Assignment Test**:
   ```javascript
   async function testAliasAssignment() {
     // Create test contractors and bids
     // Assign aliases
     // Verify each contractor has a unique alias
   }
   ```

2. **Group Messaging Test**:
   ```javascript
   async function testGroupMessaging() {
     // Send a group message
     // Verify message is created with correct type
     // Verify all contractors are added as recipients
   }
   ```

3. **File Attachment Test**:
   ```javascript
   async function testFileAttachments() {
     // Send a message with attachments
     // Verify files are uploaded to storage
     // Verify attachment records are created
   }
   ```

### Phase 3: UI Component Development

**Estimated Time**: 3-4 days

#### Tasks:

1. Create enhanced messaging UI:
   - Implement toggle between group and individual messaging
   - Display contractor aliases instead of real names
   - Show message history with proper formatting

2. Add file upload capability:
   - Create file upload component
   - Handle file selection and preview
   - Show attachment thumbnails in messages

3. Implement real-time updates:
   - Add subscription to message changes
   - Update UI when new messages arrive

#### Implementation:

```tsx
// src/components/messaging/EnhancedMessaging.tsx

export default function EnhancedMessaging({ projectId }: EnhancedMessagingProps) {
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [selectedContractorId, setSelectedContractorId] = useState<string>('');
  const [newMessage, setNewMessage] = useState<string>('');
  const [isGroupMessage, setIsGroupMessage] = useState<boolean>(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  
  // Toggle between individual and group messaging
  const toggleMessageType = () => {
    setIsGroupMessage(!isGroupMessage);
    setSelectedContractorId(isGroupMessage ? (contractors[0]?.id || '') : '');
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() && files.length === 0) {
      return;
    }
    
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is required",
        variant: "destructive"
      });
      return;
    }
    
    setSendingMessage(true);
    
    try {
      let success = false;
      
      if (isGroupMessage) {
        // Send to all contractors
        success = await sendGroupMessage(projectId, newMessage, files);
      } else if (selectedContractorId) {
        // Send to selected contractor
        success = await sendMessage(projectId, selectedContractorId, newMessage, files);
      } else {
        toast({
          title: "Error",
          description: "Please select a contractor or choose group message",
          variant: "destructive"
        });
        setSendingMessage(false);
        return;
      }
      
      if (success) {
        setNewMessage('');
        setFiles([]);
        // Refresh messages
        fetchMessages();
      } else {
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };
  
  // Render UI with contractor aliases instead of real names
  return (
    <div className="messaging-container">
      {/* Message type toggle */}
      <div className="flex items-center mb-4">
        <Switch 
          checked={isGroupMessage}
          onCheckedChange={toggleMessageType}
          id="message-type"
        />
        <Label htmlFor="message-type" className="ml-2">
          {isGroupMessage ? 'Message All Contractors' : 'Message Individual Contractor'}
        </Label>
      </div>
      
      {/* Contractor selection (for individual messages) */}
      {!isGroupMessage && (
        <div className="mb-4">
          <Label>Select Contractor</Label>
          <Select value={selectedContractorId} onValueChange={setSelectedContractorId}>
            {contractors.map(contractor => (
              <SelectItem key={contractor.id} value={contractor.id}>
                Contractor {contractor.alias} {/* Show alias instead of real name */}
              </SelectItem>
            ))}
          </Select>
        </div>
      )}
      
      {/* Message display */}
      <div className="messages-container">
        {/* Message rendering logic */}
      </div>
      
      {/* Message input */}
      <form onSubmit={handleSendMessage}>
        <Textarea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder={`Type a message to ${isGroupMessage ? 'all contractors' : `Contractor ${selectedContractor?.alias}`}`}
        />
        
        {/* File upload */}
        <div className="mt-2">
          <Label htmlFor="file-upload">Attach Files</Label>
          <Input 
            id="file-upload" 
            type="file" 
            multiple 
            onChange={handleFileChange}
            className="mt-1"
          />
        </div>
        
        {/* File previews */}
        {files.length > 0 && (
          <div className="mt-2 file-previews">
            {files.map((file, index) => (
              <div key={index} className="file-preview">
                <span>{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <Button type="submit" disabled={sendingMessage} className="mt-4">
          {sendingMessage ? <Loader2 className="animate-spin" /> : 'Send'}
        </Button>
      </form>
    </div>
  );
}
```

#### Tests:

1. **UI Rendering Test**:
   ```javascript
   function testUIRendering() {
     // Render component with mock data
     // Verify all UI elements are displayed correctly
   }
   ```

2. **Message Toggle Test**:
   ```javascript
   function testMessageToggle() {
     // Toggle between individual and group messaging
     // Verify UI updates correctly
   }
   ```

3. **File Upload Test**:
   ```javascript
   function testFileUpload() {
     // Select files for upload
     // Verify preview is displayed
     // Verify files are included in message submission
   }
   ```

### Phase 4: Testing & Deployment

**Estimated Time**: 2-3 days

#### Tasks:

1. Integration testing:
   - Test complete flow from contractor bidding to messaging
   - Verify all components work together correctly

2. Security testing:
   - Verify contractors cannot see each other's messages
   - Ensure proper access controls are in place

3. Performance testing:
   - Test with multiple contractors and messages
   - Verify system handles file uploads efficiently

4. Deployment:
   - Deploy database changes to production
   - Deploy code changes to production
   - Monitor for any issues

#### Tests:

1. **End-to-End Flow Test**:
   ```javascript
   async function testEndToEndFlow() {
     // Create project
     // Add contractor bids
     // Assign aliases
     // Send messages (both individual and group)
     // Verify all steps work correctly
   }
   ```

2. **Security Test**:
   ```javascript
   async function testSecurity() {
     // Log in as different contractors
     // Verify each contractor can only see their own messages
     // Verify homeowner can see all messages
   }
   ```

## Test Plan

### Unit Tests

1. **Database Schema Tests**:
   - Verify all tables and columns exist
   - Test constraints (unique constraints, foreign keys)
   - Test indexes for performance

2. **Service Layer Tests**:
   - Test alias assignment
   - Test message sending (individual and group)
   - Test file attachment handling
   - Test message retrieval

3. **UI Component Tests**:
   - Test rendering with different data
   - Test user interactions (toggle, selection, submission)
   - Test file upload and preview

### Integration Tests

1. **Contractor Bidding to Messaging Flow**:
   - Create project
   - Add contractor bids
   - Assign aliases
   - Send messages
   - Verify all steps work correctly

2. **File Sharing Flow**:
   - Upload files with messages
   - Verify files are stored correctly
   - Verify files can be downloaded

### Security Tests

1. **Access Control Tests**:
   - Verify contractors can only see their own messages
   - Verify homeowner can see all messages
   - Verify identity protection works correctly

2. **RLS Policy Tests**:
   - Test Row Level Security policies
   - Verify unauthorized access is blocked

## Success Criteria

The implementation will be considered successful when:

1. Homeowners can message up to 5 contractors on their projects
2. Contractors are identified only by aliases (A, B, C, etc.)
3. Homeowners can send messages to individual contractors or all contractors at once
4. File sharing (images and documents) works correctly
5. Real contact information is only shared after project award and payment
6. All tests pass successfully

## Future Enhancements

1. **Real-time Notifications**:
   - Push notifications for new messages
   - Email notifications for offline users

2. **Message Templates**:
   - Pre-defined message templates for common scenarios
   - Quick replies for frequent questions

3. **Advanced File Handling**:
   - Image compression
   - Document preview
   - Video messaging

4. **Message Analytics**:
   - Track response times
   - Analyze message patterns
   - Identify successful communication strategies
