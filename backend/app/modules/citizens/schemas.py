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
