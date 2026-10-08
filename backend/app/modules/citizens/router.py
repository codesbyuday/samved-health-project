from fastapi import APIRouter, HTTPException, Query, status
from typing import List
from app.modules.citizens.schemas import (
    CitizenSchema, CitizenCreateSchema, CitizenUpdateSchema,
    HealthRecordSchema, VaccinationRecordSchema,
    CitizenComplaintCreateSchema, CitizenComplaintSchema
)
from app.modules.citizens.service import citizen_service

router = APIRouter(prefix="/citizens", tags=["Citizens"])


@router.get("", response_model=List[CitizenSchema])
async def get_citizens(limit: int = Query(100, ge=1, le=500)):
    return await citizen_service.get_all(limit=limit)


@router.get("/count")
async def count_citizens():
    cnt = await citizen_service.count()
    return {"count": cnt}


@router.get("/search", response_model=List[CitizenSchema])
async def search_citizens(q: str = Query("")):
    return await citizen_service.search(q)


@router.get("/{citizen_id}", response_model=CitizenSchema)
async def get_citizen_by_id(citizen_id: str):
    citizen = await citizen_service.get_by_id(citizen_id)
    if not citizen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Citizen not found")
    return citizen


@router.get("/{citizen_id}/health-records", response_model=List[HealthRecordSchema])
async def get_citizen_health_records(citizen_id: str):
    return await citizen_service.get_health_records(citizen_id)


@router.get("/{citizen_id}/vaccinations", response_model=List[VaccinationRecordSchema])
async def get_citizen_vaccinations(citizen_id: str):
    return await citizen_service.get_vaccination_records(citizen_id)


@router.post("/{citizen_id}/complaints", response_model=CitizenComplaintSchema, status_code=status.HTTP_201_CREATED)
async def create_citizen_complaint(citizen_id: str, payload: CitizenComplaintCreateSchema):
    return await citizen_service.create_complaint(citizen_id, payload)


@router.get("/{citizen_id}/complaints", response_model=List[CitizenComplaintSchema])
async def get_citizen_complaints(citizen_id: str):
    return await citizen_service.get_complaints(citizen_id)


@router.post("", response_model=CitizenSchema, status_code=status.HTTP_201_CREATED)
async def create_citizen(payload: CitizenCreateSchema):
    return await citizen_service.create(payload)


@router.patch("/{citizen_id}", response_model=CitizenSchema)
async def update_citizen(citizen_id: str, payload: CitizenUpdateSchema):
    return await citizen_service.update(citizen_id, payload)

