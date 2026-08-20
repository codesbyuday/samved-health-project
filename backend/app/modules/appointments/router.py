from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.modules.appointments.schemas import AppointmentSchema, AppointmentCreateSchema, AppointmentStatusUpdateSchema
from app.modules.appointments.service import appointment_service

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.get("", response_model=List[AppointmentSchema])
async def get_appointments(
    hospital_id: Optional[str] = Query(None),
    citizen_id: Optional[str] = Query(None),
):
    return await appointment_service.get_all(hospital_id=hospital_id, citizen_id=citizen_id)


@router.post("", response_model=AppointmentSchema, status_code=status.HTTP_201_CREATED)
async def create_appointment(payload: AppointmentCreateSchema):
    return await appointment_service.create(payload)


@router.patch("/{appointment_id}", response_model=AppointmentSchema)
async def update_appointment_status(appointment_id: str, payload: AppointmentStatusUpdateSchema):
    return await appointment_service.update_status(appointment_id, payload)


@router.get("/{appointment_id}/slip")
async def get_appointment_slip(appointment_id: str):
    slip = await appointment_service.get_slip_details(appointment_id)
    if not slip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")
    return {"success": True, "data": slip}
