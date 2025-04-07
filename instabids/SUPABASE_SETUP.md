# Supabase Setup Guide for InstaBids

This guide will help you connect InstaBids to your Supabase project and set up all required tables and authentication.

## Step 1: Create a Supabase Project

1. Sign up for Supabase at [supabase.com](https://supabase.com) if you haven't already
2. Create a new project from your dashboard
3. Choose a name and password for your project (save this password somewhere secure)
4. Select a region close to your target audience

## Step 2: Get Your API Keys

1. In your Supabase project, go to **Project Settings** > **API**
2. You'll need the following values:
   - **URL**: `https://[your-project-id].supabase.co`
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role** key (for admin operations - keep this secret)

## Step 3: Set Up Your Environment Variables

1. Create a `.env.local` file in the root of the InstaBids project with the following:

```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Configure Authentication in Supabase

1. In your Supabase dashboard, go to **Authentication** > **URL Configuration**
2. Add your site URL: `http://localhost:3000` (for local development)
3. Add redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/login`
   - `http://localhost:3000/signup`

4. Go to **Authentication** > **Settings**
5. Enable Email Authentication
6. You can optionally disable "Confirm email" during development
7. Save your changes

## Step 5: Set Up Database Schema

1. Install dependencies if you haven't already:
   ```
   npm install
   ```

2. Install database setup dependencies:
   ```
   npm install dotenv @supabase/supabase-js
   ```
   
3. Run the database setup script:
   ```
   node src/scripts/setup-database.js
   ```

4. The script will create all the necessary tables for InstaBids:
   - profiles
   - projects
   - project_attachments
   - bids
   - bid_attachments
   - messages
   - reviews
   - contractor_specialties

## Step 6: Test Authentication

1. Start the development server:
   ```
   npm run dev
   ```

2. Visit `http://localhost:3000/test-auth`
3. Use the testing page to verify that:
   - You can sign up as different user types
   - You can log in as different user types
   - User profile information is stored in the database

## Step 7: Verify Database Tables

1. In your Supabase dashboard, go to **Table Editor**
2. You should see all the tables defined in our schema
3. After creating test users, you should see entries in the `profiles` table

## Troubleshooting

### "Error: Missing required environment variables"
- Make sure your `.env.local` file exists and has the correct values
- Check that there are no extra spaces in your keys

### "Network Error" during authentication
- Check that your Supabase project URL is correct
- Make sure your anon key has been entered correctly

### "Error executing statement"
- Some SQL statements might fail if tables already exist
- This is normal and the script will continue to set up other tables

## Next Steps

Once your database is properly set up, you can proceed to:
1. Create the homepage and dashboards for each user type
2. Implement project creation for homeowners
3. Set up the bidding system for contractors

## Security Notes

- The service role key has admin privileges - never expose it in client-side code
- Only use it in trusted server contexts or secure API routes
- For production, make sure to update your site URLs and enable email confirmation
