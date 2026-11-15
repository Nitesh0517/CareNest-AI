from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.models import User, Medication, MedicationSchedule, CaregiverRelationship
from app.schemas.schemas import MedicationCreate, MedicationUpdate, MedicationResponse
from app.core.dependencies import get_current_user, verify_caregiver_access_to_elderly

router = APIRouter(prefix="/medications", tags=["Medications"])

@router.post("", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(
    med_in: MedicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new medication and its schedule times."""
    target_user_id = current_user.id

    # If caregiver is creating medication for an elderly person
    if current_user.role == "caregiver":
        if not med_in.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Caregiver must specify user_id of the elderly patient."
            )
        if not verify_caregiver_access_to_elderly(current_user.id, med_in.user_id, db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have active caregiver access for this elderly profile."
            )
        target_user_id = med_in.user_id
    elif med_in.user_id and med_in.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Elderly users can only add medications for themselves."
        )

    med = Medication(
        user_id=target_user_id,
        medicine_name=med_in.medicine_name.strip(),
        dosage=med_in.dosage.strip(),
        frequency=med_in.frequency.strip(),
        instructions=med_in.instructions,
        start_date=med_in.start_date,
        end_date=med_in.end_date,
        category=med_in.category or "General",
        color=med_in.color or "#2563EB"
    )
    db.add(med)
    db.flush()

    # Add schedule times
    for s_time in med_in.schedules:
        s_time_clean = s_time.strip()
        if s_time_clean:
            sched = MedicationSchedule(
                medication_id=med.id,
                scheduled_time=s_time_clean,
                active=True
            )
            db.add(sched)

    db.commit()
    db.refresh(med)
    return med

@router.get("", response_model=List[MedicationResponse])
def get_medications(
    elderly_id: Optional[int] = Query(None, description="Elderly ID when queried by caregiver"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List medications for the current user or connected elderly patient."""
    target_user_id = current_user.id

    if current_user.role == "caregiver":
        if not elderly_id:
            # If no specific elderly_id, fetch all medications belonging to all connected elderly patients
            relationships = db.query(CaregiverRelationship).filter(
                CaregiverRelationship.caregiver_id == current_user.id,
                CaregiverRelationship.relationship_status == "active"
            ).all()
            elderly_ids = [rel.elderly_user_id for rel in relationships]
            return db.query(Medication).filter(Medication.user_id.in_(elderly_ids)).all()
        else:
            if not verify_caregiver_access_to_elderly(current_user.id, elderly_id, db):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Unauthorized access to this elderly patient's medications."
                )
            target_user_id = elderly_id

    meds = db.query(Medication).filter(Medication.user_id == target_user_id).all()
    return meds

@router.get("/{id}", response_model=MedicationResponse)
def get_medication_by_id(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve details for a single medication."""
    med = db.query(Medication).filter(Medication.id == id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")

    if current_user.role == "caregiver":
        if not verify_caregiver_access_to_elderly(current_user.id, med.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
    elif med.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")

    return med

@router.put("/{id}", response_model=MedicationResponse)
def update_medication(
    id: int,
    med_update: MedicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update medication details and schedules."""
    med = db.query(Medication).filter(Medication.id == id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")

    if current_user.role == "caregiver":
        if not verify_caregiver_access_to_elderly(current_user.id, med.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
    elif med.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")

    if med_update.medicine_name is not None:
        med.medicine_name = med_update.medicine_name.strip()
    if med_update.dosage is not None:
        med.dosage = med_update.dosage.strip()
    if med_update.frequency is not None:
        med.frequency = med_update.frequency.strip()
    if med_update.instructions is not None:
        med.instructions = med_update.instructions
    if med_update.start_date is not None:
        med.start_date = med_update.start_date
    if med_update.end_date is not None:
        med.end_date = med_update.end_date
    if med_update.category is not None:
        med.category = med_update.category
    if med_update.color is not None:
        med.color = med_update.color

    # Update schedules if provided
    if med_update.schedules is not None:
        # Clear existing schedules and re-create
        db.query(MedicationSchedule).filter(MedicationSchedule.medication_id == med.id).delete()
        for s_time in med_update.schedules:
            if s_time.strip():
                db.add(MedicationSchedule(
                    medication_id=med.id,
                    scheduled_time=s_time.strip(),
                    active=True
                ))

    db.commit()
    db.refresh(med)
    return med

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a medication and its associated schedules."""
    med = db.query(Medication).filter(Medication.id == id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")

    if current_user.role == "caregiver":
        if not verify_caregiver_access_to_elderly(current_user.id, med.user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
    elif med.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")

    db.delete(med)
    db.commit()
    return None
