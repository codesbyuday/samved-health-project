from typing import List, Optional
from datetime import datetime
from app.database.connection import supabase_http_client
from app.modules.pharmacies.schemas import MedicineStockUpdateSchema


class PharmacyService:
    async def get_medicines(self) -> List[dict]:
        from app.core.cache import cache_manager
        cached = await cache_manager.get("medicines_catalog")
        if cached:
            return cached
        meds = await supabase_http_client.select("medicines", {"order": "medicine_name.asc"})
        await cache_manager.set("medicines_catalog", meds, ttl_seconds=600)
        return meds

    async def get_stock(self, hospital_id: Optional[str] = None) -> List[dict]:
        import asyncio

        query = {"order": "last_updated.desc"}
        if hospital_id:
            query["hospital_id"] = f"eq.{hospital_id}"

        stock_task = supabase_http_client.select("hospital_medicine_stock", query)
        meds_task = supabase_http_client.select("medicines")

        stock_raw, meds_raw = await asyncio.gather(stock_task, meds_task, return_exceptions=True)

        stock_rows = stock_raw if isinstance(stock_raw, list) else []
        if not stock_rows:
            stock_rows = await supabase_http_client.select("pharmacy_medicine_stock", query)

        medicines = meds_raw if isinstance(meds_raw, list) else []
        med_map = {m["medicine_id"]: m for m in medicines if isinstance(m, dict) and "medicine_id" in m}

        for s in stock_rows:
            m_id = s.get("medicine_id")
            if m_id:
                s["medicine"] = med_map.get(m_id)

        return stock_rows

    async def update_stock(self, stock_id: str, payload: MedicineStockUpdateSchema) -> dict:
        data = payload.model_dump(exclude_unset=True)
        data["last_updated"] = datetime.now().isoformat()
        res = await supabase_http_client.update("hospital_medicine_stock", {"stock_id": f"eq.{stock_id}"}, data)
        if not res:
            res = await supabase_http_client.update("pharmacy_medicine_stock", {"stock_id": f"eq.{stock_id}"}, data)
        return res[0] if res else {"stock_id": stock_id, **data}


pharmacy_service = PharmacyService()
