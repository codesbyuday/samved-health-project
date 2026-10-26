import { NextRequest, NextResponse } from "next/server";
import { hasPermission, hasHospitalAccess } from "@/lib/rbac";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";
import { supabaseServer } from "@/lib/supabase-server";

type RouteContext = {
  params: Promise<{ recordId: string }>;
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

  const { recordId } = await context.params;

  const { data: existingRecord, error: existingError } = await supabaseServer
    .from("health_records")
    .select("record_id, hospital_id, diagnosis, prescription, notes")
    .eq("record_id", recordId)
    .single();

  if (existingError || !existingRecord) {
    return NextResponse.json({ success: false, error: "Health record not found" }, { status: 404 });
  }

  if (!hasHospitalAccess(user.hospital_id, existingRecord.hospital_id)) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
  }

  const body = (await request.json()) as {
    diagnosis?: string;
    prescription?: string;
    notes?: string;
  };

  const diagnosis = typeof body.diagnosis === "string" ? body.diagnosis.trim() : undefined;
  const prescription = typeof body.prescription === "string" ? body.prescription.trim() : undefined;
  const notes = typeof body.notes === "string" ? body.notes.trim() : undefined;

  const isDoctor = hasPermission(user.role, "update_treatment_full");
  const isNurse = hasPermission(user.role, "update_treatment_limited");

  if (!isDoctor && !isNurse) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
  }

  if (isNurse && (diagnosis !== undefined || prescription !== undefined)) {
    return NextResponse.json(
      { success: false, error: "Nurses can update notes only" },
      { status: 403 }
    );
  }

  const updates: Record<string, string | null> = {};

  if (isDoctor) {
    if (diagnosis !== undefined) {
      if (!diagnosis) {
        return NextResponse.json(
          { success: false, error: "Diagnosis is required" },
          { status: 400 }
        );
      }
      updates.diagnosis = diagnosis;
    }

    if (prescription !== undefined) {
      updates.prescription = prescription || null;
    }
  }

  if (notes !== undefined) {
    updates.notes = notes || null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ success: false, error: "No changes provided" }, { status: 400 });
  }

  const { data: updatedRecord, error: updateError } = await supabaseServer
    .from("health_records")
    .update(updates)
    .eq("record_id", recordId)
    .eq("hospital_id", user.hospital_id)
    .select(`
      *,
      hospitals (*),
      hospital_staff (*)
    `)
    .single();

  if (updateError || !updatedRecord) {
    return NextResponse.json(
      { success: false, error: updateError?.message || "Failed to update health record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: updatedRecord });
}
