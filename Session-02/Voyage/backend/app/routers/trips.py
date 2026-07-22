from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.dependencies import get_current_user
from app.database import get_session
from app.models.trip import Trip
from app.models.user import User
from app.schemas.trip import TripCreate, TripRead, TripUpdate

router = APIRouter(prefix="/trips", tags=["trips"])


def _get_owned_trip(session: Session, trip_id: int, current_user: User) -> Trip:
    trip = session.get(Trip, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this trip")
    return trip


@router.get("", response_model=List[TripRead])
def list_trips(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        statement = select(Trip).where(Trip.user_id == current_user.id)
        trips = session.exec(statement).all()
        return trips
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch trips",
        ) from e


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip_data: TripCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    try:
        new_trip = Trip(
            user_id=current_user.id,
            title=trip_data.title,
            destination=trip_data.destination,
            start_date=trip_data.start_date,
            end_date=trip_data.end_date,
            status=trip_data.status,
            travel_style=trip_data.travel_style,
            created_at=datetime.now(timezone.utc).isoformat(),
        )
        session.add(new_trip)
        session.commit()
        session.refresh(new_trip)
        return new_trip
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create trip",
        ) from e


@router.get("/{trip_id}", response_model=TripRead)
def get_trip(
    trip_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    return _get_owned_trip(session, trip_id, current_user)


@router.put("/{trip_id}", response_model=TripRead)
def update_trip(
    trip_id: int,
    trip_data: TripUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = _get_owned_trip(session, trip_id, current_user)

    try:
        update_fields = trip_data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(trip, field, value)

        session.add(trip)
        session.commit()
        session.refresh(trip)
        return trip
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update trip",
        ) from e


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    trip = _get_owned_trip(session, trip_id, current_user)

    try:
        session.delete(trip)
        session.commit()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete trip",
        ) from e