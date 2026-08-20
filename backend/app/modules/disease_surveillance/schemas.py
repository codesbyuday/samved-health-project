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


class DiseaseCaseSchema(DiseaseCaseCreateSchema):
    case_id: str

    class Config:
        from_attributes = True
