import { NextRequest, NextResponse } from "next/server";
import { hasHospitalAccess, hasPermission } from "@/lib/rbac";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";
import { supabaseServer } from "@/lib/supabase-server";

type RouteContext = {
  params: Promise<{ caseId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { user, error } = await getAuthenticatedStaffProfile(userId);

  if (!user || error) {
    return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await context.params;

  const { data: diseaseCase, error: diseaseCaseError } = await supabaseServer
    .from("disease_cases")
    .select("case_id, hospital_id, severity, status")
    .eq("case_id", caseId)
    .single();

  if (diseaseCaseError || !diseaseCase) {
    return NextResponse.json({ success: false, error: "Disease case not found" }, { status: 404 });
  }

  if (!hasHospitalAccess(user.hospital_id, diseaseCase.hospital_id)) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
  }

  const body = (await request.json()) as {
    severity?: string;
    status?: string;
  };

  const canDoctorEdit = hasPermission(user.role, "update_treatment_full");
  const canNurseEdit = hasPermission(user.role, "update_treatment_limited");

  if (!canDoctorEdit && !canNurseEdit) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
  }

  if (canNurseEdit && !canDoctorEdit && body.severity !== undefined) {
    return NextResponse.json(
      { success: false, error: "Nurses can update disease status only" },
      { status: 403 }
    );
  }

  const updates: Record<string, string> = {};

  if (canDoctorEdit && body.severity) {
    updates.severity = body.severity;
  }

  if (body.status) {
    updates.status = body.status;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: "No changes provided" }, { status: 400 });
  }

  const { data: updatedCase, error: updateError } = await supabaseServer
    .from("disease_cases")
    .update(updates)
    .eq("case_id", caseId)
    .eq("hospital_id", user.hospital_id)
    .select()
    .single();

  if (updateError || !updatedCase) {
    return NextResponse.json(
      { success: false, error: updateError?.message || "Failed to update disease case" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: updatedCase });
}
