import { NextRequest, NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
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

  if (!hasPermission(user.role, "create_referral")) {
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
    to_hospital_id?: string;
    to_doctor_id?: string;
    referral_reason?: string;
    urgency_level?: string;
    notes?: string;
  };

  const citizenId = body.citizen_id?.trim();
  const toHospitalId = body.to_hospital_id?.trim();
  const toDoctorId = body.to_doctor_id?.trim() || null;
  const referralReason = body.referral_reason?.trim();
  const urgencyLevel = body.urgency_level?.trim() || "normal";
  const notes = body.notes?.trim() || null;

  if (!citizenId || !toHospitalId || !referralReason) {
    return NextResponse.json(
      { success: false, error: "Destination hospital and referral reason are required" },
      { status: 400 }
    );
  }

  if (toHospitalId === user.hospital_id) {
    return NextResponse.json(
      { success: false, error: "Destination hospital must be different from your hospital" },
      { status: 400 }
    );
  }

  const { data, error: insertError } = await supabaseServer
    .from("referrals")
    .insert({
      citizen_id: citizenId,
      from_hospital_id: user.hospital_id,
      referring_doctor_id: user.staff_uuid,
      to_hospital_id: toHospitalId,
      to_doctor_id: toDoctorId,
      referral_reason: referralReason,
      urgency_level: urgencyLevel,
      notes,
      status: "pending",
    })
    .select()
    .single();

  if (insertError || !data) {
    return NextResponse.json(
      { success: false, error: insertError?.message || "Failed to create referral" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
