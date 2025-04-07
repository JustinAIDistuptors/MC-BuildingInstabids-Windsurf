# Social Sharing & Referrals Domain ERD

This document provides the Entity Relationship Diagram for the Social Sharing & Referrals domain of the InstaBids platform, illustrating the data model relationships that enable users to share content, refer other users, and participate in rewards programs.

## Overview Diagram

```mermaid
erDiagram
    USERS ||--o{ SOCIAL_SHARES : creates
    USERS ||--o{ REFERRAL_CODES : generates
    USERS ||--o{ SOCIAL_INTEGRATION_CREDENTIALS : connects
    USERS ||--o{ TESTIMONIALS : provides
    USERS ||--o{ REFERRAL_LEADERBOARD : ranks_in
    
    REFERRAL_PROGRAMS ||--o{ REFERRAL_CODES : configures
    REFERRAL_PROGRAMS ||--o{ REFERRALS : governs
    
    REFERRAL_CODES ||--o{ REFERRALS : used_in
    
    REFERRALS ||--o{ REFERRAL_REWARDS : generates
    
    PROJECTS ||--|| PROJECT_SHARING_OPTIONS : configures
    PROJECTS ||--o{ TESTIMONIALS : receives
    
    SOCIAL_SHARES ||--o{ SHARE_CLICKS : tracks
```

## Detailed Entity Relationships

### Sharing System Entities

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email
        varchar first_name
        varchar last_name
        varchar user_type
    }
    
    SOCIAL_SHARE_SETTINGS {
        uuid id PK
        varchar feature_name
        boolean is_enabled
        text share_title_template
        text share_description_template
        text share_image_url
        jsonb platforms_config
        timestamp created_at
        timestamp updated_at
    }
    
    SOCIAL_SHARES {
        uuid id PK
        uuid user_id FK
        varchar entity_type
        uuid entity_id
        varchar platform
        text share_url
        text custom_message
        jsonb share_data
        jsonb utm_parameters
        int click_count
        int conversion_count
        timestamp created_at
    }
    
    SHARE_CLICKS {
        uuid id PK
        uuid share_id FK
        varchar ip_address
        text user_agent
        text referrer_url
        boolean is_unique
        boolean converted
        varchar conversion_type
        uuid conversion_entity_id
        varchar utm_source
        varchar utm_medium
        varchar utm_campaign
        varchar utm_term
        varchar utm_content
        timestamp created_at
    }
    
    PROJECT_SHARING_OPTIONS {
        uuid project_id PK,FK
        boolean sharing_enabled
        boolean public_view_enabled
        jsonb social_platforms
        text custom_title
        text custom_description
        text custom_image_url
        boolean show_budget
        boolean show_timeline
        boolean show_contractor_info
        boolean require_approval
        uuid last_updated_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    SOCIAL_INTEGRATION_CREDENTIALS {
        uuid id PK
        uuid user_id FK
        varchar platform
        text access_token
        text refresh_token
        timestamp token_expires_at
        text scope
        varchar platform_user_id
        varchar platform_username
        boolean is_active
        timestamp last_used_at
        timestamp created_at
        timestamp updated_at
    }
    
    TESTIMONIALS {
        uuid id PK
        uuid user_id FK
        uuid project_id FK
        text content
        int rating
        varchar status
        boolean is_featured
        boolean is_public
        text moderation_notes
        uuid moderated_by FK
        timestamp moderated_at
        timestamp created_at
        timestamp updated_at
    }
    
    USERS ||--o{ SOCIAL_SHARES : creates
    USERS ||--o{ SOCIAL_INTEGRATION_CREDENTIALS : connects
    USERS ||--o{ TESTIMONIALS : provides
    PROJECTS ||--|| PROJECT_SHARING_OPTIONS : configures
    PROJECTS ||--o{ TESTIMONIALS : receives
    SOCIAL_SHARES ||--o{ SHARE_CLICKS : tracks
```

### Referral System Entities

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email
        varchar first_name
        varchar last_name
        varchar user_type
    }
    
    REFERRAL_PROGRAMS {
        uuid id PK
        varchar name
        text description
        boolean is_active
        timestamp start_date
        timestamp end_date
        int max_referrals_per_user
        varchar referrer_reward_type
        decimal referrer_reward_amount
        jsonb referrer_reward_details
        varchar referee_reward_type
        decimal referee_reward_amount
        jsonb referee_reward_details
        int expiry_days
        text terms_and_conditions
        timestamp created_at
        timestamp updated_at
    }
    
    REFERRAL_CODES {
        uuid id PK
        uuid user_id FK
        uuid program_id FK
        varchar code
        boolean is_active
        int usage_count
        int max_uses
        timestamp created_at
        timestamp expires_at
    }
    
    REFERRALS {
        uuid id PK
        uuid program_id FK
        uuid referrer_id FK
        uuid referee_id FK
        uuid referral_code_id FK
        varchar status
        varchar referrer_reward_status
        varchar referee_reward_status
        varchar qualifying_event
        timestamp qualifying_event_date
        decimal referrer_reward_amount
        decimal referee_reward_amount
        jsonb referrer_reward_details
        jsonb referee_reward_details
        timestamp created_at
        timestamp updated_at
    }
    
    REFERRAL_REWARDS {
        uuid id PK
        uuid referral_id FK
        uuid user_id FK
        varchar user_role
        varchar reward_type
        decimal amount
        varchar status
        timestamp issued_at
        timestamp redeemed_at
        timestamp expires_at
        jsonb redemption_context
        uuid transaction_id
        text notes
    }
    
    REFERRAL_LEADERBOARD {
        uuid id PK
        uuid user_id FK
        int total_referrals
        int successful_referrals
        decimal total_rewards_earned
        int rank
        int month
        int year
        timestamp last_referral_at
        timestamp updated_at
    }
    
    USERS ||--o{ REFERRAL_CODES : generates
    USERS ||--o{ REFERRAL_LEADERBOARD : ranks_in
    REFERRAL_PROGRAMS ||--o{ REFERRAL_CODES : configures
    REFERRAL_PROGRAMS ||--o{ REFERRALS : governs
    REFERRAL_CODES ||--o{ REFERRALS : used_in
    REFERRALS ||--o{ REFERRAL_REWARDS : generates
```

## Cross-Domain Relationships

The Social Sharing & Referrals domain connects with other InstaBids domains as follows:

### Sharing & Project Domain

```mermaid
erDiagram
    PROJECTS {
        uuid id PK
        varchar title
        text description
        jsonb location
        timestamp start_date
        timestamp end_date
        uuid owner_id FK
    }
    
    PROJECT_SHARING_OPTIONS {
        uuid project_id PK,FK
        boolean sharing_enabled
        boolean public_view_enabled
        jsonb social_platforms
        text custom_title
        text custom_description
        text custom_image_url
        boolean show_budget
        boolean show_timeline
        boolean show_contractor_info
        boolean require_approval
    }
    
    SOCIAL_SHARES {
        uuid id PK
        uuid user_id FK
        varchar entity_type
        uuid entity_id
        varchar platform
        text share_url
    }
    
    PROJECTS ||--|| PROJECT_SHARING_OPTIONS : configures
    PROJECTS ||--o{ SOCIAL_SHARES : shared_as "when entity_type='project'"
```

### Referrals & User Management Domain

```mermaid
erDiagram
    USERS {
        uuid id PK
        varchar email
        varchar first_name
        varchar last_name
        varchar user_type
    }
    
    REFERRALS {
        uuid id PK
        uuid program_id FK
        uuid referrer_id FK
        uuid referee_id FK
        uuid referral_code_id FK
        varchar status
    }
    
    USER_NOTIFICATIONS {
        uuid id PK
        uuid user_id FK
        varchar type
        jsonb data
        boolean is_read
        timestamp created_at
    }
    
    USERS ||--o{ REFERRALS : refers "as referrer"
    USERS ||--o{ REFERRALS : referred_by "as referee"
    REFERRALS ||--o{ USER_NOTIFICATIONS : triggers
```

### Testimonials & Bidding Domain

```mermaid
erDiagram
    PROJECTS {
        uuid id PK
        varchar title
        text description
    }
    
    BIDS {
        uuid id PK
        uuid project_id FK
        uuid contractor_id FK
        decimal amount
        text proposal
        varchar status
    }
    
    TESTIMONIALS {
        uuid id PK
        uuid user_id FK
        uuid project_id FK
        text content
        int rating
        varchar status
    }
    
    CONTRACTOR_PROFILES {
        uuid user_id PK,FK
        jsonb expertise
        text bio
        decimal avg_rating
    }
    
    PROJECTS ||--o{ BIDS : receives
    PROJECTS ||--o{ TESTIMONIALS : has_reviews
    BIDS ||--o{ TESTIMONIALS : leads_to "indirectly"
    CONTRACTOR_PROFILES ||--o{ TESTIMONIALS : highlighted_in
```

## Data Flow Views

### Referral Process Flow

```mermaid
graph TD
    A[Referrer generates code] --> B[Referral code created]
    B --> C[Referee uses code]
    C --> D[Referral record created]
    D --> E{Qualifying event?}
    E -->|No| F[Pending status]
    E -->|Yes| G[Completed status]
    G --> H[Rewards issued]
    H --> I[Leaderboard updated]
```

### Social Sharing Analytics Flow

```mermaid
graph TD
    A[User shares content] --> B[Share record created]
    B --> C[Share link clicked]
    C --> D[Click recorded]
    D --> E{Conversion?}
    E -->|Yes| F[Conversion recorded]
    E -->|No| G[Only click counted]
    F --> H[Analytics aggregated]
    G --> H
```

## Tables & Views

### Main Tables
- social_share_settings
- referral_programs
- referral_codes
- referrals
- social_shares
- share_clicks
- project_sharing_options
- referral_rewards
- testimonials
- social_integration_credentials
- referral_leaderboard

### Views
- referral_program_performance
- user_social_activity
