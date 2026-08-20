import httpx
from typing import Dict, Any, Optional
from app.core.config import settings
from app.core.logging import logger


class GeminiProvider:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = "gemini-2.0-flash"

    async def generate_prompt(self, prompt: str) -> Optional[str]:
        if not self.api_key or self.api_key == "your_gemini_api_key":
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"
        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": self.api_key
        }
        body = {"contents": [{"parts": [{"text": prompt}]}]}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(url, headers=headers, json=body)
                if resp.is_success:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        return "\n".join([p.get("text", "") for p in parts]).strip()
                else:
                    logger.warning(f"Gemini API response error [{resp.status_code}]: {resp.text}")
        except Exception as e:
            logger.error(f"Gemini API exception: {e}")

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
        return res or data.get("explanation", "Ward is monitored due to recent case trends.")


gemini_provider = GeminiProvider()
