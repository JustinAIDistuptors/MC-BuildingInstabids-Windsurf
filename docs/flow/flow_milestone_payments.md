# Milestone Payment Flow

This document outlines the complete process flow for milestone-based payments in the InstaBids platform, from project creation through milestone completion and payment release. This is a critical workflow that spans multiple domains including project management, payment processing, and user communication.

## Milestone Payment Sequence

```mermaid
sequenceDiagram
    participant HO as Homeowner
    participant C as Contractor
    participant PM as Project Manager
    participant BS as Bidding Service
    participant PS as Project Service
    participant ES as Escrow Service
    participant PS2 as Payment Service
    participant NS as Notification Service

    %% Phase 1: Project Creation and Milestone Setup
    HO->>BS: Accept Bid
    BS->>PS: Create Project
    PS->>PS: Create Default Milestones
    PS-->>HO: Show Milestone Configuration
    HO->>PS: Adjust Milestones (optional)
    PS->>PS: Finalize Project Structure
    PS->>PS: Generate Payment Schedule
    PS-->>HO: Display Payment Schedule
    PS-->>C: Notify Project Start
    
    %% Phase 2: Initial Milestone Payment
    HO->>PS2: Fund First Milestone
    PS2->>PS2: Process Payment
    PS2->>ES: Hold Funds in Escrow
    ES-->>HO: Confirm Escrow Deposit
    ES-->>C: Notify Milestone Funded
    PS->>PS: Update Milestone Status to "Funded"
    
    %% Phase 3: Work Completion and Verification
    C->>PS: Mark Milestone as Complete
    PS->>PS: Update Milestone Status to "Pending Verification"
    PS-->>HO: Request Milestone Verification
    NS-->>HO: Send Reminder Notification
    
    alt Milestone Approved
        HO->>PS: Approve Milestone Completion
        PS->>PS: Update Milestone Status to "Verified"
        PS->>ES: Request Fund Release
        ES->>ES: Release Funds from Escrow
        ES->>PS2: Process Payout to Contractor
        PS2-->>C: Notify Payment Sent
        PS-->>HO: Confirm Release
        PS->>PS: Update Milestone Status to "Completed"
    else Milestone Disputed
        HO->>PS: Dispute Milestone Completion
        PS->>PS: Update Milestone Status to "Disputed"
        PS-->>C: Notify Dispute
        HO->>PS: Provide Dispute Details
        PS-->>C: Forward Dispute Details
        
        alt Contractor Resolves Issue
            C->>PS: Address Issues
            C->>PS: Request Re-verification
            PS-->>HO: Request Verification Again
            HO->>PS: Approve Milestone Completion
            PS->>PS: Update Milestone Status to "Verified"
            PS->>ES: Request Fund Release
            ES->>ES: Release Funds from Escrow
            ES->>PS2: Process Payout to Contractor
            PS-->>HO: Confirm Release
        else Escalate to Mediation
            C->>PS: Request Mediation
            PS->>PM: Assign Mediator
            PM->>PS: Review Evidence
            PM->>PS: Make Decision
            
            alt Full Release
                PM->>ES: Authorize Full Release
                ES->>ES: Release Full Amount
                ES->>PS2: Process Full Payout
                PS-->>HO: Notify Decision
                PS-->>C: Notify Full Payment
            else Partial Release
                PM->>ES: Authorize Partial Release
                ES->>ES: Release Partial Amount
                ES->>PS2: Process Partial Payout
                ES->>PS2: Refund Remaining to Homeowner
                PS-->>HO: Notify Partial Refund
                PS-->>C: Notify Partial Payment
            else Full Refund
                PM->>ES: Authorize Full Refund
                ES->>ES: Release All Funds to Homeowner
                ES->>PS2: Process Refund
                PS-->>HO: Notify Full Refund
                PS-->>C: Notify Decision
            end
        end
    end
    
    %% Phase 4: Next Milestone
    PS->>PS: Activate Next Milestone
    PS-->>HO: Request Next Milestone Funding
    PS-->>C: Notify Next Milestone Active
    
    %% Optional: Final Project Completion
    alt Final Milestone Completed
        PS->>PS: Update Project Status to "Completed"
        PS-->>HO: Request Project Review
        PS-->>C: Request Project Review
        HO->>PS: Submit Contractor Review
        C->>PS: Submit Homeowner Review
        PS->>PS: Calculate Final Ratings
        PS-->>HO: Thank for Project Completion
        PS-->>C: Thank for Project Completion
    end
```

## Detailed Process Description

### 1. Project Setup Phase

1. **Bid Acceptance**: The homeowner accepts a contractor's bid, initiating the project creation process.
2. **Project Creation**: The Bidding Service communicates with the Project Service to create a new project.
3. **Default Milestone Creation**: The system generates default milestones based on project type and size.
4. **Milestone Configuration**: The homeowner can review and adjust the milestone structure if needed.
5. **Payment Schedule Generation**: The system creates a payment schedule linked to the milestones.

### 2. Milestone Funding Phase

1. **Initial Funding**: The homeowner funds the first milestone (or multiple milestones, depending on project settings).
2. **Payment Processing**: The Payment Service processes the payment using the homeowner's selected payment method.
3. **Escrow Deposit**: Funds are held in escrow, ensuring security for both parties.
4. **Status Updates**: Both parties are notified of the funding, and the milestone status is updated.

### 3. Work and Verification Phase

1. **Work Completion**: The contractor completes the work for the milestone and marks it as complete in the system.
2. **Verification Request**: The homeowner receives a notification to verify the milestone completion.
3. **Approval Process**: The homeowner reviews the work and either approves or disputes the milestone.

### 4. Payment Release Phase

#### 4A. Standard Release (No Dispute)

1. **Approval**: Homeowner approves the milestone completion.
2. **Fund Release**: The Escrow Service releases funds from escrow.
3. **Payout Processing**: The Payment Service processes the payout to the contractor.
4. **Notification**: Both parties are notified of the successful transaction.

#### 4B. Dispute Resolution Process

1. **Dispute Initiation**: Homeowner disputes milestone completion and provides details.
2. **Contractor Response**: Contractor is notified and can address the issues.
3. **Resolution Paths**:
   a. **Direct Resolution**: Contractor fixes issues, homeowner approves, funds are released.
   b. **Mediation Process**: If direct resolution fails, a mediator reviews the case and decides on an appropriate action (full release, partial release, or full refund).
4. **Transaction Processing**: The system processes the appropriate transaction based on the resolution.

### 5. Project Progression

1. **Next Milestone Activation**: Upon successful completion of a milestone, the next one is activated.
2. **Funding Request**: Homeowner is prompted to fund the next milestone.
3. **Final Completion**: After all milestones are completed, the project is marked as complete and reviews are requested.

## Key Business Rules

1. **Escrow Protection**: All milestone funds are held in escrow until milestone verification is complete.
2. **Verification Timeline**: Homeowners have 72 hours to verify milestone completion before receiving escalating reminders.
3. **Dispute Window**: Disputes must be initiated within 5 days of milestone completion notification.
4. **Fee Structure**: 
   - Platform charges 2.5% of milestone payment amount to homeowners
   - Payment processor fees are passed through to the payer
   - Withdrawal fees apply when contractors withdraw funds (variable by withdrawal method)
5. **Auto-Approval**: Milestones may be auto-approved after 7 days of no response from homeowner (configurable setting).
6. **Mediation Trigger**: Mediation is automatically triggered if dispute is not resolved within 3 days.

## Integration Points

This flow involves multiple service integrations:

1. **Project Service ↔ Bidding Service**: Project creation from accepted bid
2. **Project Service ↔ Payment Service**: Milestone payment status synchronization
3. **Payment Service ↔ Escrow Service**: Fund holding and release management
4. **Notification Service**: Triggered by status changes across all services
5. **Payment Service ↔ External Payment Processors**: For payment processing and payouts
6. **Project Service ↔ User Service**: For verification of user roles and permissions

## Error Handling

The system includes robust error handling for various scenarios:

1. **Payment Failure**: Automatic retry with exponential backoff, notification to homeowner
2. **Payout Failure**: Administrative review, alternative payout methods offered
3. **Dispute Deadlock**: Automatic escalation to platform administrators after timeout
4. **System Outages**: Transaction queuing with guaranteed execution

## Performance Considerations

1. **Transaction Throughput**: The system is designed to handle multiple concurrent milestone transactions.
2. **Escrow Operations**: Critical escrow operations use database transactions to ensure atomicity.
3. **Notification Batching**: Notifications are batched for efficiency when appropriate.
4. **Financial Reconciliation**: Daily reconciliation processes ensure financial integrity.

This process flow represents one of the core value propositions of the InstaBids platform: secure, milestone-based payments that protect both homeowners and contractors throughout the project lifecycle.
