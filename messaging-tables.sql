-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
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
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);

-- Row-level security policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policy for messages: Users can only see messages they sent or received
CREATE POLICY messages_select_policy ON public.messages 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy for messages: Users can only insert messages they send
CREATE POLICY messages_insert_policy ON public.messages 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Policy for attachments: Users can see attachments for messages they can see
CREATE POLICY attachments_select_policy ON public.attachments 
  FOR SELECT USING (
    message_id IN (
      SELECT id FROM public.messages 
      WHERE sender_id = auth.uid() OR recipient_id = auth.uid()
    )
  );

-- Policy for attachments: Users can insert attachments for messages they sent
CREATE POLICY attachments_insert_policy ON public.attachments 
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM public.messages 
      WHERE sender_id = auth.uid()
    )
  );
