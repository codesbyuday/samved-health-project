import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";
import { apiClient } from "@/services/apiClient";

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
  const citizenId = body.citizen_id?.trim();
  const diagnosis = body.diagnosis?.trim();

  if (!citizenId || !diagnosis) {
    return NextResponse.json({ success: false, error: "Citizen and diagnosis are required" }, { status: 400 });
  }

  const res = await apiClient.post<any>("/laboratories/reports", {
    citizen_id: citizenId,
    hospital_id: user.hospital_id || "HOSP001",
    result: diagnosis,
    description: body.prescription || body.notes || "Health Record Entry",
    status: "completed",
    test_date: body.visit_date || new Date().toISOString().split("T")[0]
  });

  if (res.error) {
    return NextResponse.json({ success: false, error: res.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: res.data });
}
