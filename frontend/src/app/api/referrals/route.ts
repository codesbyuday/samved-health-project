import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { user, error } = await getAuthenticatedStaffProfile(userId);

  if (!user || error) {
    return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  return NextResponse.json({
    success: true,
    data: {
      referral_id: `REF-${Date.now()}`,
      status: "pending",
      ...body,
    },
  });
}
