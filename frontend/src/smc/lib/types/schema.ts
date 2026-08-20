export type OfficialRole = "SMC Admin" | "SMC Health Officer" | "Ward Officer";

export type UserContext = {
  id: string;
  email: string | null;
  role: OfficialRole;
  officialId: string | null;
  name: string;
  designation: string | null;
};

export type SummaryMetric = {
  label: string;
  value: number;
  helper: string;
};

export type TrendPoint = {
  label: string;
  value: number;
  secondaryValue?: number;
};

export type WardHealthRow = {
  wardId: number;
  wardName: string;
  population: number;
  doctors: number;
  beds: number;
  cases: number;
  deaths: number;
  healthIndex: number;
  riskLevel: string;
};

export type HospitalOverviewRow = {
  hospitalId: string;
  name: string;
  wardId: number | null;
  wardName: string;
  type: string | null;
  contactNumber: string | null;
  verified: boolean;
  totalBeds: number;
  occupiedBeds: number;
  doctors: number;
  equipment: number;
  lowStockMedicines: number;
  lastUpdatedAt: string | null;
};

export type ComplianceHospitalRow = HospitalOverviewRow & {
  complianceStatus: string;
  lastAlertSentAt: string | null;
  alertCount: number;
  hoursSinceUpdate: number | null;
};

export type ResourceAllocationTaskRow = {
  taskId: string;
  hospitalName: string;
  wardName: string;
  taskType: string;
  status: string;
  message: string;
  createdAt: string | null;
  source: "task" | "notification";
};

export type ComplaintRow = {
  complaintId: string;
  citizenName: string;
  hospitalName: string;
  priority: string | null;
  status: string | null;
  remarks: string | null;
  createdAt: string | null;
};

export type CampaignRow = {
  campaignId: string;
  name: string | null;
  wardId: number | null;
  wardName: string;
  vaccineType: string | null;
  date: string | null;
  targetPopulation: string | null;
  status: string | null;
  administeredDoses: number;
};

export type NotificationRow = {
  notificationId: string;
  title: string | null;
  message: string | null;
  type: string | null;
  priority: string | null;
  targetType: string | null;
  createdAt: string | null;
};

export type OutbreakSignalRow = {
  signalId: string;
  wardNumber: number;
  wardName: string;
  diseaseId: string;
  diseaseName: string;
  currentWeekCases: number;
  previousWeekCases: number;
  activeCases: number;
  severeCases: number;
  positivityRate: number;
  healthIndex: number;
  outbreakScore: number;
  riskLevel: string;
  aiSummary: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type DiseaseSurveillanceRow = {
  id: string;
  wardNumber: number;
  wardName: string;
  diseaseId: string;
  diseaseName: string;
  currentCases: number;
  previousCases: number;
  growthRate: number;
  growthTrend: "Increase" | "Decrease" | "Stable";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  earlyOutbreakSignal: boolean;
  ruleTriggered: boolean;
  trendTriggered: boolean;
  anomalyTriggered: boolean;
  abnormalityScore: number;
  explanation: string;
  citizenPreview: string;
  alertMessage: string;
};

export type OutbreakAlertRow = {
  id: string;
  wardNumber: number;
  wardName: string;
  diseaseId: string;
  diseaseName: string;
  message: string;
  severity: "MEDIUM" | "HIGH";
  status: "Pending" | "Approved / Sent";
  citizenMessage: string;
  createdAt: string | null;
};

