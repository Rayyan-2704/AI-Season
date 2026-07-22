from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.dependencies import get_current_user
from app.database import get_session
from app.models.itinerary import Itinerary
from app.models.trip import Trip
from app.models.user import User
from app.schemas.itinerary import (
    ItineraryGenerateRequest,
    ItineraryRead,
    ItineraryRegenerateRequest,
)
from app.services.gemini_service import (
    GeminiServiceError,
    generate_itinerary_narrative,
    regenerate_itinerary_narrative,
)

router = APIRouter(prefix="/trips/{trip_id}/itinerary", tags=["itineraries"])


def _get_owned_trip(session: Session, trip_id: int, current_user: User) -> Trip:
    trip = session.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this trip")
    return trip


def _get_latest_itinerary(session: Session, trip_id: int) -> Itinerary:
    statement = (
        select(Itinerary)
        .where(Itinerary.trip_id == trip_id)
        .order_by(Itinerary.generated_at.desc())
    )
    itinerary = session.exec(statement).first()
    if itinerary is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No itinerary exists yet for this trip",
        )
    return itinerary


@router.post("", response_model=ItineraryRead, status_code=status.HTTP_201_CREATED)
def create_itinerary(
    trip_id: int,
    request_data: ItineraryGenerateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = _get_owned_trip(session, trip_id, current_user)

    try:
        narrative_text, raw_payload = generate_itinerary_narrative(
            trip=trip,
            pace=request_data.pace,
            travel_style=request_data.travel_style,
            notes=request_data.notes,
        )
    except GeminiServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to generate itinerary: {str(e)}",
        )

    try:
        new_itinerary = Itinerary(
            trip_id=trip.id,
            narrative_text=narrative_text,
            raw_gemini_payload=raw_payload,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
        session.add(new_itinerary)
        session.commit()
        session.refresh(new_itinerary)
        return new_itinerary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Itinerary generated but failed to save",
        ) from e


@router.post("/regenerate", response_model=ItineraryRead, status_code=status.HTTP_201_CREATED)
def regenerate_itinerary(
    trip_id: int,
    request_data: ItineraryRegenerateRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = _get_owned_trip(session, trip_id, current_user)
    existing = _get_latest_itinerary(session, trip_id)

    try:
        narrative_text, raw_payload = regenerate_itinerary_narrative(
            trip=trip,
            existing_narrative=existing.narrative_text,
            section=request_data.section,
            pace=request_data.pace,
            travel_style=request_data.travel_style,
            notes=request_data.notes,
        )
    except GeminiServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to regenerate itinerary: {str(e)}",
        )

    try:
        new_itinerary = Itinerary(
            trip_id=trip.id,
            narrative_text=narrative_text,
            raw_gemini_payload=raw_payload,
            generated_at=datetime.now(timezone.utc).isoformat(),
        )
        session.add(new_itinerary)
        session.commit()
        session.refresh(new_itinerary)
        return new_itinerary
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Itinerary regenerated but failed to save",
        ) from e


@router.get("", response_model=ItineraryRead)
def get_itinerary(
    trip_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    _get_owned_trip(session, trip_id, current_user)
    return _get_latest_itinerary(session, trip_id)