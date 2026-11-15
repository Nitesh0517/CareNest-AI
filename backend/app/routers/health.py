from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional
from app.database import get_db
from app.models.models import User, HealthRecord, CaregiverRelationship
from app.schemas.schemas import HealthRecordCreate, HealthRecordResponse
from app.core.dependencies import get_current_user, verify_caregiver_access_to_elderly

router = APIRouter(prefix="/health-records", tags=["Health Monitoring"])

DISCLAIMER = "Notice: Health records recorded on ElderCare AI are for wellness and personal tracking purposes only. They do not constitute clinical diagnosis or treatment recommendations. Always consult a qualified physician for medical decisions."

@router.post("", response_model=HealthRecordResponse, status_code=status.HTTP_201_CREATED)
def create_health_record(
    record_in: HealthRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Log a new health metric (blood pressure, glucose, heart rate, weight).
    Caregivers can log for authorized connected elderly users.
    """
    target_user_id = current_user.id
    if current_user.role == "caregiver":
        if not record_in.user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Caregiver must specify user_id.")
        if not verify_caregiver_access_to_elderly(current_user.id, record_in.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
        target_user_id = record_in.user_id
    elif record_in.user_id and record_in.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot record health data for another user.")

    # Validation
    if record_in.blood_pressure_systolic is not None and (record_in.blood_pressure_systolic < 50 or record_in.blood_pressure_systolic > 300):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Systolic pressure out of plausible range (50-300 mmHg).")

    if record_in.blood_pressure_diastolic is not None and (record_in.blood_pressure_diastolic < 30 or record_in.blood_pressure_diastolic > 200):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Diastolic pressure out of plausible range (30-200 mmHg).")

    recorded_time = record_in.recorded_at or datetime.now(timezone.utc)

    record = HealthRecord(
        user_id=target_user_id,
        blood_pressure_systolic=record_in.blood_pressure_systolic,
        blood_pressure_diastolic=record_in.blood_pressure_diastolic,
        blood_glucose=record_in.blood_glucose,
        heart_rate=record_in.heart_rate,
        weight=record_in.weight,
        notes=record_in.notes,
        recorded_at=recorded_time
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("", response_model=List[HealthRecordResponse])
def get_health_records(
    elderly_id: Optional[int] = Query(None),
    limit: int = Query(30, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve historical health measurements for trend analytics."""
    target_user_id = current_user.id
    if current_user.role == "caregiver":
        if not elderly_id:
            # Get latest for all connected
            links = db.query(CaregiverRelationship).filter(
                CaregiverRelationship.caregiver_id == current_user.id,
                CaregiverRelationship.relationship_status == "active"
            ).all()
            ids = [l.elderly_user_id for l in links]
            return db.query(HealthRecord).filter(HealthRecord.user_id.in_(ids)).order_by(HealthRecord.recorded_at.desc()).limit(limit).all()
        else:
            if not verify_caregiver_access_to_elderly(current_user.id, elderly_id, db):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
            target_user_id = elderly_id

    records = db.query(HealthRecord).filter(
        HealthRecord.user_id == target_user_id
    ).order_by(HealthRecord.recorded_at.desc()).limit(limit).all()
    return records

@router.get("/{id}", response_model=HealthRecordResponse)
def get_health_record_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a single health record by ID."""
    rec = db.query(HealthRecord).filter(HealthRecord.id == id).first()
    if not rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Health record not found.")

    if current_user.role == "caregiver":
        if not verify_caregiver_access_to_elderly(current_user.id, rec.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
    elif rec.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")

    return rec
