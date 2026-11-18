import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, AuthenticatedUser, decodeSession } from "@/lib/auth";
import { apiClient } from "@/services/apiClient";
import { supabaseServer } from "@/lib/supabase-server";

export function getSessionUserId(request: NextRequest) {
  const sessionValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionValue ? decodeSession(sessionValue) : null;
  return session?.user_id || null;
}

export async function getAuthenticatedStaffProfile(userId: string): Promise<{
  user: AuthenticatedUser | null;
  authUser: { id: string; email: string | null; role: string | null; phone: string | null } | null;
  error: string | null;
}> {
  try {
    const res = await apiClient.post<any>("/auth/login", {
      sessionRestore: true,
      userId,
      role: "hospital_staff",
    });

    if (res.data?.success && res.data.user) {
      const u = res.data.user;
      return {
        user: u,
        authUser: {
          id: u.user_id,
          email: u.email,
          role: u.access_role,
          phone: u.phone,
        },
        error: null,
      };
    }
  } catch (e) {
    console.error("Backend session restore error, attempting Supabase fallback:", e);
  }

  // Fallback via supabaseServer
  if (supabaseServer) {
    try {
      const [staffRes, userRes] = await Promise.all([
        supabaseServer.from("hospital_staff").select("*, hospitals(*)").eq("user_id", userId).limit(1),
        supabaseServer.from("auth_users").select("*").eq("id", userId).limit(1),
      ]);

      const staff = staffRes.data?.[0];
      const authU = userRes.data?.[0];

      if (staff || authU) {
        const hospital = staff?.hospitals || {};
        const role = staff?.role || authU?.role || "hospital_staff";
        const email = authU?.email || null;
        const phone = staff?.phone || authU?.phone || null;

        const user: AuthenticatedUser = {
          user_id: userId,
          access_role: role,
          name: staff?.name || email?.split("@")[0] || "Hospital Staff",
          email,
          role,
          hospital_id: staff?.hospital_id || null,
          hospital_name: hospital.name || null,
          staff_uuid: staff?.staff_uuid || null,
          staff_id: staff?.staff_id || null,
          designation: staff?.designation || null,
          department: staff?.department || null,
          phone,
          address: staff?.address || null,
          joined_at: staff?.joined_at || null,
        };

        return {
          user,
          authUser: {
            id: userId,
            email,
            role,
            phone,
          },
          error: null,
        };
      }
    } catch (err: any) {
      console.error("Supabase fallback session restore error:", err);
    }
  }

  return { user: null, authUser: null, error: "Session expired" };
}
