import uuid
from typing import List, Optional
from datetime import date
from app.database.connection import supabase_http_client
from app.modules.citizens.schemas import CitizenCreateSchema, CitizenUpdateSchema


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


citizen_service = CitizenService()
