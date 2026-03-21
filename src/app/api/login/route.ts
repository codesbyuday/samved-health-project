import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, StaffProfile, decodeSession, encodeSession } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabase-server";

function buildSessionResponse(user: StaffProfile) {
  const response = NextResponse.json({
    success: true,
    user,
  });

  response.cookies.set(AUTH_COOKIE_NAME, encodeSession({ user_id: user.user_id, role: user.auth_role }), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

async function getStaffProfileByUserId(userId: string) {
  const { data: profile, error: profileError } = await supabaseServer
    .from("hospital_staff")
    .select("name, designation, department, hospital_id, role, phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      user: null,
      error: "Hospital staff profile not found",
    };
  }

  const { data: authUser, error: userError } = await supabaseServer
    .from("auth_users")
    .select("id, email, role")
    .eq("id", userId)
    .eq("role", "hospital_staff")
    .maybeSingle();

  if (userError || !authUser) {
    return {
      user: null,
      error: "Access restricted to hospital staff only",
    };
  }

  return {
    user: {
      user_id: authUser.id,
      auth_role: authUser.role,
      email: authUser.email,
      name: profile.name,
      designation: profile.designation,
      department: profile.department,
      hospital_id: profile.hospital_id,
      role: profile.role,
      phone: profile.phone,
    } satisfies StaffProfile,
    error: null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
      sessionRestore?: boolean;
      userId?: string;
      role?: string;
    };

    if (body.sessionRestore) {
      const cookieSession = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const parsedCookie = cookieSession ? decodeSession(cookieSession) : null;
      const requestedUserId = body.userId || parsedCookie?.user_id;
      const requestedRole = body.role || parsedCookie?.role;

      if (!requestedUserId || requestedRole !== "hospital_staff") {
        return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
      }

      const { user, error } = await getStaffProfileByUserId(requestedUserId);

      if (error || !user) {
        return NextResponse.json({ success: false, error: error || "Session expired" }, { status: 401 });
      }

      return buildSessionResponse(user);
    }

    const identifier = body.identifier?.trim();
    const password = body.password?.trim();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: "Identifier and password are required" },
        { status: 400 }
      );
    }

    const { data: emailMatch, error: emailError } = await supabaseServer
      .from("auth_users")
      .select("id, email, phone, role, password_hash")
      .eq("email", identifier)
      .maybeSingle();

    if (emailError) {
      return NextResponse.json({ success: false, error: "Unable to verify user" }, { status: 500 });
    }

    const { data: phoneMatch, error: phoneError } = emailMatch
      ? { data: null, error: null }
      : await supabaseServer
          .from("auth_users")
          .select("id, email, phone, role, password_hash")
          .eq("phone", identifier)
          .maybeSingle();

    if (phoneError) {
      return NextResponse.json({ success: false, error: "Unable to verify user" }, { status: 500 });
    }

    const user = emailMatch || phoneMatch;

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (user.password_hash !== password) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    if (user.role !== "hospital_staff") {
      return NextResponse.json(
        { success: false, error: "Access restricted to hospital staff only" },
        { status: 403 }
      );
    }

    const { user: staffProfile, error: profileError } = await getStaffProfileByUserId(user.id);

    if (profileError || !staffProfile) {
      return NextResponse.json(
        { success: false, error: profileError || "Hospital staff profile not found" },
        { status: 404 }
      );
    }

    return buildSessionResponse(staffProfile);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }
}
