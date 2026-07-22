"""
Seed script for Voyage — populates the SQLite database with sample data
for frontend development. Safe to run multiple times; it skips creating
the demo user if it already exists, but will still add fresh trips.

Run from the backend/ folder with:
    python seed.py
"""

from datetime import datetime, timezone

from app.database import get_session, init_db
from app.models.itinerary import Itinerary
from app.models.saved_place import SavedPlace
from app.models.trip import Trip
from app.models.user import User
from app.services.auth_service import get_user_by_email
from app.core.security import hash_password


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def seed():
    init_db()
    session = next(get_session())

    # --- Demo user ---
    demo_email = "demo@voyage.app"
    user = get_user_by_email(session, demo_email)
    if user is None:
        user = User(
            email=demo_email,
            hashed_password=hash_password("demopass123"),
            name="Demo Traveler",
            created_at=now_iso(),
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"Created demo user: {user.email} (id={user.id})")
    else:
        print(f"Demo user already exists: {user.email} (id={user.id})")

    # --- Sample trips ---
    trips_data = [
        {
            "title": "Kyoto in Autumn",
            "destination": "Kyoto, Japan",
            "start_date": "2026-11-01",
            "end_date": "2026-11-10",
            "status": "upcoming",
            "travel_style": "cultural",
        },
        {
            "title": "Slow Days in the Algarve",
            "destination": "Algarve, Portugal",
            "start_date": "2026-05-12",
            "end_date": "2026-05-19",
            "status": "past",
            "travel_style": "relaxed coastal",
        },
        {
            "title": "Tuscany Wine Country",
            "destination": "Tuscany, Italy",
            "start_date": "2027-04-03",
            "end_date": "2027-04-11",
            "status": "draft",
            "travel_style": "culinary",
        },
    ]

    created_trips = []
    for trip_data in trips_data:
        trip = Trip(
            user_id=user.id,
            title=trip_data["title"],
            destination=trip_data["destination"],
            start_date=trip_data["start_date"],
            end_date=trip_data["end_date"],
            status=trip_data["status"],
            travel_style=trip_data["travel_style"],
            created_at=now_iso(),
        )
        session.add(trip)
        session.commit()
        session.refresh(trip)
        created_trips.append(trip)
        print(f"Created trip: {trip.title} (id={trip.id}, status={trip.status})")

    # --- Sample itinerary for the first (upcoming) trip ---
    kyoto_trip = created_trips[0]
    itinerary = Itinerary(
        trip_id=kyoto_trip.id,
        narrative_text=(
            "As the last wisps of summer's warmth dissipate, Kyoto awakens to the "
            "vibrant hues of autumn, a kaleidoscope of color dancing across the "
            "city's ancient landscapes. Over the next ten days, we'll meander "
            "through quiet temples, moss-covered gardens, and lantern-lit streets, "
            "letting the unhurried rhythm of the city set our pace.\n\n"
            "Day 1 — Softly Falling Leaves\n"
            "The first morning breaks with a gentle mist over the Imperial Palace "
            "gardens, gravel raked into quiet lines, the scent of damp earth in "
            "the air..."
        ),
        raw_gemini_payload=None,
        generated_at=now_iso(),
    )
    session.add(itinerary)
    session.commit()
    session.refresh(itinerary)
    print(f"Created itinerary for trip {kyoto_trip.id} (itinerary id={itinerary.id})")

    # --- Sample saved places for the first trip ---
    saved_places_data = [
        {"name": "Arashiyama Bamboo Grove", "notes": "Best at sunrise, before the crowds arrive.", "category": "activity"},
        {"name": "Kiyomizu-dera Temple", "notes": "Wooden stage view is worth the climb.", "category": "activity"},
        {"name": "Ryokan Sakura", "notes": "Traditional inn with a private onsen.", "category": "lodging"},
    ]

    for place_data in saved_places_data:
        place = SavedPlace(
            trip_id=kyoto_trip.id,
            name=place_data["name"],
            notes=place_data["notes"],
            category=place_data["category"],
        )
        session.add(place)

    session.commit()
    print(f"Created {len(saved_places_data)} saved places for trip {kyoto_trip.id}")

    session.close()
    print("\nSeeding complete.")
    print(f"Log in as: {demo_email} / demopass123")


if __name__ == "__main__":
    seed()