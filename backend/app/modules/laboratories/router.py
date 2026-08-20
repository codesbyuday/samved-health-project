from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.modules.laboratories.schemas import TestTypeSchema, DiagnosticReportSchema, DiagnosticReportCreateSchema
from app.modules.laboratories.service import laboratory_service

router = APIRouter(prefix="/laboratories", tags=["Laboratories"])


@router.get("/test-types", response_model=List[TestTypeSchema])
async def get_test_types():
    return await laboratory_service.get_test_types()


@router.get("/reports", response_model=List[DiagnosticReportSchema])
async def get_diagnostic_reports(
    citizen_id: Optional[str] = Query(None),
    hospital_id: Optional[str] = Query(None),
):
    return await laboratory_service.get_reports(citizen_id=citizen_id, hospital_id=hospital_id)


@router.post("/reports", response_model=DiagnosticReportSchema, status_code=status.HTTP_201_CREATED)
async def create_diagnostic_report(payload: DiagnosticReportCreateSchema):
    return await laboratory_service.create_report(payload)


@router.get("/reports/{report_id}/file")
async def get_report_file(report_id: str):
    file_url = await laboratory_service.get_report_file_url(report_id)
    if not file_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report file not found")
    return {"report_id": report_id, "file_url": file_url}
