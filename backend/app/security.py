from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app import models

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


def hash_password(p: str) -> str:
    return pwd.hash(p)


def verify_password(p: str, h: str) -> bool:
    return pwd.verify(p, h)


def create_token(sub: str, role: str, farmer_id: str | None) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode(
        {"sub": sub, "role": role, "farmer_id": farmer_id, "exp": exp},
        settings.secret_key,
        algorithm="HS256",
    )


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> models.User:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, settings.secret_key, algorithms=["HS256"])
    except JWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token") from e
    user = db.get(models.User, payload.get("sub"))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def farmer_id_of(user: models.User) -> str | None:
    return user.farmer.id if user.farmer else None


def assert_field_access(db: Session, user: models.User, field_id: str) -> models.Field:
    field = db.get(models.Field, field_id)
    if not field:
        raise HTTPException(404, "Field not found")
    if user.role in ("engineer", "admin"):
        return field
    if not user.farmer or field.farmer_id != user.farmer.id:
        raise HTTPException(403, "Not authorized for this field")
    return field


def hash_device_token(token: str) -> str:
    return pwd.hash(token)


def verify_device_token(token: str, hashed: str) -> bool:
    return pwd.verify(token, hashed)
