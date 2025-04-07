# Labor Marketplace Analytics Specification

This document outlines the analytics architecture, metrics tracking, and reporting capabilities for the Labor Marketplace domain of InstaBids. Data-driven insights are crucial for optimizing the marketplace's efficiency, quality of matches, and overall participant satisfaction.

## Core Analytics Goals

1. **Marketplace Health Monitoring**: Track overall marketplace activity, supply-demand balance, and growth metrics
2. **Helper Performance Analysis**: Measure and improve helper quality, reliability, and success rates
3. **Client Satisfaction Metrics**: Track client outcomes and satisfaction with labor services
4. **Job Matching Optimization**: Improve the efficiency and quality of job-helper matching
5. **Financial Performance Tracking**: Monitor revenue, payment flows, and economic incentives
6. **Trust & Safety Metrics**: Ensure the marketplace maintains high standards of trust and safety
7. **Geographic Coverage Analysis**: Understand and improve market penetration across regions

## Data Collection Points

### Helper-Related Collection Points

| Data Point | Collection Trigger | Storage Location | Retention Period |
|------------|---------------------|------------------|------------------|
| Profile Creation | Helper signup | `labor_helpers` | Indefinite |
| Profile Updates | Profile edits | `helper_profile_changes` | 3 years |
| Skill Additions | Skill registration | `helper_skills` | Indefinite |
| Certification Uploads | Certification registration | `helper_certifications` | Indefinite |
| Availability Changes | Schedule updates | `helper_availability_changes` | 1 year |
| Location Updates | Check-ins, profile updates | `helper_location_history` | 90 days |
| Application Submissions | Job applications | `labor_job_applications` | 7 years |
| Check-ins/Check-outs | Work tracking | `assignment_check_ins` | 7 years |
| Work Completion | Assignment completion | `labor_assignments` | 7 years |
| Ratings Received | Client reviews | `labor_helper_reviews` | Indefinite |
| Earnings | Payment processing | `helper_payments` | 7 years |
| Verification Events | Identity/skill verifications | `verification_events` | 7 years |

### Client-Related Collection Points

| Data Point | Collection Trigger | Storage Location | Retention Period |
|------------|---------------------|------------------|------------------|
| Job Post Creation | New job posts | `labor_job_posts` | 7 years |
| Job Requirements | Job post requirements | `job_specific_requirements` | 7 years |
| Applicant Selection | Application status changes | `application_status_history` | 3 years |
| Helper Assignment | Assignment creation | `labor_assignments` | 7 years |
| Hour Verification | Check-in verification | `check_in_verifications` | 7 years |
| Payments Made | Payment processing | `client_payments` | 7 years |
| Ratings Given | Helper reviews | `labor_helper_reviews` | Indefinite |
| Dispute Filing | Dispute creation | `helper_disputes` | 7 years |
| Repeat Hiring | Multiple assignments to same helper | Derived | N/A |

### Marketplace-Level Collection Points

| Data Point | Collection Trigger | Storage Location | Retention Period |
|------------|---------------------|------------------|------------------|
| Search Queries | Helper/job searches | `marketplace_searches` | 90 days |
| Search Results | Search completions | `search_results` | 30 days |
| Job View Events | Job post views | `job_view_events` | 30 days |
| Profile View Events | Helper profile views | `profile_view_events` | 30 days |
| Match Success Rate | Hire after application | Derived | N/A |
| Geographic Distribution | Job and helper locations | Derived | N/A |
| Category Distribution | Skill categories | Derived | N/A |
| Time-to-Fill | Job post to assignment | Derived | N/A |
| Fee Revenue | Payment processing | `platform_fees` | 7 years |

## Key Metrics and KPIs

### Marketplace Health Metrics

| Metric | Formula | Tracking Frequency | Target |
|--------|---------|-------------------|--------|
| Active Helpers | Count of helpers with status='active' | Daily | Growth: 5% MoM |
| New Helper Registration | Count of new helper profiles | Daily | Growth: 8% MoM |
| Active Job Posts | Count of jobs with status='open' | Daily | Balance with helpers |
| Supply-Demand Ratio | Active Helpers : Active Jobs | Weekly | 3:1 to 5:1 |
| Total Job Value | Sum of estimated job values | Monthly | Growth: 10% MoM |
| Marketplace Liquidity | % of jobs filled within 48 hours | Weekly | >85% |
| Geographic Coverage | % zip codes with at least 5 helpers | Monthly | Expansion target areas |
| Category Coverage | % skill categories with adequate helper supply | Monthly | >90% for core categories |

### Helper Performance Metrics

| Metric | Formula | Tracking Frequency | Target |
|--------|---------|-------------------|--------|
| Application Success Rate | Hired applications / Total applications | Weekly | >25% |
| Job Completion Rate | Completed assignments / Total assignments | Weekly | >95% |
| On-time Arrival Rate | On-time check-ins / Total check-ins | Weekly | >90% |
| Hours Accuracy | Hours verified / Hours submitted | Weekly | >98% |
| Client Satisfaction | Average rating from reviews | Weekly | >4.2/5.0 |
| Dispute Rate | Assignments with disputes / Total assignments | Weekly | <3% |
| Repeat Hire Rate | Assignments from repeat clients / Total assignments | Monthly | >40% |
| Helper Earnings | Average hourly earnings | Monthly | Above local minimum wage + 50% |
| Helper Retention | Helpers active after 90 days / New helpers 90 days ago | Monthly | >70% |

### Client Satisfaction Metrics

| Metric | Formula | Tracking Frequency | Target |
|--------|---------|-------------------|--------|
| Time-to-Fill | Average hours from job post to hiring | Weekly | <24 hours |
| Match Quality | Average client ratings of helpers | Weekly | >4.2/5.0 |
| Application Quantity | Average applications per job post | Weekly | >3 |
| Budget Accuracy | Actual job cost / Estimated job cost | Monthly | 90%-110% |
| Client Retention | Repeat job posts / Total clients | Monthly | >50% at 90 days |
| Dispute Resolution Satisfaction | Rating of dispute resolution | Monthly | >4.0/5.0 |
| Net Promoter Score | Quarterly client NPS survey | Quarterly | >40 |

### Financial Performance Metrics

| Metric | Formula | Tracking Frequency | Target |
|--------|---------|-------------------|--------|
| Gross Marketplace Value | Total payment volume | Weekly | Growth: 8% MoM |
| Platform Revenue | Total fees collected | Weekly | 12-15% of GMV |
| Revenue per Active Helper | Platform revenue / Active helpers | Monthly | Growth: 5% MoM |
| Revenue per Active Client | Platform revenue / Active clients | Monthly | Growth: 5% MoM |
| Customer Acquisition Cost | Marketing spend / New clients | Monthly | <$200 |
| Lifetime Value | Projected client revenue over lifetime | Quarterly | LTV:CAC >3:1 |
| Transaction Size | Average job total value | Monthly | Growth: 3% MoM |

### Trust & Safety Metrics

| Metric | Formula | Tracking Frequency | Target |
|--------|---------|-------------------|--------|
| Verification Rate | Verified helpers / Total helpers | Weekly | >80% |
| Background Check Pass Rate | Passed checks / Total checks | Weekly | Monitor for abnormalities |
| Community Verification Rate | Skills with community verification / Total skills | Monthly | >50% |
| Safety Incidents | Count of reported safety issues | Weekly | 0 |
| Identity Fraud Attempts | Count of detected fraud attempts | Weekly | Monitor for trends |
| Location Verification Success | Check-ins with verified location / Total check-ins | Weekly | >95% |

## Data Access, Aggregation, and Visualization

### Data Warehouse Architecture

The analytics data pipeline for the Labor Marketplace follows these stages:

1. **Collection**: Raw event data captured by application services
2. **Ingestion**: Events streamed to AWS Kinesis
3. **Processing**: Transformations performed using AWS Lambda and Step Functions
4. **Storage**: 
   - Raw data stored in S3 data lake
   - Processed data loaded to Snowflake data warehouse
   - Aggregated metrics stored in PostgreSQL for application access
5. **Visualization**: 
   - Internal dashboards via Metabase
   - Client dashboards via embedded analytics in application
   - Helper insights via mobile and web application

### Update Frequencies

| Data Category | Update Frequency | Availability |
|--------------|------------------|--------------|
| Real-time Metrics | Near real-time (1-5 min) | Application UI, internal alerts |
| Daily Aggregations | Every 6 hours | Application dashboards, internal reports |
| Weekly Trends | Daily refresh | Management dashboards, client reports |
| Monthly Analysis | Daily refresh | Strategic planning, executive dashboards |
| Quarterly Deep Dives | Manual preparation | Board reporting, strategic planning |

### Access Control

Access to analytics data follows strict role-based permission controls:

| Role | Access Level | Limitations |
|------|--------------|------------|
| Helpers | Personal performance only | No access to other helpers' data or client details |
| Clients | Own jobs and aggregated helper data | No access to helpers' personal details |
| Internal Support | Full access with audit logging | Subject to data privacy restrictions |
| Data Analysts | Full anonymized access | PII access requires additional approval |
| Executives | Aggregate dashboards and drill-down | Subject to data privacy restrictions |

## Dashboard Specifications

### Helper Performance Dashboard

**Purpose**: Enable helpers to track and improve their marketplace performance

**Access**: Individual helpers (personal data only)

**Key Visualizations**:
1. Earnings over time (daily, weekly, monthly)
2. Ratings distribution and trend
3. Job success metrics compared to marketplace average
4. Application success rate with trend
5. Skills and certifications heat map (demand vs. supply)
6. Geographic job availability map
7. Suggested improvements based on performance data

**Technical Specifications**:
- Embedded in helper web and mobile applications
- Daily data refresh
- Interactive filters for date ranges
- Export functionality for earnings data

### Client Hiring Dashboard

**Purpose**: Enable clients to optimize their hiring process and outcomes

**Access**: Individual clients (own data only)

**Key Visualizations**:
1. Job posting performance metrics
2. Time-to-fill by job category and location
3. Helper quality metrics for hired helpers
4. Cost analysis vs. estimated budgets
5. Recurring helpers and teams performance
6. Job request optimization suggestions
7. Seasonal trends and planning suggestions

**Technical Specifications**:
- Embedded in client web and mobile applications
- Daily data refresh
- Predictive elements for job planning
- Comparative metrics against similar jobs

### Marketplace Operations Dashboard

**Purpose**: Internal monitoring of marketplace health and performance

**Access**: Operations team, management

**Key Visualizations**:
1. Real-time marketplace activity map
2. Supply-demand heat maps by location and category
3. Verification and trust metrics with alerts
4. Financial performance metrics and projections
5. User acquisition and retention funnels
6. Dispute monitoring and resolution tracking
7. A/B test performance tracking

**Technical Specifications**:
- Internal dashboard built on Metabase
- Near real-time data for critical metrics
- Alert system for metric anomalies
- Drill-down capabilities for detailed analysis

### Executive Dashboard

**Purpose**: Strategic overview of marketplace performance

**Access**: Executive team, board

**Key Visualizations**:
1. Marketplace growth metrics vs. targets
2. Financial performance and projections
3. Geographic expansion progress
4. Customer satisfaction and quality metrics
5. Competitive positioning (where data available)
6. Strategic initiative tracking
7. Risk indicators and compliance metrics

**Technical Specifications**:
- Interactive dashboard with presentation mode
- Weekly automated refresh with manual review
- Exportable for board reporting
- Long-term trend analysis capabilities

## Analytics Export and Integration

### Data Export Options

The following data exports are supported:

1. **Helper Earnings Reports**: 
   - Format: CSV, PDF
   - Fields: Date, job details, hours, earnings, deductions
   - Access: Individual helpers for personal data

2. **Client Hiring Reports**:
   - Format: CSV, PDF, Excel
   - Fields: Jobs posted, helpers hired, hours billed, costs
   - Access: Individual clients for own data

3. **Tax Documentation Exports**:
   - Format: IRS-compatible formats
   - Fields: As required by tax regulations
   - Access: Helpers, clients, and authorized accounting personnel

### API Access to Analytics Data

The following analytics APIs are provided:

1. **Helper Performance API**:
   - Authentication: Helper API tokens
   - Rate limits: 100 requests/day
   - Use cases: Integration with helper tools and services

2. **Client Reporting API**:
   - Authentication: Client API tokens
   - Rate limits: 1000 requests/day
   - Use cases: Integration with client business systems

3. **Marketplace Metrics API** (partners only):
   - Authentication: Partner API tokens with special access
   - Rate limits: Negotiated by partner
   - Use cases: Approved research, strategic partnerships

## Data Privacy and Compliance

### Analytics Data Privacy

1. All personal information in analytics systems is subject to:
   - Anonymization for aggregate reports
   - Pseudonymization for internal analysis
   - End-to-end encryption for exports
   - Access controls and audit logging

2. User opt-out options:
   - Optional participation in benchmark comparisons
   - Optional inclusion in research and improvement analysis
   - Required inclusion in financial and tax reporting

### Regulatory Compliance

Analytics systems comply with:
- GDPR (for EU data subjects)
- CCPA/CPRA (for California residents)
- FCRA (for background check data)
- Tax reporting regulations
- Industry-specific regulations per category

## Future Analytics Roadmap

Phase 1 (Next Quarter):
- Launch of basic helper and client dashboards
- Implementation of core marketplace health monitoring
- Establishment of data warehouse architecture

Phase 2 (6-Month Horizon):
- Predictive analytics for job matching
- AI-powered helper success recommendations
- Advanced geographic expansion analytics

Phase 3 (12-Month Horizon):
- Real-time pricing optimization
- Cross-domain analytics integration (bidding + labor)
- Advanced fraud and quality prediction systems
