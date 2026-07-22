from typing import Optional

from pydantic import BaseModel, Field


class TripCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    destination: str = Field(min_length=1, max_length=200)
    start_date: str
    end_date: str
    status: str = Field(default="draft")
    travel_style: Optional[str] = None


class TripUpdate(BaseModel):
    title: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    travel_style: Optional[str] = None


class TripRead(BaseModel):
    id: int
    user_id: int
    title: str
    destination: str
    start_date: str
    end_date: str
    status: str
    travel_style: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}