import { redirect } from "next/navigation";
import { canAccess } from "@/smc/lib/auth/roles";
import type { UserContext } from "@/smc/lib/types/schema";
import { cookies } from "next/headers";

import { normalizeRole } from "@/smc/lib/auth/roles";

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = Buffer.from(payloadBase64, "base64").toString("utf-8");
      return JSON.parse(json);
    }
  } catch {
    // ignore decoding errors
  }
  return null;
}

export async function getCurrentUserContext(): Promise<UserContext | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("samved_session")?.value;
  const profileCookie = cookieStore.get("smc_user_profile")?.value;

  if (!sessionToken && !profileCookie) {
    return null;
  }

  // 1. Try reading profile from cookie
  if (profileCookie) {
    try {
      const profile = JSON.parse(decodeURIComponent(profileCookie));
      if (profile && (profile.user_id || profile.id)) {
        return {
          id: profile.user_id || profile.id,
          email: profile.email || null,
          role: normalizeRole(profile.role || profile.access_role),
          officialId: profile.official_id || profile.officialId || null,
          name: profile.name || "SMC Official",
          designation: profile.designation || "Municipal Officer",
          phone: profile.phone || null,
          status: profile.status || "active",
        };
      }
    } catch {
      // fallback to token decoding
    }
  }

  // 2. Fallback to decoding the JWT session token
  if (sessionToken) {
    const decoded = decodeJwtPayload(sessionToken);
    if (decoded && (decoded.user_id || decoded.sub)) {
      return {
        id: decoded.user_id || decoded.sub,
        email: decoded.email || null,
        role: normalizeRole(decoded.role),
        officialId: decoded.official_id || null,
        name: decoded.name || "SMC Official",
        designation: decoded.designation || "Municipal Officer",
        phone: decoded.phone || null,
        status: decoded.status || "active",
      };
    }
  }

  return null;
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
