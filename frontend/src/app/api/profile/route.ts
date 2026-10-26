import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";
import { apiClient } from "@/services/apiClient";

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

  const body = await request.json();
  const res = await apiClient.patch<any>(`/auth/me`, body);

  if (res.error) {
    return NextResponse.json({ success: false, error: res.error }, { status: 500 });
  }

  const profile = await getAuthenticatedStaffProfile(userId);
  return NextResponse.json({
    success: true,
    user: profile.user,
    message: "Settings updated successfully",
  });
}
