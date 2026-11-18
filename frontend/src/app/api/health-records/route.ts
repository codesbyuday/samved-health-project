import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";
import { supabaseServer } from "@/lib/supabase-server";

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

  const hospitalId = user.hospital_id || body.hospital_id || "HOSP001";
  const staffUuid = user.staff_uuid || user.staff_id;

  try {
    const { data: record, error: insertError } = await supabaseServer
      .from("health_records")
      .insert({
        citizen_id: citizenId,
        hospital_id: hospitalId,
        staff_id: staffUuid,
        diagnosis: diagnosis,
        prescription: body.prescription?.trim() || null,
        notes: body.notes?.trim() || null,
        visit_date: body.visit_date || new Date().toISOString().split("T")[0],
      })
      .select("*, hospitals(*), hospital_staff(*)")
      .single();

    if (insertError) {
      console.error("Error creating health record:", insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    if (Array.isArray(body.reportedDiseases) && body.reportedDiseases.length > 0) {
      const diseaseCases = body.reportedDiseases.map((d: any) => ({
        hospital_id: hospitalId,
        citizen_id: citizenId,
        disease_id: d.disease_id,
        report_date: body.visit_date || new Date().toISOString().split("T")[0],
        severity: d.severity || "moderate",
        status: d.status || "active",
        reported_by: staffUuid,
        health_record_id: record?.record_id || null,
      }));

      const { error: diseaseError } = await supabaseServer
        .from("disease_cases")
        .insert(diseaseCases);

      if (diseaseError) {
        console.error("Error creating disease cases:", diseaseError);
      }
    }

    return NextResponse.json({ success: true, data: record });
  } catch (err: any) {
    console.error("Unexpected error creating health record:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
