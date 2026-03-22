import type { UserProfile } from "@/lib/auth";

export type UserRole =
  | "admin"
  | "doctor"
  | "nurse"
  | "lab_staff"
  | "pharmacist"
  | "technician"
  | "receptionist"
  | "support_staff"
  | "driver";

export type ModuleKey =
  | "dashboard"
  | "appointments"
  | "citizen-services"
  | "patients"
  | "lab-reports"
  | "bed-management"
  | "infrastructure"
  | "disease-reporting"
  | "referrals"
  | "medicine-stock"
  | "staff-management"
  | "complaints"
  | "settings";

export type AccessLevel = "none" | "view" | "partial" | "full";

type PermissionAction =
  | "dashboard.view"
  | "dashboard_interact"
  | "appointments.view"
  | "appointments.manage"
  | "citizen-services.view"
  | "citizen-services.manage"
  | "patients.view"
  | "patients.manage"
  | "patients.notes"
  | "add_treatment"
  | "update_treatment_full"
  | "update_treatment_limited"
  | "lab-reports.view"
  | "lab-reports.manage"
  | "bed-management.view"
  | "bed-management.manage"
  | "infrastructure.view"
  | "infrastructure.manage"
  | "disease-reporting.view"
  | "disease-reporting.manage"
  | "referrals.view"
  | "referrals.manage"
  | "referrals.approve"
  | "create_referral"
  | "medicine-stock.view"
  | "medicine-stock.manage"
  | "staff-management.view"
  | "staff-management.manage"
  | "complaints.view"
  | "complaints.manage";

const rolePermissions: Record<UserRole, Set<PermissionAction>> = {
  admin: new Set([
    "dashboard.view",
    "dashboard_interact",
    "appointments.view",
    "appointments.manage",
    "citizen-services.view",
    "citizen-services.manage",
    "patients.view",
    "lab-reports.view",
    "bed-management.view",
    "bed-management.manage",
    "infrastructure.view",
    "infrastructure.manage",
    "disease-reporting.view",
    "disease-reporting.manage",
    "referrals.view",
    "referrals.approve",
    "medicine-stock.view",
    "medicine-stock.manage",
    "staff-management.view",
    "staff-management.manage",
    "complaints.view",
    "complaints.manage",
  ]),
  doctor: new Set([
    "dashboard.view",
    "dashboard_interact",
    "appointments.view",
    "appointments.manage",
    "citizen-services.view",
    "patients.view",
    "patients.manage",
    "add_treatment",
    "update_treatment_full",
    "lab-reports.view",
    "bed-management.view",
    "disease-reporting.view",
    "disease-reporting.manage",
    "referrals.view",
    "referrals.manage",
    "create_referral",
    "medicine-stock.view",
  ]),
  nurse: new Set([
    "dashboard.view",
    "dashboard_interact",
    "appointments.view",
    "citizen-services.view",
    "patients.view",
    "patients.notes",
    "update_treatment_limited",
    "lab-reports.view",
    "bed-management.view",
    "bed-management.manage",
    "referrals.view",
    "referrals.manage",
    "create_referral",
    "medicine-stock.view",
  ]),
  lab_staff: new Set([
    "dashboard.view",
    "lab-reports.view",
    "lab-reports.manage",
  ]),
  pharmacist: new Set([
    "dashboard.view",
    "medicine-stock.view",
    "medicine-stock.manage",
  ]),
  technician: new Set([
    "dashboard.view",
    "infrastructure.view",
    "infrastructure.manage",
  ]),
  receptionist: new Set([
    "dashboard.view",
    "appointments.view",
    "appointments.manage",
    "citizen-services.view",
    "citizen-services.manage",
    "patients.view",
    "referrals.view",
    "referrals.manage",
    "create_referral",
  ]),
  support_staff: new Set([
    "dashboard.view",
    "complaints.view",
    "complaints.manage",
  ]),
  driver: new Set([
    "dashboard.view",
    "infrastructure.view",
  ]),
};

const moduleActionMap: Record<ModuleKey, PermissionAction[]> = {
  dashboard: ["dashboard.view"],
  appointments: ["appointments.manage", "appointments.view"],
  "citizen-services": ["citizen-services.manage", "citizen-services.view"],
  patients: ["patients.manage", "patients.notes", "patients.view"],
  "lab-reports": ["lab-reports.manage", "lab-reports.view"],
  "bed-management": ["bed-management.manage", "bed-management.view"],
  infrastructure: ["infrastructure.manage", "infrastructure.view"],
  "disease-reporting": ["disease-reporting.manage", "disease-reporting.view"],
  referrals: ["referrals.manage", "referrals.approve", "referrals.view"],
  "medicine-stock": ["medicine-stock.manage", "medicine-stock.view"],
  "staff-management": ["staff-management.manage", "staff-management.view"],
  complaints: ["complaints.manage", "complaints.view"],
  settings: ["dashboard.view"],
};

export function normalizeRole(role: string | null | undefined): UserRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.trim().toLowerCase().replace(/\s+/g, "_") as UserRole;
  return normalized in rolePermissions ? normalized : null;
}

export function hasPermission(role: string | null | undefined, action: PermissionAction) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole ? rolePermissions[normalizedRole].has(action) : false;
}

export function hasHospitalAccess(userHospitalId: string | null | undefined, recordHospitalId: string | null | undefined) {
  if (!userHospitalId || !recordHospitalId) {
    return false;
  }

  return userHospitalId === recordHospitalId;
}

export function getModuleAccess(role: string | null | undefined, moduleKey: ModuleKey): AccessLevel {
  if (moduleKey === "settings") {
    return role ? "full" : "none";
  }

  switch (moduleKey) {
    case "dashboard":
      return hasPermission(role, "dashboard.view") ? "view" : "none";
    case "appointments":
      return hasPermission(role, "appointments.manage")
        ? "full"
        : hasPermission(role, "appointments.view")
          ? "view"
          : "none";
    case "citizen-services":
      return hasPermission(role, "citizen-services.manage")
        ? "full"
        : hasPermission(role, "citizen-services.view")
          ? "view"
          : "none";
    case "patients":
      return hasPermission(role, "patients.manage")
        ? "full"
        : hasPermission(role, "patients.notes")
          ? "partial"
          : hasPermission(role, "patients.view")
            ? "view"
            : "none";
    case "lab-reports":
      return hasPermission(role, "lab-reports.manage")
        ? "full"
        : hasPermission(role, "lab-reports.view")
          ? "view"
          : "none";
    case "bed-management":
      return hasPermission(role, "bed-management.manage")
        ? "full"
        : hasPermission(role, "bed-management.view")
          ? "view"
          : "none";
    case "infrastructure":
      return hasPermission(role, "infrastructure.manage")
        ? "full"
        : hasPermission(role, "infrastructure.view")
          ? "view"
          : "none";
    case "disease-reporting":
      return hasPermission(role, "disease-reporting.manage")
        ? "full"
        : hasPermission(role, "disease-reporting.view")
          ? "view"
          : "none";
    case "referrals":
      return hasPermission(role, "referrals.manage")
        ? "full"
        : hasPermission(role, "referrals.approve")
          ? "partial"
          : hasPermission(role, "referrals.view")
            ? "view"
            : "none";
    case "medicine-stock":
      return hasPermission(role, "medicine-stock.manage")
        ? "full"
        : hasPermission(role, "medicine-stock.view")
          ? "view"
          : "none";
    case "staff-management":
      return hasPermission(role, "staff-management.manage")
        ? "full"
        : hasPermission(role, "staff-management.view")
          ? "view"
          : "none";
    case "complaints":
      return hasPermission(role, "complaints.manage")
        ? "full"
        : hasPermission(role, "complaints.view")
          ? "view"
          : "none";
    default:
      return "none";
  }
}

export function canAccessModule(role: string | null | undefined, moduleKey: ModuleKey) {
  return getModuleAccess(role, moduleKey) !== "none";
}

export function getVisibleModules(role: string | null | undefined) {
  return (Object.keys(moduleActionMap) as ModuleKey[]).filter((moduleKey) =>
    canAccessModule(role, moduleKey)
  );
}

export function getUserHospitalId(user: UserProfile | null | undefined) {
  return user?.hospital_id || null;
}
