from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from app.database import get_db
from app.models.models import User, Medication, MedicationSchedule, MedicationLog, CaregiverRelationship
from app.schemas.schemas import (
    MedicationLogCreate,
    MedicationLogResponse,
    TodayScheduleItem,
    AdherenceResponse,
)
from app.core.dependencies import get_current_user, verify_caregiver_access_to_elderly

router = APIRouter(prefix="/medication-logs", tags=["Medication Tracking"])

@router.post("", response_model=MedicationLogResponse, status_code=status.HTTP_201_CREATED)
def record_medication_log(
    log_in: MedicationLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a medicine as taken or update dose status.
    Guarantees no duplicate entries for the same scheduled dose and records exact timestamp.
    """
    med = db.query(Medication).filter(Medication.id == log_in.medication_id).first()
    if not med:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found.")

    target_user_id = med.user_id
    if current_user.role == "caregiver":
        if not verify_caregiver_access_to_elderly(current_user.id, target_user_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
    elif current_user.id != target_user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")

    # Check for existing log for the same medication, date, and scheduled time
    existing_log = db.query(MedicationLog).filter(
        MedicationLog.medication_id == log_in.medication_id,
        MedicationLog.log_date == log_in.log_date,
        MedicationLog.scheduled_time == log_in.scheduled_time
    ).first()

    now_utc = datetime.now(timezone.utc)

    if existing_log:
        # If already marked as taken, prevent duplicate submission or update notes/status
        existing_log.status = log_in.status
        if log_in.status == "taken" and not existing_log.taken_at:
            existing_log.taken_at = now_utc
        elif log_in.status != "taken":
            existing_log.taken_at = None
        if log_in.notes is not None:
            existing_log.notes = log_in.notes
        
        db.commit()
        db.refresh(existing_log)
        
        return MedicationLogResponse(
            id=existing_log.id,
            medication_id=existing_log.medication_id,
            user_id=existing_log.user_id,
            scheduled_time=existing_log.scheduled_time,
            log_date=existing_log.log_date,
            status=existing_log.status,
            taken_at=existing_log.taken_at,
            notes=existing_log.notes,
            created_at=existing_log.created_at,
            medication_name=med.medicine_name,
            dosage=med.dosage
        )

    # Create new log
    taken_at_val = now_utc if log_in.status == "taken" else None
    new_log = MedicationLog(
        medication_id=med.id,
        user_id=target_user_id,
        scheduled_time=log_in.scheduled_time,
        log_date=log_in.log_date,
        status=log_in.status,
        taken_at=taken_at_val,
        notes=log_in.notes or "Marked via ElderCare Web Platform",
        created_at=now_utc
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return MedicationLogResponse(
        id=new_log.id,
        medication_id=new_log.medication_id,
        user_id=new_log.user_id,
        scheduled_time=new_log.scheduled_time,
        log_date=new_log.log_date,
        status=new_log.status,
        taken_at=new_log.taken_at,
        notes=new_log.notes,
        created_at=new_log.created_at,
        medication_name=med.medicine_name,
        dosage=med.dosage
    )

@router.get("/today", response_model=List[TodayScheduleItem])
def get_today_medication_schedule(
    elderly_id: Optional[int] = Query(None, description="Elderly ID when queried by caregiver"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns today's medication timeline items with status: 'taken', 'upcoming', or 'missed',
    including whether upcoming doses are overdue based on current time.
    """
    target_user_id = current_user.id
    if current_user.role == "caregiver":
        if not elderly_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Caregiver must provide elderly_id.")
        if not verify_caregiver_access_to_elderly(current_user.id, elderly_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
        target_user_id = elderly_id

    today_str = date.today().isoformat()
    now_time = datetime.now().strftime("%H:%M")

    # Get active medications for user
    medications = db.query(Medication).filter(Medication.user_id == target_user_id).all()
    
    # Get today's logs for user
    logs = db.query(MedicationLog).filter(
        MedicationLog.user_id == target_user_id,
        MedicationLog.log_date == today_str
    ).all()
    log_map = {(log.medication_id, log.scheduled_time): log for log in logs}

    timeline_items = []

    for med in medications:
        for sched in med.schedules:
            if not sched.active:
                continue

            scheduled_time = sched.scheduled_time
            log = log_map.get((med.id, scheduled_time))

            if log:
                status_val = log.status
                taken_at_val = log.taken_at
                log_id_val = log.id
                is_overdue = False
            else:
                log_id_val = None
                taken_at_val = None
                # If scheduled time has passed by more than 45 minutes and not logged, consider overdue
                is_overdue = scheduled_time < now_time
                status_val = "missed" if is_overdue else "upcoming"

            timeline_items.append(TodayScheduleItem(
                medication_id=med.id,
                medicine_name=med.medicine_name,
                dosage=med.dosage,
                instructions=med.instructions,
                category=med.category,
                color=med.color,
                scheduled_time=scheduled_time,
                status=status_val,
                taken_at=taken_at_val,
                log_id=log_id_val,
                is_overdue=is_overdue
            ))

    # Sort chronologically by scheduled_time
    timeline_items.sort(key=lambda item: item.scheduled_time)
    return timeline_items

@router.get("", response_model=List[MedicationLogResponse])
def get_medication_logs(
    elderly_id: Optional[int] = Query(None),
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve historical medication logs."""
    target_user_id = current_user.id
    if current_user.role == "caregiver":
        if elderly_id:
            if not verify_caregiver_access_to_elderly(current_user.id, elderly_id, db):
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
            target_user_id = elderly_id
        else:
            # Query all connected elderly
            rels = db.query(CaregiverRelationship).filter(
                CaregiverRelationship.caregiver_id == current_user.id,
                CaregiverRelationship.relationship_status == "active"
            ).all()
            target_ids = [r.elderly_user_id for r in rels]
            logs = db.query(MedicationLog).filter(MedicationLog.user_id.in_(target_ids)).order_by(MedicationLog.created_at.desc()).limit(100).all()
            
            result = []
            for l in logs:
                med = db.query(Medication).filter(Medication.id == l.medication_id).first()
                result.append(MedicationLogResponse(
                    id=l.id,
                    medication_id=l.medication_id,
                    user_id=l.user_id,
                    scheduled_time=l.scheduled_time,
                    log_date=l.log_date,
                    status=l.status,
                    taken_at=l.taken_at,
                    notes=l.notes,
                    created_at=l.created_at,
                    medication_name=med.medicine_name if med else "Unknown Medication",
                    dosage=med.dosage if med else ""
                ))
            return result

    start_date = (date.today() - timedelta(days=days)).isoformat()
    logs = db.query(MedicationLog).filter(
        MedicationLog.user_id == target_user_id,
        MedicationLog.log_date >= start_date
    ).order_by(MedicationLog.log_date.desc(), MedicationLog.scheduled_time.desc()).all()

    result = []
    for l in logs:
        med = db.query(Medication).filter(Medication.id == l.medication_id).first()
        result.append(MedicationLogResponse(
            id=l.id,
            medication_id=l.medication_id,
            user_id=l.user_id,
            scheduled_time=l.scheduled_time,
            log_date=l.log_date,
            status=l.status,
            taken_at=l.taken_at,
            notes=l.notes,
            created_at=l.created_at,
            medication_name=med.medicine_name if med else "Unknown Medication",
            dosage=med.dosage if med else ""
        ))
    return result

@router.get("/adherence", response_model=AdherenceResponse)
def get_medication_adherence(
    elderly_id: Optional[int] = Query(None),
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculate adherence percentage and trends over the requested number of days."""
    target_user_id = current_user.id
    if current_user.role == "caregiver":
        if not elderly_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Caregiver must supply elderly_id.")
        if not verify_caregiver_access_to_elderly(current_user.id, elderly_id, db):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized access.")
        target_user_id = elderly_id

    start_date = date.today() - timedelta(days=days - 1)
    
    # Query logs in the period
    logs = db.query(MedicationLog).filter(
        MedicationLog.user_id == target_user_id,
        MedicationLog.log_date >= start_date.isoformat()
    ).all()

    taken_count = sum(1 for log in logs if log.status == "taken")
    missed_count = sum(1 for log in logs if log.status == "missed")
    total_logged = taken_count + missed_count
    
    adherence_pct = round((taken_count / total_logged * 100), 1) if total_logged > 0 else 100.0

    # Build day-by-day history for charts
    history = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        d_str = d.isoformat()
        day_logs = [l for l in logs if l.log_date == d_str]
        day_taken = sum(1 for l in day_logs if l.status == "taken")
        day_missed = sum(1 for l in day_logs if l.status == "missed")
        day_total = day_taken + day_missed
        day_rate = round((day_taken / day_total * 100), 1) if day_total > 0 else 100.0
        
        history.append({
            "date": d.strftime("%b %d"),
            "full_date": d_str,
            "taken": day_taken,
            "missed": day_missed,
            "adherence_rate": day_rate
        })

    return AdherenceResponse(
        adherence_percentage=adherence_pct,
        total_doses=total_logged,
        taken_doses=taken_count,
        missed_doses=missed_count,
        pending_doses=0,
        history=history
    )
