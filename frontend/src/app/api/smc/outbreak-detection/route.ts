import { endOfDay, format, startOfWeek, subWeeks } from "date-fns";
import { NextResponse } from "next/server";

import { generateGeminiOutbreakExplanation } from "@/smc/lib/ai/outbreak";
import { getCurrentUserContext } from "@/smc/lib/auth/session";
import { evaluateOutbreakSignals } from "@/smc/lib/disease-surveillance/detection";
import { createClient } from "@/smc/lib/supabase/server";

type DiseaseCaseWithJoins = {
  disease_id: string | null;
  report_date: string | null;
  severity: string | null;
  status: string | null;
  diseases: { disease_name?: string | null } | null;
  hospitals: { ward_id?: number | null } | null;
};

export async function POST(request: Request) {
  const cronSecret = request.headers.get("x-cron-secret");
  const user = await getCurrentUserContext();

  if (cronSecret !== process.env.OUTBREAK_CRON_SECRET && !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const weeklyBuckets = Array.from({ length: 6 }, (_, index) =>
    startOfWeek(subWeeks(new Date(), 5 - index), { weekStartsOn: 1 }),
  );
  const now = endOfDay(new Date());

  const [{ data: cases }, { data: wards }] = await Promise.all([
    supabase
      .from("disease_cases")
      .select("disease_id, report_date, severity, status, diseases(disease_name), hospitals!inner(ward_id)")
      .gte("report_date", format(weeklyBuckets[0], "yyyy-MM-dd"))
      .lte("report_date", format(now, "yyyy-MM-dd")),
    supabase.from("wards").select("ward_id, ward_name"),
  ]);

  const wardNames = new Map(
    (wards ?? []).map((row) => [row.ward_id, row.ward_name ?? `Ward ${row.ward_id}`]),
  );

  const grouped = new Map<
    string,
    {
      wardNumber: number;
      wardName: string;
      diseaseId: string;
      diseaseName: string;
      weeklyCounts: number[];
      activeCases: number;
      severeCases: number;
    }
  >();

  for (const row of (cases ?? []) as DiseaseCaseWithJoins[]) {
    const wardNumber = row.hospitals?.ward_id;
    const diseaseId = row.disease_id;
    const reportDate = new Date(row.report_date ?? 0);

    if (!wardNumber || !diseaseId || Number.isNaN(reportDate.getTime())) {
      continue;
    }

    const key = `${wardNumber}:${diseaseId}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        wardNumber,
        wardName: wardNames.get(wardNumber) ?? `Ward ${wardNumber}`,
        diseaseId,
        diseaseName: row.diseases?.disease_name ?? diseaseId,
        weeklyCounts: Array.from({ length: weeklyBuckets.length }, () => 0),
        activeCases: 0,
        severeCases: 0,
      });
    }

    const current = grouped.get(key)!;
    const weekIndex = weeklyBuckets.findIndex((bucketStart, index) => {
      const nextBucket = weeklyBuckets[index + 1];
      return reportDate >= bucketStart && (!nextBucket || reportDate < nextBucket);
    });

    if (weekIndex >= 0) {
      current.weeklyCounts[weekIndex] += 1;
    }

    if (String(row.status ?? "").toLowerCase().includes("active")) {
      current.activeCases += 1;
    }

    if (["severe", "critical"].some((token) => String(row.severity ?? "").toLowerCase().includes(token))) {
      current.severeCases += 1;
    }
  }

  const rows = [];
  for (const signal of grouped.values()) {
    const evaluated = evaluateOutbreakSignals(signal);
    const triggers = [
      evaluated.ruleTriggered ? "rule-based high-growth detection" : null,
      evaluated.trendTriggered ? "continuous rise over time" : null,
      evaluated.anomalyTriggered ? "abnormal statistical spike" : null,
    ].filter(Boolean) as string[];

    const aiSummary =
      evaluated.earlyOutbreakSignal || evaluated.riskLevel !== "LOW"
        ? await generateGeminiOutbreakExplanation({
            wardName: evaluated.wardName,
            wardNumber: evaluated.wardNumber,
            diseaseName: evaluated.diseaseName,
            currentWeekCases: evaluated.currentWeekCases,
            previousWeekCases: evaluated.previousWeekCases,
            growthRate: evaluated.growthRate,
            riskLevel: evaluated.riskLevel,
            triggers,
          })
        : null;

    rows.push({
      ward_number: signal.wardNumber,
      disease_id: signal.diseaseId,
      disease_name: signal.diseaseName,
      current_week_cases: evaluated.currentWeekCases,
      previous_week_cases: evaluated.previousWeekCases,
      active_cases: signal.activeCases,
      severe_cases: signal.severeCases,
      positivity_rate: 0,
      health_index: 0,
      outbreak_score: evaluated.abnormalityScore,
      risk_level: evaluated.riskLevel.toLowerCase(),
      ai_summary: aiSummary,
      updated_at: new Date().toISOString(),
    });
  }

  const { error } = await supabase.from("outbreak_signals").upsert(rows, {
    onConflict: "ward_number,disease_id",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, count: rows.length });
}

