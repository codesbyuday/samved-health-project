from fastapi import APIRouter, Query
from typing import List, Optional, Dict, Any
from app.modules.ai.schemas import (
    OutbreakDetectionInput, OutbreakDetectionResult,
    ExplainSignalInput, ExplainSignalResult,
    CitizenAlertInput, CitizenAlertResult,
    AIStatusResponse, RunSurveillanceResponse
)
from app.modules.ai.service import ai_service

router = APIRouter(prefix="/ai", tags=["AI & Analytics"])


@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    """Check Gemini AI connection status, model configuration, and health."""
    return await ai_service.get_ai_status()


@router.post("/outbreak-detection", response_model=OutbreakDetectionResult)
async def detect_outbreak(payload: OutbreakDetectionInput):
    """Evaluate disease cases and generate Gemini AI explanation."""
    return await ai_service.process_outbreak_detection(payload)


@router.post("/explain-signal", response_model=ExplainSignalResult)
async def explain_signal(payload: ExplainSignalInput):
    """Generate 3-sentence plain language epidemiological explanation using Gemini."""
    return await ai_service.explain_signal(payload)


@router.post("/generate-citizen-alert", response_model=CitizenAlertResult)
async def generate_citizen_alert(payload: CitizenAlertInput):
    """Rewrite public health message into a calm, actionable 2-sentence citizen alert."""
    return await ai_service.generate_citizen_alert(payload)


@router.post("/run-surveillance", response_model=RunSurveillanceResponse)
async def run_surveillance():
    """Run full citywide surveillance across all wards, generate AI briefings, and update database."""
    return await ai_service.run_citywide_surveillance()


@router.get("/signals")
async def get_outbreak_signals(risk_level: Optional[str] = Query(None)):
    """Fetch current outbreak signals with AI explanations."""
    return await ai_service.get_outbreak_signals(risk_level=risk_level)

