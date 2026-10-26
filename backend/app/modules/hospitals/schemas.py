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
    status: Optional[str] = "pending"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: Optional[str] = None

class HospitalDocumentCreateSchema(BaseModel):
    hospital_id: str
    document_type: str
    file_url: str

class HospitalDocumentSchema(BaseModel):
    document_id: str
    hospital_id: str
    document_type: str
    file_url: str
    uploaded_at: Optional[str] = None

class HospitalRegistrationCreateSchema(BaseModel):
    name: str
    type: str
    address: str
    ward_id: Optional[int] = None
    contact_number: str
    email: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    admin_password: str

class HospitalStatusUpdateSchema(BaseModel):
    status: str


class StaffCreateSchema(BaseModel):
    name: str
    role: str
    designation: str
    department: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    shift: Optional[str] = "morning"
    status: Optional[str] = "active"
    salary: Optional[float] = None
    specialization: Optional[str] = None
    consultation_time: Optional[int] = 15
    work_start_time: Optional[str] = "09:00:00"
    work_end_time: Optional[str] = "17:00:00"
    max_patients_per_day: Optional[int] = 30
    qualification: Optional[str] = None
    experience: Optional[int] = None
    emergency_contact: Optional[str] = None
    generate_credentials: Optional[bool] = False
    password: Optional[str] = None


class StaffUpdateSchema(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    designation: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    shift: Optional[str] = None
    status: Optional[str] = None
    salary: Optional[float] = None
    specialization: Optional[str] = None
    consultation_time: Optional[int] = None
    work_start_time: Optional[str] = None
    work_end_time: Optional[str] = None
    max_patients_per_day: Optional[int] = None
    qualification: Optional[str] = None
    experience: Optional[int] = None
    emergency_contact: Optional[str] = None


class GenerateCredentialsSchema(BaseModel):
    email: str
    password: Optional[str] = None


class StaffResponseSchema(BaseModel):
    staff_uuid: str
    staff_id: Optional[str] = None
    hospital_id: Optional[str] = None
    user_id: Optional[str] = None
    name: str
    role: str
    designation: Optional[str] = None
    department: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    shift: Optional[str] = None
    status: Optional[str] = None
    salary: Optional[float] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience: Optional[int] = None
    emergency_contact: Optional[str] = None
    joined_at: Optional[str] = None
    credentials: Optional[dict] = None





class DoctorSchema(BaseModel):
    staff_uuid: str
    name: Optional[str] = None
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
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
