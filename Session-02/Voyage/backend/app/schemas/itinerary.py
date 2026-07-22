from typing import Optional

from pydantic import BaseModel, Field


class ItineraryGenerateRequest(BaseModel):
    pace: str = Field(default="moderate", description="e.g. relaxed, moderate, packed")
    travel_style: Optional[str] = Field(default=None, description="e.g. romantic, adventurous, cultural")
    notes: Optional[str] = Field(default=None, description="Any extra preferences from the user")


class ItineraryRegenerateRequest(BaseModel):
    section: Optional[str] = Field(default=None, description="Which section to regenerate, if patching rather than full rewrite")
    pace: Optional[str] = None
    travel_style: Optional[str] = None
    notes: Optional[str] = None


class ItineraryRead(BaseModel):
    id: int
    trip_id: int
    narrative_text: str
    generated_at: str

    model_config = {"from_attributes": True}