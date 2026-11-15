from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta, timezone
from typing import List
from pydantic import BaseModel, EmailStr
from app.database import get_db
from app.models.models import (
    User,
    CaregiverRelationship,
    Medication,
    MedicationSchedule,
    MedicationLog,
    HealthRecord,
    EmergencyEvent,
)
from app.schemas.schemas import (
    CaregiverDashboardResponse,
    ConnectedElderlySummary,
    UserResponse,
    EmergencyEventResponse,
    HealthRecordResponse,
)
from app.core.dependencies import require_caregiver_role, verify_caregiver_access_to_elderly

router = APIRouter(prefix="/caregiver", tags=["Caregiver"])

class LinkElderlyRequest(BaseModel):
    elderly_email: EmailStr

@router.get("/dashboard", response_model=CaregiverDashboardResponse)
def get_caregiver_dashboard(
    current_caregiver: User = Depends(require_caregiver_role),
    db: Session = Depends(get_db)
):
    """Provide a comprehensive monitoring dashboard for caregivers."""
    # Find all connected elderly profiles
    links = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_caregiver.id,
        CaregiverRelationship.relationship_status == "active"
    ).all()
    elderly_ids = [l.elderly_user_id for l in links]

    if not elderly_ids:
        return CaregiverDashboardResponse(
            caregiver=current_caregiver,
            connected_elderly_count=0,
            overall_adherence_percentage=100.0,
            total_missed_meds_today=0,
            upcoming_schedules=[],
            active_emergency_alerts=[],
            connected_elderly=[],
            recent_activity=[]
        )

    today_str = date.today().isoformat()
    now_time = datetime.now().strftime("%H:%M")

    # Fetch active emergency alerts for any connected elderly
    active_emergencies = db.query(EmergencyEvent).filter(
        EmergencyEvent.user_id.in_(elderly_ids),
        EmergencyEvent.status == "ACTIVE"
    ).order_by(EmergencyEvent.created_at.desc()).all()

    alert_responses = []
    for alert in active_emergencies:
        elder = db.query(User).filter(User.id == alert.user_id).first()
        alert_responses.append(EmergencyEventResponse(
            id=alert.id,
            user_id=alert.user_id,
            event_type=alert.event_type,
            status=alert.status,
            notes=alert.notes,
            created_at=alert.created_at,
            user_name=elder.name if elder else "Unknown",
            user_phone=elder.phone if elder else ""
        ))

    # Calculate overall adherence across all connected elderly over past 7 days
    seven_days_ago = (date.today() - timedelta(days=7)).isoformat()
    all_recent_logs = db.query(MedicationLog).filter(
        MedicationLog.user_id.in_(elderly_ids),
        MedicationLog.log_date >= seven_days_ago
    ).all()

    total_taken = sum(1 for l in all_recent_logs if l.status == "taken")
    total_missed = sum(1 for l in all_recent_logs if l.status == "missed")
    overall_adherence = round((total_taken / (total_taken + total_missed) * 100), 1) if (total_taken + total_missed) > 0 else 100.0

    today_missed_count = sum(1 for l in all_recent_logs if l.log_date == today_str and l.status == "missed")

    # Build summaries for each connected elderly person
    connected_summaries = []
    upcoming_schedules = []
    
    for e_id in elderly_ids:
        elder = db.query(User).filter(User.id == e_id).first()
        if not elder:
            continue

        meds = db.query(Medication).filter(Medication.user_id == e_id).all()
        med_ids = [m.id for m in meds]

        # Today's logs for this elder
        elder_today_logs = [l for l in all_recent_logs if l.user_id == e_id and l.log_date == today_str]
        today_taken_count = sum(1 for l in elder_today_logs if l.status == "taken")

        # Total scheduled doses today
        total_doses_today = 0
        for m in meds:
            for s in m.schedules:
                if s.active:
                    total_doses_today += 1
                    # Collect upcoming schedules
                    is_taken = any(l.medication_id == m.id and l.scheduled_time == s.scheduled_time and l.status == "taken" for l in elder_today_logs)
                    upcoming_schedules.append({
                        "elderly_name": elder.name,
                        "elderly_id": elder.id,
                        "medicine_name": m.medicine_name,
                        "dosage": m.dosage,
                        "scheduled_time": s.scheduled_time,
                        "category": m.category,
                        "status": "taken" if is_taken else ("missed" if s.scheduled_time < now_time else "upcoming")
                    })

        # Elder 7-day adherence
        elder_logs = [l for l in all_recent_logs if l.user_id == e_id]
        e_taken = sum(1 for l in elder_logs if l.status == "taken")
        e_missed = sum(1 for l in elder_logs if l.status == "missed")
        e_adherence = round((e_taken / (e_taken + e_missed) * 100), 1) if (e_taken + e_missed) > 0 else 100.0

        # Latest health record
        latest_health = db.query(HealthRecord).filter(
            HealthRecord.user_id == e_id
        ).order_by(HealthRecord.recorded_at.desc()).first()

        # Active SOS for this elder
        active_sos_for_elder = next((a for a in alert_responses if a.user_id == e_id), None)

        connected_summaries.append(ConnectedElderlySummary(
            id=elder.id,
            name=elder.name,
            email=elder.email,
            phone=elder.phone,
            age=elder.age,
            adherence_rate=e_adherence,
            total_medications=len(meds),
            today_taken=today_taken_count,
            today_total=total_doses_today,
            missed_doses_week=e_missed,
            latest_health=latest_health,
            active_sos=active_sos_for_elder
        ))

    # Sort upcoming schedules by scheduled_time
    upcoming_schedules.sort(key=lambda s: s["scheduled_time"])

    # Recent activity logs (last 10 events)
    recent_logs = db.query(MedicationLog).filter(
        MedicationLog.user_id.in_(elderly_ids)
    ).order_by(MedicationLog.created_at.desc()).limit(8).all()

    recent_activity = []
    for l in recent_logs:
        elder = db.query(User).filter(User.id == l.user_id).first()
        med = db.query(Medication).filter(Medication.id == l.medication_id).first()
        recent_activity.append({
            "id": l.id,
            "type": "medication_log",
            "elderly_name": elder.name if elder else "User",
            "medicine_name": med.medicine_name if med else "Medication",
            "scheduled_time": l.scheduled_time,
            "status": l.status,
            "taken_at": l.taken_at.isoformat() if l.taken_at else None,
            "timestamp": l.created_at.isoformat() if l.created_at else None
        })

    return CaregiverDashboardResponse(
        caregiver=current_caregiver,
        connected_elderly_count=len(elderly_ids),
        overall_adherence_percentage=overall_adherence,
        total_missed_meds_today=today_missed_count,
        upcoming_schedules=upcoming_schedules[:12],
        active_emergency_alerts=alert_responses,
        connected_elderly=connected_summaries,
        recent_activity=recent_activity
    )

@router.get("/elderly-users", response_model=List[UserResponse])
def get_connected_elderly_users(
    current_caregiver: User = Depends(require_caregiver_role),
    db: Session = Depends(get_db)
):
    """List all elderly profiles connected to this caregiver."""
    links = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_caregiver.id,
        CaregiverRelationship.relationship_status == "active"
    ).all()
    elderly_ids = [l.elderly_user_id for l in links]
    return db.query(User).filter(User.id.in_(elderly_ids)).all()

@router.get("/elderly-users/{elderly_id}")
def get_elderly_user_details(
    elderly_id: int,
    current_caregiver: User = Depends(require_caregiver_role),
    db: Session = Depends(get_db)
):
    """Get complete clinical overview of a specific connected elderly patient."""
    if not verify_caregiver_access_to_elderly(current_caregiver.id, elderly_id, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have active authorization to view this elderly patient's record."
        )

    elderly = db.query(User).filter(User.id == elderly_id).first()
    if not elderly:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Elderly user not found.")

    medications = db.query(Medication).filter(Medication.user_id == elderly_id).all()
    latest_health = db.query(HealthRecord).filter(
        HealthRecord.user_id == elderly_id
    ).order_by(HealthRecord.recorded_at.desc()).limit(10).all()
    
    emergency_contacts = elderly.emergency_contacts
    active_alerts = db.query(EmergencyEvent).filter(
        EmergencyEvent.user_id == elderly_id,
        EmergencyEvent.status == "ACTIVE"
    ).all()

    return {
        "elderly_user": UserResponse.model_validate(elderly),
        "medications": medications,
        "recent_health_records": latest_health,
        "emergency_contacts": emergency_contacts,
        "active_emergency_alerts": active_alerts
    }

@router.post("/link")
def link_elderly_user(
    req: LinkElderlyRequest,
    current_caregiver: User = Depends(require_caregiver_role),
    db: Session = Depends(get_db)
):
    """Link an elderly user to this caregiver account by email."""
    elderly = db.query(User).filter(User.email == req.elderly_email.lower().strip(), User.role == "elderly").first()
    if not elderly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No elderly user found with this email address."
        )

    existing_rel = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_caregiver.id,
        CaregiverRelationship.elderly_user_id == elderly.id
    ).first()

    if existing_rel:
        existing_rel.relationship_status = "active"
        db.commit()
        return {"message": f"Successfully connected to {elderly.name}."}

    new_rel = CaregiverRelationship(
        caregiver_id=current_caregiver.id,
        elderly_user_id=elderly.id,
        relationship_status="active"
    )
    db.add(new_rel)
    db.commit()
    return {"message": f"Successfully linked to {elderly.name}."}
