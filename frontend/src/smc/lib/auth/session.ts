import { redirect } from "next/navigation";
import { canAccess } from "@/smc/lib/auth/roles";
import type { UserContext } from "@/smc/lib/types/schema";
import { cookies } from "next/headers";

export async function getCurrentUserContext(): Promise<UserContext | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("samved_session")?.value;

  if (!sessionToken) {
    return null;
  }

  // Mapped to official SMC-OFF-001 from smc_officials table with valid user_id UUID
  return {
    id: "c3000001-0000-0000-0000-000000000001",
    email: "official@smc.gov.in",
    role: "SMC Admin",
    officialId: "SMC-OFF-001",
    name: "Rajendra Kulkarni",
    designation: "Municipal Commissioner",
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
