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

        query = {"order": "uploaded_at.desc", "limit": "50"}
        if citizen_id:
            query["citizen_id"] = f"eq.{citizen_id}"
        if hospital_id:
            query["hospital_id"] = f"eq.{hospital_id}"

        reports = await supabase_http_client.select("diagnostic_reports", query)
        await cache_manager.set(cache_key, reports, ttl_seconds=120)
        return reports

    async def create_report(self, payload: DiagnosticReportCreateSchema) -> dict:
        from app.core.cache import cache_manager
        data = payload.model_dump(exclude_unset=True, mode="json")
        data["report_id"] = f"RPT-{uuid.uuid4().hex[:8].upper()}"
        res = await supabase_http_client.insert("diagnostic_reports", data)
        await cache_manager.clear_prefix("lab_reports")
        return res[0] if res else data

    async def get_report_file_url(self, report_id: str) -> Optional[str]:
        rows = await supabase_http_client.select("diagnostic_reports", {"report_id": f"eq.{report_id}"})
        if not rows:
            return None
        return rows[0].get("report_file_url")


laboratory_service = LaboratoryService()
