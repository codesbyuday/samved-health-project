from fastapi import APIRouter, HTTPException, status
from app.modules.citizens.service import citizen_service

router = APIRouter(prefix="/health-cards", tags=["Health Cards"])


@router.get("/{citizen_id}")
async def get_health_card(citizen_id: str):
    citizen = await citizen_service.get_by_id(citizen_id)
    if not citizen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Citizen profile not found")
    
    return {
        "card_number": f"SMD-HC-{citizen['citizen_id']}",
        "citizen": citizen,
        "issued_by": "Surat Municipal Corporation",
        "qr_code_data": f"SAMVED_HC:{citizen['citizen_id']}:{citizen.get('aadhar_id', '')}",
        "status": "Active"
    }
