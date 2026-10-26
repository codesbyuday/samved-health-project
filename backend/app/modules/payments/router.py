import uuid
from fastapi import APIRouter, status
from pydantic import BaseModel

router = APIRouter(prefix="/payments", tags=["Payments"])


class PaymentInitiateSchema(BaseModel):
    amount: float
    purpose: str
    citizen_id: str


@router.post("/initiate", status_code=status.HTTP_201_CREATED)
async def initiate_payment(payload: PaymentInitiateSchema):
    payment_id = f"PAY-{uuid.uuid4().hex[:8].upper()}"
    return {
        "success": True,
        "payment_id": payment_id,
        "amount": payload.amount,
        "purpose": payload.purpose,
        "citizen_id": payload.citizen_id,
        "status": "Pending",
        "gateway_url": f"https://payment.samved.gov.in/checkout?id={payment_id}"
    }
