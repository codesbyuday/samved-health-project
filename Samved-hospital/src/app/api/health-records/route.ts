import { NextRequest, NextResponse } from "next/server";
import { hasPermission, hasHospitalAccess } from "@/lib/rbac";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";
import { supabaseServer } from "@/lib/supabase-server";

type ReportedDiseasePayload = {
  disease_id?: string;
  severity?: string;
  status?: string;
};

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { user, error } = await getAuthenticatedStaffProfile(userId);

  if (!user || error) {
    return NextResponse.json({ success: false, error: error || "Unauthorized" }, { status: 401 });
  }

  if (!hasPermission(user.role, "add_treatment")) {
    return NextResponse.json({ success: false, error: "Access Denied" }, { status: 403 });
  }

  if (!user.hospital_id || !user.staff_uuid) {
    return NextResponse.json(
      { success: false, error: "Current staff profile is incomplete" },
      { status: 403 }
    );
  }

  const body = (await request.json()) as {
    citizen_id?: string;
    diagnosis?: string;
    prescription?: string;
    notes?: string;
    visit_date?: string;
    reportedDiseases?: ReportedDiseasePayload[];
  };

  const citizenId = body.citizen_id?.trim();
  const diagnosis = body.diagnosis?.trim();
  const prescription = body.prescription?.trim() || null;
  const notes = body.notes?.trim() || null;
  const visitDate = body.visit_date?.trim() || new Date().toISOString().split("T")[0];
  const reportedDiseases = Array.isArray(body.reportedDiseases) ? body.reportedDiseases : [];

  if (!citizenId || !diagnosis) {
    return NextResponse.json(
      { success: false, error: "Citizen and diagnosis are required" },
      { status: 400 }
    );
  }

  const { data: healthRecord, error: insertError } = await supabaseServer
    .from("health_records")
    .insert({
      citizen_id: citizenId,
      hospital_id: user.hospital_id,
      staff_id: user.staff_uuid,
      diagnosis,
      prescription,
      notes,
      visit_date: visitDate,
    })
    .select(`
      *,
      hospitals (*),
      hospital_staff (*)
    `)
    .single();

  if (insertError || !healthRecord) {
    return NextResponse.json(
      { success: false, error: insertError?.message || "Failed to create health record" },
      { status: 500 }
    );
  }

  if (reportedDiseases.length > 0 && hasPermission(user.role, "disease-reporting.manage")) {
    const diseaseRows = reportedDiseases
      .filter((disease) => disease.disease_id)
      .map((disease) => ({
        hospital_id: user.hospital_id,
        citizen_id: citizenId,
        disease_id: disease.disease_id,
        severity: disease.severity || "moderate",
        status: disease.status || "active",
        report_date: visitDate,
        reported_by: user.staff_uuid,
      }));

    if (diseaseRows.length > 0) {
      const { error: diseaseError } = await supabaseServer.from("disease_cases").insert(diseaseRows);

      if (diseaseError) {
        return NextResponse.json(
          {
            success: false,
            error: diseaseError.message || "Health record created but disease reporting failed",
          },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ success: true, data: healthRecord });
}
