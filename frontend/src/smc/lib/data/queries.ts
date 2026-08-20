import { endOfDay, format, startOfWeek, subWeeks } from "date-fns";
import { evaluateOutbreakSignals } from "@/smc/lib/disease-surveillance/detection";
import { createClient } from "@/smc/lib/supabase/server";
import type {
  CampaignRow,
  ComplaintRow,
  DiseaseSurveillanceRow,
  HospitalOverviewRow,
  NotificationRow,
  OutbreakAlertRow,
  OutbreakSignalRow,
  ResourceAllocationTaskRow,
  TrendPoint,
  WardHealthRow,
} from "@/smc/lib/types/schema";

type SearchParams = Record<string, string | string[] | undefined>;
type IndicatorSnapshot = {
  total_doctors?: number | null;
  total_beds?: number | null;
  confirmed_cases?: number | null;
  active_cases?: number | null;
  deaths?: number | null;
};
type HealthIndexSnapshot = {
  health_index?: number | null;
  risk_level?: string | null;
};
type DiseaseSurveillanceJoinedRow = {
  disease_id: string | null;
  report_date: string | null;
  diseases: { disease_name?: string | null } | null;
  hospitals: { ward_id?: number | null } | null;
};

function getPage(searchParams: SearchParams) {
  const raw = Array.isArray(searchParams.page)
    ? searchParams.page[0]
    : searchParams.page;
  return Math.max(1, Number(raw ?? 1) || 1);
}

function getPageSize(searchParams: SearchParams, fallback = 10) {
  const raw = Array.isArray(searchParams.pageSize)
    ? searchParams.pageSize[0]
    : searchParams.pageSize;
  return Math.min(50, Math.max(5, Number(raw ?? fallback) || fallback));
}

const cacheMap = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5000; // 5s cache for fast navigation

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = cacheMap.get(key);
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  const result = await fetcher();
  cacheMap.set(key, { data: result, timestamp: now });
  return result;
}

async function getHospitalsBase() {
  const supabase = await createClient();
  const { data: hospitals } = await supabase
    .from("hospitals")
    .select("hospital_id, name, type, ward_id, contact_number, verified_by_smc");

  return hospitals ?? [];
}

async function getWardsLookup() {
  const supabase = await createClient();
  const { data } = await supabase.from("wards").select("ward_id, ward_name, population");
  return new Map((data ?? []).map((ward) => [ward.ward_id, ward]));
}

async function getLatestHealthIndicators() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("health_indicator_data")
    .select("*")
    .order("recorded_at", { ascending: false });

  const latest = new Map<number, IndicatorSnapshot>();
  (data ?? []).forEach((row) => {
    if (!latest.has(row.ward_number)) {
      latest.set(row.ward_number, row);
    }
  });

  return latest;
}

async function getLatestHealthIndexResults() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("health_index_results")
    .select("*")
    .order("calculated_at", { ascending: false });

  const latest = new Map<number, HealthIndexSnapshot>();
  (data ?? []).forEach((row) => {
    if (!latest.has(row.ward_number)) {
      latest.set(row.ward_number, row);
    }
  });

  return latest;
}

export async function getDashboardData() {
  return cachedFetch("dashboard_data_v4", async () => {
    const supabase = await createClient();
    const [
      hospitals,
      bedsResult,
      diseaseCasesResult,
      healthIndicators,
      healthIndexResults,
      medicineStockResult,
      alertsResult,
    ] = await Promise.all([
      getHospitalsBase(),
      supabase.from("beds").select("hospital_id, bed_status, bed_type"),
      supabase
        .from("disease_cases")
        .select("report_date, hospital_id, status, severity")
        .order("report_date", { ascending: true }),
      getLatestHealthIndicators(),
      getLatestHealthIndexResults(),
      supabase.from("hospital_medicine_stock").select("hospital_id, quantity, threshold"),
      supabase.from("alerts").select("alert_id, severity, created_at, message"),
    ]);

    const beds = bedsResult.data ?? [];
    const diseaseCases = diseaseCasesResult.data ?? [];
    const stock = medicineStockResult.data ?? [];
    const alerts = alertsResult.data ?? [];

    const occupiedBeds = beds.filter((bed) =>
      String(bed.bed_status ?? "").toLowerCase().includes("occupied"),
    ).length;
    const activeCases = diseaseCases.filter((row) =>
      String(row.status ?? "").toLowerCase().includes("active"),
    ).length;
    const lowMedicineStock = stock.filter(
      (item) => (item.quantity ?? 0) <= (item.threshold ?? 0),
    ).length;
    const criticalAlerts = alerts.filter((item) =>
      String(item.severity ?? "").toLowerCase().includes("critical"),
    ).length;

    const diseaseTrendMap = new Map<string, number>();
    diseaseCases.forEach((row) => {
      const label = row.report_date
        ? format(new Date(row.report_date), "dd MMM")
        : "Unknown";
      diseaseTrendMap.set(label, (diseaseTrendMap.get(label) ?? 0) + 1);
    });

    const hospitalLoadMap = new Map<string, { total: number; occupied: number }>();
    beds.forEach((bed) => {
      const current = hospitalLoadMap.get(bed.hospital_id) ?? {
        total: 0,
        occupied: 0,
      };
      current.total += 1;
      if (String(bed.bed_status ?? "").toLowerCase().includes("occupied")) {
        current.occupied += 1;
      }
      hospitalLoadMap.set(bed.hospital_id, current);
    });

    const hospitalLoadDistribution: TrendPoint[] = hospitals
      .slice(0, 8)
      .map((hospital) => {
        const load = hospitalLoadMap.get(hospital.hospital_id) ?? { total: 0, occupied: 0 };
        return {
          label: hospital.name ?? hospital.hospital_id,
          value: load.occupied,
        };
      });

    const wardHealthComparison: TrendPoint[] = Array.from(healthIndexResults.entries())
      .map(([wardNumber, row]) => ({
        label: `Ward ${wardNumber}`,
        value: Number(row.health_index ?? 0),
      }))
      .sort((a, b) => b.value - a.value);

    return {
      stats: [
        {
          label: "Total Hospitals",
          value: hospitals.length,
          helper: "Registered healthcare institutions across SMC coverage.",
        },
        {
          label: "Active Disease Cases",
          value: activeCases || diseaseCases.length,
          helper: "Live surveillance count based on the disease_cases table.",
        },
        {
          label: "Medicine Availability Alerts",
          value: lowMedicineStock,
          helper: "Hospital stock records at or below threshold.",
        },
        {
          label: "Emergency Alerts",
          value: criticalAlerts || alerts.length,
          helper: "Alerts issued through the command system.",
        },
        {
          label: "Occupied Hospital Beds",
          value: occupiedBeds,
          helper: `${beds.length} total beds currently tracked in the network.`,
        },
        {
          label: "Ward Health Records",
          value: healthIndicators.size,
          helper: "Wards with latest health indicator snapshots available.",
        },
      ],
      diseaseTrend: Array.from(diseaseTrendMap.entries()).map(([label, value]) => ({
        label,
        value,
      })),
      wardHealthComparison,
      hospitalLoadDistribution,
      recentAlerts: alerts
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
        )
        .slice(0, 5),
    };
  });
}

export async function getWardHealthRows(): Promise<WardHealthRow[]> {
  return cachedFetch("ward_health_rows_v4", async () => {
    const [wardsMap, indicators, indexResults] = await Promise.all([
      getWardsLookup(),
      getLatestHealthIndicators(),
      getLatestHealthIndexResults(),
    ]);

    return Array.from(wardsMap.values())
      .map((ward) => {
        const indicator = indicators.get(ward.ward_id);
        const indexResult = indexResults.get(ward.ward_id);
        return {
          wardId: ward.ward_id,
          wardName: ward.ward_name ?? `Ward ${ward.ward_id}`,
          population: ward.population ?? 0,
          doctors: indicator?.total_doctors ?? 0,
          beds: indicator?.total_beds ?? 0,
          cases: indicator?.confirmed_cases ?? indicator?.active_cases ?? 0,
          deaths: indicator?.deaths ?? 0,
          healthIndex: Number(indexResult?.health_index ?? 0),
          riskLevel: indexResult?.risk_level ?? "healthy",
        };
      })
      .sort((a, b) => b.healthIndex - a.healthIndex);
  });
}

export async function getDiseaseSurveillanceData(searchParams: SearchParams) {
  const supabase = await createClient();
  const disease = Array.isArray(searchParams.disease)
    ? searchParams.disease[0]
    : searchParams.disease;
  const ward = Array.isArray(searchParams.ward) ? searchParams.ward[0] : searchParams.ward;
  const from = Array.isArray(searchParams.from) ? searchParams.from[0] : searchParams.from;
  const to = Array.isArray(searchParams.to) ? searchParams.to[0] : searchParams.to;
  const page = getPage(searchParams);
  const pageSize = getPageSize(searchParams);
  const wardsLookup = await getWardsLookup();
  const diseaseFilter = String(disease ?? "").trim().toLowerCase();
  const wardFilterRaw = String(ward ?? "").trim().toLowerCase();
  const wardFilterDigits = wardFilterRaw.replace(/\D+/g, "");
  const wardFilterText = wardFilterRaw.replace(/\s+/g, " ");

  const weeklyBuckets = Array.from({ length: 6 }, (_, index) =>
    startOfWeek(subWeeks(new Date(), 5 - index), { weekStartsOn: 1 }),
  );
  const earliestDate = from ?? format(weeklyBuckets[0], "yyyy-MM-dd");
  const latestDate = to ?? format(endOfDay(new Date()), "yyyy-MM-dd");

  const casesQuery = supabase
    .from("disease_cases")
    .select("disease_id, report_date, diseases(disease_name), hospitals!inner(ward_id)")
    .gte("report_date", earliestDate)
    .lte("report_date", latestDate);

  const { data: cases } = await casesQuery;
  const grouped = new Map<
    string,
    {
      wardNumber: number;
      wardName: string;
      diseaseId: string;
      diseaseName: string;
      weeklyCounts: number[];
    }
  >();
  const citywideTrendMap = new Map<string, number>();

  for (const row of (cases ?? []) as DiseaseSurveillanceJoinedRow[]) {
    const wardNumber = row.hospitals?.ward_id;
    const diseaseId = row.disease_id;
    const reportDate = new Date(row.report_date ?? 0);

    if (!wardNumber || !diseaseId || Number.isNaN(reportDate.getTime())) {
      continue;
    }

    if (wardFilterRaw) {
      const wardNumberText = String(wardNumber);
      const wardName =
        wardsLookup.get(Number(wardNumber))?.ward_name?.toLowerCase().trim() ?? "";
      const wardNameCompact = wardName.replace(/\s+/g, " ");
      const wardNumberDigits = wardNumberText.replace(/\D+/g, "");

      const matchesDigits = wardFilterDigits
        ? wardNumberDigits === wardFilterDigits
        : false;
      const matchesWardText =
        wardNumberText.toLowerCase() === wardFilterText ||
        `ward ${wardNumberText}` === wardFilterText ||
        wardNameCompact.includes(wardFilterText);

      if (!matchesDigits && !matchesWardText) {
        continue;
      }
    }

    const key = `${wardNumber}:${diseaseId}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        wardNumber,
        wardName: wardsLookup.get(wardNumber)?.ward_name ?? `Ward ${wardNumber}`,
        diseaseId,
        diseaseName: row.diseases?.disease_name ?? diseaseId,
        weeklyCounts: Array.from({ length: weeklyBuckets.length }, () => 0),
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

    const trendLabel = format(reportDate, "dd MMM");
    citywideTrendMap.set(trendLabel, (citywideTrendMap.get(trendLabel) ?? 0) + 1);
  }

  let surveillanceRows = Array.from(grouped.values()).map((entry) =>
    evaluateOutbreakSignals(entry),
  );

  if (diseaseFilter && diseaseFilter !== "all") {
    surveillanceRows = surveillanceRows.filter(
      (row) =>
        row.diseaseId.toLowerCase().includes(diseaseFilter) ||
        row.diseaseName.toLowerCase().includes(diseaseFilter),
    );
  }

  const pagedRows = surveillanceRows.slice((page - 1) * pageSize, page * pageSize);
  const { data: sentNotifications } = await supabase
    .from("notifications")
    .select("target_ward_number, related_entity, created_at")
    .like("related_entity", "disease-outbreak:%")
    .order("created_at", { ascending: false })
    .limit(100);

  const sentMap = new Map<string, string>();
  (sentNotifications ?? []).forEach((notification) => {
    if (notification.related_entity && !sentMap.has(notification.related_entity)) {
      sentMap.set(
        notification.related_entity,
        notification.created_at ?? new Date().toISOString(),
      );
    }
  });

  const alertRows: OutbreakAlertRow[] = surveillanceRows
    .filter((row) => row.riskLevel === "HIGH" || row.earlyOutbreakSignal)
    .map((row) => {
      const id = `disease-outbreak:${row.wardNumber}:${row.diseaseId}`;
      return {
        id,
        wardNumber: row.wardNumber,
        wardName: row.wardName,
        diseaseId: row.diseaseId,
        diseaseName: row.diseaseName,
        message: row.alertMessage,
        severity: row.riskLevel === "HIGH" ? "HIGH" : "MEDIUM",
        status: sentMap.has(id) ? "Approved / Sent" : "Pending",
        citizenMessage: row.citizenPreview,
        createdAt: sentMap.get(id) ?? null,
      };
    });

  const trendEntries = Array.from(citywideTrendMap.entries());
  const thisWeek = surveillanceRows.reduce((sum, row) => sum + row.currentWeekCases, 0);
  const lastWeek = surveillanceRows.reduce((sum, row) => sum + row.previousWeekCases, 0);
  const outbreakSignals = surveillanceRows.filter((row) => row.earlyOutbreakSignal).length;
  const highRiskCount = surveillanceRows.filter((row) => row.riskLevel === "HIGH").length;
  const topOutbreakSignals: OutbreakSignalRow[] = surveillanceRows
    .filter((row) => row.earlyOutbreakSignal)
    .slice(0, 6)
    .map((row, index) => ({
      signalId: `${row.wardNumber}-${row.diseaseId}-${index}`,
      wardNumber: row.wardNumber,
      wardName: row.wardName,
      diseaseId: row.diseaseId,
      diseaseName: row.diseaseName,
      currentWeekCases: row.currentWeekCases,
      previousWeekCases: row.previousWeekCases,
      activeCases: 0,
      severeCases: 0,
      positivityRate: 0,
      healthIndex: 0,
      outbreakScore: row.abnormalityScore,
      riskLevel: row.riskLevel.toLowerCase(),
      aiSummary: row.explanation,
      createdAt: null,
      updatedAt: null,
    }));

  return {
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(surveillanceRows.length / pageSize)),
    rows: pagedRows.map<DiseaseSurveillanceRow>((row) => ({
      id: `${row.wardNumber}:${row.diseaseId}`,
      wardNumber: row.wardNumber,
      wardName: row.wardName,
      diseaseId: row.diseaseId,
      diseaseName: row.diseaseName,
      currentCases: row.currentWeekCases,
      previousCases: row.previousWeekCases,
      growthRate: row.growthRate,
      growthTrend: row.growthTrend,
      riskLevel: row.riskLevel,
      earlyOutbreakSignal: row.earlyOutbreakSignal,
      ruleTriggered: row.ruleTriggered,
      trendTriggered: row.trendTriggered,
      anomalyTriggered: row.anomalyTriggered,
      abnormalityScore: row.abnormalityScore,
      explanation: row.explanation,
      citizenPreview: row.citizenPreview,
      alertMessage: row.alertMessage,
    })),
    trend: trendEntries.map(([label, value]) => ({ label, value })),
    weeklyComparison: [
      { label: "Last Week", value: lastWeek },
      { label: "This Week", value: thisWeek },
    ],
    outbreakSignals,
    highRiskCount,
    alertRows,
    topOutbreakSignals,
    flaggedRows: surveillanceRows.filter((row) => row.earlyOutbreakSignal).slice(0, 6),
  };
}

export async function getHospitalOverviewRows(): Promise<HospitalOverviewRow[]> {
  return cachedFetch("hospital_overview_rows_v4", async () => {
    const supabase = await createClient();
    const [hospitals, wardsMap, bedsRes, equipmentRes, staffRes, medicineRes] =
      await Promise.all([
        getHospitalsBase(),
        getWardsLookup(),
        supabase.from("beds").select("hospital_id, bed_status, last_updated_on"),
        supabase.from("medical_equipment").select("hospital_id"),
        supabase.from("hospital_staff").select("hospital_id, role, joined_at"),
        supabase.from("hospital_medicine_stock").select("hospital_id, quantity, threshold, last_updated"),
      ]);

    const beds = bedsRes.data ?? [];
    const equipment = equipmentRes.data ?? [];
    const staff = staffRes.data ?? [];
    const medicines = medicineRes.data ?? [];

    return hospitals.map((hospital) => {
      const hospitalBeds = beds.filter((bed) => bed.hospital_id === hospital.hospital_id);
      const occupiedBeds = hospitalBeds.filter((bed) =>
        String(bed.bed_status ?? "").toLowerCase().includes("occupied"),
      ).length;
      const lastUpdatedCandidates = [
        ...hospitalBeds.map((row) => row.last_updated_on),
        ...medicines
          .filter((row) => row.hospital_id === hospital.hospital_id)
          .map((row) => row.last_updated),
      ].filter(Boolean);

      return {
        hospitalId: hospital.hospital_id,
        name: hospital.name ?? hospital.hospital_id,
        wardId: hospital.ward_id ?? null,
        wardName:
          wardsMap.get(hospital.ward_id)?.ward_name ?? `Ward ${hospital.ward_id ?? "-"}`,
        type: hospital.type,
        contactNumber: hospital.contact_number,
        verified: Boolean(hospital.verified_by_smc),
        totalBeds: hospitalBeds.length,
        occupiedBeds,
        doctors: staff.filter(
          (member) =>
            member.hospital_id === hospital.hospital_id &&
            String(member.role ?? "").toLowerCase().includes("doctor"),
        ).length,
        equipment: equipment.filter(
          (item) => item.hospital_id === hospital.hospital_id,
        ).length,
        lowStockMedicines: medicines.filter(
          (item) =>
            item.hospital_id === hospital.hospital_id &&
            (item.quantity ?? 0) <= (item.threshold ?? 0),
        ).length,
        lastUpdatedAt:
          lastUpdatedCandidates.sort().reverse()[0]?.toString() ?? null,
      };
    });
  });
}

export async function getComplaintsData(searchParams: SearchParams) {
  const supabase = await createClient();
  const page = getPage(searchParams);
  const pageSize = getPageSize(searchParams);
  const status = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;

  let query = supabase
    .from("complaints")
    .select(
      "complaint_id, priority, status, remarks_by_officers, created_at, citizens(name), hospitals(name)",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1,
  );

  const rows: ComplaintRow[] = (data ?? []).map((item: any) => ({
    complaintId: item.complaint_id,
    citizenName: item.citizens?.name ?? "Unknown citizen",
    hospitalName: item.hospitals?.name ?? "Unassigned",
    priority: item.priority,
    status: item.status,
    remarks: item.remarks_by_officers,
    createdAt: item.created_at,
  }));

  return {
    page,
    totalPages: Math.max(1, Math.ceil((count ?? rows.length) / pageSize)),
    rows,
  };
}

export async function getVaccinationCampaignRows(): Promise<CampaignRow[]> {
  const supabase = await createClient();
  const [{ data: campaigns }, { data: records }, wardsLookup] = await Promise.all([
    supabase
      .from("vaccination_campaigns")
      .select("*")
      .order("date", { ascending: false }),
    supabase.from("vaccination_records").select("campaign_id"),
    getWardsLookup(),
  ]);

  return (campaigns ?? []).map((campaign) => ({
    campaignId: campaign.campaign_id,
    name: campaign.name,
    wardId: campaign.ward_id,
    wardName:
      wardsLookup.get(campaign.ward_id)?.ward_name ?? `Ward ${campaign.ward_id ?? "-"}`,
    vaccineType: campaign.vaccine_type,
    date: campaign.date,
    targetPopulation: campaign.target_population,
    status: campaign.status,
    administeredDoses: (records ?? []).filter(
      (record) => record.campaign_id === campaign.campaign_id,
    ).length,
  }));
}

export async function getEmergencyResponseData() {
  const supabase = await createClient();
  const [alertsRes, wards, hospitals] = await Promise.all([
    supabase.from("alerts").select("*").order("created_at", { ascending: false }),
    getWardHealthRows(),
    getHospitalOverviewRows(),
  ]);
  const alerts = alertsRes.data ?? [];

  const criticalWards = wards.filter((ward) =>
    String(ward.riskLevel).toLowerCase().includes("critical"),
  );

  const overloadHospitals = hospitals
    .map((hospital) => ({
      ...hospital,
      occupancy:
        hospital.totalBeds > 0
          ? (hospital.occupiedBeds / hospital.totalBeds) * 100
          : 0,
    }))
    .filter((hospital) => hospital.occupancy >= 80);

  return {
    alerts,
    criticalWards,
    overloadHospitals,
  };
}

export async function getNotificationRows(): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("notification_id, title, message, type, priority, target_type, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((item) => ({
    notificationId: item.notification_id,
    title: item.title,
    message: item.message,
    type: item.type,
    priority: item.priority,
    targetType: item.target_type,
    createdAt: item.created_at,
  }));
}

export async function getResourceAllocationData() {
  const supabase = await createClient();
  const [hospitals, diseaseRes, taskRes, notificationRes] = await Promise.all([
    getHospitalOverviewRows(),
    supabase.from("disease_cases").select("hospital_id, status"),
    supabase.from("resource_allocation_tasks").select("hospital_id, ward_number"),
    supabase
      .from("notifications")
      .select("target_hospital_id, target_ward_number, related_entity")
      .like("related_entity", "resource-task%"),
  ]);

  const patientLoad = new Map<string, number>();
  (diseaseRes.data ?? []).forEach((row) => {
    if (String(row.status ?? "").toLowerCase().includes("active")) {
      patientLoad.set(row.hospital_id, (patientLoad.get(row.hospital_id) ?? 0) + 1);
    }
  });

  const handledKeys = new Set<string>();
  (taskRes.data ?? []).forEach((row) => {
    handledKeys.add(`${row.hospital_id}:${row.ward_number ?? "na"}`);
  });
  (notificationRes.data ?? []).forEach((row) => {
    handledKeys.add(`${row.target_hospital_id ?? "unknown"}:${row.target_ward_number ?? "na"}`);
  });

  const ranked = hospitals
    .map((hospital) => ({
      ...hospital,
      patientLoad: patientLoad.get(hospital.hospitalId) ?? 0,
      occupancy:
          hospital.totalBeds > 0
            ? (hospital.occupiedBeds / hospital.totalBeds) * 100
            : 0,
    }))
    .filter((hospital) => !handledKeys.has(`${hospital.hospitalId}:${hospital.wardId ?? "na"}`))
    .sort((a, b) => b.occupancy - a.occupancy);

  const receivers = ranked.filter((item) => item.occupancy < 60).slice(0, 3);

  return ranked.map((hospital) => ({
    ...hospital,
    recommendation:
      hospital.occupancy >= 85
        ? `Redistribute non-critical cases to ${receivers
            .map((item) => item.name)
            .join(", ") || "available lower-load hospitals"}.`
        : "Current capacity is within acceptable operating threshold.",
  }));
}

export async function getResourceAllocationTaskRows(): Promise<ResourceAllocationTaskRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resource_allocation_tasks")
    .select("task_id, hospital_id, ward_number, task_type, status, message, created_at")
    .neq("status", "resolved")
    .order("created_at", { ascending: false })
    .limit(10);

  const [hospitals, wardsLookup] = await Promise.all([getHospitalsBase(), getWardsLookup()]);
  const hospitalMap = new Map(hospitals.map((hospital) => [hospital.hospital_id, hospital.name]));

  if (error) {
    const { data: fallbackRows, error: fallbackError } = await supabase
      .from("notifications")
      .select(
        "notification_id, title, message, related_entity, target_hospital_id, target_ward_number, created_at",
      )
      .like("related_entity", "resource-task:%")
      .order("created_at", { ascending: false })
      .limit(10);

    if (fallbackError) {
      return [];
    }

    return (fallbackRows ?? []).map((item) => {
      const action = item.related_entity?.split(":")[1];
      const isReview = action === "mark_review";
      return {
        taskId: item.notification_id,
        hospitalName:
          hospitalMap.get(item.target_hospital_id ?? "") ??
          item.target_hospital_id ??
          item.title ??
          "Unknown hospital",
        wardName:
          wardsLookup.get(item.target_ward_number)?.ward_name ??
          `Ward ${item.target_ward_number ?? "-"}`,
        taskType: isReview ? "review" : "redistribution",
        status: isReview ? "under_review" : "open",
        message: item.message ?? item.title ?? "Resource task created",
        createdAt: item.created_at,
        source: "notification",
      };
    });
  }

  return (data ?? []).map((item) => ({
    taskId: item.task_id,
    hospitalName: hospitalMap.get(item.hospital_id) ?? item.hospital_id ?? "Unknown hospital",
    wardName:
      wardsLookup.get(item.ward_number)?.ward_name ?? `Ward ${item.ward_number ?? "-"}`,
    taskType: item.task_type,
    status: item.status,
    message: item.message,
    createdAt: item.created_at,
    source: "task",
  }));
}

export async function getComplianceData(searchParams?: SearchParams) {
  const supabase = await createClient();
  const ward = searchParams
    ? Array.isArray(searchParams.ward)
      ? searchParams.ward[0]
      : searchParams.ward
    : undefined;
  const status = searchParams
    ? Array.isArray(searchParams.status)
      ? searchParams.status[0]
      : searchParams.status
    : undefined;
  const [hospitals, notificationsRes] = await Promise.all([
    getHospitalOverviewRows(),
    supabase
      .from("notifications")
      .select("notification_id, target_hospital_id, created_at, related_entity")
      .like("related_entity", "compliance-alert:%")
      .order("created_at", { ascending: false }),
  ]);
  const now = Date.now();
  const alertMap = new Map<string, { lastAlertSentAt: string | null; alertCount: number }>();

  (notificationsRes.data ?? []).forEach((row) => {
    const hospitalId = row.target_hospital_id;
    if (!hospitalId) {
      return;
    }

    const current = alertMap.get(hospitalId) ?? {
      lastAlertSentAt: null,
      alertCount: 0,
    };
    current.alertCount += 1;
    if (
      !current.lastAlertSentAt ||
      new Date(row.created_at ?? 0).getTime() > new Date(current.lastAlertSentAt).getTime()
    ) {
      current.lastAlertSentAt = row.created_at;
    }
    alertMap.set(hospitalId, current);
  });

  const rows = hospitals.map((hospital) => {
    const lastUpdatedAt = hospital.lastUpdatedAt;
    const hoursSinceUpdate = lastUpdatedAt
      ? Math.max(0, (now - new Date(lastUpdatedAt).getTime()) / (1000 * 60 * 60))
      : null;

    let complianceStatus: "Critical" | "Warning" | "No Data" | "Compliant" = "Compliant";
    if (hoursSinceUpdate === null) {
      complianceStatus = "No Data";
    } else if (hoursSinceUpdate > 24) {
      complianceStatus = "Critical";
    } else if (hoursSinceUpdate > 12) {
      complianceStatus = "Warning";
    }

    const alerts = alertMap.get(hospital.hospitalId);

    return {
      hospitalId: hospital.hospitalId,
      name: hospital.name,
      wardId: hospital.wardId ?? 0,
      wardName: hospital.wardName,
      lastUpdatedAt,
      hoursSinceUpdate,
      complianceStatus,
      status: complianceStatus,
      lastAlertSentAt: alerts?.lastAlertSentAt ?? null,
      alertCount: alerts?.alertCount ?? 0,
    };
  });

  const filteredRows = rows.filter((row) => {
    if (ward && ward !== "all" && String(row.wardId) !== ward) {
      return false;
    }
    if (status && status !== "all" && row.complianceStatus.toLowerCase() !== status.toLowerCase()) {
      return false;
    }
    return true;
  });

  const summary = {
    critical: rows.filter((row) => row.complianceStatus === "Critical").length,
    warning: rows.filter((row) => row.complianceStatus === "Warning").length,
    noData: rows.filter((row) => row.complianceStatus === "No Data").length,
    compliant: rows.filter((row) => row.complianceStatus === "Compliant").length,
  };

  const wardsLookup = await getWardsLookup();
  const recentReminders = (notificationsRes.data ?? [])
    .slice(0, 5)
    .map((item) => ({
      id: item.notification_id,
      hospitalName: item.target_hospital_id ?? "Unknown Hospital",
      createdAt: item.created_at ?? new Date().toISOString(),
    }));

  return {
    filters: {
      ward: ward ?? "all",
      status: status ?? "all",
    },
    summary,
    wards: Array.from(wardsLookup.values()).map((wardRow) => ({
      wardId: wardRow.ward_id,
      wardName: wardRow.ward_name ?? `Ward ${wardRow.ward_id}`,
    })),
    rows: filteredRows,
    staleRanking: filteredRows
      .filter((row) => row.hoursSinceUpdate !== null)
      .sort((a, b) => (b.hoursSinceUpdate ?? 0) - (a.hoursSinceUpdate ?? 0))
      .slice(0, 8)
      .map((row) => ({
        label: row.name,
        value: Number((row.hoursSinceUpdate ?? 0).toFixed(0)),
      })),
    recentReminders,
  };
}

export async function getHealthCardAdminData(searchParams: SearchParams) {
  const supabase = await createClient();
  const ward = Array.isArray(searchParams.ward) ? searchParams.ward[0] : searchParams.ward;
  const from = Array.isArray(searchParams.from) ? searchParams.from[0] : searchParams.from;
  const to = Array.isArray(searchParams.to) ? searchParams.to[0] : searchParams.to;
  const page = getPage(searchParams);
  const pageSize = getPageSize(searchParams);
  const now = new Date();
  const defaultFrom = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
  const defaultTo = format(endOfDay(now), "yyyy-MM-dd");
  const fromDate = from ?? defaultFrom;
  const toDate = to ?? defaultTo;
  const wardFilter = ward && ward !== "all" ? Number(ward) : null;

  let citizensQuery = supabase
    .from("citizens")
    .select("citizen_id, aadhar_id, phone, ward_number, created_at", { count: "exact" })
    .gte("created_at", `${fromDate}T00:00:00`)
    .lte("created_at", `${toDate}T23:59:59`)
    .order("created_at", { ascending: false });

  if (wardFilter) {
    citizensQuery = citizensQuery.eq("ward_number", wardFilter);
  }

  const [citizensRes, healthRecordsRes, vaccinationsRes, wardsLookup] = await Promise.all([
    citizensQuery,
    supabase.from("health_records").select("citizen_id"),
    supabase.from("vaccination_records").select("citizen_id"),
    getWardsLookup(),
  ]);

  const citizens = citizensRes.data ?? [];
  const duplicates = new Map<string, number>();
  citizens.forEach((citizen) => {
    const key = citizen.phone || citizen.aadhar_id || "";
    if (key) {
      duplicates.set(key, (duplicates.get(key) ?? 0) + 1);
    }
  });

  const activeUsage = new Set([
    ...(healthRecordsRes.data ?? []).map((row) => row.citizen_id),
    ...(vaccinationsRes.data ?? []).map((row) => row.citizen_id),
  ]);
  const duplicateCount = Array.from(duplicates.values()).filter((value) => value > 1).length;

  const wardAggregateMap = new Map<
    number,
    { wardId: number; wardName: string; created: number; used: number; duplicates: number }
  >();
  citizens.forEach((citizen) => {
    const wardId = citizen.ward_number ?? 0;
    const current = wardAggregateMap.get(wardId) ?? {
      wardId,
      wardName: wardsLookup.get(wardId)?.ward_name ?? `Ward ${wardId || "-"}`,
      created: 0,
      used: 0,
      duplicates: 0,
    };
    current.created += 1;
    if (activeUsage.has(citizen.citizen_id)) {
      current.used += 1;
    }
    const duplicateKey = citizen.phone || citizen.aadhar_id || "";
    if (duplicateKey && (duplicates.get(duplicateKey) ?? 0) > 1) {
      current.duplicates += 1;
    }
    wardAggregateMap.set(wardId, current);
  });

  const monthAggregateMap = new Map<string, number>();
  citizens.forEach((citizen) => {
    const label = citizen.created_at
      ? format(new Date(citizen.created_at), "MMM yyyy")
      : "Unknown";
    monthAggregateMap.set(label, (monthAggregateMap.get(label) ?? 0) + 1);
  });

  return {
    filters: {
      ward: wardFilter ? String(wardFilter) : "all",
      from: fromDate,
      to: toDate,
    },
    totalRegistrations: citizens.length,
    activeUsage: citizens.filter((citizen) => activeUsage.has(citizen.citizen_id)).length,
    duplicateCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil((citizensRes.count ?? citizens.length) / pageSize)),
    wards: Array.from(wardsLookup.values()).map((wardRow) => ({
      wardId: wardRow.ward_id,
      wardName: wardRow.ward_name ?? `Ward ${wardRow.ward_id}`,
    })),
    wardAggregates: Array.from(wardAggregateMap.values()).sort((a, b) => b.created - a.created),
    monthlyAggregates: Array.from(monthAggregateMap.entries()).map(([label, value]) => ({
      label,
      value,
    })),
    recentRegistrations: citizens.slice(0, 10),
  };
}

export async function getReportsData() {
  const [wardHealth, hospitals, disease] = await Promise.all([
    getWardHealthRows(),
    getHospitalOverviewRows(),
    getDashboardData(),
  ]);

  return {
    wardHealth,
    hospitals,
    diseaseTrend: disease.diseaseTrend,
  };
}

export async function getSystemMonitoringData() {
  const supabase = await createClient();
  const [alertsRes, notificationsRes, officialsRes, providersRes, wardsLookup] = await Promise.all([
    supabase.from("alerts").select("alert_id, ward_number, alert_type, severity, created_at"),
    supabase
      .from("notifications")
      .select("notification_id, title, priority, target_type, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("smc_officials")
      .select("official_id, name, designation, role, status, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("provider")
      .select("provider_id, name, role, ward_id, email, created_at")
      .order("created_at", { ascending: false }),
    getWardsLookup(),
  ]);

  const alerts = alertsRes.data ?? [];
  const notifications = notificationsRes.data ?? [];
  const officials = officialsRes.data ?? [];
  const providers = providersRes.data ?? [];
  const activeOfficials = officials.filter((row) =>
    String(row.status ?? "").toLowerCase().includes("active"),
  );
  const recentAlerts = alerts
    .slice()
    .sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    )
    .slice(0, 10)
    .map((alert) => ({
      id: alert.alert_id,
      wardName:
        wardsLookup.get(alert.ward_number)?.ward_name ?? `Ward ${alert.ward_number ?? "-"}`,
      alertType: alert.alert_type ?? "Untitled",
      severity: alert.severity ?? "unknown",
      createdAt: alert.created_at,
    }));
  const recentNotifications = notifications.slice(0, 10).map((notification) => ({
    id: notification.notification_id,
    title: notification.title ?? "Untitled notification",
    priority: notification.priority ?? "unknown",
    targetType: notification.target_type ?? "unspecified",
    createdAt: notification.created_at,
  }));
  const officialStatusBreakdown = [
    {
      label: "Active",
      value: activeOfficials.length,
    },
    {
      label: "Inactive",
      value: officials.length - activeOfficials.length,
    },
  ];
  const providerWardBreakdown = Array.from(
    providers.reduce((map, provider) => {
      const label =
        wardsLookup.get(provider.ward_id)?.ward_name ?? `Ward ${provider.ward_id ?? "-"}`;
      map.set(label, (map.get(label) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    alertsCount: alerts.length,
    notificationCount: notifications.length,
    activeOfficials: activeOfficials.length,
    providerCount: providers.length,
    recentAlerts,
    recentNotifications,
    officialStatusBreakdown,
    providerWardBreakdown,
    officials: officials.map((official) => ({
      officialId: official.official_id,
      name: official.name ?? official.official_id,
      designation: official.designation ?? "Not specified",
      role: official.role ?? "Not specified",
      status: official.status ?? "unknown",
      createdAt: official.created_at,
    })),
    providers: providers.map((provider) => ({
      providerId: provider.provider_id,
      name: provider.name ?? provider.provider_id,
      role: provider.role ?? "Not specified",
      wardName:
        wardsLookup.get(provider.ward_id)?.ward_name ?? `Ward ${provider.ward_id ?? "-"}`,
      email: provider.email ?? "Not available",
      createdAt: provider.created_at,
    })),
  };
}
