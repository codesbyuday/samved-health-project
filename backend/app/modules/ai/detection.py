import math
from typing import List, Dict, Any


def round_val(value: float, digits: int = 1) -> float:
    factor = 10 ** digits
    return round(value * factor) / factor


def get_growth_rate(current_cases: int, previous_cases: int) -> float:
    if previous_cases <= 0:
        return 100.0 if current_cases > 0 else 0.0
    return round_val(((current_cases - previous_cases) / previous_cases) * 100.0)


def average(values: List[int]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def standard_deviation(values: List[int]) -> float:
    if not values:
        return 0.0
    avg = average(values)
    variance = sum((x - avg) ** 2 for x in values) / len(values)
    return math.sqrt(variance)


def evaluate_outbreak_signals(
    ward_number: int,
    ward_name: str,
    disease_id: str,
    disease_name: str,
    weekly_counts: List[int]
) -> Dict[str, Any]:
    current_cases = weekly_counts[-1] if weekly_counts else 0
    previous_cases = weekly_counts[-2] if len(weekly_counts) >= 2 else 0
    growth_rate = get_growth_rate(current_cases, previous_cases)

    growth_trend = "Stable"
    if growth_rate > 5:
        growth_trend = "Increase"
    elif growth_rate < -5:
        growth_trend = "Decrease"

    baseline = weekly_counts[:-1] if len(weekly_counts) > 1 else [0]
    recent_window = weekly_counts[-4:] if len(weekly_counts) >= 4 else weekly_counts
    mean_val = average(baseline)
    dev_val = standard_deviation(baseline)

    rule_triggered = (
        (current_cases >= 12 and growth_rate >= 50) or
        (current_cases >= 8 and previous_cases == 0) or
        (current_cases >= 18 and growth_rate >= 25)
    )

    medium_rule = (
        not rule_triggered and (
            (current_cases >= 8 and growth_rate >= 20) or
            (current_cases >= 6 and growth_rate >= 35)
        )
    )

    trend_triggered = (
        len(recent_window) >= 4 and
        recent_window[0] < recent_window[1] < recent_window[2] < recent_window[3] and
        recent_window[3] >= 6
    )

    anomaly_threshold = mean_val + max(2 * dev_val, 3.0)
    anomaly_triggered = (
        len(baseline) >= 3 and
        current_cases >= 6 and
        current_cases > anomaly_threshold
    )

    if rule_triggered:
        risk_level = "HIGH"
    elif medium_rule or trend_triggered or anomaly_triggered:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    early_outbreak_signal = rule_triggered or trend_triggered or anomaly_triggered
    abnormality_score = round_val(
        (45.0 if rule_triggered else 0.0) +
        (20.0 if medium_rule else 0.0) +
        (20.0 if trend_triggered else 0.0) +
        (25.0 if anomaly_triggered else 0.0) +
        min(10.0, float(current_cases)),
        1
    )

    triggers = []
    if rule_triggered:
        triggers.append("high case load and rapid weekly growth")
    if trend_triggered:
        triggers.append("continuous increase over recent weeks")
    if anomaly_triggered:
        triggers.append("statistical spike above baseline")

    explanation = (
        f"Flagged due to {', '.join(triggers)}."
        if triggers else
        "Current ward-level counts remain within the normal recent range."
    )

    return {
        "wardNumber": ward_number,
        "wardName": ward_name,
        "diseaseId": disease_id,
        "diseaseName": disease_name,
        "currentWeekCases": current_cases,
        "previousWeekCases": previous_cases,
        "growthRate": growth_rate,
        "growthTrend": growth_trend,
        "riskLevel": risk_level,
        "earlyOutbreakSignal": early_outbreak_signal,
        "ruleTriggered": rule_triggered,
        "trendTriggered": trend_triggered,
        "anomalyTriggered": anomaly_triggered,
        "abnormalityScore": abnormality_score,
        "triggers": triggers,
        "explanation": explanation
    }
