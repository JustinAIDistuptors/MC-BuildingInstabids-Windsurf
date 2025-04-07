# Labor Marketplace Domain Overview

This document provides a comprehensive overview of the Labor Marketplace domain within the InstaBids platform. The Labor Marketplace is a core component that connects homeowners and contractors with skilled labor providers (helpers) for various construction and home improvement projects.

## Domain Purpose

The Labor Marketplace domain enables:
- Homeowners and contractors to find, vet, and hire qualified helpers
- Helpers to create profiles, showcase skills, and find work opportunities
- Verification of skills, identity, and qualifications
- Job posting, application, and matching processes
- Secure work tracking and payment processing
- Rating and review systems for quality assurance

## Integration with Other Domains

The Labor Marketplace interacts with multiple other domains:
- **User Management**: For authentication and core user data
- **Project Management**: For connecting labor to specific projects
- **Bidding**: For sourcing labor based on accepted bids
- **Payment Processing**: For secure payment handling
- **Messaging**: For communication between parties
- **Group Bidding**: For team-based labor coordination
- **Community**: For ratings, reviews, and skill verification

## Documentation Structure

### Architecture & Design
- [Labor Marketplace ERD](erd/erd_labor_marketplace.md) - Entity relationship diagrams
- [Labor Marketplace Schema](schema/schema_labor_marketplace.sql) - Database schema definition
- [Labor Marketplace TypeScript Interfaces](interfaces/interfaces_labor_marketplace.ts) - Core domain interfaces
- [Labor Marketplace Flow Diagrams](flow/flow_labor_marketplace.md) - Key process flows
- [Architecture Decision Records](adr/adr_05_labor_marketplace_verification_system.md) - Critical design decisions

### Implementation
- [Labor Marketplace Service Example](implementation/labor_marketplace_service_example.ts) - Service implementation examples
- [API Specification](api/api_labor_marketplace.yaml) - OpenAPI specification
- [Deployment Architecture](deployment/deployment_labor_marketplace.md) - Infrastructure and deployment details
- [Testing Strategy](testing/testing_labor_marketplace.md) - Testing approach and examples

### Cross-Cutting Concerns
- [Security Documentation](security/security_labor_marketplace.md) - Security model and practices
- [Analytics Specification](analytics/analytics_labor_marketplace.md) - Analytics design and metrics
- [Mobile Strategy](mobile/mobile_labor_marketplace.md) - Mobile implementation approach
- [Integration Map](integration/integration_labor_marketplace.md) - Cross-domain and external integrations

## Core Domain Models

### Helper Profiles
The central entity in the Labor Marketplace is the Helper Profile, which extends the base User entity with labor-specific attributes:

```typescript
interface LaborHelper {
  id: string;
  userId: string;
  profileStatus: 'pending_verification' | 'verified' | 'suspended' | 'inactive' | 'active';
  verificationLevel: 'basic' | 'identity_verified' | 'background_checked' | 'fully_verified';
  skills: HelperSkill[];
  availability: HelperAvailability[];
  hourlyRateRange: { min: number; max: number };
  hasTransportation: boolean;
  hasOwnTools: boolean;
  overallRating: number;
  // Additional attributes...
}
```

### Job Posts
Job Posts represent labor needs that can be matched with Helpers:

```typescript
interface LaborJobPost {
  id: string;
  creatorId: string;
  creatorType: 'homeowner' | 'contractor';
  projectId?: string;
  title: string;
  description: string;
  status: 'draft' | 'open' | 'in_progress' | 'filled' | 'canceled' | 'completed' | 'expired';
  jobType: 'one_time' | 'recurring' | 'multi_day' | 'project_based';
  payType: 'hourly' | 'fixed' | 'daily';
  payRate: number;
  location: JobLocation;
  requiredSkills: JobRequiredSkill[];
  requiredVerificationLevel: 'basic' | 'identity_verified' | 'background_checked' | 'fully_verified';
  // Additional attributes...
}
```

### Job Applications
Applications connect Helpers to Job Posts:

```typescript
interface LaborJobApplication {
  id: string;
  helperId: string;
  jobPostId: string;
  status: 'submitted' | 'viewed' | 'shortlisted' | 'rejected' | 'hired' | 'withdrawn';
  coverLetter?: string;
  proposedRate: number;
  availableStartDate: string; // ISO date
  submissionDate: string; // ISO date
  // Additional attributes...
}
```

### Labor Assignments
Assignments represent hired Helpers working on specific jobs:

```typescript
interface LaborAssignment {
  id: string;
  helperId: string;
  jobPostId: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled' | 'no_show' | 'partial';
  startDate: string; // ISO date
  endDate?: string; // ISO date
  agreedRate: number;
  paymentStatus: 'pending' | 'in_escrow' | 'partially_released' | 'fully_released' | 'disputed';
  checkIns: AssignmentCheckIn[];
  // Additional attributes...
}
```

### Helper Verification
Verification is a key aspect of the Labor Marketplace:

```typescript
interface HelperVerification {
  helperId: string;
  identityVerified: boolean;
  identityVerifiedDate?: string; // ISO date
  backgroundCheckStatus: 'not_submitted' | 'pending' | 'passed' | 'failed' | 'expired';
  backgroundCheckDate?: string; // ISO date
  skillsVerified: boolean;
  skillsVerifiedDate?: string; // ISO date
  verifiedById?: string; // User ID of verifier
  // Additional attributes...
}
```

## Key Workflows

1. **Helper Onboarding Flow**
   - User registration
   - Helper profile creation
   - Skill and certification registration
   - Availability setup
   - Verification process (multi-tier)

2. **Job Posting and Matching Flow**
   - Client creates job post
   - System matches potential helpers
   - Helpers discover and apply to jobs
   - Client reviews applications
   - Helper selection and hiring

3. **Work Execution Flow**
   - Helper check-in/check-out
   - Work validation and documentation
   - Time tracking
   - Client verification
   - Payment processing

4. **Verification Flows**
   - Identity verification
   - Background checking
   - Skill verification (official and community-based)
   - Insurance verification

## Implementation Approach

The Labor Marketplace domain follows these implementation principles:

1. **Domain-Driven Design**:
   - Clearly defined bounded context
   - Aggregate roots (Helper, JobPost, Assignment)
   - Rich domain model with business logic
   - Domain events for cross-context communication

2. **Service Architecture**:
   - Modular services within the domain
   - Clear interfaces between services
   - RESTful API with GraphQL for complex queries
   - Event-driven processes for async operations

3. **Technology Stack**:
   - TypeScript for type safety
   - PostgreSQL on Supabase for persistence
   - Node.js for service implementation
   - Redis for caching and real-time features
   - Elasticsearch for search capabilities

4. **Data Strategy**:
   - Normalized data model for transactional data
   - Denormalized views for read-optimized operations
   - Event sourcing for critical workflows
   - CQRS pattern for complex queries

## External Integrations

The Labor Marketplace integrates with several external services:

1. **Background Check Services**:
   - Provider: Checkr
   - Purpose: Criminal background checks, work eligibility

2. **Identity Verification Services**:
   - Provider: Onfido
   - Purpose: ID validation, document verification

3. **Mapping Services**:
   - Provider: Google Maps Platform
   - Purpose: Location validation, distance calculation, geocoding

4. **Payment Processing**:
   - Provider: Stripe Connect
   - Purpose: Secure payments, escrow services, helper payouts

## Development Roadmap

### Phase 1: Core Functionality (Q3 2025)
- Basic helper profiles
- Job posting and application
- Simple verification system
- Fundamental assignment tracking

### Phase 2: Enhanced Features (Q4 2025)
- Advanced verification tiers
- Rating and review system
- Improved search and matching
- Mobile application core features

### Phase 3: Advanced Capabilities (Q1 2026)
- Team-based labor coordination
- AI-powered matching and recommendations
- Advanced analytics and reporting
- Community verification features

## Implementation Guidance

When working with the Labor Marketplace domain, follow these best practices:

1. **Domain Boundaries**:
   - Respect the Labor Marketplace domain boundary
   - Use well-defined interfaces for cross-domain integration
   - Follow the event-driven approach for domain events

2. **Data Handling**:
   - Follow data privacy guidelines for PII
   - Use appropriate verification level checks
   - Implement proper authorization for sensitive operations

3. **Extensibility**:
   - Use strategy patterns for verification processes
   - Implement plugin architecture for new skill categories
   - Follow open/closed principle for domain extensions

4. **Performance**:
   - Cache helper search results
   - Optimize location-based queries
   - Use pagination for large result sets
   - Implement efficient real-time updates

## Getting Started

To begin working with the Labor Marketplace domain:

1. Review the [ERD](erd/erd_labor_marketplace.md) to understand the data model
2. Examine the [TypeScript Interfaces](interfaces/interfaces_labor_marketplace.ts) for domain entities
3. Study the [Flow Diagrams](flow/flow_labor_marketplace.md) for key processes
4. Reference the [API Specification](api/api_labor_marketplace.yaml) for external interfaces
5. Understand [Security Requirements](security/security_labor_marketplace.md) for implementation

For guidance on specific implementation tasks, refer to the appropriate section of documentation based on your focus area.
