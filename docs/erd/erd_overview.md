# InstaBids Core Entity Relationship Diagram

This diagram provides a high-level overview of the core database entities and their relationships.

## Core Entities

```mermaid
erDiagram
    %% Core User Management
    users ||--o{ user_types : "has"
    users ||--o{ user_addresses : "has"
    users ||--o{ user_notification_preferences : "has"
    users ||--o{ user_auth : "has"
    users ||--o{ audit_logs : "generates"

    %% Location Management
    zip_codes ||--o{ user_addresses : "located in"
    service_areas o{--o{ zip_codes : "contains"

    %% Common Lookup Tables
    job_categories ||--o{ job_types : "contains"
    job_categories ||--o{ job_categories : "parent of"
    tags }o--o{ tags : "related to"

    %% System Configuration
    feature_flags ||--o{ user_types : "available to"
    system_settings ||--o{ feature_flags : "configures"

    users {
        uuid id PK
        string email UK
        string phone
        string full_name
        string username UK
        string password_hash
        timestamp created_at
        timestamp updated_at
        timestamp last_login_at
        string status
        boolean email_verified
        boolean phone_verified
        string avatar_url
        string timezone
        string locale
        jsonb metadata
    }

    user_types {
        uuid id PK
        uuid user_id FK
        string type
        boolean is_primary
        timestamp created_at
    }

    user_auth {
        uuid id PK
        uuid user_id FK
        string refresh_token UK
        timestamp token_expires_at
        jsonb device_info
        string ip_address
        timestamp last_used_at
        timestamp created_at
        boolean revoked
        timestamp revoked_at
    }

    user_addresses {
        uuid id PK
        uuid user_id FK
        string address_type
        boolean is_primary
        string address_line1
        string address_line2
        string city
        string state
        string zip_code
        string country
        decimal latitude
        decimal longitude
        timestamp created_at
        timestamp updated_at
        boolean verified
    }

    user_notification_preferences {
        uuid id PK
        uuid user_id FK
        string channel
        string notification_type
        boolean enabled
        timestamp created_at
        timestamp updated_at
    }

    zip_codes {
        string code PK
        string city
        string state
        decimal latitude
        decimal longitude
        string timezone
        boolean dst
        string country
    }

    service_areas {
        uuid id PK
        string name
        string[] zip_codes
        string state
        timestamp created_at
        timestamp updated_at
    }

    system_settings {
        uuid id PK
        string setting_key UK
        jsonb setting_value
        string description
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }

    tags {
        uuid id PK
        string name
        string category
        timestamp created_at
    }

    job_categories {
        uuid id PK
        string name UK
        string display_name
        string description
        string icon
        integer display_order
        uuid parent_category_id FK
        timestamp created_at
        timestamp updated_at
    }

    job_types {
        uuid id PK
        uuid category_id FK
        string name
        string display_name
        string description
        string icon
        integer estimated_duration_days
        string complexity_level
        timestamp created_at
        timestamp updated_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string entity_type
        uuid entity_id
        jsonb change_data
        string ip_address
        string user_agent
        timestamp created_at
    }

    feature_flags {
        uuid id PK
        string flag_key UK
        string description
        boolean enabled
        jsonb user_group_filters
        integer percentage_rollout
        timestamp created_at
        timestamp updated_at
    }
```

## Legend

Relationship notation follows standard Entity-Relationship Diagram conventions:

- `||--o{` : One-to-many relationship (one entity has many related entities)
- `||--||` : One-to-one relationship
- `}o--o{` : Many-to-many relationship
- `FK` : Foreign Key
- `PK` : Primary Key
- `UK` : Unique Key

## Key Domain Boundaries

The core schema spans several fundamental domains:

1. **User Management**: Authentication, profiles, and preferences
2. **Location Management**: Geographic data for service areas
3. **Configuration Management**: System settings and feature flags
4. **Job Classification**: Categories and types of work
5. **Auditing & Analytics**: Tracking system activity

## Extension Points

This core schema provides several extension points for domain-specific functionality:

1. User profiles can be extended with domain-specific tables (e.g., `homeowners`, `contractors`)
2. The job categorization system can be extended with domain-specific job types
3. The notification system can be extended with domain-specific notification types
4. The tagging system can be used for domain-specific categorization
5. The feature flag system allows for controlled rollout of new functionality
