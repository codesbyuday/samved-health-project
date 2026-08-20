from fastapi import APIRouter, Query, status
from typing import List, Optional
from app.modules.disease_surveillance.schemas import DiseaseCaseSchema, DiseaseCaseCreateSchema, DiseaseSchema
from app.modules.disease_surveillance.service import disease_surveillance_service

router = APIRouter(prefix="/disease-surveillance", tags=["Disease Surveillance"])


@router.get("/public-analytics")
async def get_public_analytics():
    return await disease_surveillance_service.get_public_analytics()


@router.get("/cases", response_model=List[DiseaseCaseSchema])
async def get_disease_cases(
    ward_number: Optional[int] = Query(None),
    hospital_id: Optional[str] = Query(None),
):
    return await disease_surveillance_service.get_cases(ward_number=ward_number, hospital_id=hospital_id)


@router.post("/cases", response_model=DiseaseCaseSchema, status_code=status.HTTP_201_CREATED)
async def report_disease_case(payload: DiseaseCaseCreateSchema):
    return await disease_surveillance_service.report_case(payload)


@router.get("/diseases", response_model=List[DiseaseSchema])
async def get_diseases():
    return await disease_surveillance_service.get_diseases()
