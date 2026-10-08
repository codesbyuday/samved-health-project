import uuid
from fastapi import APIRouter, Query, status
from typing import List, Optional
from pydantic import BaseModel
from app.database.connection import supabase_http_client

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class NotificationCreateSchema(BaseModel):
    recipient_type: Optional[str] = "officer"
    recipient_id: Optional[str] = None
    title: str
    message: str
    type: Optional[str] = "alert"


@router.get("")
async def get_notifications(
    recipient_id: Optional[str] = Query(None),
    ward_number: Optional[int] = Query(None)
):
    query = {"order": "created_at.desc", "limit": "50"}
    if recipient_id and ward_number:
        query["or"] = f"(target_user_id.eq.{recipient_id},target_ward_number.eq.{ward_number},target_type.eq.broadcast)"
    elif recipient_id:
        query["or"] = f"(target_user_id.eq.{recipient_id},target_type.eq.broadcast)"
    elif ward_number:
        query["or"] = f"(target_ward_number.eq.{ward_number},target_type.eq.broadcast)"
    return await supabase_http_client.select("notifications", query)


@router.post("", status_code=status.HTTP_201_CREATED)
async def send_notification(payload: NotificationCreateSchema):
    data = payload.model_dump(exclude_unset=True)
    data["id"] = f"NTF-{uuid.uuid4().hex[:8].upper()}"
    data["is_read"] = False
    res = await supabase_http_client.insert("notifications", data)
    return res[0] if res else data


@router.patch("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    res = await supabase_http_client.update("notifications", {"id": f"eq.{notification_id}"}, {"is_read": True})
    return res[0] if res else {"id": notification_id, "is_read": True}
