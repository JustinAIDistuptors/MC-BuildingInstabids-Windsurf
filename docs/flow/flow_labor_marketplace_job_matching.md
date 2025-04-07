# Labor Marketplace Job Matching & Application Process Flows

This document outlines the job matching, discovery, and application processes in the Labor Marketplace domain. These workflows are central to connecting clients with qualified helpers and enabling efficient labor sourcing.

## Job Posting and Discovery Flow

This diagram illustrates how jobs are created, matched, and discovered by potential helpers.

```mermaid
sequenceDiagram
    participant Client
    participant JobUI as Job Posting UI
    participant JobService as Job Service
    participant SearchService as Search Service
    participant AIRecommender as AI Recommendation Engine
    participant HelperDB as Helper Database
    participant NotificationService as Notification Service
    participant Helper
    
    Client->>JobUI: Create new job post
    JobUI->>Client: Request job details form
    
    Client->>JobUI: Submit job details (title, description, skills, location, timing, budget)
    JobUI->>JobService: Create job post
    
    JobService->>JobService: Validate job data
    JobService->>JobService: Generate job ID
    JobService->>JobService: Set status to "draft" or "open"
    
    JobService->>SearchService: Index job for search
    
    JobService->>AIRecommender: Request helper recommendations
    AIRecommender->>HelperDB: Query helpers matching job criteria
    
    par AI Recommendation Processing
        AIRecommender->>AIRecommender: Score helpers based on:
        Note over AIRecommender: Match skills to requirements
        Note over AIRecommender: Consider location proximity
        Note over AIRecommender: Check availability
        Note over AIRecommender: Analyze rating patterns
        Note over AIRecommender: Consider job history
        AIRecommender->>JobService: Return ranked helper recommendations
        
        JobService->>Client: Present recommended helpers
        
        opt Direct Invitation
            Client->>JobService: Select helpers to invite
            JobService->>NotificationService: Send direct job invitations
            NotificationService->>Helper: Job invitation notification
        end
    end
    
    par Search Indexing and Discovery
        SearchService->>SearchService: Process job attributes
        SearchService->>SearchService: Generate search vectors
        SearchService->>SearchService: Apply geographic indexing
        SearchService->>SearchService: Index skill requirements
    end
    
    alt Standard Discovery
        Helper->>SearchService: Search for jobs with criteria
        SearchService->>SearchService: Match criteria to indexed jobs
        SearchService->>Helper: Return matching job posts
        Helper->>JobService: View job details
    else Recommendation-Based Discovery
        JobService->>NotificationService: Schedule job match notifications
        NotificationService->>Helper: "New job matches your profile" notification
        Helper->>JobService: View recommended job
    end
    
    JobService->>JobService: Track job view metrics
    JobService->>JobService: Update job visibility score
```

## Helper Search and Filtering Flow

This diagram illustrates how clients can search for and filter potential helpers.

```mermaid
sequenceDiagram
    participant Client
    participant SearchUI as Search UI
    participant SearchService as Search Service
    participant HelperDB as Helper Database
    participant LocationService as Location Service
    participant HelperProfileService as Helper Profile Service
    
    Client->>SearchUI: Navigate to helper search
    SearchUI->>Client: Present search form
    
    Client->>SearchUI: Enter search criteria (skills, location, dates)
    SearchUI->>SearchService: Submit search request
    
    par Location Processing
        SearchService->>LocationService: Resolve location to coordinates
        LocationService->>SearchService: Return geocoded location
    end
    
    SearchService->>HelperDB: Query helpers matching criteria
    
    alt Skill-Based Search
        SearchService->>HelperDB: Query by required skills
        HelperDB->>SearchService: Return skill matches
    else Category-Based Search
        SearchService->>HelperDB: Query by skill category
        HelperDB->>SearchService: Return category matches
    else Keyword Search
        SearchService->>HelperDB: Full-text search on profiles
        HelperDB->>SearchService: Return text matches
    end
    
    SearchService->>SearchService: Apply filters:
    Note over SearchService: Verification level filter
    Note over SearchService: Rating threshold filter
    Note over SearchService: Availability filter
    Note over SearchService: Rate range filter
    
    SearchService->>SearchService: Sort results:
    Note over SearchService: By relevance
    Note over SearchService: By rating
    Note over SearchService: By distance
    Note over SearchService: By verification level
    
    SearchService->>SearchUI: Return search results
    
    SearchUI->>Client: Display helper list
    
    Client->>SearchUI: Select helper to view
    SearchUI->>HelperProfileService: Request helper profile
    HelperProfileService->>SearchUI: Return helper details
    SearchUI->>Client: Display helper profile
    
    opt Direct Hire or Invite
        Client->>SearchUI: Select "Invite to Job"
        SearchUI->>Client: Show job selection dialog
        Client->>SearchUI: Select job to invite to
        SearchUI->>HelperProfileService: Send job invitation
        HelperProfileService->>HelperProfileService: Create job invitation
    end
```

## Job Application Flow

This diagram illustrates the process of a helper applying to a job post.

```mermaid
sequenceDiagram
    participant Helper
    participant JobUI as Job UI
    participant JobService as Job Service
    participant ApplicationService as Application Service
    participant ClientDB as Client Database
    participant NotificationService as Notification Service
    participant Client
    
    Helper->>JobUI: View job details
    JobUI->>Helper: Show job requirements and details
    
    Helper->>JobUI: Click "Apply"
    
    JobUI->>ApplicationService: Check eligibility
    ApplicationService->>ApplicationService: Verify helper meets job requirements
    
    alt Helper Meets Requirements
        ApplicationService-->>JobUI: Eligible to apply
        JobUI->>Helper: Show application form
        
        Helper->>JobUI: Complete application (rate, availability, cover letter)
        JobUI->>ApplicationService: Submit application
        
        ApplicationService->>ApplicationService: Validate application
        ApplicationService->>ApplicationService: Generate application ID
        ApplicationService->>ApplicationService: Set status to "submitted"
        ApplicationService->>JobService: Associate application with job
        
        ApplicationService->>NotificationService: Send application confirmation
        NotificationService->>Helper: "Application submitted" confirmation
        
        ApplicationService->>NotificationService: Notify client of new application
        NotificationService->>Client: "New application received" notification
    else Helper Does Not Meet Requirements
        ApplicationService-->>JobUI: Not eligible with reason
        JobUI->>Helper: Show eligibility requirements and reason
        
        opt Verification Level Upgrade
            Helper->>JobUI: "Upgrade verification level" option
            JobUI->>Helper: Redirect to verification process
        end
    else Already Applied
        ApplicationService-->>JobUI: Application already exists
        JobUI->>Helper: Show existing application status
    end
```

## Application Review and Hiring Flow

This diagram illustrates how clients review applications and make hiring decisions.

```mermaid
sequenceDiagram
    participant Client
    participant ApplicationUI as Application UI
    participant ApplicationService as Application Service
    participant HelperProfileService as Helper Profile Service
    participant JobService as Job Service
    participant NotificationService as Notification Service
    participant Helper
    participant AssignmentService as Assignment Service
    participant PaymentService as Payment Service
    
    Client->>ApplicationUI: View job applications
    ApplicationUI->>ApplicationService: Request applications for job
    ApplicationService->>ApplicationUI: Return list of applications
    
    ApplicationUI->>Client: Display application list with:
    Note over ApplicationUI,Client: Helper ratings and verification level
    Note over ApplicationUI,Client: Proposed rate and availability
    Note over ApplicationUI,Client: Application date
    
    Client->>ApplicationUI: Select application to review
    ApplicationUI->>ApplicationService: Get application details
    ApplicationService->>HelperProfileService: Get helper profile details
    HelperProfileService->>ApplicationService: Return helper details
    ApplicationService->>ApplicationUI: Return complete application
    
    ApplicationUI->>Client: Show detailed application with:
    Note over ApplicationUI,Client: Helper skills and experience
    Note over ApplicationUI,Client: Cover letter
    Note over ApplicationUI,Client: Previous work samples
    Note over ApplicationUI,Client: Reviews from past clients
    
    alt Application Shortlisting
        Client->>ApplicationUI: Mark application as "shortlisted"
        ApplicationUI->>ApplicationService: Update status to "shortlisted"
        ApplicationService->>NotificationService: Notify helper of shortlisting
        NotificationService->>Helper: "Application shortlisted" notification
    else Application Rejection
        Client->>ApplicationUI: Reject application
        ApplicationUI->>Client: Request rejection reason
        Client->>ApplicationUI: Provide rejection reason
        ApplicationUI->>ApplicationService: Update status to "rejected"
        ApplicationService->>NotificationService: Notify helper of rejection
        NotificationService->>Helper: "Application not selected" notification
    else Direct Hiring
        Client->>ApplicationUI: Select "Hire" option
        ApplicationUI->>Client: Confirm hiring details (start date, rate)
        Client->>ApplicationUI: Confirm hiring
        
        ApplicationUI->>ApplicationService: Update status to "hired"
        ApplicationService->>JobService: Update job status to "filled" or "in_progress"
        
        ApplicationService->>AssignmentService: Create labor assignment
        AssignmentService->>AssignmentService: Generate assignment ID
        AssignmentService->>AssignmentService: Set status to "scheduled"
        
        opt Escrow Payment
            AssignmentService->>PaymentService: Create payment escrow
            PaymentService->>AssignmentService: Confirm escrow creation
        end
        
        AssignmentService->>NotificationService: Send hiring notifications
        NotificationService->>Helper: "You've been hired" notification
        NotificationService->>Client: "Hiring confirmed" notification
    end
```

## Matching Algorithm Logic Flow

This diagram illustrates the core logic of the matching algorithm that connects helpers to relevant jobs.

```mermaid
flowchart TD
    Start([Start Matching]) --> SkillMatch[Match Skills to Requirements]
    
    SkillMatch --> SkillScore[Calculate Skill Match Score]
    SkillScore --> SkillWeight[Apply Skill Importance Weights]
    
    SkillWeight --> LocationMatch[Location Proximity Evaluation]
    LocationMatch --> TravelCalc[Calculate Travel Distance]
    TravelCalc --> PreferenceCheck[Check Helper Travel Preferences]
    
    PreferenceCheck --> AvailabilityCheck[Check Helper Availability]
    AvailabilityCheck --> AvailabilityFilter{Availability Match?}
    
    AvailabilityFilter -->|No| Exclude[Exclude from Matches]
    AvailabilityFilter -->|Yes| VerificationCheck[Check Verification Level]
    
    VerificationCheck --> VerificationFilter{Meets Required Level?}
    VerificationFilter -->|No| Exclude
    VerificationFilter -->|Yes| RateCheck[Compare Rate Expectations]
    
    RateCheck --> RateFilter{Rate Compatible?}
    RateFilter -->|No| Exclude
    RateFilter -->|Yes| PriorWorkCheck[Check Prior Work Relationship]
    
    PriorWorkCheck --> RatingCheck[Evaluate Ratings & Reviews]
    
    RatingCheck --> FinalScore[Calculate Final Match Score]
    FinalScore --> Ranking[Rank Matches by Score]
    
    Ranking --> TopMatches[Select Top Matches]
    TopMatches --> PromoteRecent[Promote Recent Activity]
    PromoteRecent --> DiversifyResults[Diversify Results]
    
    DiversifyResults --> End([Return Ranked Matches])
    
    %% Additional analytics path
    Ranking -.-> AnalyticsUpdate[Update Match Analytics]
    AnalyticsUpdate -.-> FeedbackLoop[Feedback Loop to Algorithm]
    
    %% Style definitions
    classDef process fill:#f9f,stroke:#333,stroke-width:1px;
    classDef filter fill:#bbf,stroke:#33b,stroke-width:1px;
    classDef score fill:#bfb,stroke:#3b3,stroke-width:1px;
    classDef result fill:#fbb,stroke:#b33,stroke-width:1px;
    
    class SkillMatch,LocationMatch,AvailabilityCheck,VerificationCheck,RateCheck,PriorWorkCheck,RatingCheck process;
    class AvailabilityFilter,VerificationFilter,RateFilter filter;
    class SkillScore,SkillWeight,TravelCalc,FinalScore,Ranking score;
    class Exclude,TopMatches,PromoteRecent,DiversifyResults,End result;
```

## Group Application Flow

This diagram illustrates how a team of helpers can apply to a job as a group.

```mermaid
sequenceDiagram
    participant Leader as Team Leader
    participant TeamMembers as Team Members
    participant TeamUI as Team UI
    participant TeamService as Team Service
    participant JobService as Job Service
    participant ApplicationService as Application Service
    participant NotificationService as Notification Service
    participant Client
    
    Leader->>TeamUI: Create helper team
    TeamUI->>TeamService: Create team record
    
    Leader->>TeamUI: Invite team members
    TeamUI->>TeamService: Store team invitations
    TeamService->>NotificationService: Send team invitations
    NotificationService->>TeamMembers: "Team invitation" notifications
    
    TeamMembers->>TeamUI: Accept team invitations
    TeamUI->>TeamService: Update team member status
    
    Leader->>JobService: View job opportunity
    JobService->>Leader: Show job details
    
    Leader->>TeamUI: Select "Apply as Team"
    TeamUI->>ApplicationService: Initiate team application
    
    ApplicationService->>TeamService: Verify team eligibility
    TeamService->>ApplicationService: Return eligibility status
    
    alt Team Eligible
        ApplicationService->>TeamUI: Show team application form
        
        Leader->>TeamUI: Complete team application
        TeamUI->>ApplicationService: Submit team application
        
        ApplicationService->>ApplicationService: Create team application
        ApplicationService->>ApplicationService: Create individual applications
        ApplicationService->>ApplicationService: Link applications as team
        
        ApplicationService->>JobService: Update job with team application
        
        ApplicationService->>NotificationService: Send team application confirmations
        NotificationService->>Leader: "Team application submitted" notification
        NotificationService->>TeamMembers: "Your team has applied" notifications
        
        ApplicationService->>NotificationService: Notify client of team application
        NotificationService->>Client: "Team application received" notification
    else Team Not Eligible
        ApplicationService->>TeamUI: Show eligibility requirements
        TeamUI->>Leader: Display team eligibility issues
    end
    
    alt Team Hired
        Client->>JobService: Select "Hire Team"
        JobService->>ApplicationService: Update team application status
        ApplicationService->>ApplicationService: Update all team member applications
        
        ApplicationService->>NotificationService: Send team hiring notifications
        NotificationService->>Leader: "Your team is hired" notification
        NotificationService->>TeamMembers: "Your team is hired" notifications
        
        ApplicationService->>JobService: Update job status to "filled"
    end
```

## Contractor Labor Pool Flow

This diagram illustrates how contractors can maintain and deploy their own labor pool for projects.

```mermaid
sequenceDiagram
    participant Contractor
    participant LaborPoolUI as Labor Pool UI
    participant LaborPoolService as Labor Pool Service
    participant HelperDB as Helper Database
    participant JobService as Job Service
    participant NotificationService as Notification Service
    participant Helper
    
    Contractor->>LaborPoolUI: Create labor pool
    LaborPoolUI->>LaborPoolService: Initialize contractor labor pool
    
    alt Add Existing Helpers
        Contractor->>LaborPoolUI: Search for helpers
        LaborPoolUI->>HelperDB: Query helpers matching criteria
        HelperDB->>LaborPoolUI: Return helper search results
        
        Contractor->>LaborPoolUI: Send pool invitation
        LaborPoolUI->>LaborPoolService: Create pool invitation
        LaborPoolService->>NotificationService: Send labor pool invitation
        NotificationService->>Helper: "Labor pool invitation" notification
        
        Helper->>LaborPoolService: Accept pool invitation
        LaborPoolService->>LaborPoolService: Add helper to contractor's pool
        LaborPoolService->>NotificationService: Send confirmation notifications
        NotificationService->>Contractor: "Helper joined pool" notification
    end
    
    alt Labor Pool Job Assignment
        Contractor->>JobService: Create new job
        JobService->>Contractor: Job creation form
        
        Contractor->>JobService: Select "Use Labor Pool"
        JobService->>LaborPoolService: Request contractor's labor pool
        LaborPoolService->>JobService: Return available pool helpers
        
        Contractor->>JobService: Select helpers for job
        JobService->>JobService: Create job with pre-selected helpers
        
        JobService->>NotificationService: Notify assigned helpers
        NotificationService->>Helper: "Direct job assignment" notification
        
        Helper->>JobService: Accept or decline assignment
        
        alt Helper Accepts
            JobService->>JobService: Confirm helper assignment
            JobService->>NotificationService: Send acceptance confirmation
            NotificationService->>Contractor: "Helper accepted assignment" notification
        else Helper Declines
            JobService->>JobService: Remove helper assignment
            JobService->>NotificationService: Send decline notification
            NotificationService->>Contractor: "Helper declined assignment" notification
        end
    end
    
    alt Contractor Insight Dashboard
        Contractor->>LaborPoolUI: View labor pool analytics
        LaborPoolUI->>LaborPoolService: Request pool performance metrics
        LaborPoolService->>LaborPoolUI: Return pool analytics:
        Note over LaborPoolUI: Helper availability stats
        Note over LaborPoolUI: Skill coverage analysis
        Note over LaborPoolUI: Historical performance
        Note over LaborPoolUI: Utilization metrics
        LaborPoolUI->>Contractor: Display labor pool dashboard
    end
```

These workflow diagrams illustrate the key processes in the Labor Marketplace for connecting helpers with appropriate job opportunities, ensuring effective matching, and facilitating team-based work arrangements.
