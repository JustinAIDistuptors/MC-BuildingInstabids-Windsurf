-- Fix recursive policy issues in messaging system

-- First, drop any existing policies that might be causing recursion
DROP POLICY IF EXISTS messages_select_policy ON public.messages;
DROP POLICY IF EXISTS messages_insert_policy ON public.messages;
DROP POLICY IF EXISTS attachments_select_policy ON public.attachments;
DROP POLICY IF EXISTS attachments_insert_policy ON public.attachments;
DROP POLICY IF EXISTS message_recipients_select_policy ON public.message_recipients;
DROP POLICY IF EXISTS message_recipients_insert_policy ON public.message_recipients;

-- Now recreate the policies with simplified definitions

-- Messages table policies
CREATE POLICY messages_select_policy ON public.messages 
  FOR SELECT USING (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid()
  );

CREATE POLICY messages_insert_policy ON public.messages 
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
  );

-- Attachments table policies
CREATE POLICY attachments_select_policy ON public.attachments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = attachments.message_id
      AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
    )
  );

CREATE POLICY attachments_insert_policy ON public.attachments 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = attachments.message_id
      AND messages.sender_id = auth.uid()
    )
  );

-- Message recipients policies
CREATE POLICY message_recipients_select_policy ON public.message_recipients 
  FOR SELECT USING (
    recipient_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = message_recipients.message_id
      AND messages.sender_id = auth.uid()
    )
  );

CREATE POLICY message_recipients_insert_policy ON public.message_recipients 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages 
      WHERE messages.id = message_recipients.message_id
      AND messages.sender_id = auth.uid()
    )
  );
