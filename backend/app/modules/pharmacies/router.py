from fastapi import APIRouter, Query, status
from typing import List, Optional
from app.modules.pharmacies.schemas import MedicineSchema, MedicineStockSchema, MedicineStockUpdateSchema
from app.modules.pharmacies.service import pharmacy_service

router = APIRouter(prefix="/pharmacies", tags=["Pharmacies"])


@router.get("/medicines", response_model=List[MedicineSchema])
async def get_medicines():
    return await pharmacy_service.get_medicines()


@router.get("/stock", response_model=List[MedicineStockSchema])
async def get_medicine_stock(hospital_id: Optional[str] = Query(None)):
    return await pharmacy_service.get_stock(hospital_id=hospital_id)


@router.patch("/stock/{stock_id}", response_model=MedicineStockSchema)
async def update_medicine_stock(stock_id: str, payload: MedicineStockUpdateSchema):
    return await pharmacy_service.update_stock(stock_id, payload)
