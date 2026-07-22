import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { user, error } = await getAuthenticatedStaffProfile(userId);

  if (error || !user) {
    return NextResponse.json({ success: false, error: error || "Unable to load profile" }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}

export async function PATCH(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    phone?: string;
    address?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const nextPhone = body.phone?.trim() || null;
  const nextAddress = body.address?.trim() || null;
  const nextPassword = body.newPassword?.trim() || "";
  const currentPassword = body.currentPassword?.trim() || "";

  const profileResult = await getAuthenticatedStaffProfile(userId);

  if (!profileResult.user || !profileResult.authUser) {
    return NextResponse.json(
      { success: false, error: profileResult.error || "Unable to load profile" },
      { status: 404 }
    );
  }

  if (nextPhone && nextPhone !== profileResult.user.phone) {
    const { data: existingPhoneUser, error: phoneLookupError } = await supabaseServer
      .from("auth_users")
      .select("id")
      .eq("phone", nextPhone)
      .maybeSingle();

    if (phoneLookupError) {
      return NextResponse.json({ success: false, error: "Unable to validate phone number" }, { status: 500 });
    }

    if (existingPhoneUser && existingPhoneUser.id !== userId) {
      return NextResponse.json(
        { success: false, error: "Phone number already exists for another user" },
        { status: 409 }
      );
    }
  }

  if (nextPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is required to set a new password" },
        { status: 400 }
      );
    }

    if (profileResult.authUser.password_hash !== currentPassword) {
      return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 });
    }
  }

  const authUpdates: Record<string, string | null> = {};
  const staffUpdates: Record<string, string | null> = {};

  if (nextPhone !== profileResult.user.phone) {
    authUpdates.phone = nextPhone;
    staffUpdates.phone = nextPhone;
  }

  if (nextAddress !== profileResult.user.address) {
    staffUpdates.address = nextAddress;
  }

  if (nextPassword) {
    authUpdates.password_hash = nextPassword;
  }

  if (Object.keys(authUpdates).length > 0) {
    const { error: authUpdateError } = await supabaseServer
      .from("auth_users")
      .update(authUpdates)
      .eq("id", userId);

    if (authUpdateError) {
      return NextResponse.json({ success: false, error: "Failed to update account settings" }, { status: 500 });
    }
  }

  if (Object.keys(staffUpdates).length > 0) {
    const { error: staffUpdateError } = await supabaseServer
      .from("hospital_staff")
      .update(staffUpdates)
      .eq("user_id", userId);

    if (staffUpdateError) {
      return NextResponse.json({ success: false, error: "Failed to update staff profile" }, { status: 500 });
    }
  }

  const refreshedProfile = await getAuthenticatedStaffProfile(userId);

  if (!refreshedProfile.user) {
    return NextResponse.json({ success: false, error: "Unable to reload profile" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    user: refreshedProfile.user,
    message: "Settings updated successfully",
  });
}
