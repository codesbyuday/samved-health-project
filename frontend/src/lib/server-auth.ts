import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, AuthenticatedUser, decodeSession } from "@/lib/auth";
import { apiClient } from "@/services/apiClient";

export function getSessionUserId(request: NextRequest) {
  const sessionValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionValue ? decodeSession(sessionValue) : null;
  return session?.role === "hospital_staff" ? session.user_id : null;
}

export async function getAuthenticatedStaffProfile(userId: string): Promise<{
  user: AuthenticatedUser | null;
  authUser: { id: string; email: string | null; role: string | null; phone: string | null } | null;
  error: string | null;
}> {
  const res = await apiClient.post<any>("/auth/login", {
    sessionRestore: true,
    userId,
    role: "hospital_staff",
  });

  if (res.error || !res.data || !res.data.success || !res.data.user) {
    return { user: null, authUser: null, error: res.error || "Session expired" };
  }

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
