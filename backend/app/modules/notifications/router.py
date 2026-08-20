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
async def get_notifications(recipient_id: Optional[str] = Query(None)):
    query = {"order": "created_at.desc"}
    if recipient_id:
        query["recipient_id"] = f"eq.{recipient_id}"
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
