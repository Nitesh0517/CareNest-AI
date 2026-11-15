from typing import List, Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# ----------------- User Schemas -----------------
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "elderly"  # "elderly" or "caregiver"
    phone: Optional[str] = None
    age: Optional[int] = None
    medical_notes: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

# ----------------- Medication Schemas -----------------
class ScheduleBase(BaseModel):
    scheduled_time: str # "08:00"
    active: bool = True

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleResponse(ScheduleBase):
    id: int
    medication_id: int

    class Config:
        from_attributes = True

class MedicationBase(BaseModel):
    medicine_name: str
    dosage: str
    frequency: str
    instructions: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    category: Optional[str] = "General"
    color: Optional[str] = "#2563EB"

class MedicationCreate(MedicationBase):
    user_id: Optional[int] = None # Caregivers can specify which elderly user this is for
    schedules: List[str] = [] # list of times like ["08:00", "20:00"]

class MedicationUpdate(BaseModel):
    medicine_name: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    instructions: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    schedules: Optional[List[str]] = None

class MedicationResponse(MedicationBase):
    id: int
    user_id: int
    created_at: datetime
    schedules: List[ScheduleResponse] = []

    class Config:
        from_attributes = True

# ----------------- Medication Log Schemas -----------------
class MedicationLogCreate(BaseModel):
    medication_id: int
    scheduled_time: str
    log_date: str # YYYY-MM-DD
    status: str = "taken" # "taken", "missed", "upcoming"
    notes: Optional[str] = None

class MedicationLogResponse(BaseModel):
    id: int
    medication_id: int
    user_id: int
    scheduled_time: str
    log_date: str
    status: str
    taken_at: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime
    medication_name: Optional[str] = None
    dosage: Optional[str] = None

    class Config:
        from_attributes = True

class TodayScheduleItem(BaseModel):
    medication_id: int
    medicine_name: str
    dosage: str
    instructions: Optional[str] = None
    category: Optional[str] = None
    color: Optional[str] = None
    scheduled_time: str
    status: str # "upcoming", "taken", "missed"
    taken_at: Optional[datetime] = None
    log_id: Optional[int] = None
    is_overdue: bool = False

class AdherenceResponse(BaseModel):
    adherence_percentage: float
    total_doses: int
    taken_doses: int
    missed_doses: int
    pending_doses: int
    history: List[dict] = []

# ----------------- Health Record Schemas -----------------
class HealthRecordBase(BaseModel):
    blood_pressure_systolic: Optional[int] = None
    blood_pressure_diastolic: Optional[int] = None
    blood_glucose: Optional[float] = None
    heart_rate: Optional[int] = None
    weight: Optional[float] = None
    notes: Optional[str] = None

class HealthRecordCreate(HealthRecordBase):
    user_id: Optional[int] = None # Caregivers can record for elderly
    recorded_at: Optional[datetime] = None

class HealthRecordResponse(HealthRecordBase):
    id: int
    user_id: int
    recorded_at: datetime

    class Config:
        from_attributes = True

# ----------------- Emergency Schemas -----------------
class EmergencyContactBase(BaseModel):
    name: str
    phone_number: str
    relationship: str
    is_primary: bool = False

class EmergencyContactCreate(EmergencyContactBase):
    user_id: Optional[int] = None

class EmergencyContactResponse(EmergencyContactBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SOSRequest(BaseModel):
    user_id: Optional[int] = None
    notes: Optional[str] = "Emergency SOS button was pressed by user."

class EmergencyEventResponse(BaseModel):
    id: int
    user_id: int
    event_type: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    user_name: Optional[str] = None
    user_phone: Optional[str] = None

    class Config:
        from_attributes = True

# ----------------- AI Schemas -----------------
class ChatMessage(BaseModel):
    role: str # "user" or "model" / "assistant"
    content: str

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    user_context: Optional[dict] = None

class AIChatResponse(BaseModel):
    reply: str
    is_fallback: bool = False
    disclaimer: str = "ElderCare Assistant provides general wellness information and is not a substitute for professional medical advice, diagnosis, or emergency care."

# ----------------- Dashboard Schemas -----------------
class ElderlyDashboardResponse(BaseModel):
    user: UserResponse
    today_total_meds: int
    today_taken_meds: int
    today_pending_meds: int
    today_missed_meds: int
    next_reminder: Optional[TodayScheduleItem] = None
    today_timeline: List[TodayScheduleItem] = []
    latest_health: Optional[HealthRecordResponse] = None
    primary_emergency_contact: Optional[EmergencyContactResponse] = None
    recent_emergency: Optional[EmergencyEventResponse] = None

class ConnectedElderlySummary(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    age: Optional[int] = None
    adherence_rate: float
    total_medications: int
    today_taken: int
    today_total: int
    missed_doses_week: int
    latest_health: Optional[HealthRecordResponse] = None
    active_sos: Optional[EmergencyEventResponse] = None

class CaregiverDashboardResponse(BaseModel):
    caregiver: UserResponse
    connected_elderly_count: int
    overall_adherence_percentage: float
    total_missed_meds_today: int
    upcoming_schedules: List[dict] = []
    active_emergency_alerts: List[EmergencyEventResponse] = []
    connected_elderly: List[ConnectedElderlySummary] = []
    recent_activity: List[dict] = []
