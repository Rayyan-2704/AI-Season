-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    email               TEXT NOT NULL,
    hashed_password     TEXT NOT NULL,
    name                TEXT NOT NULL,
    created_at          TEXT NOT NULL,  -- ISO8601 string, e.g. "2026-07-22T05:00:00Z"

    CONSTRAINT uq_users_email UNIQUE (email)
);

-- =========================================
-- TRIPS
-- =========================================
CREATE TABLE trips (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id             INTEGER NOT NULL,
    title               TEXT NOT NULL,
    destination         TEXT NOT NULL,
    start_date          TEXT NOT NULL,  -- ISO8601
    end_date            TEXT NOT NULL,  -- ISO8601
    status              TEXT NOT NULL DEFAULT 'draft',  -- 'draft' | 'upcoming' | 'past'
    travel_style        TEXT,
    created_at          TEXT NOT NULL,  -- ISO8601

    CONSTRAINT fk_trips_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_trips_user_id ON trips (user_id);

-- =========================================
-- ITINERARIES
-- =========================================
CREATE TABLE itineraries (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id             INTEGER NOT NULL,
    narrative_text      TEXT NOT NULL,
    raw_gemini_payload  TEXT,           -- unparsed Gemini JSON response
    generated_at        TEXT NOT NULL, -- ISO8601

    CONSTRAINT fk_itineraries_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_itineraries_trip_id ON itineraries (trip_id);

-- =========================================
-- SAVEDPLACES
-- =========================================
CREATE TABLE saved_places (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id             INTEGER NOT NULL,
    name                TEXT NOT NULL,
    notes               TEXT,
    category            TEXT,           -- e.g. 'lodging', 'food', 'activity', 'transport'

    CONSTRAINT fk_saved_places_trip
        FOREIGN KEY (trip_id) REFERENCES trips (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_saved_places_trip_id ON saved_places (trip_id);