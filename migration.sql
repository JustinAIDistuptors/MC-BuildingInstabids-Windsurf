-- Create messaging schema
CREATE SCHEMA IF NOT EXISTS messaging;

-- Messages table
CREATE TABLE IF NOT EXISTS messaging.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ,
  
  CONSTRAINT sender_not_recipient CHECK (sender_id != recipient_id)
);

-- Attachments table
CREATE TABLE IF NOT EXISTS messaging.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messaging.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON messaging.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messaging.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messaging.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON messaging.attachments(message_id);

-- Row-level security policies
ALTER TABLE messaging.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messaging.attachments ENABLE ROW LEVEL SECURITY;

-- Policy for messages: Users can only see messages they sent or received
CREATE POLICY messages_select_policy ON messaging.messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy for messages: Users can only insert messages they send
CREATE POLICY messages_insert_policy ON messaging.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy for attachments: Users can see attachments for messages they can see
CREATE POLICY attachments_select_policy ON messaging.attachments 
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM messaging.messages 
      WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
    )
  );

-- Policy for attachments: Users can insert attachments for messages they sent
CREATE POLICY attachments_insert_policy ON messaging.attachments 
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM messaging.messages 
      WHERE sender_id = auth.uid()
    )
  );
