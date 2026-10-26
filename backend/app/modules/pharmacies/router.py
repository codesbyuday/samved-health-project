from fastapi import APIRouter, Query, status
from typing import List, Optional
from app.modules.pharmacies.schemas import (
    MedicineSchema,
    MedicineStockSchema,
    MedicineStockCreateSchema,
    MedicineStockUpdateSchema,
    ProviderSchema,
)
from app.modules.pharmacies.service import pharmacy_service

router = APIRouter(prefix="/pharmacies", tags=["Pharmacies"])


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
