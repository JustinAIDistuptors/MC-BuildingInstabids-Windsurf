-- Fix Messaging Schema Script
-- Created: April 15, 2025

-- 1. First, check if recipient_id column exists in messages table and drop it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'messages' 
    AND column_name = 'recipient_id'
  ) THEN
    -- Drop the recipient_id column from messages table
    ALTER TABLE public.messages DROP COLUMN recipient_id;
    RAISE NOTICE 'Dropped recipient_id column from messages table';
  ELSE
    RAISE NOTICE 'recipient_id column does not exist in messages table, no need to drop it';
  END IF;
END $$;

-- 2. Ensure message_recipients table exists with correct structure
CREATE TABLE IF NOT EXISTS public.message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients(message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON public.message_recipients(recipient_id);

-- 4. Ensure messages table has the correct structure
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) NOT NULL DEFAULT 'individual';

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS contractor_alias VARCHAR(5) NULL;

-- 5. Ensure contractor_aliases table exists with correct structure
CREATE TABLE IF NOT EXISTS public.contractor_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id),
  contractor_id UUID NOT NULL REFERENCES auth.users(id),
  alias VARCHAR(5) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, contractor_id),
  UNIQUE(project_id, alias)
);

-- 6. Create indexes for contractor_aliases table
CREATE INDEX IF NOT EXISTS idx_contractor_aliases_project_id ON public.contractor_aliases(project_id);
CREATE INDEX IF NOT EXISTS idx_contractor_aliases_contractor_id ON public.contractor_aliases(contractor_id);

-- 7. Ensure attachments table exists with correct structure
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Create index for attachments table
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON public.attachments(message_id);

-- 9. Verify the structure of all tables
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name IN ('messages', 'message_recipients', 'contractor_aliases', 'attachments') 
ORDER BY 
  table_name, 
  ordinal_position;

-- 10. Create a test message to verify everything works
DO $$
DECLARE
  v_message_id UUID;
  v_project_id UUID;
  v_sender_id UUID;
  v_recipient_id UUID;
BEGIN
  -- Get a valid project ID
  SELECT id INTO v_project_id FROM public.projects LIMIT 1;
  
  -- Get valid user IDs
  SELECT id INTO v_sender_id FROM auth.users LIMIT 1;
  SELECT id INTO v_recipient_id FROM auth.users WHERE id != v_sender_id LIMIT 1;
  
  IF v_project_id IS NOT NULL AND v_sender_id IS NOT NULL AND v_recipient_id IS NOT NULL THEN
    -- Insert test message
    INSERT INTO public.messages (
      project_id,
      sender_id,
      content,
      message_type,
      created_at
    ) VALUES (
      v_project_id,
      v_sender_id,
      'Test message from SQL fix script',
      'individual',
      NOW()
    ) RETURNING id INTO v_message_id;
    
    -- Insert message recipient
    INSERT INTO public.message_recipients (
      message_id,
      recipient_id,
      created_at
    ) VALUES (
      v_message_id,
      v_recipient_id,
      NOW()
    );
    
    RAISE NOTICE 'Created test message with ID: % from sender: % to recipient: %', v_message_id, v_sender_id, v_recipient_id;
  ELSE
    RAISE NOTICE 'Could not create test message due to missing project or user data';
  END IF;
END $$;
