# InstaBids Environment Setup Guide

This guide provides detailed instructions for setting up the InstaBids development environment. Follow these steps to ensure proper configuration of all required services and dependencies.

## Prerequisites

Before beginning setup, ensure you have the following installed:

- **Node.js** (v18.x or later)
- **npm** (v9.x or later)
- **PostgreSQL** (v14.x or later)
- **Redis** (v6.x or later)
- **Docker** (optional, for containerized development)
- **Git** (for version control)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/instabids/instabids.git
cd instabids
```

### 2. Configure Environment Variables

1. Copy the environment template to create your local environment files:

```bash
cp docs/environment/.env.template .env
cp docs/environment/.env.template .env.local  # for overriding values in local development
```

2. Edit the `.env` and `.env.local` files to set your development-specific values:
   - Generate secure random strings for secrets (JWT_SECRET, API_SECRET_KEY)
   - Configure database connection details
   - Set up API keys for third-party services as needed

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL Installation

1. Create the InstaBids database:

```bash
psql -U postgres
CREATE DATABASE instabids;
CREATE DATABASE instabids_test;
\q
```

2. Initialize the database schema:

```bash
npm run db:migrate
```

#### Option B: Using Docker for PostgreSQL

1. Run PostgreSQL with Docker:

```bash
docker run --name instabids-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=instabids \
  -p 5432:5432 \
  -d postgres:14
```

2. Create the test database:

```bash
docker exec -it instabids-postgres psql -U postgres -c "CREATE DATABASE instabids_test;"
```

3. Initialize the database schema:

```bash
npm run db:migrate
```

### 4. Set Up Redis

#### Option A: Local Redis Installation

Ensure your Redis server is running on the default port (6379).

#### Option B: Using Docker for Redis

```bash
docker run --name instabids-redis \
  -p 6379:6379 \
  -d redis:6
```

### 5. Set Up Supabase (Optional)

If you're using Supabase for authentication, storage, or realtime features:

1. Create a new project on [Supabase](https://supabase.com)
2. Copy your project URL and anon key to the `.env` file:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   ```
3. Set up Row Level Security (RLS) policies:
   ```bash
   npm run supabase:rls
   ```

### 6. Install Dependencies

```bash
npm install
```

### 7. Start the Development Server

```bash
# Start the backend API server
npm run dev:api

# In another terminal, start the frontend
npm run dev:web
```

## Configuring Third-Party Services

### Payment Processing (Stripe)

1. Create a [Stripe account](https://stripe.com)
2. Obtain your API keys from the Stripe dashboard
3. Update the following environment variables:
   ```
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. To test webhooks locally, use Stripe CLI:
   ```bash
   stripe listen --forward-to http://localhost:3000/webhooks/stripe
   ```

### Email Service

1. Choose an email service provider (SendGrid, Mailgun, etc.) or use SMTP
2. Update the email configuration in your `.env` file
3. Test the email service:
   ```bash
   npm run test:email
   ```

### SMS Service (Twilio)

1. Create a [Twilio account](https://twilio.com)
2. Obtain your Account SID and Auth Token
3. Purchase a phone number
4. Update your `.env` file with the Twilio credentials

### Identity Verification Services

#### Onfido (ID Verification)

1. Create an [Onfido account](https://onfido.com)
2. Obtain your API key from the dashboard
3. Update the environment variables:
   ```
   ONFIDO_API_KEY=your_onfido_api_key
   ONFIDO_WEBHOOK_SECRET=your_onfido_webhook_secret
   ```

#### Checkr (Background Checks)

1. Create a [Checkr account](https://checkr.com)
2. Obtain your API key
3. Update the environment variables:
   ```
   CHECKR_API_KEY=your_checkr_api_key
   CHECKR_WEBHOOK_SECRET=your_checkr_webhook_secret
   ```

### AI Services (OpenAI)

1. Create an [OpenAI account](https://openai.com)
2. Obtain your API key and organization ID
3. Update the environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_ORG_ID=your_openai_org_id
   OPENAI_DEFAULT_MODEL=gpt-4
   ```

### Google Maps API (Geocoding)

1. Create a [Google Cloud project](https://console.cloud.google.com)
2. Enable the Maps JavaScript API and Geocoding API
3. Create an API key with appropriate restrictions
4. Update your `.env` file:
   ```
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

## Environment-Specific Configurations

### Development Environment

Development is the default environment and uses:
- Local databases
- Test API keys for third-party services
- Debug-level logging
- No SSL requirement

### Staging Environment

For the staging environment, update your `.env.staging` file:
```
NODE_ENV=staging
API_URL=https://api-staging.instabids.com
FRONTEND_URL=https://staging.instabids.com
LOG_LEVEL=info
POSTGRES_SSL=true
```

### Production Environment

For production, ensure these values are set securely:
```
NODE_ENV=production
API_URL=https://api.instabids.com
FRONTEND_URL=https://instabids.com
LOG_LEVEL=warn
POSTGRES_SSL=true
SECURITY_HSTS_ENABLED=true
SECURITY_CSP_ENABLED=true
```

## Docker Compose Setup (Optional)

For a full containerized development environment, use the provided Docker Compose configuration:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running with `pg_isready`
- Check database credentials in your `.env` file
- Ensure the database has been created: `psql -U postgres -c '\l'`

### Redis Connection Issues

- Verify Redis is running with `redis-cli ping`
- Check Redis connection settings in your `.env` file
- Clear Redis: `redis-cli flushall`

### JWT Authentication Issues

- Regenerate your JWT secret: `openssl rand -base64 32`
- Check token expiration times in your `.env` file
- Verify that the client and server are using the same JWT secrets

### Third-Party API Connection Issues

- Verify API keys in your `.env` file
- Check network connectivity to third-party services
- Confirm your account status with each service provider

## Security Best Practices

1. **Never commit `.env` files to version control**
2. **Rotate API keys and secrets regularly**
3. **Use different API keys for development, staging, and production**
4. **Enable two-factor authentication for all service accounts**
5. **Keep all dependencies up to date with `npm audit` and regular updates**

## Additional Resources

- [InstaBids API Documentation](https://docs.instabids.com/api)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Docker Documentation](https://docs.docker.com/)
