from fastapi import APIRouter, Query, status
from typing import List, Optional
from app.modules.smc.schemas import (
    WardSchema, ComplaintSchema, AlertSchema, AlertCreateSchema,
    VaccinationCampaignSchema, VaccinationCampaignCreateSchema,
    ResourceAllocationTaskSchema, ResourceAllocationTaskCreateSchema
)
from app.modules.smc.service import smc_service

router = APIRouter(prefix="/smc", tags=["SMC Portal"])


@router.get("/wards", response_model=List[WardSchema])
async def get_wards():
    return await smc_service.get_wards()


@router.get("/analytics")
async def get_smc_analytics():
    return await smc_service.get_analytics_summary()


@router.get("/complaints", response_model=List[ComplaintSchema])
async def get_complaints(status_filter: Optional[str] = Query(None, alias="status")):
    return await smc_service.get_complaints(status_filter=status_filter)


@router.patch("/complaints/{complaint_id}/resolve")
async def resolve_complaint(complaint_id: str, remarks: Optional[str] = Query(None)):
    return await smc_service.resolve_complaint(complaint_id, remarks=remarks)


@router.get("/campaigns", response_model=List[VaccinationCampaignSchema])
async def get_campaigns():
    return await smc_service.get_campaigns()


@router.post("/campaigns", response_model=VaccinationCampaignSchema, status_code=status.HTTP_201_CREATED)
async def create_campaign(payload: VaccinationCampaignCreateSchema):
    return await smc_service.create_campaign(payload)


@router.get("/alerts", response_model=List[AlertSchema])
async def get_alerts():
    return await smc_service.get_alerts()


@router.post("/alerts", response_model=AlertSchema, status_code=status.HTTP_201_CREATED)
async def create_alert(payload: AlertCreateSchema):
    return await smc_service.create_alert(payload)


@router.get("/resource-tasks", response_model=List[ResourceAllocationTaskSchema])
async def get_resource_tasks():
    return await smc_service.get_resource_tasks()


@router.post("/resource-tasks", response_model=ResourceAllocationTaskSchema, status_code=status.HTTP_201_CREATED)
async def create_resource_task(payload: ResourceAllocationTaskCreateSchema):
    return await smc_service.create_resource_task(payload)


@router.patch("/resource-tasks/{task_id}")
async def update_task_status(task_id: str, new_status: str = Query(..., alias="status")):
    return await smc_service.update_resource_task_status(task_id, new_status)
