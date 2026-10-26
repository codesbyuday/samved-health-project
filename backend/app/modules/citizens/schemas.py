from typing import Optional
from pydantic import BaseModel
from datetime import date


class CitizenBase(BaseModel):
    name: Optional[str] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    ward_number: Optional[int] = None
    aadhar_id: Optional[str] = None
    blood_group: Optional[str] = None
    user_photo_url: Optional[str] = None
    date_of_birth: Optional[date] = None


class CitizenCreateSchema(CitizenBase):
    user_id: Optional[str] = None
    guardian_id: Optional[str] = None


class CitizenUpdateSchema(CitizenBase):
    pass


class CitizenSchema(CitizenBase):
    citizen_id: str
    user_id: Optional[str] = None
    guardian_id: Optional[str] = None
    age: Optional[int] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class HealthRecordSchema(BaseModel):
    record_id: str
    citizen_id: str
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    staff_id: Optional[str] = None
    doctor_name: Optional[str] = None
    department: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    notes: Optional[str] = None
    visit_date: Optional[str] = None


class VaccinationRecordSchema(BaseModel):
    record_id: str
    citizen_id: str
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    campaign_id: Optional[str] = None
    vaccine_type: Optional[str] = None
    dose_number: Optional[int] = None
    date_administered: Optional[str] = None


class CitizenComplaintCreateSchema(BaseModel):
    category: Optional[str] = "other"
    description: str
    hospital_id: Optional[str] = None
    priority: Optional[str] = "low"


class CitizenComplaintSchema(BaseModel):
    complaint_id: str
    citizen_id: str
    hospital_id: Optional[str] = None
    category: Optional[str] = None
    description: str
    priority: Optional[str] = "low"
    status: Optional[str] = "submitted"
    remarks_by_officers: Optional[str] = None
    created_at: Optional[str] = None
    resolved_at: Optional[str] = None

