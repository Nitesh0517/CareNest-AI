from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta, timezone
from typing import Optional, List
from app.database import get_db
from app.models.models import (
    User,
    Medication,
    MedicationSchedule,
    MedicationLog,
    HealthRecord,
    EmergencyContact,
    EmergencyEvent,
)
from app.schemas.schemas import (
    ElderlyDashboardResponse,
    TodayScheduleItem,
    HealthRecordResponse,
    EmergencyContactResponse,
    EmergencyEventResponse,
    UserResponse,
)
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/elderly", response_model=ElderlyDashboardResponse)
def get_elderly_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get full dashboard metrics for the elderly user:
    - Today's medication counts (total, taken, pending, missed)
    - Next medication reminder
    - Today's medication timeline
    - Latest health summary
    - Emergency contacts & status
    """
    today_str = date.today().isoformat()
    now_time = datetime.now().strftime("%H:%M")

    # Fetch user medications
    medications = db.query(Medication).filter(Medication.user_id == current_user.id).all()
    
    # Fetch today's logs
    logs = db.query(MedicationLog).filter(
        MedicationLog.user_id == current_user.id,
        MedicationLog.log_date == today_str
    ).all()
    log_map = {(l.medication_id, l.scheduled_time): l for l in logs}

    timeline = []
    taken_count = 0
    missed_count = 0
    pending_count = 0

    for med in medications:
        for sched in med.schedules:
            if not sched.active:
                continue

            scheduled_time = sched.scheduled_time
            log = log_map.get((med.id, scheduled_time))

            if log and log.status == "taken":
                status_val = "taken"
                taken_count += 1
                taken_at_val = log.taken_at
                log_id_val = log.id
                is_overdue = False
            elif log and log.status == "missed":
                status_val = "missed"
                missed_count += 1
                taken_at_val = None
                log_id_val = log.id
                is_overdue = True
            else:
                log_id_val = None
                taken_at_val = None
                if scheduled_time < now_time:
                    status_val = "missed"
                    missed_count += 1
                    is_overdue = True
                else:
                    status_val = "upcoming"
                    pending_count += 1
                    is_overdue = False

            timeline.append(TodayScheduleItem(
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

    # Sort timeline by time
    timeline.sort(key=lambda x: x.scheduled_time)

    # Determine next upcoming reminder
    upcoming_items = [item for item in timeline if item.status == "upcoming"]
    next_reminder = upcoming_items[0] if upcoming_items else None

    # Latest health record
    latest_health = db.query(HealthRecord).filter(
        HealthRecord.user_id == current_user.id
    ).order_by(HealthRecord.recorded_at.desc()).first()

    # Primary emergency contact
    primary_contact = db.query(EmergencyContact).filter(
        EmergencyContact.user_id == current_user.id,
        EmergencyContact.is_primary == True
    ).first()
    if not primary_contact:
        primary_contact = db.query(EmergencyContact).filter(
            EmergencyContact.user_id == current_user.id
        ).first()

    # Recent active emergency event
    active_emergency = db.query(EmergencyEvent).filter(
        EmergencyEvent.user_id == current_user.id,
        EmergencyEvent.status == "ACTIVE"
    ).order_by(EmergencyEvent.created_at.desc()).first()

    total_count = len(timeline)

    return ElderlyDashboardResponse(
        user=UserResponse.model_validate(current_user),
        today_total_meds=total_count,
        today_taken_meds=taken_count,
        today_pending_meds=pending_count,
        today_missed_meds=missed_count,
        next_reminder=next_reminder,
        today_timeline=timeline,
        latest_health=latest_health,
        primary_emergency_contact=primary_contact,
        recent_emergency=active_emergency
    )
