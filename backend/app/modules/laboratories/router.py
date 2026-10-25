from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.modules.laboratories.schemas import (
    TestTypeSchema,
    DiagnosticReportSchema,
    DiagnosticReportCreateSchema,
    LaboratorySchema,
    LaboratoryDetailSchema,
    LabTestDetailSchema,
)
from app.modules.laboratories.service import laboratory_service

router = APIRouter(prefix="/laboratories", tags=["Laboratories"])


@router.get("", response_model=List[LaboratorySchema])
async def get_laboratories(
    search: Optional[str] = Query(None, description="Search by laboratory name or address"),
    ward_id: Optional[int] = Query(None, description="Filter by Solapur ward number"),
    latitude: Optional[float] = Query(None, description="Citizen current latitude for distance calculation"),
    longitude: Optional[float] = Query(None, description="Citizen current longitude for distance calculation"),
):
    """Retrieve eligible diagnostic laboratories with location and test catalogue counts"""
    return await laboratory_service.get_laboratories(
        search=search,
        ward_id=ward_id,
        user_lat=latitude,
        user_lon=longitude,
    )


@router.get("/search-tests", response_model=List[LabTestDetailSchema])
async def search_diagnostic_tests(
    q: Optional[str] = Query(None, description="Search term (e.g. CBC, Dengue, Blood Sugar)"),
    category: Optional[str] = Query(None, description="Filter by test category"),
    sort_by: Optional[str] = Query("price", pattern="^(price|price_asc|price_desc|nearby)$", description="Sort option: price, price_desc, or nearby"),
    latitude: Optional[float] = Query(None, description="Citizen current latitude"),
    longitude: Optional[float] = Query(None, description="Citizen current longitude"),
):
    """Search diagnostic tests across all laboratories with price and nearby sorting"""
    return await laboratory_service.search_tests(
        q=q,
        category=category,
        sort_by=sort_by,
        user_lat=latitude,
        user_lon=longitude,
    )


@router.get("/tests/{lab_test_id}", response_model=LabTestDetailSchema)
async def get_test_detail(
    lab_test_id: str,
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
):
    """Retrieve full details of a specific laboratory test entry"""
    test = await laboratory_service.get_test_detail(lab_test_id, user_lat=latitude, user_lon=longitude)
    if not test:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Laboratory test entry not found")
    return test


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


@router.patch("/reports/{report_id}")
async def update_diagnostic_report(report_id: str, payload: dict):
    return await laboratory_service.update_report(report_id, payload)


@router.get("/{provider_id}", response_model=LaboratoryDetailSchema)
async def get_laboratory_profile(
    provider_id: str,
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
):
    """Retrieve complete laboratory profile and diagnostic test catalogue"""
    lab = await laboratory_service.get_laboratory_by_id(provider_id, user_lat=latitude, user_lon=longitude)
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Laboratory not found")
    return lab


@router.get("/{provider_id}/catalogue", response_model=List[LabTestDetailSchema])
async def get_laboratory_catalogue(
    provider_id: str,
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    """Retrieve all diagnostic tests in a laboratory's catalogue with optional category filter"""
    return await laboratory_service.get_laboratory_catalogue(provider_id=provider_id, category=category, search=search)
