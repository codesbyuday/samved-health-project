"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessModule, getModuleAccess, getUserHospitalId, getVisibleModules, hasHospitalAccess, hasPermission, ModuleKey } from "@/lib/rbac";

export function useRBAC() {
  const { user } = useAuth();

  return useMemo(
    () => ({
      role: user?.role || null,
      hospitalId: getUserHospitalId(user),
      user,
      hasPermission: (action: Parameters<typeof hasPermission>[1]) => hasPermission(user?.role, action),
      hasHospitalAccess: (recordHospitalId: string | null | undefined) =>
        hasHospitalAccess(user?.hospital_id, recordHospitalId),
      getModuleAccess: (moduleKey: ModuleKey) => getModuleAccess(user?.role, moduleKey),
      canAccessModule: (moduleKey: ModuleKey) => canAccessModule(user?.role, moduleKey),
      visibleModules: getVisibleModules(user?.role),
    }),
    [user]
  );
}
