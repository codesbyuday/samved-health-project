from fastapi import APIRouter
from app.modules.ai.schemas import OutbreakDetectionInput, OutbreakDetectionResult
from app.modules.ai.service import ai_service

router = APIRouter(prefix="/ai", tags=["AI & Analytics"])


@router.post("/outbreak-detection", response_model=OutbreakDetectionResult)
async def detect_outbreak(payload: OutbreakDetectionInput):
    return await ai_service.process_outbreak_detection(payload)
