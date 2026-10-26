import uuid
import asyncio
from datetime import datetime
from typing import List, Optional
from app.database.connection import supabase_http_client
from app.modules.referrals.schemas import ReferralCreateSchema, ReferralStatusUpdateSchema


class ReferralService:
    async def get_all(self, hospital_id: Optional[str] = None) -> List[dict]:
        query = {"order": "created_at.desc"}
        if hospital_id:
            query["or"] = f"(from_hospital_id.eq.{hospital_id},to_hospital_id.eq.{hospital_id})"
        
        apts_task = supabase_http_client.select("referrals", query)
        citizens_task = supabase_http_client.select("citizens")
        hospitals_task = supabase_http_client.select("hospitals")
        staff_task = supabase_http_client.select("hospital_staff")

        referrals_raw, citizens_raw, hospitals_raw, staff_raw = await asyncio.gather(
            apts_task, citizens_task, hospitals_task, staff_task, return_exceptions=True
        )

        rows = referrals_raw if isinstance(referrals_raw, list) else []
        citizens = citizens_raw if isinstance(citizens_raw, list) else []
        hospitals = hospitals_raw if isinstance(hospitals_raw, list) else []
        staff = staff_raw if isinstance(staff_raw, list) else []

        citizen_map = {c["citizen_id"]: c for c in citizens if isinstance(c, dict) and "citizen_id" in c}
        hospital_map = {h["hospital_id"]: h for h in hospitals if isinstance(h, dict) and "hospital_id" in h}
        staff_map = {s["staff_uuid"]: s for s in staff if isinstance(s, dict) and "staff_uuid" in s}

        for r in rows:
            cz_id = r.get("citizen_id")
            fh_id = r.get("from_hospital_id")
            th_id = r.get("to_hospital_id")
            rd_id = r.get("referring_doctor_id")
            td_id = r.get("to_doctor_id")

            if cz_id:
                r["citizen"] = citizen_map.get(cz_id)
            if fh_id:
                r["from_hospital"] = hospital_map.get(fh_id)
            if th_id:
                r["to_hospital"] = hospital_map.get(th_id)
            if rd_id:
                r["referring_doctor"] = staff_map.get(rd_id)
            if td_id:
                r["to_doctor"] = staff_map.get(td_id)

        return rows

    async def create(self, payload: ReferralCreateSchema) -> dict:
        data = payload.model_dump(exclude_unset=True, mode="json")
        if not data.get("referral_id"):
            data["referral_id"] = str(uuid.uuid4())
        data["status"] = "pending"
        data["created_at"] = datetime.now().isoformat()
        data["updated_at"] = datetime.now().isoformat()
        res = await supabase_http_client.insert("referrals", data)
        return res[0] if res else data

    async def update_status(self, referral_id: str, status_val: str, notes: Optional[str] = None) -> dict:
        update_data = {
            "status": status_val,
            "updated_at": datetime.now().isoformat()
        }
        if notes:
            update_data["notes"] = notes
        res = await supabase_http_client.update("referrals", {"referral_id": f"eq.{referral_id}"}, update_data)
        return res[0] if res else {"referral_id": referral_id, **update_data}


referral_service = ReferralService()
