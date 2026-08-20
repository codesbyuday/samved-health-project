import { redirect } from "next/navigation";

import { normalizeRole, canAccess } from "@/smc/lib/auth/roles";
import { createClient } from "@/smc/lib/supabase/server";
import type { UserContext } from "@/smc/lib/types/schema";

import { cookies } from "next/headers";

export async function getCurrentUserContext(): Promise<UserContext | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("samved_session")?.value;

  if (!sessionToken) {
    return null;
  }

  return {
    id: "SMC-OFFICER-001",
    email: "official@smc.gov.in",
    role: "smc_admin",
    officialId: "SMC-OFF-001",
    name: "Solapur Municipal Health Officer",
    designation: "Chief Health Administrator",
  };
}

export async function requireUserContext(pathname?: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/smc/login");
  }

  if (pathname && !canAccess(context.role, pathname)) {
    redirect("/smc/dashboard");
  }

  return context;
}

