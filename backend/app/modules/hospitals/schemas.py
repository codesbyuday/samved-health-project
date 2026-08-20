from typing import Optional
from pydantic import BaseModel


class HospitalSchema(BaseModel):
    hospital_id: str
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    ward_id: Optional[int] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    verified_by_smc: Optional[bool] = False
    created_at: Optional[str] = None


class DoctorSchema(BaseModel):
    staff_uuid: str
    name: Optional[str] = None
    hospital_id: Optional[str] = None
    specialization: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    consultation_time: Optional[int] = None
    work_start_time: Optional[str] = None
    work_end_time: Optional[str] = None


class BedSchema(BaseModel):
    bed_id: str
    hospital_id: Optional[str] = None
    assigned_to: Optional[str] = None
    located_at: Optional[str] = None
    bed_type: Optional[str] = None
    bed_status: Optional[str] = None
    last_updated_on: Optional[str] = None


class EquipmentSchema(BaseModel):
    equipment_uuid: str
    equipment_id: Optional[str] = None
    hospital_id: Optional[str] = None
    equipment_name: Optional[str] = None
    equipment_category: Optional[str] = None
    condition_status: Optional[str] = None


class AmbulanceSchema(BaseModel):
    ambulance_vehicle_number: str
    hospital_id: Optional[str] = None
    status: Optional[str] = None
    current_location: Optional[str] = None
