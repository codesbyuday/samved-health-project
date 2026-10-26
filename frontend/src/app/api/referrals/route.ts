import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedStaffProfile, getSessionUserId } from "@/lib/server-auth";
import { apiClient } from "@/services/apiClient";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospital_id");

  if (supabase) {
    try {
      let query = supabase
        .from("referrals")
        .select("*, citizen:citizens(*), from_hospital:hospitals!from_hospital_id(*), to_hospital:hospitals!to_hospital_id(*), referring_doctor:hospital_staff!referring_doctor_id(*)")
        .order("created_at", { ascending: false });

      if (hospitalId) {
        query = query.or(`from_hospital_id.eq.${hospitalId},to_hospital_id.eq.${hospitalId}`);
      }

      const { data, error } = await query;
      if (!error && data) {
        return NextResponse.json({ success: true, data });
      }
    } catch {
      // Fallback
    }
  }

  const res = await apiClient.get<any[]>("/referrals", hospitalId ? { hospital_id: hospitalId } : undefined);
  return NextResponse.json({ success: !res.error, data: res.data || [], error: res.error });
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);
  let hospitalId: string | null = null;
  let staffUuid: string | null = null;

  if (userId) {
    const { user } = await getAuthenticatedStaffProfile(userId);
    if (user) {
      hospitalId = user.hospital_id || null;
      staffUuid = user.staff_uuid || null;
    }
  }

  const body = await request.json();
  const payload = {
    citizen_id: body.citizen_id,
    from_hospital_id: body.from_hospital_id || hospitalId,
    to_hospital_id: body.to_hospital_id,
    referring_doctor_id: body.referring_doctor_id || staffUuid,
    to_doctor_id: body.to_doctor_id || null,
    urgency_level: body.urgency_level || "normal",
    referral_reason: body.referral_reason,
    notes: body.notes || null,
    status: "pending",
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("referrals")
        .insert(payload)
        .select("*, citizen:citizens(*), from_hospital:hospitals!from_hospital_id(*), to_hospital:hospitals!to_hospital_id(*), referring_doctor:hospital_staff!referring_doctor_id(*)")
        .single();

      if (!error && data) {
        return NextResponse.json({ success: true, data });
      }
    } catch {
      // Fallback
    }
  }

  const res = await apiClient.post<any>("/referrals", payload);
  return NextResponse.json({ success: !res.error, data: res.data, error: res.error });
}
