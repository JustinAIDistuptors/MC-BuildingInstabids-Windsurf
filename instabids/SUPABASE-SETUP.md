# Supabase Setup for InstaBids

This document provides instructions for setting up Supabase for the InstaBids application.

## Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

The application requires several tables and schemas to be set up in Supabase:

1. Run the SQL scripts in the following order:
   - `contractor-messaging-schema.sql` - Creates the messaging schema
   - `disable-all-rls.sql` - Disables row-level security for development
   - `schema-update.sql` - Updates the schema with the latest changes

## Authentication

For development, the application uses anonymous authentication. In production, you should implement proper authentication with email/password or OAuth providers.

## Storage

For file attachments, you need to configure the Supabase storage:

1. Create a bucket called `message-attachments`
2. Set the bucket to public
3. Run the `storage-permissions-fix.sql` script to configure the permissions

## Testing

You can test the Supabase connection by running:

```bash
node supabase-health-check.js
```

This will verify that your Supabase connection is working correctly.
