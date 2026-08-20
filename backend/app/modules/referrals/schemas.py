from pydantic import BaseModel
from typing import Optional

class ReferralCreateSchema(BaseModel):
    citizen_id: str
    from_hospital_id: Optional[str] = "HOSP001"
    to_hospital_id: Optional[str] = "HOSP002"
    referring_doctor_id: Optional[str] = None
    to_doctor_id: Optional[str] = None
    urgency_level: Optional[str] = "medium"
    referral_reason: Optional[str] = None
    notes: Optional[str] = None

class ReferralStatusUpdateSchema(BaseModel):
    status: str
