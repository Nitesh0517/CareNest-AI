from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.models import (
    User,
    CaregiverRelationship,
    Medication,
    MedicationSchedule,
    MedicationLog,
    HealthRecord,
    EmergencyContact,
    EmergencyEvent,
)
from app.core.security import hash_password

def seed_demo_data(db: Session, force_reset: bool = False):
    """Seed realistic elderly care and caregiver demo data for hackathon demonstrations."""
    existing_elderly = db.query(User).filter(User.email == "robert.miller@eldercare.demo").first()
    if existing_elderly and not force_reset:
        return

    if force_reset:
        # Delete existing data if force reset is requested
        db.query(EmergencyEvent).delete()
        db.query(EmergencyContact).delete()
        db.query(HealthRecord).delete()
        db.query(MedicationLog).delete()
        db.query(MedicationSchedule).delete()
        db.query(Medication).delete()
        db.query(CaregiverRelationship).delete()
        db.query(User).filter(User.email.in_(["robert.miller@eldercare.demo", "sarah.miller@eldercare.demo"])).delete()
        db.commit()

    # 1. Create Elderly User: Robert Miller
    elderly = User(
        name="Robert Miller",
        email="robert.miller@eldercare.demo",
        hashed_password=hash_password("Password123!"),
        role="elderly",
        phone="+1 (555) 234-5678",
        age=76,
        medical_notes="Mild Hypertension, Type 2 Diabetes, Osteoarthritis in knees. Prefers large text and clear morning reminders.",
        created_at=datetime.now(timezone.utc) - timedelta(days=60)
    )
    db.add(elderly)

    # 2. Create Caregiver User: Sarah Miller (Daughter & Registered Nurse)
    caregiver = User(
        name="Sarah Miller (RN)",
        email="sarah.miller@eldercare.demo",
        hashed_password=hash_password("Password123!"),
        role="caregiver",
        phone="+1 (555) 876-5432",
        age=42,
        medical_notes="Family caregiver and licensed healthcare professional.",
        created_at=datetime.now(timezone.utc) - timedelta(days=60)
    )
    db.add(caregiver)
    db.flush()

    # 3. Create Caregiver-Elderly Relationship
    rel = CaregiverRelationship(
        caregiver_id=caregiver.id,
        elderly_user_id=elderly.id,
        relationship_status="active",
        created_at=datetime.now(timezone.utc) - timedelta(days=50)
    )
    db.add(rel)

    # 4. Five Prescribed Medications for Robert
    meds_data = [
        {
            "name": "Lisinopril",
            "dosage": "10 mg (1 tablet)",
            "frequency": "Once Daily",
            "instructions": "Take with a full glass of water after breakfast. Sit for a moment before standing.",
            "category": "Blood Pressure",
            "color": "#2563EB",
            "schedules": ["08:00"]
        },
        {
            "name": "Metformin",
            "dosage": "500 mg (1 tablet)",
            "frequency": "Twice Daily",
            "instructions": "Take with morning and evening meals to minimize stomach upset.",
            "category": "Diabetes",
            "color": "#0F766E",
            "schedules": ["08:30", "19:30"]
        },
        {
            "name": "Vitamin D3 + Calcium",
            "dosage": "1000 IU / 500 mg",
            "frequency": "Once Daily",
            "instructions": "Take in the morning with food to support bone density.",
            "category": "Supplements",
            "color": "#059669",
            "schedules": ["09:00"]
        },
        {
            "name": "Glucosamine & Chondroitin",
            "dosage": "1 capsule (750 mg)",
            "frequency": "Once Daily",
            "instructions": "Take during lunchtime with water for joint and knee mobility.",
            "category": "Joint Care",
            "color": "#EA580C",
            "schedules": ["13:00"]
        },
        {
            "name": "Atorvastatin",
            "dosage": "20 mg (1 tablet)",
            "frequency": "Once Daily",
            "instructions": "Take at bedtime with or without food. Avoid drinking grapefruit juice.",
            "category": "Cholesterol",
            "color": "#7C3AED",
            "schedules": ["21:00"]
        }
    ]

    saved_meds = []
    today_str = date.today().isoformat()
    start_date_str = (date.today() - timedelta(days=45)).isoformat()

    for m_info in meds_data:
        med = Medication(
            user_id=elderly.id,
            medicine_name=m_info["name"],
            dosage=m_info["dosage"],
            frequency=m_info["frequency"],
            instructions=m_info["instructions"],
            start_date=start_date_str,
            end_date=None,
            category=m_info["category"],
            color=m_info["color"],
            created_at=datetime.now(timezone.utc) - timedelta(days=45)
        )
        db.add(med)
        db.flush()
        saved_meds.append((med, m_info["schedules"]))

        for sched_time in m_info["schedules"]:
            sched = MedicationSchedule(
                medication_id=med.id,
                scheduled_time=sched_time,
                active=True
            )
            db.add(sched)

    # 5. Realistic Historical Medication Logs (Past 7 Days)
    # Most days taken, one missed dose 3 days ago
    for day_offset in range(7, 0, -1):
        log_d = date.today() - timedelta(days=day_offset)
        log_d_str = log_d.isoformat()
        
        for med, sched_list in saved_meds:
            for s_time in sched_list:
                # 3 days ago afternoon, simulate a missed dose
                is_missed = (day_offset == 3 and s_time == "13:00")
                status_val = "missed" if is_missed else "taken"
                
                hour_val, min_val = map(int, s_time.split(":"))
                taken_time = None
                if not is_missed:
                    taken_time = datetime(log_d.year, log_d.month, log_d.day, hour_val, min_val + 4, tzinfo=timezone.utc)

                log_entry = MedicationLog(
                    medication_id=med.id,
                    user_id=elderly.id,
                    scheduled_time=s_time,
                    log_date=log_d_str,
                    status=status_val,
                    taken_at=taken_time,
                    notes="Dose taken with water" if not is_missed else "Away visiting clinic, dose missed"
                )
                db.add(log_entry)

    # Today's Logs:
    # 08:00 Lisinopril, 08:30 Metformin, 09:00 Vitamin D are taken!
    # 13:00 Glucosamine, 19:30 Metformin, 21:00 Atorvastatin are upcoming!
    today_hour = datetime.now().hour
    for med, sched_list in saved_meds:
        for s_time in sched_list:
            s_hour = int(s_time.split(":")[0])
            # If scheduled in early morning (<= 9), pre-mark as taken for a great initial demo view
            if s_hour <= 9:
                taken_t = datetime.now(timezone.utc).replace(hour=s_hour, minute=8)
                log_entry = MedicationLog(
                    medication_id=med.id,
                    user_id=elderly.id,
                    scheduled_time=s_time,
                    log_date=today_str,
                    status="taken",
                    taken_at=taken_t,
                    notes="Taken on time with breakfast"
                )
                db.add(log_entry)

    # 6. Sample Health Records (Past 7 Readings)
    health_samples = [
        {"days_ago": 6, "sys": 128, "dia": 82, "glucose": 114.0, "hr": 74, "weight": 74.5, "notes": "Felt good after morning garden walk."},
        {"days_ago": 5, "sys": 126, "dia": 80, "glucose": 110.0, "hr": 72, "weight": 74.4, "notes": "Normal reading."},
        {"days_ago": 4, "sys": 130, "dia": 84, "glucose": 118.0, "hr": 76, "weight": 74.2, "notes": "Slight fatigue in afternoon."},
        {"days_ago": 3, "sys": 124, "dia": 78, "glucose": 106.0, "hr": 70, "weight": 74.0, "notes": "Followed low sodium lunch."},
        {"days_ago": 2, "sys": 122, "dia": 76, "glucose": 104.0, "hr": 68, "weight": 73.8, "notes": "Great energy all day."},
        {"days_ago": 1, "sys": 125, "dia": 79, "glucose": 108.0, "hr": 71, "weight": 73.7, "notes": "BP stable."},
        {"days_ago": 0, "sys": 121, "dia": 78, "glucose": 105.0, "hr": 70, "weight": 73.6, "notes": "Today morning resting vitals. All stable."}
    ]

    for h in health_samples:
        rec_time = datetime.now(timezone.utc) - timedelta(days=h["days_ago"], hours=3)
        hr_entry = HealthRecord(
            user_id=elderly.id,
            blood_pressure_systolic=h["sys"],
            blood_pressure_diastolic=h["dia"],
            blood_glucose=h["glucose"],
            heart_rate=h["hr"],
            weight=h["weight"],
            notes=h["notes"],
            recorded_at=rec_time
        )
        db.add(hr_entry)

    # 7. Emergency Contacts
    c1 = EmergencyContact(
        user_id=elderly.id,
        name="Sarah Miller (RN)",
        phone_number="+1 (555) 876-5432",
        relationship="Daughter & Primary Caregiver",
        is_primary=True,
        created_at=datetime.now(timezone.utc) - timedelta(days=40)
    )
    c2 = EmergencyContact(
        user_id=elderly.id,
        name="Dr. David Chen, MD",
        phone_number="+1 (555) 912-4000",
        relationship="Primary Cardiologist (St. Jude Clinic)",
        is_primary=False,
        created_at=datetime.now(timezone.utc) - timedelta(days=40)
    )
    db.add(c1)
    db.add(c2)

    # 8. Sample Historical Emergency Event (Resolved)
    sos_sample = EmergencyEvent(
        user_id=elderly.id,
        event_type="SOS_BUTTON_TRIGGERED",
        status="RESOLVED",
        notes="False alarm while testing device. Caregiver contacted and verified Robert is safe.",
        created_at=datetime.now(timezone.utc) - timedelta(days=12)
    )
    db.add(sos_sample)

    db.commit()
    print("Demo data successfully seeded for Robert Miller (elderly) and Sarah Miller (caregiver).")
