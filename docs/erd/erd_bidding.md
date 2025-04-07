# InstaBids Bidding System Entity Relationship Diagram

This diagram provides a detailed view of the bidding system, showing the relationships between bid cards, bids, group bidding, and related entities.

```mermaid
erDiagram
    bid_cards ||--o{ bid_card_media : "has"
    bid_cards ||--o{ bids : "receives"
    bid_cards }o--o{ bid_groups : "can be part of"
    bid_cards ||--o{ bid_card_revisions : "has"
    
    bids ||--o{ bid_revisions : "has"
    bids ||--o{ connection_payments : "triggers"
    bids }o--o{ bids : "original bid"
    
    bid_groups ||--o{ bid_group_members : "has"
    bid_groups ||--o{ group_bids : "receives"
    
    group_bids ||--o{ group_bid_acceptances : "has"
    group_bids ||--o{ group_bid_extensions : "can have"
    
    bid_card_revisions ||--o{ bid_card_change_details : "has"
    bid_card_revisions ||--o{ bid_card_revision_media : "has"
    
    bid_cards {
        uuid id PK
        uuid creator_id FK
        uuid job_category_id FK
        uuid job_type_id FK
        string title
        text description
        jsonb location
        string zip_code
        decimal budget_min
        decimal budget_max
        date timeline_start
        date timeline_end
        timestamp bid_deadline
        boolean group_bidding_enabled
        string status
        timestamp created_at
        timestamp updated_at
        string visibility
        integer max_contractor_messages
        jsonb homeowner_rating_summary
        boolean prohibit_negotiation
        text guidance_for_bidders
        integer current_revision_number
        boolean has_active_revision
        timestamp last_revised_at
        uuid managed_property_id FK
        boolean open_to_group_bidding
        timestamp job_start_window_start
        timestamp job_start_window_end
        string job_size
        jsonb custom_answers
        uuid intention_type_id FK
        uuid timeline_horizon_id FK
        boolean group_eligible
        boolean price_driven
        integer min_bids_target
        integer max_bids_allowed
        integer current_commitments
        integer current_bids
        integer commitment_duration_hours
        integer acceptance_time_limit_hours
        uuid current_accepted_bid_id FK
        timestamp acceptance_expires_at
        uuid[] previous_accepted_bids
        uuid project_phase_id FK
        boolean is_part_of_suite
    }
    
    bid_card_media {
        uuid id PK
        uuid bid_card_id FK
        string media_type
        string url
        string thumbnail_url
        text description
        jsonb metadata
        integer display_order
        timestamp created_at
    }
    
    bids {
        uuid id PK
        uuid bid_card_id FK
        uuid contractor_id FK
        decimal amount
        boolean is_final_offer
        text scope_of_work
        jsonb materials_included
        jsonb timeline
        text[] value_propositions
        text additional_notes
        string status
        timestamp created_at
        timestamp updated_at
        timestamp last_updated_at
        integer update_count
        boolean is_retracted
        text retraction_reason
        boolean has_messaging_access
        boolean overflow_bid
        uuid original_bid_id FK
        uuid bid_card_revision_id FK
        boolean is_current_revision
        uuid project_suite_id FK
        boolean is_conditional
        uuid[] conditional_bid_ids
    }
    
    bid_revisions {
        uuid id PK
        uuid original_bid_id FK
        uuid bid_card_revision_id FK
        decimal revised_amount
        text scope_changes
        jsonb timeline_changes
        jsonb materials_changes
        string status
        timestamp created_at
        timestamp submitted_at
    }
    
    bid_card_revisions {
        uuid id PK
        uuid bid_card_id FK
        integer revision_number
        string revision_type
        text change_summary
        jsonb detailed_changes
        timestamp created_at
        boolean notification_sent
        timestamp notification_sent_at
    }
    
    bid_card_change_details {
        uuid id PK
        uuid revision_id FK
        string field_name
        text old_value
        text new_value
        string change_type
    }
    
    bid_card_revision_media {
        uuid id PK
        uuid revision_id FK
        uuid media_id FK
    }
    
    bid_commitments {
        uuid id PK
        uuid bid_card_id FK
        uuid contractor_id FK
        string status
        timestamp committed_at
        timestamp deadline
        boolean reminder_sent
        timestamp reminder_sent_at
    }
    
    connection_payments {
        uuid id PK
        uuid bid_acceptance_id FK
        uuid contractor_id FK
        decimal amount
        string payment_method
        string payment_processor
        string transaction_id
        string status
        timestamp created_at
        timestamp completed_at
        text error_message
    }
    
    bid_acceptances {
        uuid id PK
        uuid bid_id FK
        uuid bid_card_id FK
        uuid accepted_by FK
        timestamp accepted_at
        timestamp expires_at
        decimal connection_fee_amount
        string fee_calculation_method
        string status
        boolean expiry_notified
        timestamp expiry_notification_sent_at
        timestamp fallback_activated_at
        uuid fallback_bid_id FK
    }
    
    contact_releases {
        uuid id PK
        uuid bid_acceptance_id FK
        jsonb homeowner_contact
        jsonb contractor_contact
        timestamp released_at
        boolean viewed_by_contractor
        timestamp viewed_at
    }
    
    bid_groups {
        uuid id PK
        string name
        string zip_code
        uuid job_category_id FK
        timestamp bid_deadline
        timestamp job_start_window_start
        timestamp job_start_window_end
        string status
        timestamp created_at
        uuid created_by FK
        boolean is_auto_generated
    }
    
    bid_group_members {
        uuid id PK
        uuid bid_group_id FK
        uuid bid_card_id FK
        uuid user_id FK
        timestamp joined_at
        string status
        boolean visible_to_group
    }
    
    group_bids {
        uuid id PK
        uuid bid_group_id FK
        uuid contractor_id FK
        decimal individual_price
        decimal group_price
        integer required_acceptance_count
        integer required_acceptance_percentage
        timestamp acceptance_deadline
        text terms
        jsonb timeline
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    group_bid_acceptances {
        uuid id PK
        uuid group_bid_id FK
        uuid bid_card_id FK
        uuid user_id FK
        timestamp accepted_at
    }
    
    group_nudges {
        uuid id PK
        uuid template_id FK
        uuid sender_id FK
        uuid recipient_id FK
        uuid bid_group_id FK
        text message
        timestamp sent_at
        timestamp read_at
    }
    
    nudge_templates {
        uuid id PK
        text message
        string icon
        string category
    }
    
    group_bid_extensions {
        uuid id PK
        uuid group_bid_id FK
        timestamp previous_deadline
        timestamp new_deadline
        text reason
        timestamp created_at
        uuid created_by FK
    }
    
    job_categories }o--|| bid_cards : "has"
    job_types }o--|| bid_cards : "has"
    users ||--o{ bid_cards : "creates"
    users ||--o{ bids : "submits"
    users ||--o{ bid_groups : "creates"
    users ||--o{ bid_group_members : "joins"
    users ||--o{ group_bid_acceptances : "accepts"
    users ||--o{ group_nudges : "sends"
    contractors ||--o{ bids : "submits"
    contractors ||--o{ group_bids : "submits"
    contractors ||--o{ bid_commitments : "makes"
    managed_properties }o--|| bid_cards : "for"
    project_phases }o--|| bid_cards : "part of"
```

This diagram visually represents the relationships between the tables in the bidding system.
