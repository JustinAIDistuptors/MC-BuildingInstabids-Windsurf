# Labor Marketplace Assignment & Work Execution Process Flows

This document outlines the assignment, work execution, time tracking, and payment processes in the Labor Marketplace domain. These workflows are essential for managing the actual delivery of labor services after the matching and hiring phases.

## Assignment Creation and Scheduling Flow

This diagram illustrates how a labor assignment is created, scheduled, and communicated to all parties.

```mermaid
sequenceDiagram
    participant Client
    participant AssignmentUI as Assignment UI
    participant AssignmentService as Assignment Service
    participant HelperProfileService as Helper Profile Service
    participant NotificationService as Notification Service
    participant Helper
    participant CalendarService as Calendar Service
    participant JobService as Job Service
    participant PaymentService as Payment Service
    
    Client->>AssignmentUI: Create assignment from hired application
    AssignmentUI->>AssignmentService: Initialize assignment
    
    AssignmentService->>HelperProfileService: Verify helper availability
    HelperProfileService->>AssignmentService: Return availability status
    
    alt Helper Available
        AssignmentService->>AssignmentService: Generate assignment ID
        AssignmentService->>AssignmentService: Set status to "scheduled"
        
        Client->>AssignmentUI: Provide assignment details (date, time, location, instructions)
        AssignmentUI->>AssignmentService: Submit assignment details
        
        AssignmentService->>JobService: Update job status to "in_progress" or "filled"
        
        opt Escrow Payment
            AssignmentService->>PaymentService: Create payment escrow
            PaymentService->>AssignmentService: Confirm escrow creation
        end
        
        AssignmentService->>NotificationService: Send assignment notifications
        NotificationService->>Helper: "New assignment" notification
        
        AssignmentService->>CalendarService: Create calendar events
        CalendarService->>Helper: Add to helper's calendar
        CalendarService->>Client: Add to client's calendar
        
        Helper->>AssignmentUI: Review and confirm assignment
        AssignmentUI->>AssignmentService: Record helper confirmation
        AssignmentService->>NotificationService: Send confirmation notification
        NotificationService->>Client: "Helper confirmed assignment" notification
    else Helper Unavailable
        AssignmentService->>AssignmentUI: Report scheduling conflict
        AssignmentUI->>Client: Display conflict and suggest alternatives
        
        Client->>AssignmentUI: Select alternative time
        AssignmentUI->>AssignmentService: Try alternative schedule
    end
    
    opt Assignment Adjustments
        Client->>AssignmentUI: Request assignment change
        AssignmentUI->>AssignmentService: Submit change request
        AssignmentService->>NotificationService: Send change request notification
        NotificationService->>Helper: "Assignment change request" notification
        
        alt Helper Accepts Change
            Helper->>AssignmentUI: Accept schedule change
            AssignmentUI->>AssignmentService: Update assignment details
            AssignmentService->>NotificationService: Send confirmation notifications
            NotificationService->>Client: "Change request accepted" notification
            
            AssignmentService->>CalendarService: Update calendar events
            CalendarService->>Helper: Update helper's calendar
            CalendarService->>Client: Update client's calendar
        else Helper Declines Change
            Helper->>AssignmentUI: Decline schedule change
            AssignmentUI->>AssignmentService: Record decline response
            AssignmentService->>NotificationService: Send decline notification
            NotificationService->>Client: "Change request declined" notification
        end
    end
```

## Assignment Check-In and Work Execution Flow

This diagram illustrates the process when a helper arrives at a job site, checks in, performs work, and checks out.

```mermaid
sequenceDiagram
    participant Helper
    participant MobileApp as Mobile App
    participant AssignmentService as Assignment Service
    participant LocationService as Location Verification Service
    participant NotificationService as Notification Service
    participant Client
    participant TimerService as Timer Service
    participant DB as Database
    
    Helper->>MobileApp: Navigate to upcoming assignment
    MobileApp->>Helper: Show assignment details and check-in button
    
    Note over Helper,MobileApp: When helper arrives at job site
    
    Helper->>MobileApp: Tap "Check In"
    
    MobileApp->>LocationService: Send current location
    LocationService->>LocationService: Verify proximity to job site
    
    alt Valid Location
        LocationService->>AssignmentService: Confirm location validity
        AssignmentService->>AssignmentService: Record check-in time and location
        AssignmentService->>DB: Update assignment status to "in_progress"
        
        AssignmentService->>NotificationService: Send check-in notification
        NotificationService->>Client: "Helper has checked in" notification
        
        AssignmentService->>MobileApp: Confirm successful check-in
        
        MobileApp->>TimerService: Start work timer
        TimerService->>MobileApp: Initialize timer
        
        MobileApp->>Helper: Show active assignment interface with:
        Note over MobileApp,Helper: Running timer
        Note over MobileApp,Helper: Job details and instructions
        Note over MobileApp,Helper: Check-out button
        Note over MobileApp,Helper: Issue reporting option
        
        opt Work Notes and Photos
            Helper->>MobileApp: Add work notes
            MobileApp->>AssignmentService: Save work notes
            
            Helper->>MobileApp: Take progress photos
            MobileApp->>AssignmentService: Upload and associate photos
        end
        
        opt Client Communication
            Helper->>MobileApp: Send message to client
            MobileApp->>NotificationService: Route message to client
            NotificationService->>Client: "Message from helper" notification
            
            Client->>NotificationService: Reply to message
            NotificationService->>MobileApp: Deliver client's response
            MobileApp->>Helper: Show client's message
        end
    else Invalid Location
        LocationService->>AssignmentService: Report location mismatch
        AssignmentService->>MobileApp: Display location verification error
        
        MobileApp->>Helper: Show options:
        Note over MobileApp,Helper: Retry location verification
        Note over MobileApp,Helper: Submit photo verification
        Note over MobileApp,Helper: Request client override
        
        alt Photo Verification
            Helper->>MobileApp: Take job site photo
            MobileApp->>AssignmentService: Submit photo for verification
            AssignmentService->>AssignmentService: Queue for review or AI verification
            AssignmentService->>MobileApp: Allow provisional check-in
            
            MobileApp->>TimerService: Start work timer (provisional)
            AssignmentService->>NotificationService: Send provisional check-in notification
            NotificationService->>Client: "Helper check-in pending verification" notification
        else Client Override
            Helper->>MobileApp: Request client override
            MobileApp->>AssignmentService: Submit override request
            AssignmentService->>NotificationService: Send override request
            NotificationService->>Client: "Check-in override request" notification
            
            Client->>NotificationService: Approve override
            NotificationService->>AssignmentService: Forward override approval
            AssignmentService->>MobileApp: Allow check-in with override note
            
            MobileApp->>TimerService: Start work timer
            AssignmentService->>DB: Update assignment with override note
        end
    end
    
    Note over Helper,MobileApp: When work is completed
    
    Helper->>MobileApp: Tap "Check Out"
    
    MobileApp->>TimerService: Stop work timer
    TimerService->>MobileApp: Return total time worked
    
    MobileApp->>Helper: Show work summary form
    Helper->>MobileApp: Complete and submit:
    Note over MobileApp,Helper: Total hours worked
    Note over MobileApp,Helper: Work completed description
    Note over MobileApp,Helper: Any materials used
    Note over MobileApp,Helper: Final work photos
    
    MobileApp->>LocationService: Verify check-out location
    LocationService->>AssignmentService: Confirm location validity
    
    AssignmentService->>AssignmentService: Record check-out time and details
    AssignmentService->>DB: Update assignment status to "completed"
    
    AssignmentService->>NotificationService: Send work completion notification
    NotificationService->>Client: "Work completed, verification required" notification
```

## Work Verification and Payment Flow

This diagram illustrates the process of verifying completed work and processing payment.

```mermaid
sequenceDiagram
    participant Helper
    participant Client
    participant VerificationUI as Verification UI
    participant AssignmentService as Assignment Service
    participant PaymentService as Payment Service
    participant NotificationService as Notification Service
    participant DisputeService as Dispute Service
    participant RatingService as Rating Service
    
    AssignmentService->>NotificationService: Send verification request
    NotificationService->>Client: "Verify work completion" notification
    
    Client->>VerificationUI: Review work details
    VerificationUI->>Client: Show:
    Note over VerificationUI,Client: Work time log
    Note over VerificationUI,Client: Helper notes
    Note over VerificationUI,Client: Work photos
    Note over VerificationUI,Client: Total amount due
    
    alt Work Accepted
        Client->>VerificationUI: Approve work
        VerificationUI->>AssignmentService: Record work approval
        AssignmentService->>AssignmentService: Update status to "verified"
        
        AssignmentService->>PaymentService: Request payment processing
        
        alt Escrow Payment
            PaymentService->>PaymentService: Release funds from escrow
            PaymentService->>AssignmentService: Confirm payment release
        else Direct Payment
            PaymentService->>PaymentService: Process payment
            PaymentService->>AssignmentService: Confirm payment processing
        end
        
        AssignmentService->>NotificationService: Send payment notifications
        NotificationService->>Helper: "Payment processed" notification
        NotificationService->>Client: "Payment completed" notification
        
        AssignmentService->>RatingService: Prompt for ratings
        RatingService->>NotificationService: Send rating requests
        NotificationService->>Helper: "Rate your client" notification
        NotificationService->>Client: "Rate your helper" notification
        
        Helper->>RatingService: Submit client rating
        Client->>RatingService: Submit helper rating
        
        RatingService->>RatingService: Process ratings
        RatingService->>AssignmentService: Update assignment with ratings
    else Work Disputed
        Client->>VerificationUI: Raise work issues
        VerificationUI->>Client: Request issue details
        Client->>VerificationUI: Provide issue description
        
        VerificationUI->>DisputeService: Create work dispute
        DisputeService->>DisputeService: Generate dispute ID
        DisputeService->>AssignmentService: Update status to "disputed"
        
        DisputeService->>PaymentService: Hold payment
        
        DisputeService->>NotificationService: Send dispute notifications
        NotificationService->>Helper: "Work dispute filed" notification
        NotificationService->>Client: "Dispute process initiated" notification
        
        DisputeService->>DisputeService: Start resolution process
        Note over DisputeService: Resolution process flows documented separately
    else Partial Acceptance
        Client->>VerificationUI: Request partial payment
        VerificationUI->>Client: Enter partially completed scope
        Client->>VerificationUI: Specify partial payment amount
        
        VerificationUI->>AssignmentService: Submit partial acceptance
        AssignmentService->>Helper: Send partial acceptance proposal
        
        alt Helper Accepts Partial Payment
            Helper->>AssignmentService: Accept partial payment
            AssignmentService->>PaymentService: Process partial payment
            PaymentService->>AssignmentService: Confirm partial payment
            
            AssignmentService->>NotificationService: Send confirmation notifications
            NotificationService->>Helper: "Partial payment processed" notification
            NotificationService->>Client: "Partial payment completed" notification
            
            AssignmentService->>RatingService: Prompt for ratings
        else Helper Disputes Partial Payment
            Helper->>AssignmentService: Reject partial payment
            AssignmentService->>DisputeService: Create partial payment dispute
            DisputeService->>DisputeService: Start resolution process
        end
    end
```

## Multi-Day Assignment Management Flow

This diagram illustrates how multi-day or recurring assignments are managed.

```mermaid
sequenceDiagram
    participant Client
    participant Helper
    participant AssignmentUI as Assignment UI
    participant AssignmentService as Assignment Service
    participant ScheduleService as Schedule Service
    participant NotificationService as Notification Service
    participant PaymentService as Payment Service
    
    Client->>AssignmentUI: Create multi-day assignment
    AssignmentUI->>Client: Request schedule details
    
    Client->>AssignmentUI: Define work schedule:
    Note over AssignmentUI,Client: Start and end dates
    Note over AssignmentUI,Client: Daily work hours
    Note over AssignmentUI,Client: Payment frequency
    Note over AssignmentUI,Client: Milestone deliverables
    
    AssignmentUI->>AssignmentService: Create multi-day assignment
    AssignmentService->>ScheduleService: Generate work schedule
    
    ScheduleService->>ScheduleService: Create individual day assignments
    ScheduleService->>ScheduleService: Link to master assignment
    
    AssignmentService->>NotificationService: Send assignment notification
    NotificationService->>Helper: "Multi-day assignment created" notification
    
    Helper->>AssignmentUI: Review and confirm multi-day assignment
    AssignmentUI->>AssignmentService: Record confirmation
    
    loop Each Work Day
        Note over Helper,AssignmentService: Daily check-in/check-out flow
        Helper->>AssignmentUI: Daily check-in
        
        AssignmentUI->>AssignmentService: Record daily progress
        AssignmentService->>ScheduleService: Update day completion status
        
        Helper->>AssignmentUI: Daily check-out with summary
        AssignmentUI->>AssignmentService: Record daily completion
        
        AssignmentService->>NotificationService: Send daily update
        NotificationService->>Client: "Daily progress update" notification
    end
    
    alt Milestone Payment Schedule
        ScheduleService->>ScheduleService: Check for payment milestone
        ScheduleService->>AssignmentService: Trigger milestone payment
        
        AssignmentService->>Client: Request milestone verification
        Client->>AssignmentService: Approve milestone
        
        AssignmentService->>PaymentService: Process milestone payment
        PaymentService->>Helper: Milestone payment issued
    end
    
    opt Schedule Adjustment
        Client->>AssignmentUI: Request schedule adjustment
        AssignmentUI->>AssignmentService: Submit adjustment request
        AssignmentService->>ScheduleService: Update work schedule
        
        ScheduleService->>NotificationService: Send schedule update
        NotificationService->>Helper: "Schedule adjustment" notification
        
        Helper->>AssignmentUI: Confirm or request changes
        AssignmentUI->>AssignmentService: Record response
    end
    
    AssignmentService->>AssignmentService: Check for final day completion
    AssignmentService->>AssignmentService: Update master assignment status
    
    AssignmentService->>NotificationService: Send completion notification
    NotificationService->>Client: "Full assignment completed" notification
    
    AssignmentService->>Client: Request final verification
    Client->>AssignmentService: Provide final approval
    
    AssignmentService->>PaymentService: Process final payment
    PaymentService->>Helper: Final payment issued
```

## Team Assignment Coordination Flow

This diagram illustrates how team-based labor assignments are coordinated and managed.

```mermaid
sequenceDiagram
    participant Client
    participant TeamLeader as Team Leader
    participant TeamMembers as Team Members
    participant TeamUI as Team Assignment UI
    participant TeamService as Team Assignment Service
    participant AssignmentService as Assignment Service
    participant NotificationService as Notification Service
    participant PaymentService as Payment Service
    
    Client->>TeamUI: Create team assignment
    TeamUI->>TeamService: Initialize team assignment
    
    TeamService->>TeamService: Generate master assignment
    TeamService->>TeamService: Create linked individual assignments
    
    TeamService->>NotificationService: Send team assignment notifications
    NotificationService->>TeamLeader: "Team assignment created" notification
    NotificationService->>TeamMembers: "Team assignment created" notification
    
    TeamLeader->>TeamUI: Review and confirm team assignment
    TeamUI->>TeamService: Record leader confirmation
    
    TeamMembers->>TeamUI: Review and confirm participation
    TeamUI->>TeamService: Record member confirmations
    
    TeamLeader->>TeamUI: Assign team member roles
    TeamUI->>TeamService: Store role assignments
    
    alt Team Check-in Process
        TeamLeader->>TeamUI: Team check-in at job site
        TeamUI->>TeamService: Process team check-in
        
        TeamService->>AssignmentService: Record individual check-ins
        TeamService->>NotificationService: Send team check-in notification
        NotificationService->>Client: "Team has arrived" notification
        
        opt Individual Check-ins
            TeamMembers->>TeamUI: Individual check-ins
            TeamUI->>AssignmentService: Record individual statuses
        end
    end
    
    alt Work Coordination
        TeamLeader->>TeamUI: Update work progress
        TeamUI->>TeamService: Store progress updates
        
        TeamLeader->>TeamUI: Reassign tasks within team
        TeamUI->>TeamService: Update task assignments
        TeamService->>NotificationService: Notify affected team members
        
        TeamLeader->>TeamUI: Request client input
        TeamUI->>NotificationService: Forward request to client
        NotificationService->>Client: "Team needs input" notification
        
        Client->>TeamUI: Provide feedback/direction
        TeamUI->>TeamService: Relay client feedback
        TeamService->>NotificationService: Notify team of client input
    end
    
    alt Team Check-out Process
        TeamLeader->>TeamUI: Submit team work summary
        TeamUI->>TeamService: Process team summary
        
        TeamMembers->>TeamUI: Submit individual time logs
        TeamUI->>TeamService: Process individual logs
        
        TeamService->>TeamService: Consolidate team work report
        TeamService->>AssignmentService: Update master assignment
        
        TeamService->>NotificationService: Send completion notification
        NotificationService->>Client: "Team work completed" notification
    end
    
    Client->>TeamUI: Review and verify team work
    TeamUI->>TeamService: Record verification
    
    alt Team Payment Distribution
        TeamService->>PaymentService: Process team payment
        
        alt Even Distribution
            PaymentService->>PaymentService: Split payment equally
        else Role-Based Distribution
            PaymentService->>PaymentService: Distribute payment by role/hours
        else Leader Distribution
            PaymentService->>TeamLeader: Distribute team payment
            TeamLeader->>PaymentService: Submit distribution plan
        end
        
        PaymentService->>TeamLeader: Process leader payment
        PaymentService->>TeamMembers: Process member payments
    end
    
    TeamService->>NotificationService: Send payment notifications
    NotificationService->>TeamLeader: "Payment processed" notification
    NotificationService->>TeamMembers: "Payment processed" notification
```

## Assignment Cancellation and Rescheduling Flow

This diagram illustrates how assignment cancellations and rescheduling are handled.

```mermaid
sequenceDiagram
    participant Initiator as Initiator (Client or Helper)
    participant AssignmentUI as Assignment UI
    participant AssignmentService as Assignment Service
    participant PolicyService as Policy Service
    participant NotificationService as Notification Service
    participant OtherParty as Other Party
    participant ReplacementService as Replacement Service
    
    Initiator->>AssignmentUI: Request cancellation or reschedule
    AssignmentUI->>AssignmentService: Submit request
    
    AssignmentService->>PolicyService: Check cancellation policy
    PolicyService->>AssignmentService: Return policy terms
    
    alt Reschedule Request
        AssignmentService->>NotificationService: Send reschedule request
        NotificationService->>OtherParty: "Reschedule requested" notification
        
        opt Counter Proposal
            OtherParty->>AssignmentUI: Suggest alternative time
            AssignmentUI->>AssignmentService: Submit counter proposal
            AssignmentService->>NotificationService: Send counter proposal
            NotificationService->>Initiator: "Counter proposal received" notification
            
            Initiator->>AssignmentUI: Accept counter proposal
            AssignmentUI->>AssignmentService: Confirm new schedule
        end
        
        OtherParty->>AssignmentUI: Accept reschedule
        AssignmentUI->>AssignmentService: Update assignment schedule
        
        AssignmentService->>NotificationService: Send confirmation notifications
        NotificationService->>Initiator: "Reschedule confirmed" notification
        NotificationService->>OtherParty: "Reschedule confirmed" notification
    else Cancellation Request
        AssignmentService->>PolicyService: Calculate cancellation impact
        PolicyService->>AssignmentService: Return cancellation terms
        
        AssignmentService->>NotificationService: Send cancellation notification
        NotificationService->>OtherParty: "Cancellation requested" notification
        
        alt Within Cancellation Window
            AssignmentService->>AssignmentService: Process penalty-free cancellation
            AssignmentService->>AssignmentService: Update assignment status to "cancelled"
            
            AssignmentService->>NotificationService: Send confirmation notifications
            NotificationService->>Initiator: "Cancellation confirmed" notification
            NotificationService->>OtherParty: "Assignment cancelled" notification
        else Late Cancellation
            AssignmentService->>Initiator: Show late cancellation terms
            Initiator->>AssignmentUI: Confirm with penalty understanding
            
            AssignmentUI->>AssignmentService: Process cancellation with penalty
            AssignmentService->>AssignmentService: Update assignment status to "cancelled"
            
            alt Helper-Initiated Late Cancellation
                AssignmentService->>NotificationService: Send cancellation notification
                NotificationService->>OtherParty: "Helper cancelled" notification
                
                AssignmentService->>ReplacementService: Request helper replacement
                ReplacementService->>ReplacementService: Find matching helpers
                ReplacementService->>OtherParty: Suggest replacement options
            else Client-Initiated Late Cancellation
                AssignmentService->>NotificationService: Send cancellation notification
                NotificationService->>OtherParty: "Client cancelled" notification
                
                AssignmentService->>ReplacementService: Find alternative jobs
                ReplacementService->>OtherParty: Suggest alternative job options
            end
        end
    end
```

These workflow diagrams illustrate the key processes involved in managing labor assignments, from scheduling and execution to verification, payment, and special circumstances like team coordination and cancellations. These flows demonstrate how the Labor Marketplace facilitates the actual delivery of services, which is the ultimate purpose of the marketplace.
