# InstaBids Project Management Entity Relationship Diagram

This diagram provides a detailed view of the project management domain, showing the relationships between projects, phases, tasks, and related entities that manage the lifecycle of a construction project from acceptance to completion.

```mermaid
erDiagram
    %% Core Project Tables
    projects ||--o{ project_phases : "has"
    projects ||--o{ project_milestones : "has"
    projects ||--o{ project_tasks : "has"
    projects ||--o{ project_materials : "requires"
    projects ||--o{ project_status_updates : "receives"
    projects ||--o{ project_issues : "has"
    projects ||--o{ project_schedules : "maintains"
    projects ||--o{ project_daily_logs : "tracks"
    projects ||--o{ project_payment_schedules : "has"
    projects ||--o{ project_inspections : "undergoes"
    projects ||--o{ project_change_orders : "receives"
    projects ||--o{ project_contracts : "has"
    projects ||--o{ project_warranties : "provides"
    projects ||--o{ labor_assignments : "uses"
    
    %% Phase Relationships
    project_phases ||--o{ project_milestones : "includes"
    project_phases ||--o{ project_tasks : "contains"
    project_phases ||--o{ project_materials : "requires"
    project_phases ||--o{ project_status_updates : "receives"
    project_phases ||--o{ project_issues : "experiences"
    project_phases ||--o{ project_schedules : "has"
    project_phases ||--o{ project_daily_logs : "tracks"
    project_phases ||--o{ project_inspections : "requires"
    project_phases ||--o{ project_change_orders : "can have"
    
    %% Milestone and Task Relationships
    project_milestones ||--o{ project_tasks : "triggers"
    project_milestones ||--o{ project_payment_schedules : "triggers"
    
    %% Warranty Relationships
    project_warranties ||--o{ warranty_claims : "receives"
    
    %% Labor Assignment Relationships
    project_tasks ||--o{ labor_assignments : "assigned to"
    
    projects {
        uuid id PK
        uuid homeowner_id FK
        uuid contractor_id FK
        uuid bid_card_id FK
        uuid accepted_bid_id FK
        string title
        string status
        date start_date
        date scheduled_completion_date
        decimal budget
        decimal final_cost
        boolean is_multi_phase
        uuid current_phase_id FK
        string project_health
    }
    
    project_phases {
        uuid id PK
        uuid project_id FK
        string name
        integer phase_number
        string status
        date start_date
        date end_date
        decimal budget
        decimal final_cost
        integer completion_percentage
        uuid depends_on_phase_id FK
    }
    
    project_milestones {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        string title
        timestamp due_date
        string status
        boolean is_payment_trigger
        decimal payment_amount
        boolean requires_verification
        integer order
    }
    
    project_tasks {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        uuid milestone_id FK
        string title
        string status
        string priority
        uuid assigned_to FK
        timestamp due_date
        decimal estimated_hours
        decimal actual_hours
        uuid[] depends_on
    }
    
    project_materials {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        uuid task_id FK
        string name
        decimal quantity
        string unit
        decimal estimated_cost
        decimal actual_cost
        string status
        string purchased_by
    }
    
    project_status_updates {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        uuid created_by FK
        string user_type
        text content
        string status
        boolean is_public
        boolean requires_response
    }
    
    project_issues {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        uuid reported_by FK
        string reporter_type
        string title
        string severity
        string status
        uuid assigned_to FK
    }
    
    project_schedules {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        string title
        timestamp start_time
        timestamp end_time
        boolean is_all_day
        boolean is_recurring
        string status
    }
    
    project_daily_logs {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        uuid created_by FK
        date log_date
        text work_completed
        decimal hours_worked
        integer worker_count
    }
    
    project_payment_schedules {
        uuid id PK
        uuid project_id FK
        string name
        decimal amount
        timestamp due_date
        string status
        uuid milestone_id FK
    }
    
    project_inspections {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        string inspection_type
        timestamp scheduled_date
        string status
        string result
        boolean follow_up_required
    }
    
    project_change_orders {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        string title
        uuid requested_by FK
        string requestor_type
        string status
        decimal cost_change
        integer timeline_impact_days
        boolean signature_required
    }
    
    project_contracts {
        uuid id PK
        uuid project_id FK
        string title
        string document_type
        integer version_number
        string status
        boolean signed_by_homeowner
        boolean signed_by_contractor
    }
    
    project_warranties {
        uuid id PK
        uuid project_id FK
        string title
        string warranty_type
        date start_date
        date end_date
        uuid issued_by FK
        boolean transferred
    }
    
    warranty_claims {
        uuid id PK
        uuid warranty_id FK
        uuid project_id FK
        string claim_number
        string title
        string status
        uuid submitted_by FK
        boolean inspection_required
    }
    
    labor_assignments {
        uuid id PK
        uuid project_id FK
        uuid phase_id FK
        uuid task_id FK
        uuid labor_helper_id FK
        uuid contractor_id FK
        timestamp start_time
        timestamp end_time
        decimal hourly_rate
        string status
    }
    
    %% External table relationships
    users ||--o{ projects : "owns as homeowner"
    users ||--o{ projects : "contracted for"
    users ||--o{ project_tasks : "assigned to"
    users ||--o{ project_issues : "reports"
    users ||--o{ project_status_updates : "creates"
    users ||--o{ labor_assignments : "works on"
    
    bid_cards ||--o{ projects : "leads to"
    bids ||--o{ projects : "accepted for"
```

This diagram shows the complex relationships between project entities, reflecting how the system tracks every aspect of a construction project from initiation through completion and warranty service.
