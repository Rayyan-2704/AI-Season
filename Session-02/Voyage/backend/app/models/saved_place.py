from typing import Optional, TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

if TYPE_CHECKING:
    from app.models.trip import Trip


class SavedPlace(SQLModel, table=True):
    __tablename__ = "saved_places"

    id: Optional[int] = Field(default=None, primary_key=True)
    trip_id: int = Field(foreign_key="trips.id", index=True, nullable=False)
    name: str = Field(nullable=False)
    notes: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None)

    trip: Optional["Trip"] = Relationship(back_populates="saved_places")