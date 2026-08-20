from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.modules.hospitals.schemas import (
    HospitalSchema, DoctorSchema, BedSchema, EquipmentSchema, AmbulanceSchema
)
from app.modules.hospitals.service import hospital_service

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.get("", response_model=List[HospitalSchema])
async def get_hospitals():
    return await hospital_service.get_all_hospitals()


@router.get("/{hospital_id}", response_model=HospitalSchema)
async def get_hospital(hospital_id: str):
    h = await hospital_service.get_hospital_by_id(hospital_id)
    if not h:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found")
    return h


@router.get("/{hospital_id}/doctors", response_model=List[DoctorSchema])
async def get_hospital_doctors(hospital_id: str, department: Optional[str] = Query(None)):
    return await hospital_service.get_doctors(hospital_id=hospital_id, department=department)


@router.get("/{hospital_id}/beds", response_model=List[BedSchema])
async def get_hospital_beds(hospital_id: str):
    return await hospital_service.get_beds(hospital_id)


@router.patch("/beds/{bed_id}", response_model=BedSchema)
async def update_bed_status(bed_id: str, updates: dict):
    return await hospital_service.update_bed(bed_id, updates)


@router.get("/{hospital_id}/equipment", response_model=List[EquipmentSchema])
async def get_hospital_equipment(hospital_id: str):
    return await hospital_service.get_equipment(hospital_id)


@router.get("/{hospital_id}/dashboard-overview")
async def get_hospital_dashboard_overview(hospital_id: str):
    return await hospital_service.get_dashboard_overview(hospital_id)


@router.get("/{hospital_id}/ambulances", response_model=List[AmbulanceSchema])
async def get_hospital_ambulances(hospital_id: str):
    return await hospital_service.get_ambulances(hospital_id)
