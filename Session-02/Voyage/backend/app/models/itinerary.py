from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.trip import Trip


class Itinerary(SQLModel, table=True):
    __tablename__ = "itineraries"

    id: Optional[int] = Field(default=None, primary_key=True)
    trip_id: int = Field(foreign_key="trips.id", index=True, nullable=False)
    narrative_text: str = Field(nullable=False)
    raw_gemini_payload: Optional[str] = Field(default=None)
    generated_at: str = Field(nullable=False)

    trip: Optional["Trip"] = Relationship(back_populates="itineraries")