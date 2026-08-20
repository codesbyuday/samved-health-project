from typing import List, Optional
from pydantic import BaseModel


class OutbreakDetectionInput(BaseModel):
    wardNumber: int
    wardName: str
    diseaseId: str
    diseaseName: str
    weeklyCounts: List[int]


class OutbreakDetectionResult(BaseModel):
    wardNumber: int
    wardName: str
    diseaseId: str
    diseaseName: str
    currentWeekCases: int
    previousWeekCases: int
    growthRate: float
    growthTrend: str
    riskLevel: str
    earlyOutbreakSignal: bool
    ruleTriggered: bool
    trendTriggered: bool
    anomalyTriggered: bool
    abnormalityScore: float
    explanation: str
    aiExplanation: Optional[str] = None
