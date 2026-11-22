from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.modules.hospitals.schemas import (
    HospitalSchema, DoctorSchema, BedSchema, BedCreateSchema, BedUpdateSchema,
    EquipmentSchema, EquipmentCreateSchema, EquipmentUpdateSchema, AmbulanceSchema,
    HospitalRegistrationCreateSchema, HospitalStatusUpdateSchema, HospitalDocumentSchema,
    HospitalDocumentCreateSchema, StaffCreateSchema, StaffUpdateSchema, StaffResponseSchema,
    GenerateCredentialsSchema
)
from app.database.connection import supabase_http_client
from app.modules.hospitals.service import hospital_service

router = APIRouter(prefix="/hospitals", tags=["Hospitals"])

@router.post("/register", response_model=HospitalSchema)
async def register_hospital(payload: HospitalRegistrationCreateSchema):
    return await hospital_service.register_hospital(payload.model_dump())

@router.get("/pending", response_model=List[HospitalSchema])
async def get_pending_hospitals():
    return await hospital_service.get_pending_registrations()

@router.patch("/{hospital_id}/status", response_model=HospitalSchema)
async def update_hospital_status(hospital_id: str, payload: HospitalStatusUpdateSchema):
    res = await hospital_service.update_hospital_status(hospital_id, payload.status)
    if not res:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return res

@router.post("/{hospital_id}/documents", response_model=HospitalDocumentSchema)
async def upload_document(
    hospital_id: str,
    document: HospitalDocumentCreateSchema,
    staff_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None)
):
    if role:
        normalized = role.strip().lower()
        if normalized not in ["admin", "hospital_admin", "hospital_administrator", "smc_admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only hospital administrators can upload hospital documents."
            )
    if staff_id:
        staff_rows = await supabase_http_client.select("hospital_staff", {"staff_id": f"eq.{staff_id}"})
        if staff_rows:
            staff = staff_rows[0]
            if staff.get("hospital_id") != hospital_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Staff does not belong to this hospital facility."
                )
            s_role = (staff.get("role") or "").strip().lower()
            s_desig = (staff.get("designation") or "").strip().lower()
            if s_role not in ["admin", "hospital_admin"] and "admin" not in s_desig:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Only hospital administrators can upload hospital documents."
                )
    return await hospital_service.add_document(document.model_dump())

@router.get("/{hospital_id}/documents", response_model=List[HospitalDocumentSchema])
async def get_documents(
    hospital_id: str,
    staff_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None)
):
    if role:
        normalized = role.strip().lower()
        smc_roles = [
            "admin",
            "hospital_admin",
            "hospital_administrator",
            "smc_admin",
            "smc admin",
            "smc_officer",
            "officer",
            "commissioner",
            "health_officer",
            "ward_supervisor",
        ]
        if normalized not in smc_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Only hospital administrators and authorized SMC officials can view hospital documents."
            )
        # If it's an authorized SMC official, allow viewing documents for any hospital
        if normalized in ["smc_admin", "smc admin", "smc_officer", "officer", "commissioner", "health_officer", "ward_supervisor"]:
            return await hospital_service.get_documents(hospital_id)

    if staff_id:
        staff_rows = await supabase_http_client.select("hospital_staff", {"staff_id": f"eq.{staff_id}"})
        if staff_rows:
            staff = staff_rows[0]
            if staff.get("hospital_id") != hospital_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Staff does not belong to this hospital facility."
                )
            s_role = (staff.get("role") or "").strip().lower()
            s_desig = (staff.get("designation") or "").strip().lower()
            if s_role not in ["admin", "hospital_admin"] and "admin" not in s_desig:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied: Only hospital administrators can view hospital documents."
                )
    return await hospital_service.get_documents(hospital_id)

@router.get("", response_model=List[HospitalSchema])
async def get_hospitals():
    return await hospital_service.get_all_hospitals()


@router.get("/departments", response_model=List[str])
async def get_hospital_departments(hospital_id: Optional[str] = Query(None)):
    return await hospital_service.get_departments(hospital_id=hospital_id)


@router.get("/doctors", response_model=List[DoctorSchema])
async def get_all_doctors(
    hospital_id: Optional[str] = Query(None),
    department: Optional[str] = Query(None)
):
    return await hospital_service.get_doctors(hospital_id=hospital_id, department=department)


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


@router.post("/{hospital_id}/beds", response_model=BedSchema)
async def create_hospital_bed(hospital_id: str, payload: BedCreateSchema):
    return await hospital_service.create_bed(hospital_id, payload.model_dump())


@router.patch("/beds/{bed_id}", response_model=BedSchema)
async def update_bed_status(bed_id: str, updates: dict):
    return await hospital_service.update_bed(bed_id, updates)


@router.post("/beds/{bed_id}/assign")
async def assign_bed(bed_id: str, payload: dict):
    citizen_id = payload.get("citizen_id")
    status = payload.get("status") or "occupied"
    if not citizen_id:
        raise HTTPException(status_code=400, detail="citizen_id is required")
    return await hospital_service.assign_bed(bed_id, citizen_id, status)


@router.post("/beds/{bed_id}/release")
async def release_bed(bed_id: str):
    return await hospital_service.release_bed(bed_id)


@router.delete("/beds/{bed_id}")
async def delete_bed(bed_id: str):
    await hospital_service.delete_bed(bed_id)
    return {"status": "deleted", "bed_id": bed_id}


@router.get("/{hospital_id}/equipment", response_model=List[EquipmentSchema])
async def get_hospital_equipment(hospital_id: str):
    return await hospital_service.get_equipment(hospital_id)


@router.post("/{hospital_id}/equipment", response_model=EquipmentSchema)
async def create_hospital_equipment(hospital_id: str, payload: EquipmentCreateSchema):
    return await hospital_service.create_equipment(hospital_id, payload.model_dump())


@router.patch("/equipment/{equipment_uuid}", response_model=EquipmentSchema)
async def update_hospital_equipment(equipment_uuid: str, payload: EquipmentUpdateSchema):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    return await hospital_service.update_equipment(equipment_uuid, updates)


@router.delete("/equipment/{equipment_uuid}")
async def delete_hospital_equipment(equipment_uuid: str):
    await hospital_service.delete_equipment(equipment_uuid)
    return {"status": "deleted", "equipment_uuid": equipment_uuid}


@router.get("/{hospital_id}/dashboard-overview")
async def get_hospital_dashboard_overview(hospital_id: str):
    return await hospital_service.get_dashboard_overview(hospital_id)


@router.get("/{hospital_id}/ambulances", response_model=List[AmbulanceSchema])
async def get_hospital_ambulances(hospital_id: str):
    return await hospital_service.get_ambulances(hospital_id)


@router.post("/{hospital_id}/ambulances", response_model=AmbulanceSchema)
async def create_hospital_ambulance(hospital_id: str, payload: dict):
    return await hospital_service.create_ambulance(hospital_id, payload)


@router.patch("/ambulances/{vehicle_number}", response_model=AmbulanceSchema)
async def update_hospital_ambulance(vehicle_number: str, payload: dict):
    return await hospital_service.update_ambulance(vehicle_number, payload)


@router.delete("/ambulances/{vehicle_number}")
async def delete_hospital_ambulance(vehicle_number: str):
    await hospital_service.delete_ambulance(vehicle_number)
    return {"status": "deleted", "vehicle_number": vehicle_number}


@router.get("/{hospital_id}/staff", response_model=List[StaffResponseSchema])
async def get_hospital_staff(
    hospital_id: str,
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None)
):
    return await hospital_service.get_hospital_staff(hospital_id, role=role, department=department)


@router.post("/{hospital_id}/staff", response_model=StaffResponseSchema)
async def create_hospital_staff(hospital_id: str, payload: StaffCreateSchema):
    return await hospital_service.create_hospital_staff(hospital_id, payload.model_dump())


@router.patch("/{hospital_id}/staff/{staff_uuid}")
async def update_hospital_staff(hospital_id: str, staff_uuid: str, payload: StaffUpdateSchema):
    return await hospital_service.update_hospital_staff(hospital_id, staff_uuid, payload.model_dump())


@router.post("/{hospital_id}/staff/{staff_uuid}/credentials")
async def generate_staff_credentials(hospital_id: str, staff_uuid: str, payload: GenerateCredentialsSchema):
    return await hospital_service.generate_staff_credentials(hospital_id, staff_uuid, payload.model_dump())


@router.delete("/{hospital_id}/staff/{staff_uuid}")
async def delete_hospital_staff(hospital_id: str, staff_uuid: str):
    res = await hospital_service.delete_hospital_staff(hospital_id, staff_uuid)
    if not res:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return {"status": "deleted", "staff_uuid": staff_uuid}

