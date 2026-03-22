import { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, AuthenticatedUser, decodeSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase-server";

export function getSessionUserId(request: NextRequest) {
  const sessionValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = sessionValue ? decodeSession(sessionValue) : null;
  return session?.role === "hospital_staff" ? session.user_id : null;
}

export async function getAuthenticatedStaffProfile(userId: string): Promise<{
  user: AuthenticatedUser | null;
  authUser: { id: string; email: string | null; role: string | null; phone: string | null; password_hash?: string | null } | null;
  error: string | null;
}> {
  const { data: authUser, error: authError } = await supabaseServer
    .from("auth_users")
    .select("id, email, role, phone, password_hash")
    .eq("id", userId)
    .eq("role", "hospital_staff")
    .maybeSingle();

  if (authError || !authUser) {
    return { user: null, authUser: null, error: "Session expired" };
  }

  const { data: staff, error: staffError } = await supabaseServer
    .from("hospital_staff")
    .select(
      "staff_uuid, name, staff_id, designation, department, phone, address, joined_at, hospital_id, role, hospitals (hospital_id, name)"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (staffError || !staff) {
    return { user: null, authUser, error: "Hospital staff profile not found" };
  }

  const hospitalRecord = Array.isArray(staff.hospitals) ? staff.hospitals[0] : staff.hospitals;

  return {
    authUser,
    user: {
      user_id: authUser.id,
      access_role: authUser.role,
      name: staff.name,
      email: authUser.email,
      role: staff.role || authUser.role,
      hospital_id: staff.hospital_id,
      hospital_name: hospitalRecord?.name || null,
      staff_uuid: staff.staff_uuid,
      staff_id: staff.staff_id,
      designation: staff.designation,
      department: staff.department,
      phone: staff.phone || authUser.phone,
      address: staff.address,
      joined_at: staff.joined_at,
    },
    error: null,
  };
}
