from fastapi import APIRouter, status
from typing import List, Optional
from app.modules.referrals.schemas import ReferralCreateSchema, ReferralStatusUpdateSchema
from app.modules.referrals.service import referral_service

router = APIRouter(prefix="/referrals", tags=["Referrals"])


@router.get("")
async def get_referrals(hospital_id: Optional[str] = None):
    return await referral_service.get_all(hospital_id=hospital_id)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_referral(payload: ReferralCreateSchema):
    return await referral_service.create(payload)


@router.patch("/{referral_id}")
async def update_referral_status(referral_id: str, payload: ReferralStatusUpdateSchema):
    return await referral_service.update_status(referral_id, payload.status)
