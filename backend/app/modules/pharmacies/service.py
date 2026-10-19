import uuid
from typing import List, Optional
from datetime import datetime
from app.database.connection import supabase_http_client
from app.modules.pharmacies.schemas import MedicineStockCreateSchema, MedicineStockUpdateSchema


class PharmacyService:
    async def get_providers(self, role: str = "pharmacy") -> List[dict]:
        query = {"order": "name.asc"}
        if role:
            query["role"] = f"eq.{role}"
        return await supabase_http_client.select("provider", query)

    async def get_medicines(self) -> List[dict]:
        from app.core.cache import cache_manager
        cached = await cache_manager.get("medicines_catalog")
        if cached:
            return cached
        meds = await supabase_http_client.select("medicines", {"order": "medicine_name.asc"})
        await cache_manager.set("medicines_catalog", meds, ttl_seconds=600)
        return meds

    async def get_stock(self, hospital_id: Optional[str] = None, provider_id: Optional[str] = None) -> List[dict]:
        import asyncio

        meds_task = supabase_http_client.select("medicines")
        if provider_id:
            query = {"order": "last_updated.desc", "provider_id": f"eq.{provider_id}"}
            stock_task = supabase_http_client.select("pharmacy_medicine_stock", query)
        elif hospital_id:
            query = {"order": "last_updated.desc", "hospital_id": f"eq.{hospital_id}"}
            stock_task = supabase_http_client.select("hospital_medicine_stock", query)
        else:
            stock_task = supabase_http_client.select("pharmacy_medicine_stock", {"order": "last_updated.desc"})

        stock_raw, meds_raw = await asyncio.gather(stock_task, meds_task, return_exceptions=True)

        stock_rows = stock_raw if isinstance(stock_raw, list) else []

        medicines = meds_raw if isinstance(meds_raw, list) else []
        med_map = {m["medicine_id"]: m for m in medicines if isinstance(m, dict) and "medicine_id" in m}

        for s in stock_rows:
            m_id = s.get("medicine_id")
            if m_id:
                s["medicine"] = med_map.get(m_id)

        return stock_rows

    async def create_stock(self, payload: MedicineStockCreateSchema) -> dict:
        data = payload.model_dump(exclude_unset=True)
        if not data.get("stock_id"):
            data["stock_id"] = str(uuid.uuid4())
        data["last_updated"] = datetime.now().isoformat()

        table = "pharmacy_medicine_stock" if data.get("provider_id") else "hospital_medicine_stock"
        
        # Strip optional columns if table schema doesn't have them yet
        insert_data = {
            "stock_id": data["stock_id"],
            "medicine_id": data["medicine_id"],
            "quantity": data.get("quantity", 0),
            "threshold": data.get("threshold", 10),
            "expiry_date": data.get("expiry_date"),
            "last_updated": data["last_updated"],
        }
        if data.get("provider_id"):
            insert_data["provider_id"] = data["provider_id"]
        if data.get("hospital_id"):
            insert_data["hospital_id"] = data["hospital_id"]
        if data.get("price") is not None:
            insert_data["price"] = data["price"]
        if data.get("batch_number"):
            insert_data["batch_number"] = data["batch_number"]

        try:
            res = await supabase_http_client.insert(table, insert_data)
            return res[0] if res else insert_data
        except Exception:
            # Fallback without price/batch_number if schema lacks those columns
            insert_data.pop("price", None)
            insert_data.pop("batch_number", None)
            res = await supabase_http_client.insert(table, insert_data)
            return res[0] if res else insert_data

    async def update_stock(self, stock_id: str, payload: MedicineStockUpdateSchema) -> dict:
        data = payload.model_dump(exclude_unset=True)
        data["last_updated"] = datetime.now().isoformat()

        # Try updating with all fields, fall back if price/batch_number column absent
        try:
            res = await supabase_http_client.update("pharmacy_medicine_stock", {"stock_id": f"eq.{stock_id}"}, data)
            if not res:
                res = await supabase_http_client.update("hospital_medicine_stock", {"stock_id": f"eq.{stock_id}"}, data)
            return res[0] if res else {"stock_id": stock_id, **data}
        except Exception:
            data.pop("price", None)
            data.pop("batch_number", None)
            res = await supabase_http_client.update("pharmacy_medicine_stock", {"stock_id": f"eq.{stock_id}"}, data)
            if not res:
                res = await supabase_http_client.update("hospital_medicine_stock", {"stock_id": f"eq.{stock_id}"}, data)
            return res[0] if res else {"stock_id": stock_id, **data}

    async def delete_stock(self, stock_id: str) -> bool:
        await supabase_http_client.delete("pharmacy_medicine_stock", {"stock_id": f"eq.{stock_id}"})
        await supabase_http_client.delete("hospital_medicine_stock", {"stock_id": f"eq.{stock_id}"})
        return True


pharmacy_service = PharmacyService()
