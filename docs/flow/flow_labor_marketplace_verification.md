# Labor Marketplace Verification Process Flow

This document outlines the verification process flows for the Labor Marketplace domain, focusing on the multi-tier verification system that provides progressive trust building for both helpers and clients.

## Helper Identity Verification Flow

This flow illustrates how a helper's identity is verified, which is a critical step in the verification tier progression.

```mermaid
sequenceDiagram
    participant Helper
    participant VerificationUI as Verification UI
    participant VerificationService as Verification Service
    participant IDVerifyProvider as ID Verification Provider
    participant DB as Database
    participant NotificationService as Notification Service
    
    Helper->>VerificationUI: Initiates identity verification
    VerificationUI->>VerificationService: Request verification session
    
    VerificationService->>IDVerifyProvider: Create verification session
    IDVerifyProvider-->>VerificationService: Return session ID and URL
    
    VerificationService->>VerificationUI: Redirect to verification UI
    
    VerificationUI->>IDVerifyProvider: Upload ID document
    VerificationUI->>IDVerifyProvider: Complete selfie capture
    IDVerifyProvider-->>VerificationUI: Confirmation of upload
    
    IDVerifyProvider->>IDVerifyProvider: Process verification (async)
    
    IDVerifyProvider->>VerificationService: Webhook callback with result
    
    alt Verification Successful
        VerificationService->>DB: Update helper verification level
        VerificationService->>DB: Store verification reference ID
        VerificationService->>DB: Log verification event
        VerificationService->>NotificationService: Send verification success notification
        NotificationService->>Helper: "Identity verification successful" notification
    else Verification Failed
        VerificationService->>DB: Log verification failure
        VerificationService->>DB: Record failure reason
        VerificationService->>NotificationService: Send verification failure notification
        NotificationService->>Helper: "Identity verification failed" notification with reason
    end
    
    Helper->>VerificationUI: View verification status
    VerificationUI->>VerificationService: Get verification status
    VerificationService-->>VerificationUI: Return current status and next steps
```

## Background Check Process Flow

This flow illustrates the background check process, which is required for verification levels 3 and 4.

```mermaid
sequenceDiagram
    participant Helper
    participant VerificationUI as Verification UI
    participant VerificationService as Verification Service
    participant BGCheckProvider as Background Check Provider
    participant DB as Database
    participant NotificationService as Notification Service
    participant PaymentService as Payment Service
    
    Helper->>VerificationUI: Initiates background check
    
    alt Paid Background Check
        VerificationUI->>PaymentService: Process payment for check
        PaymentService-->>VerificationUI: Payment confirmation
    end
    
    VerificationUI->>VerificationService: Request background check
    
    VerificationService->>Helper: Request consent for background check
    Helper->>VerificationService: Provide consent and information
    
    VerificationService->>BGCheckProvider: Submit background check request
    BGCheckProvider-->>VerificationService: Confirm request receipt
    
    VerificationService->>DB: Update status to "pending"
    VerificationService->>NotificationService: Send check initiated notification
    NotificationService->>Helper: "Background check initiated" notification
    
    BGCheckProvider->>BGCheckProvider: Process background check (async)
    Note over BGCheckProvider: Can take 1-5 days
    
    BGCheckProvider->>VerificationService: Webhook callback with result
    
    alt Check Passed
        VerificationService->>DB: Update background check status to "passed"
        VerificationService->>DB: Update helper verification level
        VerificationService->>DB: Log verification event
        VerificationService->>NotificationService: Send check success notification
        NotificationService->>Helper: "Background check passed" notification
    else Check Failed
        VerificationService->>DB: Update background check status to "failed"
        VerificationService->>DB: Log failure reason (minimal details)
        VerificationService->>NotificationService: Send check failure notification
        NotificationService->>Helper: "Background check not passed" notification
        
        opt Appeal Process
            Helper->>VerificationService: Submit appeal with documentation
            VerificationService->>VerificationService: Manual review process
        end
    else Check Needs Review
        VerificationService->>DB: Update status to "needs_review"
        VerificationService->>NotificationService: Notify internal verification team
    end
    
    Helper->>VerificationUI: View verification status
    VerificationUI->>VerificationService: Get verification status
    VerificationService-->>VerificationUI: Return current status and next steps
```

## Skill Verification Process Flow

This flow illustrates how helper skills are verified through both official documentation and community verification.

```mermaid
sequenceDiagram
    participant Helper
    participant VerificationUI as Verification UI
    participant VerificationService as Verification Service
    participant DB as Database
    participant CommunityService as Community Service
    participant Client as Client (Previous Employer)
    participant Verifier as Verification Team
    
    Helper->>VerificationUI: Submit skill for verification
    
    alt Official Certification
        Helper->>VerificationUI: Upload certification document
        VerificationUI->>VerificationService: Submit certification for verification
        VerificationService->>DB: Store certification document reference
        VerificationService->>VerificationService: Queue for manual review
        
        Verifier->>VerificationService: Review certification document
        
        alt Certification Valid
            Verifier->>VerificationService: Approve certification
            VerificationService->>DB: Mark skill as officially verified
            VerificationService->>DB: Log verification event
            VerificationService->>Helper: Notification of verification
        else Certification Invalid
            Verifier->>VerificationService: Reject certification
            VerificationService->>DB: Log rejection reason
            VerificationService->>Helper: Notification with rejection reason
        end
    end
    
    alt Community Verification
        Helper->>VerificationUI: Request community verification
        
        opt Previous Work Reference
            VerificationUI->>VerificationService: Provide previous client reference
            VerificationService->>DB: Store reference information
            VerificationService->>Client: Send verification request email
            
            Client->>VerificationService: Complete skill verification form
            VerificationService->>DB: Record community verification
            VerificationService->>DB: Update skill verification score
            VerificationService->>Helper: Notification of new verification
        end
        
        opt Portfolio Evidence
            Helper->>VerificationUI: Upload work evidence (photos, videos)
            VerificationUI->>VerificationService: Submit evidence
            VerificationService->>DB: Store evidence references
            VerificationService->>CommunityService: Make evidence available for voting
            
            CommunityService->>CommunityService: Community members review and vote
            CommunityService->>VerificationService: Aggregate community ratings
            VerificationService->>DB: Update skill verification score
            VerificationService->>Helper: Notification of community verification
        end
    end
    
    Note over VerificationService,DB: Verification scores are calculated from multiple sources
    
    VerificationService->>DB: Update overall skill verification status
    VerificationService->>DB: Update helper profile display badges
```

## Helper Verification Level Progression Flow

This flow illustrates how helpers progress through verification levels and the triggers for each level change.

```mermaid
flowchart TD
    Start([Helper Registration]) --> BasicLevel[Basic Verification\nLevel 1]
    
    BasicLevel -->|Email & Phone Verified| EmailVerified[Basic Account Setup]
    EmailVerified -->|Profile Completion > 80%| ProfileComplete[Profile Complete]
    
    ProfileComplete -->|Initiates Identity Verification| IdentityProcess[Identity Verification Process]
    IdentityProcess -->|Identity Verified| IdentityLevel[Identity Verified\nLevel 2]
    
    IdentityLevel -->|Initiates Background Check| BGProcess[Background Check Process]
    BGProcess -->|Background Check Passed| BGLevel[Background Checked\nLevel 3]
    
    BGLevel -->|Verifies Skills & Insurance| SkillProcess[Skill & Insurance Verification]
    SkillProcess -->|Skills & Insurance Verified| FullyVerified[Fully Verified\nLevel 4]
    
    %% Alternative paths
    IdentityProcess -->|Verification Failed| RetryIdentity[Address Issues & Retry]
    RetryIdentity --> IdentityProcess
    
    BGProcess -->|Check Failed| AppealProcess[Appeal Process or Stay at Level 2]
    AppealProcess -->|Appeal Successful| BGProcess
    
    %% Required progressions for job types
    BasicLevel -.->|Can apply to basic jobs| BasicJobs[Low-trust jobs]
    IdentityLevel -.->|Can apply to standard jobs| StandardJobs[Standard jobs]
    BGLevel -.->|Can apply to high-trust jobs| HighTrustJobs[High-trust jobs]
    FullyVerified -.->|Can apply to premium jobs| PremiumJobs[Premium & in-home jobs]
    
    %% Job requirements
    classDef level fill:#f9f,stroke:#333,stroke-width:1px;
    classDef process fill:#bbf,stroke:#33b,stroke-width:1px;
    classDef jobs fill:#bfb,stroke:#3b3,stroke-width:1px;
    
    class BasicLevel,IdentityLevel,BGLevel,FullyVerified level;
    class IdentityProcess,BGProcess,SkillProcess,RetryIdentity,AppealProcess process;
    class BasicJobs,StandardJobs,HighTrustJobs,PremiumJobs jobs;
```

## Job Post Verification Requirement Flow

This flow illustrates how job posts are matched with helpers based on verification levels.

```mermaid
sequenceDiagram
    participant Client
    participant JobPostingUI as Job Posting UI
    participant JobService as Job Service
    participant SearchService as Search Service
    participant HelperDB as Helper Database
    participant NotificationService as Notification Service
    participant Helper
    
    Client->>JobPostingUI: Create job post
    JobPostingUI->>Client: Request job details
    
    Client->>JobPostingUI: Set job verification requirements
    Note over Client,JobPostingUI: Client selects verification level based on job type
    
    JobPostingUI->>JobService: Create job with verification requirements
    JobService->>JobService: Validate job requirements
    
    JobService->>HelperDB: Query helper distribution by verification levels
    HelperDB-->>JobService: Return verification level distribution
    
    alt Insufficient Helpers at Required Level
        JobService->>JobPostingUI: Warning about limited helper pool
        JobPostingUI->>Client: Display helper availability warning
        Client->>JobPostingUI: Confirm or adjust requirements
    end
    
    JobService->>SearchService: Index job with verification requirements
    
    JobService->>NotificationService: Notify eligible helpers
    NotificationService->>Helper: Job notification (only to helpers meeting requirements)
    
    Helper->>SearchService: Search for jobs
    SearchService->>SearchService: Filter based on helper verification level
    SearchService-->>Helper: Return only jobs matching verification level
    
    Helper->>JobService: Apply to job
    JobService->>JobService: Verify helper meets requirements
    
    alt Helper Meets Requirements
        JobService->>Client: Forward application
    else Helper Does Not Meet Requirements
        JobService->>Helper: Rejection with explanation
        JobService->>Helper: Suggestions to reach required verification level
    end
```

## Verification Downgrade Flow

This flow illustrates how verification levels can be downgraded based on expiration or policy violations.

```mermaid
flowchart TD
    %% Background check expiration path
    BGExpiry[Background Check Approaching Expiry] -->|90 days before expiry| ExpNotify[Send Expiration Notification]
    ExpNotify --> Renew{Helper Renews?}
    Renew -->|Yes| RenewProcess[Background Check Process]
    Renew -->|No| ExpiryWarning[Send Final Warning]
    ExpiryWarning --> Expired{Expired?}
    Expired -->|Yes| Downgrade[Downgrade to Level 2]
    Expired -->|No| ExpNotify
    
    %% Policy violation path
    Violation[Policy Violation Reported] --> Investigation[Internal Investigation]
    Investigation --> ViolationFound{Violation Confirmed?}
    ViolationFound -->|Yes| Severity{Severity Level}
    ViolationFound -->|No| MaintainLevel[Maintain Current Level]
    
    Severity -->|Minor| Warning[Issue Warning]
    Severity -->|Moderate| TempDowngrade[Temporary Downgrade]
    Severity -->|Severe| PermDowngrade[Permanent Downgrade]
    Severity -->|Critical| Suspension[Account Suspension]
    
    Warning --> SecondViolation{Repeated?}
    SecondViolation -->|Yes| TempDowngrade
    SecondViolation -->|No| MaintainLevel
    
    TempDowngrade --> RemediationPeriod[Remediation Period]
    RemediationPeriod --> Remediated{Remediated?}
    Remediated -->|Yes| RestoreLevel[Restore Previous Level]
    Remediated -->|No| PermDowngrade
    
    %% Insurance expiry path
    InsuranceExpiry[Insurance Certification Expired] --> InsuranceDowngrade[Downgrade to Level 3]
    InsuranceDowngrade --> InsuranceRenew[Insurance Renewal Process]
    InsuranceRenew --> InsuranceVerified{Verified?}
    InsuranceVerified -->|Yes| RestoreInsurance[Restore Level 4]
    InsuranceVerified -->|No| MaintainDowngrade[Maintain at Level 3]
    
    %% Styling
    classDef event fill:#f9f,stroke:#333,stroke-width:1px;
    classDef process fill:#bbf,stroke:#33b,stroke-width:1px;
    classDef decision fill:#bfb,stroke:#3b3,stroke-width:1px;
    classDef action fill:#fbb,stroke:#b33,stroke-width:1px;
    
    class BGExpiry,Violation,InsuranceExpiry event;
    class Investigation,RenewProcess,RemediationPeriod,InsuranceRenew process;
    class Renew,Expired,ViolationFound,Severity,SecondViolation,Remediated,InsuranceVerified decision;
    class Downgrade,Warning,TempDowngrade,PermDowngrade,Suspension,InsuranceDowngrade,RestoreLevel,MaintainDowngrade action;
```

## Helper Location Verification Flow

This flow illustrates how helper location is verified for on-site work check-ins.

```mermaid
sequenceDiagram
    participant Helper
    participant MobileApp as Mobile App
    participant AssignmentService as Assignment Service
    participant LocationService as Location Verification Service
    participant DB as Database
    participant Client
    
    Helper->>MobileApp: Initiate check-in
    
    MobileApp->>Helper: Request location access
    Helper->>MobileApp: Grant location access
    
    MobileApp->>LocationService: Send location coordinates
    LocationService->>LocationService: Verify device timestamp
    
    LocationService->>DB: Retrieve job site coordinates
    
    LocationService->>LocationService: Calculate distance from job site
    
    alt Within Geofence
        LocationService->>AssignmentService: Confirm valid check-in
        AssignmentService->>DB: Record check-in time and location
        AssignmentService->>MobileApp: Confirm successful check-in
        AssignmentService->>Client: Notify of helper check-in
    else Outside Geofence
        LocationService->>MobileApp: Display geofence warning
        
        opt Photo Verification Fallback
            MobileApp->>Helper: Request job site photo
            Helper->>MobileApp: Take and submit photo
            MobileApp->>AssignmentService: Submit photo with location data
            AssignmentService->>AssignmentService: Queue for manual review
            AssignmentService->>DB: Record provisional check-in
            AssignmentService->>Client: Notify of check-in pending verification
        end
        
        opt Client Override
            Helper->>MobileApp: Request client override
            MobileApp->>AssignmentService: Request override
            AssignmentService->>Client: Send override request
            Client->>AssignmentService: Approve override
            AssignmentService->>DB: Record check-in with override note
            AssignmentService->>MobileApp: Confirm successful check-in
        end
    end
    
    Helper->>MobileApp: Start work timer
    MobileApp->>AssignmentService: Update assignment status to "in progress"
    AssignmentService->>DB: Update assignment status
    AssignmentService->>Client: Notify work has started
    
    Note over MobileApp,AssignmentService: Periodic location verification may occur during assignment
```

## Dispute Resolution Flow

This flow illustrates the dispute resolution process for labor marketplace assignments.

```mermaid
sequenceDiagram
    participant Client
    participant Helper
    participant DisputeUI as Dispute UI
    participant DisputeService as Dispute Service
    participant AssignmentService as Assignment Service
    participant PaymentService as Payment Service
    participant DB as Database
    participant Mediator as Dispute Mediator
    
    alt Client Initiates Dispute
        Client->>DisputeUI: Submit dispute
        DisputeUI->>DisputeService: Create dispute case
    else Helper Initiates Dispute
        Helper->>DisputeUI: Submit dispute
        DisputeUI->>DisputeService: Create dispute case
    end
    
    DisputeService->>DB: Record dispute details
    DisputeService->>AssignmentService: Update assignment status to "disputed"
    AssignmentService->>PaymentService: Hold any pending payments
    
    DisputeService->>Client: Notify of dispute process
    DisputeService->>Helper: Notify of dispute process
    
    DisputeService->>DisputeService: Evaluate dispute severity
    
    alt Low Complexity Dispute
        DisputeService->>DisputeUI: Offer suggested resolutions
        
        opt Client Accepts Resolution
            Client->>DisputeUI: Accept resolution
            DisputeUI->>DisputeService: Record acceptance
        end
        
        opt Helper Accepts Resolution
            Helper->>DisputeUI: Accept resolution
            DisputeUI->>DisputeService: Record acceptance
        end
        
        alt Both Parties Accept
            DisputeService->>AssignmentService: Apply resolution
            AssignmentService->>PaymentService: Process adjusted payment if needed
            DisputeService->>DB: Mark dispute as resolved
            DisputeService->>Client: Send resolution confirmation
            DisputeService->>Helper: Send resolution confirmation
        end
    else High Complexity Dispute
        DisputeService->>Mediator: Assign to human mediator
        
        Mediator->>DB: Review dispute details
        Mediator->>DB: Review assignment history
        Mediator->>DB: Review communications
        
        Mediator->>Client: Request additional information
        Client->>Mediator: Provide information
        
        Mediator->>Helper: Request additional information
        Helper->>Mediator: Provide information
        
        Mediator->>Mediator: Determine resolution
        
        Mediator->>DisputeService: Submit resolution decision
        DisputeService->>AssignmentService: Apply resolution
        AssignmentService->>PaymentService: Process adjusted payment if needed
        
        DisputeService->>DB: Record resolution and reasoning
        DisputeService->>Client: Send detailed resolution explanation
        DisputeService->>Helper: Send detailed resolution explanation
    end
    
    DisputeService->>DB: Update dispute status to "resolved"
    DisputeService->>AssignmentService: Update assignment status
    
    opt Appeal Process
        alt Client Appeals
            Client->>DisputeUI: Submit appeal with new evidence
            DisputeUI->>DisputeService: Create appeal case
        else Helper Appeals
            Helper->>DisputeUI: Submit appeal with new evidence
            DisputeUI->>DisputeService: Create appeal case
        end
        
        DisputeService->>Mediator: Assign appeal to senior mediator
        Mediator->>Mediator: Review case and new evidence
        Mediator->>DisputeService: Submit final decision
        
        DisputeService->>Client: Send final decision notification
        DisputeService->>Helper: Send final decision notification
        
        DisputeService->>AssignmentService: Apply final resolution
        AssignmentService->>PaymentService: Process final payment adjustment
    end
```

These process flow diagrams illustrate the key workflows in the Labor Marketplace domain, with particular emphasis on the verification systems that build trust between parties and ensure quality service delivery.
