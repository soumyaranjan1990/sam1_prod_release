from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.security import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import TokenPayload
from app.services.user import user as user_service

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.ALGORITHM}/api/v1/auth/login" # This tokenUrl is just for docs
)

# Correct tokenUrl for OAuth2PasswordBearer
reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login"
)

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(reusable_oauth2)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (JWTError, ValidationError) as e:
        print(f"[AUTH ERROR] Token validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # sub can be a string in the JWT, convert to int for the DB lookup
    user_id = int(token_data.sub) if token_data.sub is not None else None
    user = user_service.get(db, id=user_id)
    if not user:
        print(f"[AUTH ERROR] User not found for ID: {user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    return user
