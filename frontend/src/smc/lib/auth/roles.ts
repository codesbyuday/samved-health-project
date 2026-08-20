import type { OfficialRole } from "@/smc/lib/types/schema";

export const ROLES: OfficialRole[] = [
  "SMC Admin",
  "SMC Health Officer",
  "Ward Officer",
];

export const sidebarItems = [
  { href: "/smc/dashboard", label: "Dashboard" },
  { href: "/smc/ward-health-index", label: "Ward Health Index" },
  { href: "/smc/disease-surveillance", label: "Disease Surveillance" },
  { href: "/smc/hospitals", label: "Hospitals" },
  { href: "/smc/hospital-infrastructure", label: "Hospital Infrastructure" },
  { href: "/smc/citizen-complaints", label: "Citizen Complaints" },
  { href: "/smc/vaccination-campaigns", label: "Vaccination Campaigns" },
  { href: "/smc/emergency-response", label: "Emergency Response" },
  { href: "/smc/alerts-notifications", label: "Citizen Alerts" },
  { href: "/smc/resource-allocation", label: "Resource Allocation" },
  { href: "/smc/health-card-administration", label: "Health Card Administration" },
  { href: "/smc/reports-analytics", label: "Reports & Analytics" },
  { href: "/smc/system-monitoring", label: "System Monitoring" },
  { href: "/smc/data-compliance", label: "Data Compliance" },
  { href: "/smc/ward-risk-map", label: "Ward Risk Map" },
  { href: "/smc/settings", label: "Settings" },
] as const;

const roleMatrix: Record<OfficialRole, string[]> = {
  "SMC Admin": sidebarItems.map((item) => item.href),
  "SMC Health Officer": sidebarItems.map((item) => item.href),
  "Ward Officer": sidebarItems.map((item) => item.href),
};

export function normalizeRole(value: string | null | undefined): OfficialRole {
  if (!value) {
    return "Ward Officer";
  }

  if (value.toLowerCase().includes("admin")) {
    return "SMC Admin";
  }

  if (value.toLowerCase().includes("health")) {
    return "SMC Health Officer";
  }

  return "Ward Officer";
}

export function canAccess(role: OfficialRole, pathname: string) {
  const allowed = roleMatrix[role] || sidebarItems.map((item) => item.href);
  return allowed.includes(pathname);
}

