import uuid
import struct
import binascii
import math
from typing import List, Optional
from app.database.connection import supabase_http_client
from app.modules.laboratories.schemas import DiagnosticReportCreateSchema


def parse_wkb_point(wkb_hex: Optional[str]) -> tuple[Optional[float], Optional[float]]:
    """Parse PostGIS EWKB hex string to (latitude, longitude)"""
    if not wkb_hex or not isinstance(wkb_hex, str):
        return None, None
    try:
        raw = binascii.unhexlify(wkb_hex.strip())
        if len(raw) < 25:
            return None, None
        if raw[0] == 1:
            lon, lat = struct.unpack('<dd', raw[9:25])
        else:
            lon, lat = struct.unpack('>dd', raw[9:25])
        return round(lat, 6), round(lon, 6)
    except Exception:
        return None, None


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate geographic distance between coordinates in kilometers"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def get_clinical_metadata(test_name: str, category: Optional[str], description: Optional[str] = None) -> dict:
    """Provides standard diagnostic sample requirements, patient preparation, and turnaround time"""
    name_lower = (test_name or "").lower()
    cat_lower = (category or "").lower()

    # Defaults
    sample_type = "Venous Blood Sample"
    prep = "No special preparation required. Maintain routine hydration."
    turnaround = "Same Day (Within 6-12 hours)"

    if "urine" in name_lower or "urinalysis" in name_lower or "pathology" in cat_lower and "urine" in name_lower:
        sample_type = "Midstream Clean-Catch Urine"
        prep = "Collect first-morning urine sample in sterile container provided by laboratory."
        turnaround = "Within 4-6 hours"
    elif "sputum" in name_lower:
        sample_type = "Early Morning Sputum"
        prep = "Rinse mouth with water and collect deep cough sputum in sterile container before eating."
        turnaround = "Within 24-48 hours"
    elif "culture" in name_lower or "microbiology" in cat_lower:
        sample_type = "Blood / Specimen Culture"
        prep = "Sample should be collected prior to starting antibiotic therapy if possible."
        turnaround = "Within 48-72 hours (Incubation required)"
    elif "x-ray" in name_lower or "chest x-ray" in name_lower:
        sample_type = "Digital Radiography Imaging"
        prep = "Remove metallic objects, jewelry, and belts before entering scan room."
        turnaround = "Within 1-2 hours"
    elif "ct scan" in name_lower or "mri" in name_lower or "radiology" in cat_lower:
        sample_type = "Medical Imaging (Radiology)"
        prep = "Fasting for 4 hours may be required if contrast agent is administered. Remove all metals."
        turnaround = "Within 4-8 hours (Radiologist report)"
    elif "ecg" in name_lower or "cardiology" in cat_lower:
        sample_type = "Electrocardiogram Recording"
        prep = "Avoid heavy caffeine or strenuous exercise 2 hours before the recording."
        turnaround = "Immediate (Within 30 mins)"
    elif "ultrasound" in name_lower or "sonography" in name_lower:
        sample_type = "Ultrasonography Scan"
        prep = "Drink 1 liter water 1 hour prior to maintain full bladder (for pelvic/abdominal scan)."
        turnaround = "Within 1-2 hours"
    elif "mammography" in name_lower:
        sample_type = "Low-Dose X-Ray Imaging"
        prep = "Do not apply deodorants, perfumes, or powders under arms or on breasts before test."
        turnaround = "Within 24 hours"
    elif "fasting" in name_lower:
        sample_type = "Fluoride Blood Plasma"
        prep = "Strict overnight fasting required (8-10 hours). Only plain water permitted."
        turnaround = "Within 4-6 hours"
    elif "post-prandial" in name_lower or "pp" in name_lower:
        sample_type = "Fluoride Blood Plasma"
        prep = "Sample must be drawn exactly 2 hours after completing your meal."
        turnaround = "Within 4-6 hours"
    elif "lipid" in name_lower:
        sample_type = "Serum Blood Sample"
        prep = "Strict 10-12 hours overnight fasting required. Avoid high-fat meals on previous day."
        turnaround = "Within 6-8 hours"
    elif "thyroid" in name_lower or "tsh" in name_lower:
        sample_type = "Serum Blood Sample"
        prep = "Morning fasting sample preferred. If taking thyroid medication, take after blood draw."
        turnaround = "Within 8-12 hours"
    elif "dengue" in name_lower or "malaria" in name_lower or "serology" in cat_lower:
        sample_type = "Serum / EDTA Whole Blood"
        prep = "No fasting required. Can be tested any time during fever."
        turnaround = "Within 2-4 hours (Rapid Diagnostic)"
    elif "hba1c" in name_lower:
        sample_type = "EDTA Whole Blood"
        prep = "No fasting required. Can be given at any time of the day."
        turnaround = "Within 4-6 hours"
    elif "lft" in name_lower or "liver" in name_lower:
        sample_type = "Serum Blood Sample"
        prep = "8 hours overnight fasting recommended. Avoid alcohol 24 hours prior to test."
        turnaround = "Within 6-8 hours"
    elif "kft" in name_lower or "kidney" in name_lower:
        sample_type = "Serum Blood Sample"
        prep = "Overnight fasting recommended. Maintain normal water intake."
        turnaround = "Within 6-8 hours"
    elif "cbc" in name_lower or "complete blood" in name_lower or "hematology" in cat_lower:
        sample_type = "EDTA Whole Blood"
        prep = "No special fasting required. Stay well hydrated."
        turnaround = "Within 4-6 hours"

    return {
        "sample_type": sample_type,
        "preparation": prep,
        "turnaround_time": turnaround,
    }


class LaboratoryService:
    async def get_test_types(self) -> List[dict]:
        from app.core.cache import cache_manager
        cached = await cache_manager.get("lab_test_types")
        if cached:
            return cached
        types = await supabase_http_client.select("test_types", {"order": "test_name.asc"})
        await cache_manager.set("lab_test_types", types, ttl_seconds=600)
        return types

    async def get_reports(self, citizen_id: Optional[str] = None, hospital_id: Optional[str] = None) -> List[dict]:
        from app.core.cache import cache_manager

        cache_key = f"lab_reports_{citizen_id or 'all'}_{hospital_id or 'all'}"
        cached = await cache_manager.get(cache_key)
        if cached is not None:
            return cached

        query = {"order": "uploaded_at.desc", "limit": "100"}
        if citizen_id:
            query["citizen_id"] = f"eq.{citizen_id}"
        if hospital_id:
            query["hospital_id"] = f"eq.{hospital_id}"

        reports = await supabase_http_client.select("diagnostic_reports", query)
        if not reports:
            await cache_manager.set(cache_key, [], ttl_seconds=60)
            return []

        # Fetch lookup data for test_types, hospitals, providers, and citizens
        test_types = await self.get_test_types()
        test_type_map = {t.get("test_id"): t for t in test_types}

        hospital_ids = list({r["hospital_id"] for r in reports if r.get("hospital_id")})
        provider_ids = list({r["provider_id"] for r in reports if r.get("provider_id")})
        citizen_ids = list({r["citizen_id"] for r in reports if r.get("citizen_id")})

        hospital_map = {}
        if hospital_ids:
            try:
                hospitals = await supabase_http_client.select("hospitals", {"limit": "200"})
                hospital_map = {h.get("hospital_id"): h for h in hospitals}
            except Exception:
                pass

        provider_map = {}
        if provider_ids:
            try:
                providers = await supabase_http_client.select("provider", {"limit": "200"})
                provider_map = {p.get("provider_id"): p for p in providers}
            except Exception:
                pass

        citizen_map = {}
        if citizen_ids:
            try:
                citizens = await supabase_http_client.select("citizens", {"limit": "500"})
                citizen_map = {c.get("citizen_id"): c for c in citizens if isinstance(c, dict)}
            except Exception:
                pass

        for r in reports:
            cz_id = r.get("citizen_id")
            if cz_id and cz_id in citizen_map:
                r["citizen"] = citizen_map[cz_id]

            tt_id = r.get("test_type_id")
            if tt_id and tt_id in test_type_map:
                tt = test_type_map[tt_id]
                r["test_type"] = tt
                r["test_name"] = tt.get("test_name")
                r["test_category"] = tt.get("test_category")

            h_id = r.get("hospital_id")
            p_id = r.get("provider_id")

            if h_id and h_id in hospital_map:
                hosp = hospital_map[h_id]
                r["hospital"] = hosp
                r["issuer_type"] = "Hospital"
                r["issuer_name"] = hosp.get("name")
                r["issuer_address"] = hosp.get("address")
            elif p_id and p_id in provider_map:
                prov = provider_map[p_id]
                r["provider"] = prov
                r["issuer_type"] = "Diagnostic Laboratory"
                r["issuer_name"] = prov.get("name")
                r["issuer_address"] = prov.get("address")
            elif h_id:
                r["issuer_type"] = "Hospital"
                r["issuer_name"] = h_id
                r["issuer_address"] = None
            elif p_id:
                r["issuer_type"] = "Diagnostic Laboratory"
                r["issuer_name"] = p_id
                r["issuer_address"] = None
            else:
                r["issuer_type"] = "Diagnostic Facility"
                r["issuer_name"] = "Municipal Health Facility"
                r["issuer_address"] = "Solapur, Maharashtra"

        await cache_manager.set(cache_key, reports, ttl_seconds=60)
        return reports

    async def create_report(self, payload: DiagnosticReportCreateSchema) -> dict:
        from datetime import datetime
        from app.core.cache import cache_manager
        data = payload.model_dump(exclude_unset=True, mode="json")
        if not data.get("report_id"):
            data["report_id"] = str(uuid.uuid4())
        if not data.get("uploaded_at"):
            data["uploaded_at"] = datetime.now().isoformat()
        res = await supabase_http_client.insert("diagnostic_reports", data)
        await cache_manager.clear_prefix("lab_reports")
        return res[0] if res else data

    async def get_report_file_url(self, report_id: str) -> Optional[str]:
        rows = await supabase_http_client.select("diagnostic_reports", {"report_id": f"eq.{report_id}"})
        if not rows:
            return None
        return rows[0].get("report_file_url")

    async def update_report(self, report_id: str, updates: dict) -> dict:
        from app.core.cache import cache_manager
        res = await supabase_http_client.update("diagnostic_reports", updates, {"report_id": f"eq.{report_id}"})
        await cache_manager.clear_prefix("lab_reports")
        return res[0] if res else updates

    async def get_laboratories(
        self,
        search: Optional[str] = None,
        ward_id: Optional[int] = None,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> List[dict]:
        """Discover eligible diagnostic laboratories with location and test counts"""
        from app.core.cache import cache_manager

        cache_key = f"laboratories_list_{ward_id or 'all'}"
        cached = await cache_manager.get(cache_key)
        if cached is None:
            query = {"role": "eq.lab", "order": "name.asc"}
            if ward_id is not None:
                query["ward_id"] = f"eq.{ward_id}"
            providers = await supabase_http_client.select("provider", query)
            lab_tests = await supabase_http_client.select("lab_tests")

            # Count available tests per laboratory
            counts = {}
            for lt in lab_tests:
                pid = lt.get("provider_id")
                if pid:
                    counts[pid] = counts.get(pid, 0) + 1

            result = []
            for p in providers:
                status = p.get("status")
                if status and status.lower() not in ("approved", "active", "verified"):
                    continue

                p_id = p.get("provider_id")
                lat, lon = parse_wkb_point(p.get("location"))

                lab_item = {
                    "provider_id": p_id,
                    "name": p.get("name") or "Diagnostic Laboratory",
                    "role": "lab",
                    "address": p.get("address") or "Solapur, Maharashtra",
                    "email": p.get("email"),
                    "phone": p.get("phone") or "+91 217 2740300",
                    "license": p.get("license"),
                    "status": p.get("status") or "approved",
                    "ward_id": p.get("ward_id"),
                    "latitude": lat,
                    "longitude": lon,
                    "operating_hours": "08:00 AM - 08:00 PM",
                    "tests_count": counts.get(p_id, 0),
                    "distance_km": None,
                }
                result.append(lab_item)

            await cache_manager.set(cache_key, result, ttl_seconds=180)
        else:
            result = [dict(item) for item in cached]

        # Case-insensitive text search filtering
        if search and search.strip():
            q_clean = search.strip().lower()
            result = [
                l for l in result
                if q_clean in l["name"].lower() or (l.get("address") and q_clean in l["address"].lower())
            ]

        # Calculate distances if user coordinates available
        for l in result:
            lat, lon = l.get("latitude"), l.get("longitude")
            if user_lat is not None and user_lon is not None and lat is not None and lon is not None:
                l["distance_km"] = haversine_distance(user_lat, user_lon, lat, lon)
            else:
                l["distance_km"] = None

        if user_lat is not None and user_lon is not None:
            result.sort(key=lambda x: (x["distance_km"] if x["distance_km"] is not None else 999999, x["name"]))
        else:
            result.sort(key=lambda x: x["name"])

        return result

    async def get_laboratory_by_id(
        self,
        provider_id: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> Optional[dict]:
        """Fetch complete laboratory profile and test catalogue"""
        providers = await supabase_http_client.select("provider", {"provider_id": f"eq.{provider_id}", "role": "eq.lab"})
        if not providers:
            return None
        p = providers[0]
        lat, lon = parse_wkb_point(p.get("location"))

        distance_km = None
        if user_lat is not None and user_lon is not None and lat is not None and lon is not None:
            distance_km = haversine_distance(user_lat, user_lon, lat, lon)

        catalogue = await self.get_laboratory_catalogue(provider_id=provider_id)

        return {
            "provider_id": p.get("provider_id"),
            "name": p.get("name") or "Diagnostic Laboratory",
            "role": "lab",
            "address": p.get("address") or "Solapur, Maharashtra",
            "email": p.get("email"),
            "phone": p.get("phone") or "+91 217 2740300",
            "license": p.get("license"),
            "status": p.get("status") or "approved",
            "ward_id": p.get("ward_id"),
            "latitude": lat,
            "longitude": lon,
            "operating_hours": "08:00 AM - 08:00 PM",
            "tests_count": len(catalogue),
            "distance_km": distance_km,
            "tests": catalogue,
        }

    async def get_laboratory_catalogue(
        self,
        provider_id: str,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[dict]:
        """Fetch all tests provided by a specific laboratory"""
        lab_tests = await supabase_http_client.select("lab_tests", {"provider_id": f"eq.{provider_id}"})
        if not lab_tests:
            return []

        test_types = await self.get_test_types()
        tt_map = {t.get("test_id"): t for t in test_types}

        catalogue = []
        for lt in lab_tests:
            tt_id = lt.get("test_type_id")
            tt = tt_map.get(tt_id, {})
            t_name = tt.get("test_name") or f"Diagnostic Test #{tt_id}"
            t_cat = tt.get("test_category") or "General Pathology"
            desc = tt.get("description") or ""

            if category and category.strip() and category.lower() != "all" and t_cat.lower() != category.strip().lower():
                continue

            if search and search.strip():
                q = search.strip().lower()
                if q not in t_name.lower() and q not in t_cat.lower() and q not in desc.lower():
                    continue

            meta = get_clinical_metadata(t_name, t_cat, desc)

            catalogue.append({
                "lab_test_id": lt.get("lab_test_id") or str(uuid.uuid4()),
                "provider_id": provider_id,
                "test_type_id": tt_id,
                "price": int(lt.get("price") or 0),
                "test_name": t_name,
                "test_category": t_cat,
                "description": desc,
                "sample_type": meta["sample_type"],
                "preparation": meta["preparation"],
                "turnaround_time": meta["turnaround_time"],
            })

        catalogue.sort(key=lambda x: x["test_name"])
        return catalogue

    async def search_tests(
        self,
        q: Optional[str] = None,
        category: Optional[str] = None,
        sort_by: Optional[str] = "price",
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> List[dict]:
        """Search diagnostic tests across all laboratories with price and nearby sorting"""
        import asyncio
        providers_task = supabase_http_client.select("provider", {"role": "eq.lab"})
        tests_task = supabase_http_client.select("lab_tests")
        types_task = self.get_test_types()

        providers_raw, lab_tests_raw, test_types = await asyncio.gather(
            providers_task, tests_task, types_task, return_exceptions=True
        )

        providers = providers_raw if isinstance(providers_raw, list) else []
        lab_tests = lab_tests_raw if isinstance(lab_tests_raw, list) else []
        if not isinstance(test_types, list):
            test_types = []

        prov_map = {}
        for p in providers:
            status = p.get("status")
            if status and status.lower() not in ("approved", "active", "verified"):
                continue
            lat, lon = parse_wkb_point(p.get("location"))
            p_copy = dict(p)
            p_copy["latitude"] = lat
            p_copy["longitude"] = lon
            prov_map[p.get("provider_id")] = p_copy

        tt_map = {t.get("test_id"): t for t in test_types}

        clean_q = q.strip().lower() if q and q.strip() else None
        clean_cat = category.strip().lower() if category and category.strip() and category.lower() != "all" else None

        results = []
        for lt in lab_tests:
            p_id = lt.get("provider_id")
            prov = prov_map.get(p_id)
            if not prov:
                continue

            tt_id = lt.get("test_type_id")
            tt = tt_map.get(tt_id, {})
            t_name = tt.get("test_name") or f"Diagnostic Test #{tt_id}"
            t_cat = tt.get("test_category") or "General Pathology"
            desc = tt.get("description") or ""

            # Category filter
            if clean_cat and t_cat.lower() != clean_cat:
                continue

            # Query filter (matches test name, category, description, or common clinical aliases)
            if clean_q:
                matches = False
                t_lower = t_name.lower()
                if clean_q in t_lower or clean_q in t_cat.lower() or clean_q in desc.lower():
                    matches = True
                elif clean_q == "cbc" and "complete blood" in t_lower:
                    matches = True
                elif clean_q in ("blood sugar", "sugar") and "blood sugar" in t_lower:
                    matches = True
                elif clean_q in ("lft", "liver") and "liver function" in t_lower:
                    matches = True
                elif clean_q in ("kft", "kidney") and "kidney function" in t_lower:
                    matches = True
                elif clean_q in ("thyroid", "tsh") and "thyroid" in t_lower:
                    matches = True
                elif clean_q == "lipid" and "lipid profile" in t_lower:
                    matches = True

                if not matches:
                    continue

            lat, lon = prov.get("latitude"), prov.get("longitude")
            distance_km = None
            if user_lat is not None and user_lon is not None and lat is not None and lon is not None:
                distance_km = haversine_distance(user_lat, user_lon, lat, lon)

            meta = get_clinical_metadata(t_name, t_cat, desc)
            price = int(lt.get("price") or 0)

            results.append({
                "lab_test_id": lt.get("lab_test_id") or str(uuid.uuid4()),
                "provider_id": p_id,
                "test_type_id": tt_id,
                "price": price,
                "test_name": t_name,
                "test_category": t_cat,
                "description": desc,
                "sample_type": meta["sample_type"],
                "preparation": meta["preparation"],
                "turnaround_time": meta["turnaround_time"],
                "laboratory_name": prov.get("name") or "Diagnostic Laboratory",
                "laboratory_address": prov.get("address") or "Solapur, Maharashtra",
                "laboratory_phone": prov.get("phone") or "+91 217 2740300",
                "laboratory_email": prov.get("email"),
                "laboratory_license": prov.get("license"),
                "laboratory_status": prov.get("status") or "approved",
                "latitude": lat,
                "longitude": lon,
                "distance_km": distance_km,
            })

        # Sorting logic: nearby, price_desc (high to low), or default price ascending (low to high)
        if sort_by == "nearby":
            if user_lat is not None and user_lon is not None:
                results.sort(key=lambda x: (
                    x["distance_km"] if x["distance_km"] is not None else 999999,
                    x["price"] if x["price"] > 0 else 999999,
                ))
            else:
                # If coordinates unavailable, maintain price sorting safely
                results.sort(key=lambda x: (x["price"] if x["price"] > 0 else 999999, x["test_name"]))
        elif sort_by in ("price_desc", "price_high_to_low"):
            # Price descending: highest price first, missing or 0 prices placed last
            results.sort(key=lambda x: (
                -x["price"] if x["price"] > 0 else 999999,
                x.get("distance_km") if x.get("distance_km") is not None else 999999,
            ))
        else: # Default: price ascending (missing or 0 prices placed last)
            results.sort(key=lambda x: (
                x["price"] if x["price"] > 0 else 999999,
                x.get("distance_km") if x.get("distance_km") is not None else 999999,
            ))

        return results

    async def get_test_detail(
        self,
        lab_test_id: str,
        user_lat: Optional[float] = None,
        user_lon: Optional[float] = None,
    ) -> Optional[dict]:
        """Fetch single laboratory test detail with complete provider and clinical info"""
        lab_tests = await supabase_http_client.select("lab_tests", {"lab_test_id": f"eq.{lab_test_id}"})
        if not lab_tests:
            return None
        lt = lab_tests[0]

        p_id = lt.get("provider_id")
        providers = await supabase_http_client.select("provider", {"provider_id": f"eq.{p_id}"})
        prov = providers[0] if providers else {}

        test_types = await self.get_test_types()
        tt_map = {t.get("test_id"): t for t in test_types}
        tt = tt_map.get(lt.get("test_type_id"), {})

        lat, lon = parse_wkb_point(prov.get("location"))
        distance_km = None
        if user_lat is not None and user_lon is not None and lat is not None and lon is not None:
            distance_km = haversine_distance(user_lat, user_lon, lat, lon)

        t_name = tt.get("test_name") or "Diagnostic Test"
        t_cat = tt.get("test_category") or "General Pathology"
        desc = tt.get("description") or ""
        meta = get_clinical_metadata(t_name, t_cat, desc)

        return {
            "lab_test_id": lab_test_id,
            "provider_id": p_id,
            "test_type_id": lt.get("test_type_id"),
            "price": int(lt.get("price") or 0),
            "test_name": t_name,
            "test_category": t_cat,
            "description": desc,
            "sample_type": meta["sample_type"],
            "preparation": meta["preparation"],
            "turnaround_time": meta["turnaround_time"],
            "laboratory_name": prov.get("name") or "Diagnostic Laboratory",
            "laboratory_address": prov.get("address") or "Solapur, Maharashtra",
            "laboratory_phone": prov.get("phone") or "+91 217 2740300",
            "laboratory_email": prov.get("email"),
            "laboratory_license": prov.get("license"),
            "laboratory_status": prov.get("status") or "approved",
            "latitude": lat,
            "longitude": lon,
            "distance_km": distance_km,
        }


laboratory_service = LaboratoryService()
