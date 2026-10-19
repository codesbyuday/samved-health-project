from typing import Optional
from pydantic import BaseModel
from datetime import date


class DiseaseSchema(BaseModel):
    disease_id: str
    disease_name: Optional[str] = None
    disease_type: Optional[str] = None
    disease_category: Optional[str] = None
    is_notifiable: Optional[bool] = True


class DiseaseCaseCreateSchema(BaseModel):
    hospital_id: Optional[str] = None
    citizen_id: Optional[str] = None
    ward_number: Optional[int] = None
    disease_id: Optional[str] = None
    report_date: Optional[date] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    reported_by: Optional[str] = None
    health_record_id: Optional[str] = None


class DiseaseCaseSchema(DiseaseCaseCreateSchema):
    case_id: str
    disease: Optional[DiseaseSchema] = None
    disease_name: Optional[str] = None
    disease_type: Optional[str] = None
    disease_category: Optional[str] = None
    hospital: Optional[dict] = None
    hospital_name: Optional[str] = None
    hospital_address: Optional[str] = None
    reported_by_staff: Optional[dict] = None
    doctor_name: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    citizen: Optional[dict] = None
    citizen_name: Optional[str] = None
    health_record_id: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True
