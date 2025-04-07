# Group Bidding System Entity Relationship Diagram

This diagram visualizes the database structure for InstaBids' group bidding system, which allows multiple homeowners to combine similar projects for better contractor rates.

```mermaid
erDiagram
    %% Primary Group Bidding Entities
    bid_groups ||--o{ group_joining_criteria : "defines"
    bid_groups ||--o{ bid_group_members : "contains"
    bid_groups ||--o{ group_bids : "receives"
    bid_groups ||--o{ group_discussions : "has"
    bid_groups ||--o{ group_invitations : "generates"
    bid_groups ||--o{ group_activity_log : "records"
    
    %% Bid Group Members
    bid_cards ||--o{ bid_group_members : "participates via"
    users ||--o{ bid_group_members : "joins as"
    
    %% Bids and Acceptances
    group_bids ||--o{ group_bid_items : "includes"
    group_bids ||--o{ group_bid_project_specifics : "specifies"
    group_bids ||--o{ group_bid_acceptances : "receives"
    users ||--o{ group_bids : "submits"
    bid_cards ||--o{ group_bid_project_specifics : "detailed in"
    bid_cards ||--o{ group_bid_acceptances : "accepts through"
    users ||--o{ group_bid_acceptances : "accepts"
    
    %% Discussions and Messages
    group_discussions ||--o{ group_discussion_messages : "contains"
    users ||--o{ group_discussions : "creates"
    users ||--o{ group_discussion_messages : "sends"
    group_discussion_messages }o--o{ group_discussion_messages : "replies to"
    
    %% Invitations
    users ||--o{ group_invitations : "sends"
    users }o--o{ group_invitations : "receives"
    bid_cards }o--o{ group_invitations : "linked to"
    
    %% Templates and Recommendations
    group_formation_templates }o--o{ bid_groups : "used to create"
    users ||--o{ group_formation_templates : "creates"
    job_categories }o--o{ group_formation_templates : "categorizes"
    job_types }o--o{ group_formation_templates : "specifies type"
    
    %% Recommendations and Similarity
    bid_cards ||--o{ group_recommendations : "receives"
    bid_groups }o--o{ group_recommendations : "recommended as"
    users }o--o{ group_recommendations : "shown to"
    bid_cards ||--o{ group_similar_bids : "finds matches for"
    bid_cards }o--o{ group_similar_bids : "matched with"
    
    %% Activity Logging
    users }o--o{ group_activity_log : "performs"
    bid_cards }o--o{ group_activity_log : "involved in"
    group_bids }o--o{ group_activity_log : "referenced in"
    
    %% Other Core Relations
    job_categories ||--o{ job_types : "contains"
    job_categories }o--o{ bid_groups : "categorizes"
    job_types }o--o{ bid_groups : "specifies type"

    %% Entity Definitions
    bid_groups {
        uuid id PK
        string name
        string description
        string status
        uuid job_category_id FK
        uuid job_type_id FK
        string zip_code
        int location_radius
        string city
        string state
        int min_members
        int max_members
        int current_members
        decimal target_savings_percentage
        decimal actual_savings_percentage
        uuid created_by FK
        uuid admin_user_id FK
        timestamp formation_deadline
        timestamp bid_deadline
        timestamp acceptance_deadline
        boolean is_auto_generated
        uuid accepted_group_bid_id FK
    }
    
    group_joining_criteria {
        uuid id PK
        uuid bid_group_id FK
        string criterion_type
        string criterion_name
        decimal min_value
        decimal max_value
        text text_value
        boolean boolean_value
        timestamp date_value
        boolean is_required
        int criteria_order
    }
    
    bid_group_members {
        uuid id PK
        uuid bid_group_id FK
        uuid bid_card_id FK
        uuid user_id FK
        timestamp joined_at
        string status
        timestamp left_at
        string removal_reason
        boolean is_admin
        boolean is_founding_member
        boolean visible_to_group
        boolean has_accepted_group_bid
        decimal individual_savings_amount
    }
    
    group_bids {
        uuid id PK
        uuid bid_group_id FK
        uuid contractor_id FK
        string status
        decimal group_price
        decimal individual_price
        decimal savings_percentage
        string currency
        text scope_of_work
        boolean materials_included
        text materials_description
        int timeline_days
        timestamp start_date
        int required_acceptance_count
        int required_acceptance_percentage
        int current_acceptance_count
        timestamp acceptance_deadline
        boolean is_final_offer
    }
    
    group_bid_items {
        uuid id PK
        uuid group_bid_id FK
        string item_name
        string item_type
        string description
        decimal quantity
        decimal unit_price
        decimal total_price
        boolean applies_to_all_projects
    }
    
    group_bid_project_specifics {
        uuid id PK
        uuid group_bid_id FK
        uuid bid_card_id FK
        decimal specific_price
        text specific_scope
        text specific_materials
        int timeline_days
        timestamp start_date
    }
    
    group_bid_acceptances {
        uuid id PK
        uuid group_bid_id FK
        uuid bid_card_id FK
        uuid user_id FK
        timestamp accepted_at
        decimal acceptance_amount
        string status
        uuid payment_transaction_id FK
    }
    
    group_discussions {
        uuid id PK
        uuid bid_group_id FK
        string title
        uuid created_by FK
        boolean is_announcement
        boolean is_pinned
        boolean is_closed
        timestamp closed_at
    }
    
    group_discussion_messages {
        uuid id PK
        uuid discussion_id FK
        uuid sender_id FK
        text content
        boolean is_edited
        timestamp edited_at
        uuid parent_message_id FK
        string[] media_urls
    }
    
    group_invitations {
        uuid id PK
        uuid bid_group_id FK
        uuid bid_card_id FK
        uuid inviter_id FK
        uuid invitee_id FK
        string invitee_email
        string token
        string status
        text message
        timestamp sent_at
        timestamp expires_at
        timestamp responded_at
    }
    
    group_formation_templates {
        uuid id PK
        string name
        string description
        uuid job_category_id FK
        uuid job_type_id FK
        int min_members
        int max_members
        decimal target_savings_percentage
        int formation_days
        int bidding_days
        int acceptance_days
        jsonb default_criteria
        boolean is_active
        uuid created_by FK
    }
    
    group_recommendations {
        uuid id PK
        uuid bid_card_id FK
        uuid user_id FK
        uuid recommended_group_id FK
        decimal score
        string reason
        string status
        timestamp shown_at
        timestamp clicked_at
        timestamp joined_at
        timestamp dismissed_at
    }
    
    group_similar_bids {
        uuid id PK
        uuid source_bid_card_id FK
        uuid similar_bid_card_id FK
        decimal similarity_score
        jsonb dimension_scores
        boolean is_recommended
    }
    
    group_activity_log {
        uuid id PK
        uuid bid_group_id FK
        string activity_type
        uuid user_id FK
        uuid bid_card_id FK
        uuid group_bid_id FK
        text description
        jsonb metadata
    }
    
    bid_cards {
        uuid id PK
        string title
        uuid user_id FK
    }
    
    users {
        uuid id PK
        string email
    }
    
    job_categories {
        uuid id PK
        string name
    }
    
    job_types {
        uuid id PK
        string name
        uuid job_category_id FK
    }
```

## Key Domain Concepts

### Bid Groups
The central entity in this system is the `bid_groups` table, which represents a collection of homeowners with similar projects that have been grouped together to receive collective bids from contractors. Bid groups have a defined lifecycle with stages from formation through completion.

### Group Membership
The `bid_group_members` table tracks which homeowners and bid cards are part of each group. Members can be founding members, admins, or regular participants, with different permissions and visibility options.

### Group Bidding Process
Contractors submit bids through the `group_bids` table, which includes both overall group pricing and project-specific details in `group_bid_project_specifics`. The bidding process has thresholds for acceptance (percentage or count of members) that must be met for a bid to become active.

### Collaboration Features
The group bidding system includes collaboration features through `group_discussions` and `group_discussion_messages`, allowing members to communicate about the collective project.

### Group Formation
Groups can form in several ways:
1. Manually created by homeowners
2. Auto-generated based on similarity between bid cards
3. Created from templates (`group_formation_templates`)

### Recommendation System
The system uses a recommendation engine to suggest similar projects that could benefit from group bidding, tracked in `group_recommendations` and `group_similar_bids`.

## Key Relationships

1. **Bid Cards to Groups**: Multiple bid cards can join a bid group through the `bid_group_members` association table
2. **Contractor Bidding**: Contractors submit bids to groups, with details for both the entire group and for specific projects
3. **Bid Acceptance**: Homeowners accept bids through `group_bid_acceptances`, which tracks individual acceptance and payment status
4. **Group Formation**: Templates and recommendations drive the creation of new groups based on project similarity
5. **User Roles**: Users can be group creators, admins, members, or contractors submitting bids

## Business Rules

1. Groups have minimum and maximum member counts
2. Groups can specify joining criteria that prospective members must meet
3. Group bids must meet acceptance thresholds (count or percentage) to become active
4. Group members can accept or decline group bids individually
5. Group formation follows a defined lifecycle with deadlines for each stage
6. Invitations can be sent to prospective members and expire after a set period

This group bidding system is a key differentiator for InstaBids, allowing homeowners to achieve better pricing through collective negotiation while maintaining individual project specifications.
