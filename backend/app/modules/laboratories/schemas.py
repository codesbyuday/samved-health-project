from typing import List, Optional
from pydantic import BaseModel
from datetime import date


class TestTypeSchema(BaseModel):
    test_id: int
    test_name: Optional[str] = None
    test_category: Optional[str] = None
    description: Optional[str] = None


class LabTestDetailSchema(BaseModel):
    lab_test_id: str
    provider_id: str
    test_type_id: int
    price: int
    test_name: Optional[str] = None
    test_category: Optional[str] = None
    description: Optional[str] = None
    sample_type: Optional[str] = None
    preparation: Optional[str] = None
    turnaround_time: Optional[str] = None
    laboratory_name: Optional[str] = None
    laboratory_address: Optional[str] = None
    laboratory_phone: Optional[str] = None
    laboratory_email: Optional[str] = None
    laboratory_license: Optional[str] = None
    laboratory_status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


class LaboratorySchema(BaseModel):
    provider_id: str
    name: str
    role: Optional[str] = "lab"
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license: Optional[str] = None
    status: Optional[str] = "approved"
    ward_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_hours: Optional[str] = "08:00 AM - 08:00 PM"
    tests_count: int = 0
    distance_km: Optional[float] = None

    class Config:
        from_attributes = True


class LaboratoryDetailSchema(LaboratorySchema):
    tests: List[LabTestDetailSchema] = []

    class Config:
        from_attributes = True


class DiagnosticReportCreateSchema(BaseModel):
    citizen_id: Optional[str] = None
    hospital_id: Optional[str] = None
    provider_id: Optional[str] = None
    test_type_id: Optional[int] = None
    result: Optional[str] = None
    description: Optional[str] = None
    report_file_url: Optional[str] = None
    status: Optional[str] = "Completed"
    test_date: Optional[date] = None


class DiagnosticReportSchema(DiagnosticReportCreateSchema):
    report_id: str
    uploaded_at: Optional[str] = None
    booking_id: Optional[str] = None
    test_type: Optional[TestTypeSchema] = None
    test_name: Optional[str] = None
    test_category: Optional[str] = None
    hospital: Optional[dict] = None
    provider: Optional[dict] = None
    citizen: Optional[dict] = None
    issuer_type: Optional[str] = None
    issuer_name: Optional[str] = None
    issuer_address: Optional[str] = None

    class Config:
        from_attributes = True
