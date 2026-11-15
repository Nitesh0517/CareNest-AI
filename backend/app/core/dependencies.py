from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.security import decode_access_token
from app.models.models import User, CaregiverRelationship

security_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate JWT token and return authenticated User object."""
    token = credentials.credentials
    payload = decode_access_token(token)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token payload.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def require_elderly_role(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the authenticated user is an elderly user."""
    if current_user.role != "elderly":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to elderly users.",
        )
    return current_user

def require_caregiver_role(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the authenticated user is a caregiver."""
    if current_user.role != "caregiver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted to caregivers.",
        )
    return current_user

def verify_caregiver_access_to_elderly(caregiver_id: int, elderly_user_id: int, db: Session) -> bool:
    """Check if the caregiver has active authorization to access the elderly user's data."""
    link = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == caregiver_id,
        CaregiverRelationship.elderly_user_id == elderly_user_id,
        CaregiverRelationship.relationship_status == "active"
    ).first()
    return link is not None
