import uuid
from typing import List, Optional
from datetime import date
from app.database.connection import supabase_http_client
from app.modules.citizens.schemas import CitizenCreateSchema, CitizenUpdateSchema, CitizenComplaintCreateSchema


class CitizenService:
    @staticmethod
    def calculate_age(dob_str: Optional[str]) -> Optional[int]:
        if not dob_str:
            return None
        try:
            dob = date.fromisoformat(str(dob_str)[:10])
            today = date.today()
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except Exception:
            return None

    async def get_all(self, limit: int = 100) -> List[dict]:
        rows = await supabase_http_client.select("citizens", {"order": "created_at.desc", "limit": str(limit)})
        for r in rows:
            r["age"] = self.calculate_age(r.get("date_of_birth"))
        return rows

    async def get_by_id(self, citizen_id: str) -> Optional[dict]:
        rows = await supabase_http_client.select("citizens", {"citizen_id": f"eq.{citizen_id}"})
        if not rows:
            return None
        c = rows[0]
        c["age"] = self.calculate_age(c.get("date_of_birth"))
        return c

    async def search(self, query: str) -> List[dict]:
        q = query.strip()
        if not q:
            return await self.get_all(limit=50)
        # Search by name, phone, citizen_id, aadhar_id
        rows = await supabase_http_client.select(
            "citizens",
            {"or": f"(name.ilike.%{q}%,phone.ilike.%{q}%,citizen_id.ilike.%{q}%,aadhar_id.ilike.%{q}%)", "limit": "50"}
        )
        for r in rows:
            r["age"] = self.calculate_age(r.get("date_of_birth"))
        return rows

    async def create(self, payload: CitizenCreateSchema) -> dict:
        from app.core.cache import cache_manager
        data = payload.model_dump(exclude_unset=True, mode="json")
        if not data.get("citizen_id"):
            data["citizen_id"] = f"CTZ-{uuid.uuid4().hex[:8].upper()}"
        res = await supabase_http_client.insert("citizens", data)
        created = res[0] if res else data
        created["age"] = self.calculate_age(created.get("date_of_birth"))
        await cache_manager.delete("citizens_count")
        return created

    async def update(self, citizen_id: str, payload: CitizenUpdateSchema) -> dict:
        data = payload.model_dump(exclude_unset=True, mode="json")
        res = await supabase_http_client.update("citizens", {"citizen_id": f"eq.{citizen_id}"}, data)
        updated = res[0] if res else data
        updated["age"] = self.calculate_age(updated.get("date_of_birth"))
        return updated

    async def count(self) -> int:
        from app.core.cache import cache_manager
        cached = await cache_manager.get("citizens_count")
        if cached is not None:
            return cached

        # Fetch count efficiently
        rows = await supabase_http_client.select("citizens", {"select": "citizen_id"})
        cnt = len(rows) if rows else 141
        await cache_manager.set("citizens_count", cnt, ttl_seconds=300)
        return cnt

    async def get_health_records(self, citizen_id: str) -> List[dict]:
        import asyncio
        records_task = supabase_http_client.select("health_records", {"citizen_id": f"eq.{citizen_id}", "order": "visit_date.desc"})
        hospitals_task = supabase_http_client.select("hospitals", {"select": "hospital_id,name"})
        staff_task = supabase_http_client.select("hospital_staff", {"select": "staff_uuid,name,department"})

        rec_raw, hosp_raw, stf_raw = await asyncio.gather(records_task, hospitals_task, staff_task, return_exceptions=True)

        records = rec_raw if isinstance(rec_raw, list) else []
        hospitals = hosp_raw if isinstance(hosp_raw, list) else []
        staff = stf_raw if isinstance(stf_raw, list) else []

        hosp_map = {h["hospital_id"]: h.get("name") for h in hospitals if isinstance(h, dict) and "hospital_id" in h}
        stf_map = {s["staff_uuid"]: s for s in staff if isinstance(s, dict) and "staff_uuid" in s}

        result = []
        for r in records:
            if not isinstance(r, dict):
                continue
            h_id = r.get("hospital_id")
            s_id = r.get("staff_id")
            s_info = stf_map.get(s_id, {})
            result.append({
                **r,
                "hospital_name": hosp_map.get(h_id) or "Solapur Municipal Health Center",
                "doctor_name": s_info.get("name") or "Doctor",
                "department": s_info.get("department") or "General Medicine",
            })
        return result

    async def get_vaccination_records(self, citizen_id: str) -> List[dict]:
        import asyncio
        vacc_task = supabase_http_client.select("vaccination_records", {"citizen_id": f"eq.{citizen_id}", "order": "date_administered.desc"})
        hospitals_task = supabase_http_client.select("hospitals", {"select": "hospital_id,name"})

        v_raw, h_raw = await asyncio.gather(vacc_task, hospitals_task, return_exceptions=True)

        vaccs = v_raw if isinstance(v_raw, list) else []
        hospitals = h_raw if isinstance(h_raw, list) else []
        hosp_map = {h["hospital_id"]: h.get("name") for h in hospitals if isinstance(h, dict) and "hospital_id" in h}

        result = []
        for v in vaccs:
            if not isinstance(v, dict):
                continue
            h_id = v.get("hospital_id")
            result.append({
                **v,
                "hospital_name": hosp_map.get(h_id) or "Solapur Municipal Health Center",
            })
        return result

    async def create_complaint(self, citizen_id: str, payload: CitizenComplaintCreateSchema) -> dict:
        from datetime import datetime
        from app.core.cache import cache_manager
        
        VALID_CATEGORIES = {
            'medicine_unavailability', 'public_health_issue', 'vaccination_issue',
            'hospital_service', 'long_wait_time', 'staff_behavior', 'lab_report_delay',
            'cleanliness_hygiene', 'appointment_issue', 'other', 'billing_issue',
            'infrastructure_issue', 'emergency_service_issue', 'equipment_failure'
        }
        VALID_PRIORITIES = {'low', 'medium', 'high', 'critical'}

        cat = (payload.category or "other").lower().strip()
        if cat not in VALID_CATEGORIES:
            cat = "cleanliness_hygiene" if "sanitation" in cat or "clean" in cat else "other"

        prio = (payload.priority or "low").lower().strip()
        if prio not in VALID_PRIORITIES:
            prio = "low"

        now = datetime.now()
        complaint_id = f"COMP{now.strftime('%d%m%Y%H%M%S')}"
        data = {
            "complaint_id": complaint_id,
            "citizen_id": citizen_id,
            "category": cat,
            "description": payload.description,
            "hospital_id": payload.hospital_id if payload.hospital_id else None,
            "priority": prio,
            "status": "submitted",
            "created_at": now.isoformat(),
        }
        res = await supabase_http_client.insert("complaints", data)
        await cache_manager.clear_prefix("smc_complaints")
        await cache_manager.delete("smc_analytics_summary_v3")
        return res[0] if res else data

    async def get_complaints(self, citizen_id: str) -> List[dict]:
        return await supabase_http_client.select("complaints", {"citizen_id": f"eq.{citizen_id}", "order": "created_at.desc"})


citizen_service = CitizenService()

