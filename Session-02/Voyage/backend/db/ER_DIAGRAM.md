**Core entities:** `Users`, `Trips`, `Itineraries`, `SavedPlaces`

```mermaid
erDiagram
    USERS ||--o{ TRIPS : owns
    TRIPS ||--o{ ITINERARIES : has
    TRIPS ||--o{ SAVEDPLACES : includes
    USERS {
        int id PK
        string email UK
        string hashed_password
        string name
        string created_at
    }
    TRIPS {
        int id PK
        int user_id FK
        string title
        string destination
        string start_date
        string end_date
        string status
        string travel_style
        string created_at
    }
    ITINERARIES {
        int id PK
        int trip_id FK
        string narrative_text
        string raw_gemini_payload
        string generated_at
    }
    SAVEDPLACES {
        int id PK
        int trip_id FK
        string name
        string notes
        string category
    }
```

Requirements for Phase 2 (DB design step): primary/foreign keys, unique constraint on `users.email`, indexes on `trips.user_id` and `itineraries.trip_id`, ISO8601 strings for all datetime fields, `raw_gemini_payload` as a TEXT column for the unparsed Gemini JSON response.