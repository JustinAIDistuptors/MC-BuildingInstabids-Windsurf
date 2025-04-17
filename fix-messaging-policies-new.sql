-- Fix for Messaging System Policies
-- Created: April 15, 2025

-- 1. First, check if recipient_id column exists in messages table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'recipient_id'
  ) THEN
    -- If it exists, do nothing for now
    RAISE NOTICE 'recipient_id column exists in messages table';
  ELSE
    -- If it doesn't exist, we need to fix the policies
    RAISE NOTICE 'recipient_id column does not exist in messages table, fixing policies...';
    
    -- 2. Drop the existing policies that reference recipient_id
    DROP POLICY IF EXISTS messages_select_policy ON public.messages;
    DROP POLICY IF EXISTS attachments_select_policy ON public.attachments;
    
    -- 3. Create new policies that use the message_recipients table instead
    CREATE POLICY messages_select_policy ON public.messages 
      FOR SELECT USING (
        sender_id = auth.uid() OR 
        id IN (
          SELECT message_id FROM public.message_recipients 
          WHERE recipient_id = auth.uid()
        )
      );
    
    CREATE POLICY attachments_select_policy ON public.attachments 
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.messages 
          WHERE messages.id = attachments.message_id
          AND (
            messages.sender_id = auth.uid() OR 
            messages.id IN (
              SELECT message_id FROM public.message_recipients 
              WHERE recipient_id = auth.uid()
            )
          )
        )
      );
  END IF;
END $$;

-- 4. Verify that the messages table has the correct structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'messages' 
ORDER BY ordinal_position;

-- 5. Verify that the message_recipients table exists and has the correct structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'message_recipients' 
ORDER BY ordinal_position;

-- 6. Verify that the policies are correctly set up
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('messages', 'message_recipients', 'attachments');
