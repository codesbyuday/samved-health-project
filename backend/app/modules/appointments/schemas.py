from typing import Optional, Any, Dict
from pydantic import BaseModel
from datetime import date


class AppointmentBase(BaseModel):
    citizen_id: Optional[str] = None
    hospital_id: Optional[str] = None
    hospital_ward_id: Optional[str] = None
    doctor_id: Optional[str] = None
    appointment_type: Optional[str] = None
    appointment_date: Optional[date] = None
    time_slot: Optional[str] = None


class AppointmentCreateSchema(AppointmentBase):
    pass


class AppointmentStatusUpdateSchema(BaseModel):
    status: str


class AppointmentSchema(AppointmentBase):
    appointment_id: str
    token_id: Optional[int] = None
    status: Optional[str] = None
    created_at: Optional[str] = None
    citizen: Optional[Dict[str, Any]] = None
    hospital: Optional[Dict[str, Any]] = None
    doctor: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
