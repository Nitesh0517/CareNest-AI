from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship as orm_relationship
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="elderly")  # "elderly" or "caregiver"
    phone = Column(String(50), nullable=True)
    age = Column(Integer, nullable=True)
    medical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    medications = orm_relationship("Medication", back_populates="user", cascade="all, delete-orphan")
    medication_logs = orm_relationship("MedicationLog", back_populates="user", cascade="all, delete-orphan")
    health_records = orm_relationship("HealthRecord", back_populates="user", cascade="all, delete-orphan")
    emergency_contacts = orm_relationship("EmergencyContact", back_populates="user", cascade="all, delete-orphan")
    emergency_events = orm_relationship("EmergencyEvent", back_populates="user", cascade="all, delete-orphan")

    # Caregiver relationships where this user is caregiver
    caregiver_links = orm_relationship(
        "CaregiverRelationship",
        foreign_keys="CaregiverRelationship.caregiver_id",
        back_populates="caregiver",
        cascade="all, delete-orphan"
    )
    # Caregiver relationships where this user is elderly
    elderly_links = orm_relationship(
        "CaregiverRelationship",
        foreign_keys="CaregiverRelationship.elderly_user_id",
        back_populates="elderly_user",
        cascade="all, delete-orphan"
    )


class CaregiverRelationship(Base):
    __tablename__ = "caregiver_relationships"

    id = Column(Integer, primary_key=True, index=True)
    caregiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    elderly_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    relationship_status = Column(String(50), nullable=False, default="active")  # "active", "pending"
    created_at = Column(DateTime, default=utcnow)

    caregiver = orm_relationship("User", foreign_keys=[caregiver_id], back_populates="caregiver_links")
    elderly_user = orm_relationship("User", foreign_keys=[elderly_user_id], back_populates="elderly_links")

    __table_args__ = (
        UniqueConstraint("caregiver_id", "elderly_user_id", name="uq_caregiver_elderly"),
    )


class Medication(Base):
    __tablename__ = "medications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String(150), nullable=False)
    dosage = Column(String(100), nullable=False) # e.g. "500 mg", "1 tablet"
    frequency = Column(String(100), nullable=False) # e.g. "Once Daily", "Twice Daily", "Three Times Daily"
    instructions = Column(Text, nullable=True) # e.g. "Take after breakfast with plenty of water"
    start_date = Column(String(50), nullable=False) # YYYY-MM-DD
    end_date = Column(String(50), nullable=True) # YYYY-MM-DD or ongoing
    category = Column(String(100), nullable=True, default="General") # e.g. "Blood Pressure", "Diabetes", "Cardio"
    color = Column(String(50), nullable=True, default="#2563EB")
    created_at = Column(DateTime, default=utcnow)

    user = orm_relationship("User", back_populates="medications")
    schedules = orm_relationship("MedicationSchedule", back_populates="medication", cascade="all, delete-orphan")
    logs = orm_relationship("MedicationLog", back_populates="medication", cascade="all, delete-orphan")


class MedicationSchedule(Base):
    __tablename__ = "medication_schedules"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False)
    scheduled_time = Column(String(20), nullable=False) # e.g. "08:00", "14:00", "20:00"
    active = Column(Boolean, default=True)

    medication = orm_relationship("Medication", back_populates="schedules")


class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(Integer, primary_key=True, index=True)
    medication_id = Column(Integer, ForeignKey("medications.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scheduled_time = Column(String(20), nullable=False) # e.g. "08:00"
    log_date = Column(String(20), nullable=False) # e.g. "2026-11-15"
    status = Column(String(50), nullable=False, default="upcoming") # "taken", "missed", "upcoming"
    taken_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    user = orm_relationship("User", back_populates="medication_logs")
    medication = orm_relationship("Medication", back_populates="logs")

    __table_args__ = (
        UniqueConstraint("medication_id", "log_date", "scheduled_time", name="uq_medication_date_time"),
    )


class HealthRecord(Base):
    __tablename__ = "health_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    blood_pressure_systolic = Column(Integer, nullable=True) # e.g. 120
    blood_pressure_diastolic = Column(Integer, nullable=True) # e.g. 80
    blood_glucose = Column(Float, nullable=True) # e.g. 105.0 mg/dL
    heart_rate = Column(Integer, nullable=True) # e.g. 72 bpm
    weight = Column(Float, nullable=True) # e.g. 68.5 kg
    notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=utcnow)

    user = orm_relationship("User", back_populates="health_records")


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(120), nullable=False)
    phone_number = Column(String(50), nullable=False)
    relationship = Column(String(100), nullable=False) # e.g. "Son", "Daughter", "Doctor", "Caregiver"
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    user = orm_relationship("User", back_populates="emergency_contacts")


class EmergencyEvent(Base):
    __tablename__ = "emergency_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(100), nullable=False, default="SOS_BUTTON_TRIGGERED")
    status = Column(String(50), nullable=False, default="ACTIVE") # "ACTIVE", "ACKNOWLEDGED", "RESOLVED"
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    user = orm_relationship("User", back_populates="emergency_events")
