from typing import Dict, Any
from app.modules.ai.detection import evaluate_outbreak_signals
from app.modules.ai.gemini_provider import gemini_provider
from app.modules.ai.schemas import OutbreakDetectionInput, OutbreakDetectionResult


class AIService:
    async def process_outbreak_detection(self, input_data: OutbreakDetectionInput) -> OutbreakDetectionResult:
        eval_res = evaluate_outbreak_signals(
            ward_number=input_data.wardNumber,
            ward_name=input_data.wardName,
            disease_id=input_data.diseaseId,
            disease_name=input_data.diseaseName,
            weekly_counts=input_data.weeklyCounts
        )

        ai_exp = await gemini_provider.generate_outbreak_explanation(eval_res)
        eval_res["aiExplanation"] = ai_exp
        return OutbreakDetectionResult(**eval_res)


ai_service = AIService()
