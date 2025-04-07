# Labor Marketplace Security Documentation

This document outlines the security architecture, policies, and procedures specific to the Labor Marketplace domain within InstaBids. The Labor Marketplace presents unique security challenges due to its handling of sensitive personal data, identity verification, background checks, and financial transactions.

## Authentication and Authorization

### User Authentication

- All Labor Marketplace API endpoints require authentication via JWT tokens
- Token validation occurs at the API Gateway level before requests reach the Labor Marketplace service
- JWT tokens contain claims for user ID, role(s), and permissions
- Tokens expire after 1 hour of inactivity, with refresh tokens valid for 7 days
- Background check redirect flows use single-use tokens with 15-minute expiration

### Authorization Model

The Labor Marketplace implements a role-based permission system with the following user types:

| Role | Description | Base Access Level |
|------|-------------|-------------------|
| Helper | Labor providers seeking work | Limited to own profile, applications, and assignments |
| Client (Homeowner) | End consumers posting labor jobs | Limited to own job posts, applications, and assignments |
| Client (Contractor) | Business users posting labor jobs | Same as Homeowner plus team capabilities |
| Verifier | Users authorized to verify skills and identity | Read access to profiles and special verification permissions |
| Admin | Platform administrators | Full access to all marketplace resources |

### Permission Matrix

| Action | Helper | Client | Verifier | Admin |
|--------|--------|--------|----------|-------|
| View own profile | Yes | N/A | N/A | Yes |
| View helper profiles | Limited | Limited | Yes | Yes |
| Create job posts | No | Yes | No | Yes |
| Apply to jobs | Yes | No | No | No |
| View applications | Own only | For own jobs | No | Yes |
| Manage assignments | Own only | For own jobs | No | Yes |
| Verify identity | No | No | Yes | Yes |
| Verify skills | No | Limited | Yes | Yes |
| Access analytics | Own only | Own only | Limited | Yes |

## Row-Level Security Policies

The following Supabase RLS policies enforce access controls at the database level:

### Helper Profiles Table (`labor_helpers`)

```sql
-- Helpers can view and edit their own profiles
CREATE POLICY helper_own_profile ON labor_helpers
    FOR ALL USING (auth.uid() = user_id);

-- Clients can view (but not edit) profiles of helpers who applied to their jobs
CREATE POLICY client_view_applicant_profiles ON labor_helpers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM labor_job_applications a 
            JOIN labor_job_posts j ON a.job_post_id = j.id
            WHERE a.helper_id = labor_helpers.id 
              AND j.creator_id = auth.uid()
        )
    );

-- Clients can view (but not edit) profiles of helpers assigned to their jobs
CREATE POLICY client_view_assigned_profiles ON labor_helpers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM labor_assignments a 
            JOIN labor_job_posts j ON a.job_post_id = j.id
            WHERE a.helper_id = labor_helpers.id 
              AND j.creator_id = auth.uid()
        )
    );

-- Verifiers can view all profiles for verification purposes
CREATE POLICY verifier_view_profiles ON labor_helpers
    FOR SELECT USING (
        auth.jwt() ? 'is_verifier' AND auth.jwt()->>'is_verifier' = 'true'
    );

-- Admins have full access
CREATE POLICY admin_manage_profiles ON labor_helpers
    FOR ALL USING (
        auth.jwt() ? 'is_admin' AND auth.jwt()->>'is_admin' = 'true'
    );
```

### Job Posts Table (`labor_job_posts`)

```sql
-- Anyone can view public job posts
CREATE POLICY public_view_jobs ON labor_job_posts
    FOR SELECT USING (status = 'open');

-- Creators can fully manage their own job posts
CREATE POLICY creator_manage_jobs ON labor_job_posts
    FOR ALL USING (creator_id = auth.uid());

-- Helpers can view jobs they've applied to or been assigned to
CREATE POLICY helper_view_applied_jobs ON labor_job_posts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM labor_job_applications a 
            WHERE a.job_post_id = labor_job_posts.id 
              AND a.helper_id = (
                SELECT id FROM labor_helpers 
                WHERE user_id = auth.uid()
              )
        )
        OR
        EXISTS (
            SELECT 1 FROM labor_assignments a 
            WHERE a.job_post_id = labor_job_posts.id 
              AND a.helper_id = (
                SELECT id FROM labor_helpers 
                WHERE user_id = auth.uid()
              )
        )
    );
```

Similar policies exist for all other tables in the Labor Marketplace domain, enforcing strict access controls based on user roles and relationships.

## Personal Data Protection

### PII Classification and Handling

The Labor Marketplace domain handles various categories of personal information:

| Data Category | Classification | Examples | Protection Measures |
|---------------|----------------|----------|-------------------|
| Contact Information | PII Level 1 | Email, phone number | Encrypted storage, limited access |
| Identity Information | PII Level 2 | Name, address, ID numbers | Encrypted storage, access logging |
| Verification Documents | PII Level 3 | ID scans, certification documents | Encrypted storage, limited retention |
| Background Check Data | PII Level 3 | Criminal records, verification results | Encrypted storage, restricted access |
| Location Data | PII Level 2 | Check-in GPS coordinates | Encrypted storage, precision limiting |
| Financial Information | PII Level 3 | Payment details, rates, earnings | Encrypted storage, tokenization |

### PII Mitigation Strategies

1. **Data Minimization**: We collect only necessary data for the service to function.
2. **Masked Displays**: Personal information is masked in UI displays when full information isn't needed.
3. **Progressive Disclosure**: Information is revealed progressively based on the relationship stage between parties.
4. **Document Access Controls**: Verification documents are only accessible to verified parties with a need-to-know basis.

## Data Encryption

### Data at Rest

- All PII data stored in the database is encrypted using AES-256 encryption
- Sensitive fields are encrypted using field-level encryption with application-managed keys
- Verification documents are stored in encrypted storage buckets with strict access controls
- Background check data is tokenized, with minimal data stored in our systems

### Data in Transit

- All API communications use TLS 1.3 with strong cipher suites
- Client-side encryption is used for highly sensitive data before transmission
- Background check provider communications use mutual TLS authentication
- Document uploads use signed URLs with short expiration times

### Key Management

- Encryption keys are rotated every 90 days
- Application-level encryption keys are stored in AWS KMS
- Key access is logged and audited
- Separate key hierarchies exist for different data categories

## Audit Logging

The Labor Marketplace implements comprehensive audit logging for security-relevant events:

### Logged Events

- All profile verification actions
- Background check requests and results
- Changes to verification status
- All job assignments
- All payment-related activities
- User permission changes
- Sensitive data access events
- Location verification events

### Log Structure

Each log entry includes:
- Timestamp (UTC)
- User ID and IP address
- Action performed
- Resource affected
- Previous and new values for changes
- Request context information

### Log Protection

- Logs are encrypted at rest
- Logs are immutable and append-only
- Log retention period is 7 years for compliance purposes
- Log access is restricted and itself logged

## Third-Party Security

### Background Check Provider Security

- Background check providers must meet SOC 2 Type II certification requirements
- Data sharing with background check providers is minimized to required information only
- Background check results are tokenized with detailed results stored with the provider
- Provider connections use dedicated API keys with IP restrictions
- Provider access is audited and reviewed quarterly

### Payment Processor Security

- Direct payment information is never stored in our systems
- Payment tokenization is used with our payment processor
- Payment processor communications use mutual TLS authentication
- Payment reconciliation uses minimal required information

## Compliance Requirements

The Labor Marketplace domain must comply with:

1. **GDPR**: For EU users, with right to access, rectification, and deletion capabilities
2. **CCPA/CPRA**: For California users, with similar data rights
3. **FCRA**: For background check processes, ensuring accuracy and dispute resolution
4. **EEOC**: For non-discriminatory job posting and labor matching
5. **ADA**: For accessibility of the platform to users with disabilities
6. **State Licensing Requirements**: For specific regulated skill categories

## Security Testing

### Automated Testing

- Weekly automated vulnerability scanning of all APIs
- Monthly static code analysis of marketplace codebase
- Quarterly penetration testing of the entire marketplace system
- Continuous monitoring for suspicious access patterns

### Manual Reviews

- Bi-annual comprehensive security architecture review
- Quarterly review of all access control policies
- Monthly review of security logs for anomalies
- Ad-hoc reviews triggered by security events

## Incident Response

### Security Breach Procedures

1. **Identification**: Monitoring systems identify potential breaches
2. **Containment**: Affected systems are isolated
3. **Eradication**: Vulnerabilities are addressed
4. **Recovery**: Systems are restored securely
5. **Lessons Learned**: Incident is analyzed and documented

### Special Considerations for Labor Marketplace

- Identity verification breaches require immediate notification to affected helpers
- Background check data breaches follow special notification requirements per FCRA
- Location data compromises are treated as high priority due to physical safety implications
- Team communications follow strict containment protocols during incidents

## Future Security Enhancements

1. **Biometric Authentication**: For helper check-ins to prevent fraudulent time tracking
2. **Decentralized Identity Verification**: Using blockchain-based verification protocols
3. **Zero-Knowledge Proofs**: For background check verification without revealing detailed results
4. **Enhanced Geo-fencing**: To verify on-site presence with higher accuracy
5. **AI-based Fraud Detection**: For identifying suspicious activity patterns
