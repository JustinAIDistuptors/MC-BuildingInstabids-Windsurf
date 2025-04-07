# Labor Marketplace Flow

This document outlines the end-to-end process flows for InstaBids' labor marketplace, which enables both homeowners and contractors to find and hire on-demand labor help.

## Helper Registration and Verification Flow

```mermaid
sequenceDiagram
    participant H as Helper
    participant AS as Auth Service
    participant LMS as Labor Marketplace Service
    participant VS as Verification Service
    participant BCS as Background Check Service
    
    H->>AS: Create Account
    AS->>H: Return User Account
    H->>LMS: Create Helper Profile
    LMS->>H: Return Basic Profile (Status: 'pending_verification')
    
    %% Identity Verification
    H->>VS: Submit Identity Documents
    VS->>VS: Process Documents
    VS->>LMS: Update Identity Verification
    
    %% Skills and Certifications
    H->>LMS: Add Skills
    H->>LMS: Add Certifications
    H->>LMS: Add Work History
    H->>LMS: Set Availability
    LMS->>LMS: Calculate Profile Completion %
    
    %% Background Check (Optional but Required for Higher Verification Levels)
    H->>LMS: Initiate Background Check
    LMS->>BCS: Request Background Check
    BCS->>H: Collect Additional Information
    BCS->>BCS: Process Background Check
    BCS->>LMS: Return Background Check Results
    
    alt Background Check Passed
        LMS->>LMS: Update Profile Status to 'verified'
        LMS->>LMS: Set Verification Level to 'background_checked'
        LMS->>H: Notify Verification Complete
    else Background Check Failed
        LMS->>LMS: Update Background Check Status to 'failed'
        LMS->>H: Notify Background Check Issue
    end
    
    %% Profile Review and Approval
    LMS->>LMS: Review Profile Completeness
    
    alt Profile Complete
        LMS->>LMS: Set Profile Status to 'active'
        LMS->>H: Notify Profile Activated
    else Profile Incomplete
        LMS->>H: Request Additional Information
    end
```

## Job Posting and Hiring Flow

```mermaid
sequenceDiagram
    participant C as Client (Homeowner/Contractor)
    participant LMS as Labor Marketplace Service
    participant NS as Notification Service
    participant H as Helper
    participant PM as Project Management
    participant RS as Recommendation System
    
    C->>LMS: Create Labor Job Post
    LMS->>LMS: Validate Job Requirements
    LMS->>C: Return Job Post (Status: 'draft')
    
    C->>LMS: Publish Job Post
    LMS->>LMS: Change Status to 'open'
    
    %% Notification and Discovery
    LMS->>RS: Analyze Job Requirements
    RS->>RS: Find Matching Helpers
    RS->>NS: Send Job Notifications
    NS-->>H: Notify of Matching Job
    
    %% Application Process
    H->>LMS: View Job Details
    H->>LMS: Submit Application
    LMS->>NS: Notify Client of Application
    NS-->>C: Notify New Application
    
    %% Review and Selection
    C->>LMS: Review Applications
    C->>LMS: Update Application Status to 'shortlisted'
    
    alt Direct Hire
        C->>LMS: Update Application Status to 'hired'
        LMS->>LMS: Create Labor Assignment
        LMS->>NS: Notify Helper of Hire
        NS-->>H: Notify Hired
        
    else Request More Info
        C->>LMS: Send Message to Helper
        LMS->>NS: Deliver Message
        NS-->>H: Receive Message
        H->>LMS: Respond to Message
        LMS->>NS: Deliver Response
        NS-->>C: Receive Response
        
        C->>LMS: Update Application Status to 'hired'
        LMS->>LMS: Create Labor Assignment
        LMS->>NS: Notify Helper of Hire
        NS-->>H: Notify Hired
    end
    
    %% Job Confirmation
    H->>LMS: Confirm Assignment
    LMS->>LMS: Update Assignment Status to 'scheduled'
    
    %% Project Integration (Optional)
    alt Associated with Project
        LMS->>PM: Link Assignment to Project
        PM->>PM: Update Project Status
    end
```

## Work Execution and Time Tracking Flow

```mermaid
sequenceDiagram
    participant C as Client (Homeowner/Contractor)
    participant H as Helper
    participant LMS as Labor Marketplace Service
    participant PS as Payment Service
    participant GPS as Geolocation Service
    
    %% Work Start
    H->>LMS: Record Check-In
    LMS->>GPS: Verify Location
    LMS->>LMS: Create Check-In Record
    LMS->>LMS: Update Assignment Status to 'in_progress'
    
    %% Task Management
    C->>LMS: Assign Task
    LMS->>H: Notify New Task
    H->>LMS: Update Task Status to 'in_progress'
    H->>LMS: Update Task Status to 'completed'
    H->>LMS: Add Completion Photos
    
    %% Work End
    H->>LMS: Record Check-Out
    LMS->>GPS: Verify Location
    LMS->>LMS: Calculate Hours Worked
    LMS->>LMS: Update Check-In Record
    
    %% Verification
    C->>LMS: Verify Hours Worked
    
    alt Hours Accepted
        LMS->>LMS: Set Verification Status to 'verified'
        
    else Hours Disputed
        LMS->>LMS: Set Verification Status to 'disputed'
        C->>LMS: Provide Adjusted Hours
        LMS->>LMS: Update Hours (Original Preserved)
        LMS->>LMS: Set Verification Status to 'adjusted'
    end
    
    %% Completion
    C->>LMS: Mark Assignment Complete
    LMS->>LMS: Update Assignment Status to 'completed'
    LMS->>LMS: Calculate Final Payment
    
    %% Payment
    LMS->>PS: Initiate Payment
    PS->>PS: Process Payment
    PS->>C: Charge Client
    PS->>H: Pay Helper (minus platform fee)
    
    %% Rating and Review
    C->>LMS: Submit Helper Review
    H->>LMS: Submit Client Review
    LMS->>LMS: Update Helper Ratings
    LMS->>LMS: Update Helper Metrics (jobs completed, hours, etc.)
```

## Team-Based Work Flow

```mermaid
sequenceDiagram
    participant TL as Team Leader (Helper)
    participant TM as Team Members (Helpers)
    participant C as Client
    participant LMS as Labor Marketplace Service
    participant PS as Payment Service
    
    %% Team Creation
    TL->>LMS: Create Team
    LMS->>TL: Return Team (Status: 'forming')
    TL->>LMS: Invite Helpers to Team
    LMS-->>TM: Send Team Invitations
    TM->>LMS: Accept Team Invitation
    LMS->>LMS: Update Team Member Status
    
    %% Team Job Application
    TL->>LMS: View Job Posts
    TL->>LMS: Apply as Team
    LMS->>C: Notify Team Application
    C->>LMS: Review Team Profile
    C->>LMS: Hire Team
    LMS->>LMS: Create Team Assignment
    
    %% Team Work Allocation
    TL->>LMS: Assign Team Members to Roles
    LMS->>LMS: Create Team Member Assignments
    LMS->>TM: Notify Role Assignment
    
    %% Work Execution
    TL->>LMS: Record Team Check-In
    TM->>LMS: Record Individual Check-Ins
    TL->>LMS: Manage Team Tasks
    TM->>LMS: Update Task Status
    
    %% Completion and Payment
    TL->>LMS: Mark Team Assignment Complete
    C->>LMS: Verify and Approve Work
    LMS->>LMS: Calculate Team Payment
    LMS->>PS: Process Team Payment
    PS->>TL: Distribute Team Leader Share
    PS->>TM: Distribute Team Member Shares
    
    %% Ratings
    C->>LMS: Review Team Performance
    LMS->>LMS: Update Team Rating
    LMS->>LMS: Update Individual Helper Ratings
```

## Dispute Resolution Flow

```mermaid
sequenceDiagram
    participant P1 as Party 1 (Initiator)
    participant P2 as Party 2 (Respondent)
    participant LMS as Labor Marketplace Service
    participant MS as Mediation Service
    participant PS as Payment Service
    
    %% Dispute Initiation
    P1->>LMS: Create Dispute
    LMS->>LMS: Set Dispute Status to 'opened'
    LMS->>P2: Notify of Dispute
    
    %% Evidence Collection
    P1->>LMS: Add Evidence to Dispute
    P2->>LMS: Add Response Evidence
    
    %% Communication
    P1->>LMS: Send Dispute Message
    LMS->>P2: Deliver Message
    P2->>LMS: Send Response
    LMS->>P1: Deliver Response
    
    %% Resolution Attempts
    alt Parties Reach Agreement
        P1->>LMS: Propose Resolution
        LMS->>P2: Present Resolution Proposal
        P2->>LMS: Accept Resolution
        LMS->>LMS: Set Status to 'resolved'
        LMS->>LMS: Record Resolution Terms
        
    else Mediation Required
        LMS->>LMS: Set Status to 'mediation'
        LMS->>MS: Assign Mediator
        MS->>P1: Request Additional Information
        MS->>P2: Request Additional Information
        MS->>LMS: Submit Resolution Decision
        
    else Escalation Required
        LMS->>LMS: Set Status to 'escalated'
        LMS->>MS: Escalate to Senior Mediation
        MS->>LMS: Submit Final Decision
    end
    
    %% Resolution Implementation
    LMS->>LMS: Update Assignment Records
    
    alt Payment Adjustment Required
        LMS->>PS: Process Payment Adjustment
        PS->>PS: Refund or Charge Difference
    end
    
    %% Closure
    LMS->>LMS: Set Dispute Status to 'closed'
    LMS->>P1: Notify Dispute Closed
    LMS->>P2: Notify Dispute Closed
```

## Helper Verification and Reputation Flow

```mermaid
sequenceDiagram
    participant H as Helper
    participant C as Client (Previous Employer)
    participant CV as Community Verifier
    participant LMS as Labor Marketplace Service
    participant BS as Badge Service
    
    %% Work Completion & Review
    C->>LMS: Complete Assignment with Helper
    C->>LMS: Submit Helper Review
    LMS->>LMS: Update Helper Ratings
    
    %% Community Verification
    C->>LMS: Submit Skill Verification
    LMS->>LMS: Add Community Verification (pending)
    LMS->>LMS: Review Verification
    LMS->>LMS: Set Verification to 'approved'
    
    %% Third-Party Verifications
    CV->>LMS: Submit Verification for Helper
    LMS->>H: Notify of Verification
    H->>LMS: Accept Verification
    LMS->>LMS: Add Community Verification
    
    %% Badge Award
    LMS->>BS: Check Badge Criteria
    
    alt Criteria Met
        BS->>LMS: Award Badge
        LMS->>LMS: Add Badge to Helper Profile
        LMS->>H: Notify Badge Earned
    end
    
    %% Reputation Score Updates
    LMS->>LMS: Calculate Reliability Score
    LMS->>LMS: Calculate Quality Score
    LMS->>LMS: Calculate Communication Score
    LMS->>LMS: Update Overall Rating
```

## Key Process Points

### Helper Registration
1. **Identity Verification**: Multiple mechanisms including document verification, phone/email verification, and background checks
2. **Skill Verification**: Self-declaration with progressive community verification
3. **Compliance Checks**: Background checks for certain job types and verification levels

### Job Posting
1. **Requirement Specification**: Detailed job requirements including skills, verification level, and job location
2. **Helper Matching**: Intelligent matching based on skills, location, and availability
3. **Real-time Notifications**: Immediate notifications to qualified helpers

### Work Execution
1. **Location Verification**: Check-ins include location verification to ensure on-site presence
2. **Task Management**: Granular task tracking with photos and completion verification
3. **Time Tracking**: Detailed time-tracking with breaks and client verification

### Team Operations
1. **Specialized Teams**: Teams with complementary skills can form for larger jobs
2. **Payment Distribution**: Automatic distribution of earnings based on role and contribution
3. **Collective Reputation**: Team reputation builds alongside individual reputations

### Dispute Resolution
1. **Evidence-Based Resolution**: Structured evidence collection and evaluation
2. **Mediation Services**: Third-party mediation for complex disputes
3. **Fair Resolution**: Multiple resolution types including partial refunds and credit adjustments

### Trust Building
1. **Progressive Trust**: Helpers build trust through successful jobs and verifications
2. **Badge System**: Achievement recognition for reliability, skills, and quality
3. **Community Verification**: Peers and previous clients can verify specific skills

This comprehensive labor marketplace flow enables InstaBids to provide a reliable, transparent, and efficient system for connecting homeowners and contractors with skilled labor help, while ensuring quality, safety, and fair treatment for all parties.
