from pydantic import BaseModel
from typing import Optional

class ReferralCreateSchema(BaseModel):
    citizen_id: str
    from_hospital_id: Optional[str] = None
    to_hospital_id: str
    referring_doctor_id: Optional[str] = None
    to_doctor_id: Optional[str] = None
    urgency_level: Optional[str] = "normal"
    referral_reason: str
    notes: Optional[str] = None

class ReferralStatusUpdateSchema(BaseModel):
    status: str
    notes: Optional[str] = None
