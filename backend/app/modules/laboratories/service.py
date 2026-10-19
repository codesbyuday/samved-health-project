import uuid
from typing import List, Optional
from app.database.connection import supabase_http_client
from app.modules.laboratories.schemas import DiagnosticReportCreateSchema


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


laboratory_service = LaboratoryService()
