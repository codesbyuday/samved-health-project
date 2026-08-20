from typing import Optional
from pydantic import BaseModel
from datetime import date


class TestTypeSchema(BaseModel):
    test_id: int
    test_name: Optional[str] = None
    test_category: Optional[str] = None
    description: Optional[str] = None


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

    class Config:
        from_attributes = True
