import math
import struct
import binascii
import asyncio
import uuid
from typing import List, Optional, Tuple
from datetime import datetime
from app.database.connection import supabase_http_client
from app.modules.pharmacies.schemas import MedicineStockCreateSchema, MedicineStockUpdateSchema


def parse_wkb_point(wkb_hex: Optional[str]) -> Tuple[Optional[float], Optional[float]]:
    """Decodes PostGIS EWKB Point hex geometry into (latitude, longitude)"""
    if not wkb_hex or not isinstance(wkb_hex, str):
        return None, None
    try:
        raw_bytes = binascii.unhexlify(wkb_hex.strip())
        if len(raw_bytes) < 25:
            return None, None
        # EWKB layout: 1 byte endian, 4 bytes type, 4 bytes SRID, 8 bytes lon, 8 bytes lat
        lon, lat = struct.unpack("<dd", raw_bytes[9:25])
        return round(lat, 6), round(lon, 6)
    except Exception:
        return None, None


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates geodesic distance in kilometers between two lat/lon pairs"""
    radius = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return round(radius * c, 2)



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

    async def get_pharmacies(
        self,
        search: Optional[str] = None,
        ward_id: Optional[int] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> List[dict]:
        """Fetch all approved retail pharmacies and medical stores with coordinates, distance and medicines count"""
        prov_task = supabase_http_client.select("provider", {"role": "eq.pharmacy"})
        stock_task = supabase_http_client.select("pharmacy_medicine_stock")

        prov_raw, stock_raw = await asyncio.gather(prov_task, stock_task, return_exceptions=True)

        providers = prov_raw if isinstance(prov_raw, list) else []
        stocks = stock_raw if isinstance(stock_raw, list) else []

        counts = {}
        for s in stocks:
            if not isinstance(s, dict): continue
            pid = s.get("provider_id")
            if pid:
                counts[pid] = counts.get(pid, 0) + 1

        results = []
        clean_search = search.strip().lower() if search and search.strip() else None

        for p in providers:
            if not isinstance(p, dict): continue
            status = p.get("status")
            if status and status.lower() not in ("approved", "active", "verified"):
                continue

            pid = p.get("provider_id")
            name = p.get("name") or "Medical Store"
            addr = p.get("address") or "Solapur, Maharashtra"

            if ward_id is not None and p.get("ward_id") != ward_id:
                continue

            if clean_search:
                if clean_search not in name.lower() and clean_search not in addr.lower():
                    continue

            lat, lon = parse_wkb_point(p.get("location"))
            dist_km = None
            if user_lat is not None and user_lon is not None and lat is not None and lon is not None:
                dist_km = haversine_distance(user_lat, user_lon, lat, lon)

            results.append({
                "provider_id": pid,
                "name": name,
                "role": "pharmacy",
                "address": addr,
                "email": p.get("email"),
                "phone": p.get("phone") or "+91 217 2740300",
                "license": p.get("license"),
                "status": status or "approved",
                "ward_id": p.get("ward_id"),
                "latitude": lat,
                "longitude": lon,
                "distance_km": dist_km,
                "medicines_count": counts.get(pid, 0),
                "operating_hours": "08:00 AM - 10:00 PM",
            })

        if user_lat is not None and user_lon is not None:
            results.sort(key=lambda x: (
                x["distance_km"] if x["distance_km"] is not None else 999999,
                x["name"],
            ))
        else:
            results.sort(key=lambda x: x["name"])

        return results

    async def get_pharmacy_by_id(
        self,
        provider_id: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> Optional[dict]:
        """Fetch single pharmacy profile with its complete available medicines catalogue"""
        prov_rows = await supabase_http_client.select("provider", {"provider_id": f"eq.{provider_id}", "role": "eq.pharmacy"})
        if not prov_rows or not isinstance(prov_rows, list):
            return None

        p = prov_rows[0]
        lat, lon = parse_wkb_point(p.get("location"))
        dist_km = None
        if user_lat is not None and user_lon is not None and lat is not None and lon is not None:
            dist_km = haversine_distance(user_lat, user_lon, lat, lon)

        # Fetch stocked medicines
        meds_task = supabase_http_client.select("medicines")
        stock_task = supabase_http_client.select("pharmacy_medicine_stock", {"provider_id": f"eq.{provider_id}"})
        meds_raw, stock_raw = await asyncio.gather(meds_task, stock_task, return_exceptions=True)

        medicines = {m["medicine_id"]: m for m in (meds_raw if isinstance(meds_raw, list) else []) if isinstance(m, dict) and "medicine_id" in m}
        stocks = stock_raw if isinstance(stock_raw, list) else []

        med_list = []
        for s in stocks:
            if not isinstance(s, dict): continue
            m_id = s.get("medicine_id")
            med = medicines.get(m_id) or {}
            qty = int(s.get("quantity") or 0)
            price = float(s.get("price")) if s.get("price") is not None else 45.0

            med_list.append({
                "stock_id": s.get("stock_id") or str(uuid.uuid4()),
                "medicine_id": m_id or "",
                "name": med.get("medicine_name") or "Prescription Medication",
                "category": med.get("medicine_category") or "General Medicine",
                "manufacturer": med.get("manufacturer_name") or "Approved Manufacturer",
                "description": med.get("description") or "",
                "quantity": qty,
                "is_available": qty > 0,
                "price": price,
                "expiry_date": s.get("expiry_date"),
                "batch_number": s.get("batch_number"),
                "provider_id": provider_id,
                "pharmacy_name": p.get("name") or "Licensed Pharmacy",
                "pharmacy_type": "Jan Aushadhi Kendra" if "aushadhi" in (p.get("name") or "").lower() else "Retail Pharmacy",
                "address": p.get("address") or "Solapur, Maharashtra",
                "phone": p.get("phone") or "+91 217 2740300",
                "latitude": lat,
                "longitude": lon,
                "distance_km": dist_km,
            })

        med_list.sort(key=lambda x: x["name"])

        return {
            "provider_id": provider_id,
            "name": p.get("name") or "Medical Store",
            "role": "pharmacy",
            "address": p.get("address") or "Solapur, Maharashtra",
            "email": p.get("email"),
            "phone": p.get("phone") or "+91 217 2740300",
            "license": p.get("license"),
            "status": p.get("status") or "approved",
            "ward_id": p.get("ward_id"),
            "latitude": lat,
            "longitude": lon,
            "distance_km": dist_km,
            "medicines_count": len(med_list),
            "operating_hours": "08:00 AM - 10:00 PM",
            "medicines": med_list,
        }

    async def get_medicine_availability(
        self,
        q: Optional[str] = None,
        category: Optional[str] = None,
        sort_by: Optional[str] = "nearby",
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> List[dict]:
        """Fetch all medicine offerings exclusively from retail pharmacies (provider role = 'pharmacy')"""
        meds_task = supabase_http_client.select("medicines")
        prov_task = supabase_http_client.select("provider", {"role": "eq.pharmacy"})
        p_stock_task = supabase_http_client.select("pharmacy_medicine_stock")

        meds_raw, prov_raw, p_stock_raw = await asyncio.gather(
            meds_task, prov_task, p_stock_task, return_exceptions=True
        )

        medicines = {m["medicine_id"]: m for m in (meds_raw if isinstance(meds_raw, list) else []) if isinstance(m, dict) and "medicine_id" in m}
        
        providers = {}
        for p in (prov_raw if isinstance(prov_raw, list) else []):
            if not isinstance(p, dict) or not p.get("provider_id"):
                continue
            status = p.get("status")
            if status and status.lower() not in ("approved", "active", "verified"):
                continue
            lat, lon = parse_wkb_point(p.get("location"))
            p_copy = dict(p)
            p_copy["lat"] = lat
            p_copy["lon"] = lon
            providers[p["provider_id"]] = p_copy

        p_stocks = p_stock_raw if isinstance(p_stock_raw, list) else []

        offerings = []
        clean_q = q.strip().lower() if q and q.strip() else None
        clean_cat = category.strip().lower() if category and category.strip() and category != "All" else None

        for ps in p_stocks:
            if not isinstance(ps, dict): continue
            m_id = ps.get("medicine_id")
            p_id = ps.get("provider_id")
            med = medicines.get(m_id) or {}
            prov = providers.get(p_id)
            if not prov: # Only include approved pharmacy providers
                continue

            m_name = med.get("medicine_name") or "Prescription Medication"
            m_cat = med.get("medicine_category") or "General Medicine"
            m_mfr = med.get("manufacturer_name") or "Approved Manufacturer"
            m_desc = med.get("description") or ""

            ph_name = prov.get("name") or "Licensed Pharmacy"
            ph_addr = prov.get("address") or "Solapur, Maharashtra"
            ph_phone = prov.get("phone") or "+91 217 2740300"
            lat = prov.get("lat")
            lon = prov.get("lon")

            if clean_cat and m_cat.lower() != clean_cat:
                continue

            if clean_q:
                text_to_search = f"{m_name} {m_cat} {m_mfr} {m_desc} {ph_name} {ph_addr}".lower()
                if clean_q not in text_to_search:
                    continue

            dist_km = None
            if user_lat is not None and user_lon is not None and lat is not None and lon is not None:
                dist_km = haversine_distance(user_lat, user_lon, lat, lon)

            qty = int(ps.get("quantity") or 0)
            price = float(ps.get("price")) if ps.get("price") is not None else 45.0

            offerings.append({
                "stock_id": ps.get("stock_id") or str(uuid.uuid4()),
                "medicine_id": m_id or "",
                "name": m_name,
                "category": m_cat,
                "manufacturer": m_mfr,
                "description": m_desc,
                "quantity": qty,
                "is_available": qty > 0,
                "price": price,
                "expiry_date": ps.get("expiry_date"),
                "batch_number": ps.get("batch_number"),
                "provider_id": p_id,
                "pharmacy_name": ph_name,
                "pharmacy_type": "Jan Aushadhi Kendra" if "aushadhi" in ph_name.lower() else "Retail Pharmacy",
                "address": ph_addr,
                "phone": ph_phone,
                "latitude": lat,
                "longitude": lon,
                "distance_km": dist_km,
            })

        # Multi-tier Sorting
        if sort_by == "nearby":
            if user_lat is not None and user_lon is not None:
                offerings.sort(key=lambda x: (
                    0 if x["is_available"] else 1,
                    x["distance_km"] if x["distance_km"] is not None else 999999,
                    x["name"],
                ))
            else:
                offerings.sort(key=lambda x: (0 if x["is_available"] else 1, x["name"]))
        elif sort_by == "price_asc":
            offerings.sort(key=lambda x: (
                0 if x["is_available"] else 1,
                x["price"] if x["price"] is not None and x["price"] > 0 else 999999,
                x["distance_km"] if x["distance_km"] is not None else 999999,
            ))
        elif sort_by in ("price_desc", "price_high_to_low"):
            offerings.sort(key=lambda x: (
                0 if x["is_available"] else 1,
                -x["price"] if x["price"] is not None and x["price"] > 0 else 999999,
                x["distance_km"] if x["distance_km"] is not None else 999999,
            ))
        elif sort_by == "name":
            offerings.sort(key=lambda x: (0 if x["is_available"] else 1, x["name"], x["pharmacy_name"]))
        else:
            offerings.sort(key=lambda x: (0 if x["is_available"] else 1, x["name"]))

        return offerings


pharmacy_service = PharmacyService()
