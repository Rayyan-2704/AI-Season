from typing import List, Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.itinerary import Itinerary
    from app.models.saved_place import SavedPlace


class Trip(SQLModel, table=True):
    __tablename__ = "trips"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True, nullable=False)
    title: str = Field(nullable=False)
    destination: str = Field(nullable=False)
    start_date: str = Field(nullable=False)
    end_date: str = Field(nullable=False)
    status: str = Field(default="draft", nullable=False)
    travel_style: Optional[str] = Field(default=None)
    created_at: str = Field(nullable=False)

    user: Optional["User"] = Relationship(back_populates="trips")
    itineraries: List["Itinerary"] = Relationship(back_populates="trip")
    saved_places: List["SavedPlace"] = Relationship(back_populates="trip")