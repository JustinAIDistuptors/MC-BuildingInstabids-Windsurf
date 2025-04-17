-- This script fixes the messaging system tables and relationships

-- First, check if the message_attachments table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_attachments') THEN
        -- Create the message_attachments table if it doesn't exist
        CREATE TABLE public.message_attachments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            file_type TEXT NOT NULL,
            file_url TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        -- Add comment to the table
        COMMENT ON TABLE public.message_attachments IS 'Stores attachments for messages';
    END IF;
END $$;

-- Migrate data from attachments table to message_attachments if needed
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'attachments') THEN
        -- Check if the attachments table has any data
        IF EXISTS (SELECT 1 FROM public.attachments LIMIT 1) THEN
            -- Insert data from attachments to message_attachments
            INSERT INTO public.message_attachments (message_id, file_name, file_size, file_type, file_url, created_at)
            SELECT message_id, file_name, file_size, file_type, file_url, created_at
            FROM public.attachments
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- Add RLS policies to message_attachments table
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Create policy for message_attachments - allow all operations for now for easier testing
CREATE POLICY "Allow all operations on message_attachments"
ON public.message_attachments
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON public.message_attachments (message_id);

-- Make sure the messages table has the correct structure
DO $$ 
BEGIN
    -- Check if recipient_id column exists in messages table
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'messages' 
        AND column_name = 'recipient_id'
    ) THEN
        -- Remove the recipient_id column if it exists
        ALTER TABLE public.messages DROP COLUMN recipient_id;
    END IF;
END $$;

-- Make sure the message_recipients table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'message_recipients') THEN
        -- Create the message_recipients table if it doesn't exist
        CREATE TABLE public.message_recipients (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
            recipient_id UUID NOT NULL,
            read_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );

        -- Add comment to the table
        COMMENT ON TABLE public.message_recipients IS 'Stores recipients for messages';
    END IF;
END $$;

-- Add RLS policies to message_recipients table
ALTER TABLE public.message_recipients ENABLE ROW LEVEL SECURITY;

-- Create policy for message_recipients - allow all operations for now for easier testing
CREATE POLICY "Allow all operations on message_recipients"
ON public.message_recipients
FOR ALL
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_recipients_message_id ON public.message_recipients (message_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_recipient_id ON public.message_recipients (recipient_id);

-- Make sure the messages table has the correct RLS policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policy for messages - allow all operations for now for easier testing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'messages' 
        AND policyname = 'Allow all operations on messages'
    ) THEN
        CREATE POLICY "Allow all operations on messages"
        ON public.messages
        FOR ALL
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Create indexes for better performance on messages table
CREATE INDEX IF NOT EXISTS idx_messages_project_id ON public.messages (project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at);