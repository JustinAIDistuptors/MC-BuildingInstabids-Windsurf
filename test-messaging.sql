-- Test script to verify messaging functionality
-- Run this in the Supabase SQL Editor

-- 1. First, let's create a test message
INSERT INTO public.messages (
  project_id,
  sender_id,
  content,
  message_type,
  contractor_alias,
  created_at
) VALUES (
  '515ee9d4-bfd1-4cb1-b65e-8fae27b7d68e', -- Use your actual project ID
  '00000000-0000-0000-0000-000000000001', -- Test sender ID
  'This is a test message from SQL',
  'individual',
  NULL,
  NOW()
) RETURNING id;

-- 2. Now, let's create a message recipient entry for this message
-- Replace the message_id with the ID returned from the previous query
INSERT INTO public.message_recipients (
  message_id,
  recipient_id,
  created_at
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with the actual message ID from step 1
  '00000000-0000-0000-0000-000000000002', -- Test recipient ID
  NOW()
);

-- 3. Verify that the message was created
SELECT m.id, m.content, m.sender_id, r.recipient_id
FROM public.messages m
JOIN public.message_recipients r ON m.id = r.message_id
WHERE m.content = 'This is a test message from SQL';
