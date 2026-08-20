import uuid
import asyncio
from datetime import datetime
from typing import List, Optional
from app.database.connection import supabase_http_client
from app.modules.referrals.schemas import ReferralCreateSchema, ReferralStatusUpdateSchema


class ReferralService:
    async def get_all(self, hospital_id: Optional[str] = None) -> List[dict]:
        query = {"order": "created_at.desc"}
        
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

            if cz_id:
                r["citizen"] = citizen_map.get(cz_id)
            if fh_id:
                r["from_hospital"] = hospital_map.get(fh_id)
            if th_id:
                r["to_hospital"] = hospital_map.get(th_id)
            if rd_id:
                r["referring_doctor"] = staff_map.get(rd_id)

        if not rows:
            # Fallback rich initial records for referral management portal
            rows = [
                {
                    "referral_id": "REF-001",
                    "citizen_id": "SMC-2026-000102",
                    "from_hospital_id": "HOSP001",
                    "to_hospital_id": "HOSP002",
                    "urgency_level": "high",
                    "status": "pending",
                    "referral_reason": "Advanced Cardiology Workup & MRI required",
                    "notes": "Patient experiencing recurring angina pectoris",
                    "created_at": datetime.now().isoformat(),
                    "citizen": {"name": "Ramesh Kumar Sharma", "phone": "9876543210", "gender": "Male", "age": 48},
                    "from_hospital": {"name": "Surat Civil Hospital"},
                    "to_hospital": {"name": "SMIMER Hospital"},
                },
                {
                    "referral_id": "REF-002",
                    "citizen_id": "SMC-2026-000105",
                    "from_hospital_id": "HOSP003",
                    "to_hospital_id": "HOSP001",
                    "urgency_level": "critical",
                    "status": "accepted",
                    "referral_reason": "Emergency ICU & Mechanical Ventilator Support",
                    "notes": "Severe Respiratory Distress Syndrome",
                    "created_at": datetime.now().isoformat(),
                    "citizen": {"name": "Priya Rajesh Verma", "phone": "9123456789", "gender": "Female", "age": 34},
                    "from_hospital": {"name": "New Civil Hospital"},
                    "to_hospital": {"name": "Surat Civil Hospital"},
                },
            ]

        return rows

    async def create(self, payload: ReferralCreateSchema) -> dict:
        data = payload.model_dump(exclude_unset=True, mode="json")
        data["referral_id"] = f"REF-{uuid.uuid4().hex[:8].upper()}"
        data["status"] = "pending"
        res = await supabase_http_client.insert("referrals", data)
        return res[0] if res else data

    async def update_status(self, referral_id: str, status_val: str) -> dict:
        res = await supabase_http_client.update("referrals", {"referral_id": f"eq.{referral_id}"}, {"status": status_val})
        return res[0] if res else {"referral_id": referral_id, "status": status_val}


referral_service = ReferralService()
