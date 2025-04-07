# Dream Projects & Conversion Entity Relationship Diagram

This document provides a visual representation of the database entities and relationships for the Dream Projects and Conversion domain of the InstaBids platform. Dream Projects enable homeowners to conceptualize, design, and eventually convert their home improvement ideas into actual projects for bidding.

## Core Entities Diagram

```mermaid
erDiagram
    DREAM_PROJECTS ||--o{ DREAM_PROJECT_IMAGES : contains
    DREAM_PROJECTS ||--o{ DREAM_PROJECT_INSPIRATIONS : references
    DREAM_PROJECTS ||--o{ DREAM_PROJECT_FEATURES : includes
    DREAM_PROJECTS ||--o{ DREAM_PROJECT_COLLABORATORS : shared_with
    DREAM_PROJECTS ||--o{ DREAM_PROJECT_CONVERSION_ATTEMPTS : tracks
    DREAM_PROJECTS ||--o{ DREAM_PROJECT_RECOMMENDATIONS : receives
    DREAM_PROJECTS ||--o{ DREAM_PROJECT_LIKES : saved_by
    DREAM_PROJECTS ||--o{ DREAM_PROJECT_AI_ANALYSIS : analyzed_by
    DREAM_PROJECT_TEMPLATES ||--o{ DREAM_PROJECTS : created_from
    USERS ||--o{ DREAM_PROJECTS : owns
    USERS ||--o{ DREAM_PROJECT_COLLABORATORS : participates_in
    USERS ||--o{ DREAM_PROJECT_LIKES : likes
    PROPERTIES ||--o{ DREAM_PROJECTS : associated_with
    PROJECTS ||--o{ DREAM_PROJECTS : converted_to

    DREAM_PROJECTS {
        UUID id PK
        UUID owner_id FK
        string title
        text description
        string status
        decimal budget_min
        decimal budget_max
        date desired_start_date
        date desired_completion_date
        UUID property_id FK
        string room_type
        string project_size
        boolean is_public
        timestamp created_at
        timestamp updated_at
        timestamp published_at
        timestamp archived_at
        timestamp converted_at
        UUID converted_project_id FK
        string conversion_source
        jsonb metadata
        tsvector search_vector
    }

    DREAM_PROJECT_IMAGES {
        UUID id PK
        UUID dream_project_id FK
        string storage_path
        string file_name
        int file_size
        string content_type
        int width
        int height
        boolean is_primary
        int sort_order
        text caption
        timestamp created_at
        UUID uploaded_by FK
        jsonb metadata
    }

    DREAM_PROJECT_INSPIRATIONS {
        UUID id PK
        UUID dream_project_id FK
        string inspiration_type
        string title
        text description
        string external_url
        string storage_path
        UUID reference_id
        int sort_order
        timestamp created_at
        UUID created_by FK
        jsonb metadata
    }

    DREAM_PROJECT_FEATURES {
        UUID id PK
        UUID dream_project_id FK
        string feature_type
        text description
        int sort_order
        timestamp created_at
        UUID created_by FK
    }

    DREAM_PROJECT_COLLABORATORS {
        UUID id PK
        UUID dream_project_id FK
        UUID user_id FK
        string permission_level
        timestamp invited_at
        UUID invited_by FK
        timestamp accepted_at
        string status
    }

    DREAM_PROJECT_CONVERSION_ATTEMPTS {
        UUID id PK
        UUID dream_project_id FK
        UUID user_id FK
        string status
        string conversion_step
        UUID created_project_id
        timestamp started_at
        timestamp completed_at
        text abandonment_reason
        string conversion_source
        jsonb conversion_path
        jsonb session_data
        jsonb metadata
    }

    DREAM_PROJECT_RECOMMENDATIONS {
        UUID id PK
        UUID dream_project_id FK
        UUID contractor_id FK
        decimal recommendation_score
        text recommendation_reason
        jsonb matching_criteria
        timestamp created_at
        timestamp updated_at
        string status
        timestamp contacted_at
    }

    DREAM_PROJECT_TEMPLATES {
        UUID id PK
        string title
        text description
        string category
        string room_type
        int typical_duration_days
        decimal typical_budget_min
        decimal typical_budget_max
        string complexity_level
        array required_specialties
        jsonb common_features
        jsonb template_content
        boolean is_active
        timestamp created_at
        timestamp updated_at
        UUID created_by FK
        int usage_count
    }

    DREAM_PROJECT_AI_ANALYSIS {
        UUID id PK
        UUID dream_project_id FK
        string analysis_type
        string analysis_version
        jsonb analysis_data
        decimal confidence_score
        timestamp created_at
        timestamp updated_at
        boolean is_current
    }

    DREAM_PROJECT_LIKES {
        UUID id PK
        UUID dream_project_id FK
        UUID user_id FK
        timestamp created_at
    }

    CONVERSION_ANALYTICS {
        UUID id PK
        date period_start
        date period_end
        string conversion_source
        int conversion_count
        int view_count
        decimal conversion_rate
        int avg_conversion_time_minutes
        int avg_steps_to_conversion
        jsonb top_conversion_paths
        jsonb top_abandonment_reasons
        jsonb metadata
        timestamp created_at
    }

    USERS {
        UUID id PK
        string email
        string display_name
        string role
        timestamp created_at
    }

    PROPERTIES {
        UUID id PK
        UUID owner_id FK
        string address
        string property_type
        timestamp created_at
    }

    PROJECTS {
        UUID id PK
        UUID owner_id FK
        string title
        string status
        timestamp created_at
    }
```

## Relationship Details

### Dream Projects Core Relationships

1. **Dream Projects & Images**
   - A dream project can have multiple images (including before/after, inspirational photos)
   - Images are linked directly to a dream project with a required foreign key
   - The `is_primary` flag identifies the main image for the dream project

2. **Dream Projects & Features**
   - Dream projects can specify multiple features (must-haves, nice-to-haves, avoid items)
   - Features are categorized by type and can be sorted in priority order

3. **Dream Projects & Inspirations**
   - Dream projects can have multiple inspirations (external links, other projects, etc.)
   - Inspiration sources are categorized by type and can include both internal and external references

4. **Dream Projects & Collaborators**
   - Dream projects can be shared with other users for collaboration
   - Collaborators have different permission levels (view, edit, admin)
   - Collaboration invitations track status (pending, accepted, declined, revoked)

### Dream Projects Conversion Relationships

1. **Dream Projects & Conversion Attempts**
   - Tracks all attempts to convert a dream project into an actual project
   - Records detailed conversion path, step, and completion status
   - Captures abandonment reasons for analytics and improvement

2. **Dream Projects & Projects**
   - When a dream project is successfully converted, it links to the created project
   - The `converted_project_id` field creates a direct reference to the resulting project

3. **Dream Projects & Conversion Analytics**
   - Aggregation table that tracks conversion metrics across time periods
   - Used for reporting and optimization of the conversion process

### AI & Recommendation Relationships

1. **Dream Projects & AI Analysis**
   - Stores AI-driven analysis of dream project content
   - Can include multiple analysis types (complexity estimation, scope clarification, etc.)
   - Maintains version history with confidence scores

2. **Dream Projects & Recommendations**
   - Links qualified contractors to dream projects based on matching criteria
   - Tracks recommendation status (active, dismissed, contacted)
   - Records communication with recommended contractors

### Template & Inspiration Relationships

1. **Templates & Dream Projects**
   - Dream projects can be created from predefined templates
   - Templates contain standardized structures for common project types
   - Usage tracking helps identify popular templates

2. **Dream Projects & Likes**
   - Public dream projects can be liked/saved by other users for inspiration
   - Creates a many-to-many relationship between users and public dream projects

## Special Considerations

1. **Row-Level Security**
   - Dream projects are protected with row-level security policies
   - Access is limited to owners, collaborators, and public viewing for shared projects
   - Analytics tables are restricted to admin users

2. **Full-Text Search**
   - Dream projects include a generated search vector for efficient text searching
   - Search prioritizes title (A), description (B), and room type (C) in relevance

3. **Conversion Tracking**
   - The system tracks the full conversion funnel from creation to conversion
   - Analytics capture both successful and abandoned conversion attempts
   - Custom views provide insights into conversion rates and patterns

4. **Public Inspiration Feed**
   - A special view for browsing public dream projects
   - Includes aggregated like counts and primary image paths
   - Used for the inspiration gallery functionality
