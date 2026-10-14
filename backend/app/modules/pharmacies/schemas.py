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
    provider_id: Optional[str] = None
    hospital_id: Optional[str] = None
    medicine_id: Optional[str] = None
    quantity: Optional[int] = 0
    threshold: Optional[int] = 10
    price: Optional[float] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    last_updated: Optional[str] = None
    medicine: Optional[MedicineSchema] = None


class MedicineStockCreateSchema(BaseModel):
    provider_id: Optional[str] = None
    hospital_id: Optional[str] = None
    medicine_id: str
    quantity: int = 0
    threshold: int = 10
    price: Optional[float] = 0.0
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None


class MedicineStockUpdateSchema(BaseModel):
    quantity: Optional[int] = None
    threshold: Optional[int] = None
    price: Optional[float] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[str] = None


class ProviderSchema(BaseModel):
    provider_id: str
    name: str
    role: str
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    license: Optional[str] = None
    ward_id: Optional[int] = None
    created_at: Optional[str] = None
