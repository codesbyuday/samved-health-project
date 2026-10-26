from fastapi import APIRouter, Query, status, HTTPException
from typing import List, Optional
from app.modules.pharmacies.schemas import (
    MedicineSchema,
    MedicineStockSchema,
    MedicineStockCreateSchema,
    MedicineStockUpdateSchema,
    ProviderSchema,
    MedicineOfferingSchema,
    PharmacySchema,
    PharmacyDetailSchema,
)
from app.modules.pharmacies.service import pharmacy_service

router = APIRouter(prefix="/pharmacies", tags=["Pharmacies"])


@router.get("/list", response_model=List[PharmacySchema])
async def get_pharmacies(
    search: Optional[str] = Query(None, description="Search by pharmacy name or address"),
    ward_id: Optional[int] = Query(None, description="Filter by ward ID"),
    latitude: Optional[float] = Query(None, description="Citizen current latitude for distance calculation"),
    longitude: Optional[float] = Query(None, description="Citizen current longitude for distance calculation"),
):
    """Retrieve all approved retail pharmacies and medical stores with coordinates and distance"""
    return await pharmacy_service.get_pharmacies(
        search=search,
        ward_id=ward_id,
        user_lat=latitude,
        user_lon=longitude,
    )


@router.get("/availability", response_model=List[MedicineOfferingSchema])
async def get_medicine_availability(
    q: Optional[str] = Query(None, description="Search term for medicine, category or pharmacy name"),
    category: Optional[str] = Query(None, description="Filter by medicine category"),
    sort_by: Optional[str] = Query("nearby", pattern="^(nearby|price_asc|price_desc|name)$", description="Sort option: nearby, price_asc, price_desc, name"),
    latitude: Optional[float] = Query(None, description="Citizen current latitude for distance calculation"),
    longitude: Optional[float] = Query(None, description="Citizen current longitude for distance calculation"),
):
    """Retrieve medicine availability exclusively from approved pharmacies (role = 'pharmacy')"""
    return await pharmacy_service.get_medicine_availability(
        q=q,
        category=category,
        sort_by=sort_by,
        user_lat=latitude,
        user_lon=longitude,
    )


@router.get("/{provider_id}", response_model=PharmacyDetailSchema)
async def get_pharmacy_detail(
    provider_id: str,
    latitude: Optional[float] = Query(None, description="Citizen current latitude"),
    longitude: Optional[float] = Query(None, description="Citizen current longitude"),
):
    """Retrieve detailed pharmacy profile with complete stocked medicines"""
    pharm = await pharmacy_service.get_pharmacy_by_id(
        provider_id=provider_id,
        user_lat=latitude,
        user_lon=longitude,
    )
    if not pharm:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return pharm




@router.get("/providers", response_model=List[ProviderSchema])
async def get_providers(role: Optional[str] = Query("pharmacy")):
    return await pharmacy_service.get_providers(role=role)


@router.get("/medicines", response_model=List[MedicineSchema])
async def get_medicines():
    return await pharmacy_service.get_medicines()


@router.get("/stock", response_model=List[MedicineStockSchema])
async def get_medicine_stock(
    hospital_id: Optional[str] = Query(None),
    provider_id: Optional[str] = Query(None),
):
    return await pharmacy_service.get_stock(hospital_id=hospital_id, provider_id=provider_id)


@router.post("/stock", response_model=MedicineStockSchema, status_code=status.HTTP_201_CREATED)
async def create_medicine_stock(payload: MedicineStockCreateSchema):
    return await pharmacy_service.create_stock(payload)


@router.patch("/stock/{stock_id}", response_model=MedicineStockSchema)
async def update_medicine_stock(stock_id: str, payload: MedicineStockUpdateSchema):
    return await pharmacy_service.update_stock(stock_id, payload)


@router.delete("/stock/{stock_id}")
async def delete_medicine_stock(stock_id: str):
    await pharmacy_service.delete_stock(stock_id)
    return {"success": True, "stock_id": stock_id}
