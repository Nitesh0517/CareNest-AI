from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from app.database import get_db
from app.models.models import User, EmergencyContact, EmergencyEvent, CaregiverRelationship
from app.schemas.schemas import (
    EmergencyContactCreate,
    EmergencyContactResponse,
    SOSRequest,
    EmergencyEventResponse,
)
from app.core.dependencies import get_current_user, verify_caregiver_access_to_elderly

router = APIRouter(prefix="/emergency", tags=["Emergency Services"])

@router.post("/contacts", response_model=EmergencyContactResponse, status_code=status.HTTP_201_CREATED)
def add_emergency_contact(
    contact_in: EmergencyContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a new trusted emergency contact."""
    target_user_id = current_user.id
    if current_user.role == "caregiver":
        if not contact_in.user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Caregiver must supply elderly user_id.")
        if not verify_caregiver_access_to_elderly(current_user.id, contact_in.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
        target_user_id = contact_in.user_id

    # If this is set as primary, unmark any previous primary contact
    if contact_in.is_primary:
        db.query(EmergencyContact).filter(
            EmergencyContact.user_id == target_user_id,
            EmergencyContact.is_primary == True
        ).update({"is_primary": False})

    contact = EmergencyContact(
        user_id=target_user_id,
        name=contact_in.name.strip(),
        phone_number=contact_in.phone_number.strip(),
        relationship=contact_in.relationship.strip(),
        is_primary=contact_in.is_primary
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

@router.get("/contacts", response_model=List[EmergencyContactResponse])
def get_emergency_contacts(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List registered emergency contacts for current user or connected elderly."""
    target_user_id = current_user.id
    if current_user.role == "caregiver":
        if not elderly_id:
            # All contacts for all connected elderly
            links = db.query(CaregiverRelationship).filter(
                CaregiverRelationship.caregiver_id == current_user.id,
                CaregiverRelationship.relationship_status == "active"
            ).all()
            ids = [l.elderly_user_id for l in links]
            return db.query(EmergencyContact).filter(EmergencyContact.user_id.in_(ids)).all()
        else:
            if not verify_caregiver_access_to_elderly(current_user.id, elderly_id, db):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
            target_user_id = elderly_id

    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.user_id == target_user_id
    ).order_by(EmergencyContact.is_primary.desc(), EmergencyContact.name.asc()).all()
    return contacts

@router.delete("/contacts/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emergency_contact(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an emergency contact."""
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == id).first()
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency contact not found.")

    if current_user.role == "caregiver":
        if not verify_caregiver_access_to_elderly(current_user.id, contact.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
    elif contact.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")

    db.delete(contact)
    db.commit()
    return None

@router.post("/sos", response_model=EmergencyEventResponse, status_code=status.HTTP_201_CREATED)
def trigger_emergency_sos(
    sos_data: SOSRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Trigger emergency SOS event.
    Creates an urgent event in the database, broadcastable to connected caregivers.
    """
    target_user_id = current_user.id
    if current_user.role == "caregiver" and sos_data.user_id:
        if not verify_caregiver_access_to_elderly(current_user.id, sos_data.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
        target_user_id = sos_data.user_id

    elder = db.query(User).filter(User.id == target_user_id).first()

    event = EmergencyEvent(
        user_id=target_user_id,
        event_type="SOS_BUTTON_TRIGGERED",
        status="ACTIVE",
        notes=sos_data.notes or f"SOS Alert initiated by {current_user.name}",
        created_at=datetime.now(timezone.utc)
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    return EmergencyEventResponse(
        id=event.id,
        user_id=event.user_id,
        event_type=event.event_type,
        status=event.status,
        notes=event.notes,
        created_at=event.created_at,
        user_name=elder.name if elder else current_user.name,
        user_phone=elder.phone if elder else current_user.phone
    )

@router.get("/history", response_model=List[EmergencyEventResponse])
def get_emergency_history(
    elderly_id: Optional[int] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get history of emergency events."""
    target_user_id = current_user.id
    if current_user.role == "caregiver":
        if not elderly_id:
            links = db.query(CaregiverRelationship).filter(
                CaregiverRelationship.caregiver_id == current_user.id,
                CaregiverRelationship.relationship_status == "active"
            ).all()
            ids = [l.elderly_user_id for l in links]
            events = db.query(EmergencyEvent).filter(EmergencyEvent.user_id.in_(ids)).order_by(EmergencyEvent.created_at.desc()).limit(50).all()
        else:
            if not verify_caregiver_access_to_elderly(current_user.id, elderly_id, db):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
            events = db.query(EmergencyEvent).filter(EmergencyEvent.user_id == elderly_id).order_by(EmergencyEvent.created_at.desc()).all()
    else:
        events = db.query(EmergencyEvent).filter(EmergencyEvent.user_id == target_user_id).order_by(EmergencyEvent.created_at.desc()).all()

    res = []
    for ev in events:
        u = db.query(User).filter(User.id == ev.user_id).first()
        res.append(EmergencyEventResponse(
            id=ev.id,
            user_id=ev.user_id,
            event_type=ev.event_type,
            status=ev.status,
            notes=ev.notes,
            created_at=ev.created_at,
            user_name=u.name if u else "User",
            user_phone=u.phone if u else ""
        ))
    return res

@router.put("/events/{id}/resolve", response_model=EmergencyEventResponse)
def resolve_emergency_event(
    id: int,
    status_update: str = Query("RESOLVED", pattern="^(RESOLVED|ACKNOWLEDGED)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an emergency SOS alert as acknowledged or resolved."""
    ev = db.query(EmergencyEvent).filter(EmergencyEvent.id == id).first()
    if not ev:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Emergency event not found.")

    if current_user.role == "caregiver":
        if not verify_caregiver_access_to_elderly(current_user.id, ev.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
    elif ev.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")

    ev.status = status_update
    ev.notes = (ev.notes or "") + f" | Updated to {status_update} by {current_user.name} at {datetime.now(timezone.utc).strftime('%H:%M UTC')}"
    db.commit()
    db.refresh(ev)

    u = db.query(User).filter(User.id == ev.user_id).first()
    return EmergencyEventResponse(
        id=ev.id,
        user_id=ev.user_id,
        event_type=ev.event_type,
        status=ev.status,
        notes=ev.notes,
        created_at=ev.created_at,
        user_name=u.name if u else "User",
        user_phone=u.phone if u else ""
    )
