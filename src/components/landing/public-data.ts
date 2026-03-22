import { format, subDays } from "date-fns";

export interface PublicLandingSummary {
  totalToday: number;
  totalWeek: number;
  totalMonth: number;
  activeCases: number;
  recoveredCases: number;
  criticalCases: number;
  mostReportedDisease: string;
}

export interface PublicDiseaseChartPoint {
  name: string;
  cases: number;
}

export interface PublicTimelinePoint {
  date: string;
  cases: number;
}

export interface PublicWardPoint {
  ward: string;
  cases: number;
}

export interface PublicRecentReport {
  diseaseName: string;
  ward: string;
  hospitalName: string;
  date: string;
}

export interface PublicLandingData {
  summary: PublicLandingSummary;
  topDiseases: PublicDiseaseChartPoint[];
  timeline: PublicTimelinePoint[];
  wards: PublicWardPoint[];
  recentReports: PublicRecentReport[];
  lastUpdatedAt: string;
}

type RecentCaseRow = {
  report_date: string | null;
  disease_id: string | null;
  hospital_id: string | null;
  severity?: string | null;
  status?: string | null;
};

type QueryResult<T> = {
  data: T[] | null;
  error: { message?: string | null } | null;
};

function unwrapQuery<T>(label: string, result: QueryResult<T>) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message || "query failed"}`);
  }

  return result.data || [];
}

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function displayDate(date: Date) {
  return format(date, "MMM dd");
}

function normalizeReportDate(value: string | null) {
  if (!value) {
    return null;
  }

  return value.slice(0, 10);
}

export function emptyPublicLandingData(): PublicLandingData {
  return {
    summary: {
      totalToday: 0,
      totalWeek: 0,
      totalMonth: 0,
      activeCases: 0,
      recoveredCases: 0,
      criticalCases: 0,
      mostReportedDisease: "Unavailable",
    },
    topDiseases: [],
    timeline: [],
    wards: [],
    recentReports: [],
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function fetchPublicLandingData(client: {
  from: (table: string) => any;
}): Promise<PublicLandingData> {
  const now = new Date();
  const todayKey = dateKey(now);
  const weekStartKey = dateKey(subDays(now, 6));
  const monthStartKey = dateKey(subDays(now, 29));

  const [
    monthlyCasesResult,
    statusCasesResult,
    recentReportsResult,
  ] = await Promise.all([
    client
      .from("disease_cases")
      .select(`
        report_date,
        disease_id,
        hospital_id,
        severity,
        status
      `)
      .gte("report_date", monthStartKey)
      .order("report_date", { ascending: true }),
    client
      .from("disease_cases")
      .select(`
        report_date,
        severity,
        status
      `),
    client
      .from("disease_cases")
      .select(`
        report_date,
        disease_id,
        hospital_id
      `)
      .order("report_date", { ascending: false })
      .limit(8),
  ]);

  const recentCases = unwrapQuery("disease_cases monthly analytics", monthlyCasesResult as QueryResult<RecentCaseRow>);
  const statusCases = unwrapQuery(
    "disease_cases summary analytics",
    statusCasesResult as QueryResult<RecentCaseRow>
  );
  const recentReportsRows = unwrapQuery(
    "disease_cases recent reports",
    recentReportsResult as QueryResult<RecentCaseRow>
  );

  const diseaseIds = Array.from(
    new Set(
      [...recentCases, ...recentReportsRows]
        .map((row) => row.disease_id)
        .filter((value): value is string => Boolean(value))
    )
  );
  const hospitalIds = Array.from(
    new Set(
      [...recentCases, ...recentReportsRows]
        .map((row) => row.hospital_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  const [diseasesLookupResult, hospitalsLookupResult, wardsLookupResult] = await Promise.all([
    diseaseIds.length > 0
      ? client.from("diseases").select("disease_id, disease_name").in("disease_id", diseaseIds)
      : Promise.resolve({ data: [], error: null }),
    hospitalIds.length > 0
      ? client.from("hospitals").select("hospital_id, name, ward_id").in("hospital_id", hospitalIds)
      : Promise.resolve({ data: [], error: null }),
    client.from("wards").select("ward_id, ward_name"),
  ]);

  const diseaseMap = new Map(
    ((diseasesLookupResult.error ? [] : diseasesLookupResult.data) || []).map((row: {
      disease_id: string;
      disease_name: string | null;
    }) => [
      row.disease_id,
      row.disease_name || "Unknown",
    ])
  );
  const hospitalMap = new Map(
    ((hospitalsLookupResult.error ? [] : hospitalsLookupResult.data) || []).map((row: {
      hospital_id: string;
      name: string | null;
      ward_id: number | null;
    }) => [
      row.hospital_id,
      {
        name: row.name || "Unknown Hospital",
        wardId: row.ward_id,
      },
    ])
  );
  const wardMap = new Map(
    ((wardsLookupResult.error ? [] : wardsLookupResult.data) || []).map((row: {
      ward_id: number;
      ward_name: string | null;
    }) => [
      row.ward_id,
      row.ward_name || `Ward ${row.ward_id}`,
    ])
  );

  const diseaseCounts = new Map<string, number>();
  const wardCounts = new Map<string, number>();
  const timelineCounts = new Map<string, number>();

  for (let offset = 29; offset >= 0; offset -= 1) {
    const day = subDays(now, offset);
    timelineCounts.set(dateKey(day), 0);
  }

  for (const row of recentCases) {
    const diseaseName = row.disease_id ? diseaseMap.get(row.disease_id) || "Unknown" : "Unknown";
    const hospital = row.hospital_id ? hospitalMap.get(row.hospital_id) : null;
    const wardName =
      hospital?.wardId !== null && hospital?.wardId !== undefined
        ? wardMap.get(hospital.wardId) || `Ward ${hospital.wardId}`
        : "Unassigned";

    diseaseCounts.set(diseaseName, (diseaseCounts.get(diseaseName) || 0) + 1);
    wardCounts.set(wardName, (wardCounts.get(wardName) || 0) + 1);

    const reportDateKey = normalizeReportDate(row.report_date);

    if (reportDateKey && timelineCounts.has(reportDateKey)) {
      timelineCounts.set(reportDateKey, (timelineCounts.get(reportDateKey) || 0) + 1);
    }
  }

  const topDiseases = Array.from(diseaseCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, cases]) => ({ name, cases }));

  const wards = Array.from(wardCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([ward, cases]) => ({ ward, cases }));

  const timeline = Array.from(timelineCounts.entries()).map(([date, cases]) => ({
    date: displayDate(new Date(date)),
    cases,
  }));

  const recentReports = recentReportsRows.map((row) => {
    const hospital = row.hospital_id ? hospitalMap.get(row.hospital_id) : null;

    return {
      diseaseName: row.disease_id ? diseaseMap.get(row.disease_id) || "Unknown" : "Unknown",
      ward:
        hospital?.wardId !== null && hospital?.wardId !== undefined
          ? wardMap.get(hospital.wardId) || `Ward ${hospital.wardId}`
          : "Unassigned",
      hospitalName: hospital?.name || "Unknown Hospital",
      date: row.report_date ? format(new Date(row.report_date), "MMM dd, yyyy") : "N/A",
    };
  });

  const totalToday = recentCases.filter(
    (row) => normalizeReportDate(row.report_date) === todayKey
  ).length;
  const totalWeek = recentCases.filter(
    (row) => {
      const reportDateKey = normalizeReportDate(row.report_date);
      return Boolean(reportDateKey && reportDateKey >= weekStartKey);
    }
  ).length;
  const totalMonth = recentCases.length;
  const activeCases = statusCases.filter((row) =>
    ["active", "under_treatment"].includes((row.status || "").toLowerCase())
  ).length;
  const recoveredCases = statusCases.filter(
    (row) => (row.status || "").toLowerCase() === "recovered"
  ).length;
  const criticalCases = statusCases.filter(
    (row) => (row.severity || "").toLowerCase() === "critical"
  ).length;

  return {
    summary: {
      totalToday,
      totalWeek,
      totalMonth,
      activeCases,
      recoveredCases,
      criticalCases,
      mostReportedDisease: topDiseases[0]?.name || "No recent data",
    },
    topDiseases,
    timeline,
    wards,
    recentReports,
    lastUpdatedAt: now.toISOString(),
  };
}
