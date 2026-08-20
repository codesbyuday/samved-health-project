import uuid
from typing import List, Optional
from app.database.connection import supabase_http_client
from app.modules.appointments.schemas import AppointmentCreateSchema, AppointmentStatusUpdateSchema


class AppointmentService:
    async def get_all(self, hospital_id: Optional[str] = None, citizen_id: Optional[str] = None) -> List[dict]:
        from app.core.cache import cache_manager

        cache_key = f"apts_list_{hospital_id or 'all'}_{citizen_id or 'all'}"
        cached = await cache_manager.get(cache_key)
        if cached is not None:
            return cached

        query = {
            "select": "*,citizens(citizen_id,name,phone,gender,address),hospitals(hospital_id,name,type,address)",
            "order": "created_at.desc",
            "limit": "40",
        }
        if hospital_id:
            query["hospital_id"] = f"eq.{hospital_id}"
        if citizen_id:
            query["citizen_id"] = f"eq.{citizen_id}"

        # 1. Fetch appointments with embedded citizen & hospital relations in 1 pass
        rows = await supabase_http_client.select("appointments", query)
        if not rows:
            await cache_manager.set(cache_key, [], ttl_seconds=300)
            return []

        # 2. Extract doctor IDs for staff lookup
        d_ids = list(set([str(r["doctor_id"]) for r in rows if r.get("doctor_id")]))
        stf_query = {"staff_uuid": f"in.({','.join(d_ids)})", "select": "staff_uuid,name,department,phone"} if d_ids else None

        staff_rows = await supabase_http_client.select("hospital_staff", stf_query) if stf_query else []
        staff_map = {s["staff_uuid"]: s for s in staff_rows if isinstance(s, dict) and "staff_uuid" in s}

        for r in rows:
            # Map embedded citizen & hospital objects to canonical keys
            r["citizen"] = r.get("citizens") or r.get("citizen")
            r["hospital"] = r.get("hospitals") or r.get("hospital")

            dc_id = r.get("doctor_id")
            if dc_id:
                r["doctor"] = staff_map.get(dc_id)

        await cache_manager.set(cache_key, rows, ttl_seconds=300)
        return rows

    async def create(self, payload: AppointmentCreateSchema) -> dict:
        from app.core.cache import cache_manager
        data = payload.model_dump(exclude_unset=True, mode="json")
        data["appointment_id"] = f"APT-{uuid.uuid4().hex[:8].upper()}"
        data["status"] = data.get("status") or "Scheduled"

        existing = await supabase_http_client.select("appointments", {"hospital_id": f"eq.{data.get('hospital_id')}"})
        data["token_id"] = len(existing) + 1

        res = await supabase_http_client.insert("appointments", data)
        await cache_manager.clear_prefix("apts_list")
        return res[0] if res else data

    async def update_status(self, appointment_id: str, payload: AppointmentStatusUpdateSchema) -> dict:
        from app.core.cache import cache_manager
        res = await supabase_http_client.update("appointments", {"appointment_id": f"eq.{appointment_id}"}, {"status": payload.status})
        await cache_manager.clear_prefix("apts_list")
        return res[0] if res else {"appointment_id": appointment_id, "status": payload.status}

    async def get_slip_details(self, appointment_id: str) -> Optional[dict]:
        import asyncio

        rows = await supabase_http_client.select("appointments", {"appointment_id": f"eq.{appointment_id}"})
        if not rows:
            return None
        apt = rows[0]

        cz_task = supabase_http_client.select("citizens", {"citizen_id": f"eq.{apt.get('citizen_id')}"}) if apt.get("citizen_id") else asyncio.sleep(0)
        hp_task = supabase_http_client.select("hospitals", {"hospital_id": f"eq.{apt.get('hospital_id')}"}) if apt.get("hospital_id") else asyncio.sleep(0)
        stf_task = supabase_http_client.select("hospital_staff", {"staff_uuid": f"eq.{apt.get('doctor_id')}"}) if apt.get("doctor_id") else asyncio.sleep(0)

        cz_res, hp_res, stf_res = await asyncio.gather(cz_task, hp_task, stf_task, return_exceptions=True)

        if isinstance(cz_res, list) and cz_res:
            apt["citizen"] = cz_res[0]
        if isinstance(hp_res, list) and hp_res:
            apt["hospital"] = hp_res[0]
        if isinstance(stf_res, list) and stf_res:
            apt["doctor"] = stf_res[0]

        return apt


appointment_service = AppointmentService()
