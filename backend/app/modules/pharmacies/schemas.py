from typing import Optional
from pydantic import BaseModel
from datetime import date


class MedicineSchema(BaseModel):
    medicine_id: str
    medicine_name: Optional[str] = None
    medicine_category: Optional[str] = None
    manufacturer_name: Optional[str] = None
    description: Optional[str] = None


class MedicineStockSchema(BaseModel):
    stock_id: str
    hospital_id: Optional[str] = None
    medicine_id: Optional[str] = None
    quantity: Optional[int] = 0
    threshold: Optional[int] = 10
    expiry_date: Optional[date] = None
    last_updated: Optional[str] = None
    medicine: Optional[MedicineSchema] = None


class MedicineStockUpdateSchema(BaseModel):
    quantity: int
    threshold: Optional[int] = None
