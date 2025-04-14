-- Contractor Messaging System Schema Updates
-- Created: April 11, 2025

-- 1. Add message_type to distinguish between individual and group messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) NOT NULL DEFAULT 'individual';

-- 2. Add contractor_alias to store the anonymized contractor identity (A, B, C, etc.)
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS contractor_alias VARCHAR(5);

-- 3. Create a new table for group messages recipients
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Create a contractor_aliases table to maintain consistent aliases per project
CREATE TABLE IF NOT EXISTS public.contractor_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  contractor_id UUID NOT NULL REFERENCES auth.users(id),
  alias VARCHAR(5) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, contractor_id),
  UNIQUE(project_id, alias)
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON public.message_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_contractor_aliases_project_id ON public.contractor_aliases(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_aliases_contractor_id ON public.contractor_aliases(contractor_id);

-- 6. Add RLS policies for security
-- Message recipients policies
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see message recipients where they are the sender or recipient
CREATE POLICY message_recipients_select_policy ON public.message_recipients 
  FOR SELECT USING (
    recipient_id = auth.uid() OR 
    message_id IN (
      SELECT id FROM public.messages 
      WHERE sender_id = auth.uid()
    )
  );

-- Policy: Users can only insert message recipients for messages they sent
CREATE POLICY message_recipients_insert_policy ON public.message_recipients 
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM public.messages 
      WHERE sender_id = auth.uid()
    )
  );

-- Contractor aliases policies
ALTER TABLE public.contractor_aliases ENABLE ROW LEVEL SECURITY;

-- Policy: Homeowners can see all aliases for their projects
CREATE POLICY contractor_aliases_homeowner_select_policy ON public.contractor_aliases 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = contractor_aliases.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Policy: Contractors can only see their own alias
CREATE POLICY contractor_aliases_contractor_select_policy ON public.contractor_aliases 
  FOR SELECT USING (
    contractor_id = auth.uid()
  );

-- Policy: Only system or admin users can insert contractor aliases
CREATE POLICY contractor_aliases_insert_policy ON public.contractor_aliases 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = contractor_aliases.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- 7. Update messages table policies if needed
-- Ensure messages table has RLS enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see messages they sent or received
CREATE POLICY messages_select_policy ON public.messages 
  FOR SELECT USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid()
  );

-- Policy: Users can only insert messages they send
CREATE POLICY messages_insert_policy ON public.messages 
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );

-- 8. Ensure attachments table has proper policies
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see attachments for messages they can see
CREATE POLICY attachments_select_policy ON public.attachments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = attachments.message_id
      AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
  );

-- Policy: Users can only insert attachments for messages they sent
CREATE POLICY attachments_insert_policy ON public.attachments 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = attachments.message_id
      AND messages.sender_id = auth.uid()
    )
  );

-- 9. Create verification function to check if schema was applied correctly
CREATE OR REPLACE FUNCTION public.verify_messaging_schema()
RETURNS TABLE (
  table_name TEXT,
  table_exists BOOLEAN,
  has_rls BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    true AS table_exists,
    t.has_rls
  FROM (
    SELECT 
      c.relname AS table_name,
      CASE WHEN c.relrowsecurity THEN true ELSE false END AS has_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname IN ('messages', 'attachments', 'message_recipients', 'contractor_aliases')
    AND c.relkind = 'r'
  ) t;
END;
$$;
