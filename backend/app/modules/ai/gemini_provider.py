import os
import httpx
from typing import Dict, Any, Optional, List
from app.core.config import settings
from app.core.logging import logger

SUPPORTED_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
]


class GeminiProvider:
    def __init__(self):
        self.default_model = "gemini-3.5-flash-lite"

    def get_api_key(self) -> str:
        key = (
            getattr(settings, "GEMINI_API_KEY", "") or
            os.getenv("GEMINI_API_KEY", "") or
            ""
        ).strip()
        if key in ["your_gemini_api_key", "your_gemini_api_key_here", ""]:
            return ""
        return key

    def is_configured(self) -> bool:
        return bool(self.get_api_key())

    async def test_connection(self) -> Dict[str, Any]:
        api_key = self.get_api_key()
        if not api_key:
            return {
                "configured": False,
                "status": "unconfigured",
                "model": self.default_model,
                "supported_models": SUPPORTED_MODELS,
                "message": "GEMINI_API_KEY is not set. Please provide a Google Gemini API Key."
            }

        prompt = "Respond with 'OK' only."
        res = await self.generate_prompt(prompt)
        if res:
            return {
                "configured": True,
                "status": "connected",
                "model": self.default_model,
                "supported_models": SUPPORTED_MODELS,
                "message": "Successfully connected to Google Gemini AI Engine."
            }

        return {
            "configured": True,
            "status": "error",
            "model": self.default_model,
            "supported_models": SUPPORTED_MODELS,
            "message": "API key provided but could not reach Gemini API. Please check key validity and quotas."
        }

    async def generate_prompt(self, prompt: str, preferred_model: Optional[str] = None) -> Optional[str]:
        api_key = self.get_api_key()
        if not api_key:
            return None

        models_to_try = [preferred_model] if preferred_model else SUPPORTED_MODELS

        for candidate_model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{candidate_model}:generateContent"
            headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": api_key,
            }
            body = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.3,
                    "maxOutputTokens": 300,
                }
            }

            try:
                async with httpx.AsyncClient(timeout=6.0) as client:
                    resp = await client.post(url, headers=headers, json=body)
                    if resp.is_success:
                        data = resp.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            text = "\n".join([p.get("text", "") for p in parts]).strip()
                            if text:
                                return text
                    logger.warning(f"Gemini model {candidate_model} returned {resp.status_code}. Trying next model...")
            except Exception as e:
                logger.warning(f"Gemini API attempt timed out or failed for {candidate_model}: {e}. Trying next...")

        return None

    async def generate_outbreak_explanation(self, data: Dict[str, Any]) -> str:
        prompt = (
            f"You are helping a municipal public health team explain a ward-level disease surveillance signal.\n"
            f"Write exactly 3 short sentences in plain language.\n\n"
            f"Ward: {data.get('wardName')} ({data.get('wardNumber')})\n"
            f"Disease: {data.get('diseaseName')}\n"
            f"Current week cases: {data.get('currentWeekCases')}\n"
            f"Previous week cases: {data.get('previousWeekCases')}\n"
            f"Growth rate: {data.get('growthRate')}%\n"
            f"Risk level: {data.get('riskLevel')}\n"
            f"Detected triggers: {', '.join(data.get('triggers', [])) or 'none'}\n\n"
            f"Sentence 1: why the ward is being monitored.\n"
            f"Sentence 2: how urgent the situation is without causing panic.\n"
            f"Sentence 3: one practical SMC response step.\n"
            f"Do not mention AI, patients, personal data, or raw formulas."
        )

        res = await self.generate_prompt(prompt)
        if res:
            return res

        # Intelligent rule-based fallback if Gemini API is not yet configured
        triggers_str = ", ".join(data.get("triggers", []))
        if triggers_str:
            return (
                f"{data.get('wardName')} is under active surveillance due to {triggers_str}. "
                f"The observed {data.get('diseaseName')} increase of {data.get('growthRate')}% requires heightened municipal vigilance without public alarm. "
                f"SMC field health teams are directed to carry out targeted vector checks and local awareness measures."
            )
        return (
            f"{data.get('wardName')} is being monitored for {data.get('diseaseName')} baseline stability. "
            f"Current case levels remain manageable under routine surveillance protocol. "
            f"Standard municipal health protocols and regular sanitation checks are maintained."
        )

    async def generate_citizen_alert(self, data: Dict[str, Any]) -> str:
        prompt = (
            f"Rewrite the following public health alert for citizens in the Solapur municipal area.\n"
            f"Keep it calm, simple, and actionable in exactly 2 sentences.\n\n"
            f"Disease: {data.get('diseaseName')}\n"
            f"Ward: Ward {data.get('wardNumber')} ({data.get('wardName') or ''})\n"
            f"Draft health message: {data.get('defaultMessage')}\n\n"
            f"Mention the ward, avoid panic, and include practical prevention advice.\n"
            f"Do not mention personal data, detection algorithms, or unverified claims."
        )

        res = await self.generate_prompt(prompt)
        if res:
            return res

        # Intelligent fallback
        return (
            f"Residents of Ward {data.get('wardNumber')} are advised that increased {data.get('diseaseName')} cases have been noted locally. "
            f"Please take standard precautions, eliminate standing water, and consult your nearest municipal healthcare center if symptoms appear."
        )


gemini_provider = GeminiProvider()
