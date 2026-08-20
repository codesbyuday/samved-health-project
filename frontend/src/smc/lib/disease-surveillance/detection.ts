import { endOfWeek, format, startOfWeek, subWeeks } from "date-fns";

export type DetectionRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type SurveillanceDetectionInput = {
  wardNumber: number;
  wardName: string;
  diseaseId: string;
  diseaseName: string;
  weeklyCounts: number[];
};

export type SurveillanceDetectionResult = {
  wardNumber: number;
  wardName: string;
  diseaseId: string;
  diseaseName: string;
  currentWeekCases: number;
  previousWeekCases: number;
  growthRate: number;
  growthTrend: "Increase" | "Decrease" | "Stable";
  riskLevel: DetectionRiskLevel;
  earlyOutbreakSignal: boolean;
  ruleTriggered: boolean;
  trendTriggered: boolean;
  anomalyTriggered: boolean;
  abnormalityScore: number;
  weeklyHistory: { label: string; cases: number }[];
  alertMessage: string;
  citizenPreview: string;
  explanation: string;
};

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function getGrowthRate(currentWeekCases: number, previousWeekCases: number) {
  if (previousWeekCases <= 0) {
    return currentWeekCases > 0 ? 100 : 0;
  }

  return round(((currentWeekCases - previousWeekCases) / previousWeekCases) * 100);
}

function getGrowthTrend(growthRate: number): SurveillanceDetectionResult["growthTrend"] {
  if (growthRate > 5) {
    return "Increase";
  }

  if (growthRate < -5) {
    return "Decrease";
  }

  return "Stable";
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const mean = average(values);
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;

  return Math.sqrt(variance);
}

function buildAlertMessage(diseaseName: string, wardNumber: number) {
  return `Early warning: Possible outbreak of ${diseaseName} in Ward ${wardNumber}`;
}

function buildCitizenPreview(diseaseName: string, wardNumber: number) {
  const disease = diseaseName.toLowerCase();

  if (disease.includes("dengue")) {
    return `Dengue cases are increasing in your area (Ward ${wardNumber}). Please remove stagnant water, use mosquito protection, and seek medical advice if fever symptoms appear.`;
  }

  if (disease.includes("flu") || disease.includes("influenza")) {
    return `Flu cases are increasing in your area (Ward ${wardNumber}). Please practice hand hygiene, wear a mask if unwell, and visit a clinic if symptoms worsen.`;
  }

  if (disease.includes("diarr")) {
    return `Diarrheal illness is increasing in your area (Ward ${wardNumber}). Please drink safe water, maintain food hygiene, and seek care if dehydration symptoms appear.`;
  }

  return `${diseaseName} cases are increasing in your area (Ward ${wardNumber}). Please follow local health precautions, maintain hygiene, and contact a nearby health facility if symptoms appear.`;
}

export function buildWeeklyHistory(weeklyCounts: number[]) {
  const historyStart = startOfWeek(subWeeks(new Date(), weeklyCounts.length - 1), {
    weekStartsOn: 1,
  });

  return weeklyCounts.map((count, index) => ({
    label: format(endOfWeek(subWeeks(historyStart, -index), { weekStartsOn: 1 }), "dd MMM"),
    cases: count,
  }));
}

export function evaluateOutbreakSignals(
  input: SurveillanceDetectionInput,
): SurveillanceDetectionResult {
  const currentWeekCases = input.weeklyCounts.at(-1) ?? 0;
  const previousWeekCases = input.weeklyCounts.at(-2) ?? 0;
  const growthRate = getGrowthRate(currentWeekCases, previousWeekCases);
  const growthTrend = getGrowthTrend(growthRate);

  const baseline = input.weeklyCounts.slice(0, -1);
  const recentWindow = input.weeklyCounts.slice(-4);
  const mean = average(baseline);
  const deviation = standardDeviation(baseline);

  const ruleTriggered =
    (currentWeekCases >= 12 && growthRate >= 50) ||
    (currentWeekCases >= 8 && previousWeekCases === 0) ||
    (currentWeekCases >= 18 && growthRate >= 25);

  const mediumRule =
    !ruleTriggered &&
    ((currentWeekCases >= 8 && growthRate >= 20) ||
      (currentWeekCases >= 6 && growthRate >= 35));

  const trendTriggered =
    recentWindow.length >= 4 &&
    recentWindow[0] < recentWindow[1] &&
    recentWindow[1] < recentWindow[2] &&
    recentWindow[2] < recentWindow[3] &&
    recentWindow[3] >= 6;

  const anomalyThreshold = mean + Math.max(2 * deviation, 3);
  const anomalyTriggered =
    baseline.length >= 3 &&
    currentWeekCases >= 6 &&
    currentWeekCases > anomalyThreshold;

  const riskLevel: DetectionRiskLevel = ruleTriggered
    ? "HIGH"
    : mediumRule || trendTriggered || anomalyTriggered
      ? "MEDIUM"
      : "LOW";

  const earlyOutbreakSignal = ruleTriggered || trendTriggered || anomalyTriggered;
  const abnormalityScore = round(
    (ruleTriggered ? 45 : 0) +
      (mediumRule ? 20 : 0) +
      (trendTriggered ? 20 : 0) +
      (anomalyTriggered ? 25 : 0) +
      Math.min(10, currentWeekCases),
    1,
  );

  const triggers = [
    ruleTriggered ? "high case load and rapid weekly growth" : null,
    trendTriggered ? "continuous increase over recent weeks" : null,
    anomalyTriggered ? "statistical spike above baseline" : null,
  ].filter(Boolean);

  const explanation =
    triggers.length > 0
      ? `Flagged due to ${triggers.join(", ")}.`
      : "Current ward-level counts remain within the normal recent range.";

  return {
    wardNumber: input.wardNumber,
    wardName: input.wardName,
    diseaseId: input.diseaseId,
    diseaseName: input.diseaseName,
    currentWeekCases,
    previousWeekCases,
    growthRate,
    growthTrend,
    riskLevel,
    earlyOutbreakSignal,
    ruleTriggered,
    trendTriggered,
    anomalyTriggered,
    abnormalityScore,
    weeklyHistory: buildWeeklyHistory(input.weeklyCounts),
    alertMessage: buildAlertMessage(input.diseaseName, input.wardNumber),
    citizenPreview: buildCitizenPreview(input.diseaseName, input.wardNumber),
    explanation,
  };
}

