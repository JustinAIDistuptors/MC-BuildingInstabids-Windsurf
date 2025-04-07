# Environment Setup Instructions

To set up the environment variables for InstaBids, follow these steps:

## Step 1: Create a `.env.local` file

Create a file named `.env.local` in the root directory of the project with the following content:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Other Environment Variables
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 2: Get your Supabase credentials

1. Go to your Supabase project dashboard
2. Click on the "Settings" icon in the left sidebar
3. Select "API" from the sidebar
4. Copy the following values:
   - URL (under "Project URL")
   - `anon` public key (under "Project API keys")
   - `service_role` key (under "Project API keys")

## Step 3: Update your `.env.local` file

Replace the placeholder values in your `.env.local` file with the actual values from your Supabase project.

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Restart your development server

After creating your `.env.local` file, restart your development server for the changes to take effect.

```bash
npm run dev
```
