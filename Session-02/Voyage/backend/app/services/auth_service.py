from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Session, select

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserRegister


class AuthError(Exception):
    """Raised for any auth-related failure (duplicate email, bad credentials)."""
    pass


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def register_user(session: Session, user_data: UserRegister) -> User:
    existing_user = get_user_by_email(session, user_data.email)
    if existing_user is not None:
        raise AuthError("A user with this email already exists")

    new_user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        name=user_data.name,
        created_at=datetime.now(timezone.utc).isoformat(),
    )

    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return new_user


def authenticate_user(session: Session, email: str, password: str) -> User:
    user = get_user_by_email(session, email)
    if user is None:
        raise AuthError("Invalid email or password")

    if not verify_password(password, user.hashed_password):
        raise AuthError("Invalid email or password")

    return user


def create_token_for_user(user: User) -> str:
    return create_access_token(subject=str(user.id))