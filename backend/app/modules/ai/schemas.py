from typing import List, Optional, Dict, Any
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


class ExplainSignalInput(BaseModel):
    wardNumber: Optional[int] = None
    ward_number: Optional[int] = None
    wardName: Optional[str] = None
    ward_name: Optional[str] = None
    diseaseId: Optional[str] = None
    disease_id: Optional[str] = None
    diseaseName: Optional[str] = None
    disease_name: Optional[str] = None
    currentWeekCases: Optional[int] = None
    current_week_cases: Optional[int] = None
    previousWeekCases: Optional[int] = None
    previous_week_cases: Optional[int] = None
    growthRate: Optional[float] = None
    growth_rate: Optional[float] = None
    riskLevel: Optional[str] = None
    risk_level: Optional[str] = None
    triggers: Optional[List[str]] = None

    def get_ward_number(self) -> int:
        return self.wardNumber if self.wardNumber is not None else (self.ward_number or 0)

    def get_ward_name(self) -> str:
        return self.wardName or self.ward_name or f"Ward {self.get_ward_number()}"

    def get_disease_id(self) -> str:
        return self.diseaseId or self.disease_id or ""

    def get_disease_name(self) -> str:
        return self.diseaseName or self.disease_name or self.get_disease_id() or "Disease"

    def get_current_week_cases(self) -> int:
        return self.currentWeekCases if self.currentWeekCases is not None else (self.current_week_cases or 0)

    def get_previous_week_cases(self) -> int:
        return self.previousWeekCases if self.previousWeekCases is not None else (self.previous_week_cases or 0)

    def get_growth_rate(self) -> float:
        return self.growthRate if self.growthRate is not None else (self.growth_rate or 0.0)

    def get_risk_level(self) -> str:
        return self.riskLevel or self.risk_level or "medium"


class ExplainSignalResult(BaseModel):
    wardNumber: int
    diseaseName: str
    aiExplanation: str
    explanation: Optional[str] = None
    source: str = "gemini"


class CitizenAlertInput(BaseModel):
    wardNumber: Optional[int] = None
    ward_number: Optional[int] = None
    wardName: Optional[str] = None
    ward_name: Optional[str] = None
    diseaseName: Optional[str] = None
    disease_name: Optional[str] = None
    defaultMessage: Optional[str] = None
    default_message: Optional[str] = None

    def get_ward_number(self) -> int:
        return self.wardNumber if self.wardNumber is not None else (self.ward_number or 0)

    def get_ward_name(self) -> str:
        return self.wardName or self.ward_name or f"Ward {self.get_ward_number()}"

    def get_disease_name(self) -> str:
        return self.diseaseName or self.disease_name or "Disease"

    def get_default_message(self) -> str:
        return self.defaultMessage or self.default_message or ""


class CitizenAlertResult(BaseModel):
    wardNumber: int
    diseaseName: str
    citizenMessage: str
    alert_message: Optional[str] = None
    source: str = "gemini"


class AIStatusResponse(BaseModel):
    configured: bool
    status: str
    model: str
    supported_models: List[str]
    message: str


class OutbreakSignalItem(BaseModel):
    ward_number: int
    ward_name: Optional[str] = None
    disease_id: str
    disease_name: str
    current_week_cases: int
    previous_week_cases: int
    growth_rate: float
    risk_level: str
    outbreak_score: float
    early_outbreak_signal: bool
    explanation: str
    ai_summary: Optional[str] = None


class RunSurveillanceResponse(BaseModel):
    total_signals_evaluated: int
    outbreak_signals_detected: int
    high_risk_count: int
    signals: List[OutbreakSignalItem]
    ai_enabled: bool
