from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import date


class WardSchema(BaseModel):
    ward_id: int
    ward_name: Optional[str] = None
    zone: Optional[str] = None
    population: Optional[int] = None
    population_density: Optional[float] = None
    health_index: Optional[float] = None
    risk_level: Optional[str] = None
    zone_risk_score: Optional[float] = None
    total_doctors: Optional[int] = None
    total_beds: Optional[int] = None
    active_cases: Optional[int] = None
    total_deaths: Optional[int] = None


class ComplaintSchema(BaseModel):
    complaint_id: str
    citizen_id: Optional[str] = None
    hospital_id: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    remarks_by_officers: Optional[str] = None
    created_at: Optional[str] = None
    resolved_at: Optional[str] = None


class AlertCreateSchema(BaseModel):
    alert_type: str
    ward_number: Optional[int] = None
    severity: str
    message: str


class AlertSchema(AlertCreateSchema):
    alert_id: str
    created_at: Optional[str] = None


class VaccinationCampaignCreateSchema(BaseModel):
    title: str
    target_ward: Optional[int] = None
    vaccine_name: str
    status: Optional[str] = "Planned"
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    target_count: Optional[int] = 0


class VaccinationCampaignSchema(VaccinationCampaignCreateSchema):
    campaign_id: str
    created_at: Optional[str] = None


class ResourceAllocationTaskCreateSchema(BaseModel):
    resource_type: str
    quantity: int
    hospital_id: Optional[str] = None
    ward_number: Optional[int] = None
    assigned_officer_id: Optional[str] = None
    assigned_officer_name: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "Pending"


class ResourceAllocationTaskSchema(ResourceAllocationTaskCreateSchema):
    task_id: str
    created_at: Optional[str] = None
