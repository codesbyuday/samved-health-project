import { NextResponse } from "next/server";

import { getCurrentUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

type RequestPayload = {
  wardNumber?: number;
  diseaseId?: string;
  diseaseName?: string;
  severity?: string;
  message?: string;
  citizenMessage?: string;
};

export async function POST(request: Request) {
  const user = await getCurrentUserContext();
  const userId = user?.officialId ?? user?.id ?? "SMC-OFFICER-001";
  const body = (await request.json()) as RequestPayload;

  if (!body.wardNumber || !body.diseaseId || !body.diseaseName || !body.message) {
    return NextResponse.json({ error: "Missing required alert fields." }, { status: 400 });
  }

  const supabase = await createClient();
  const alertText = body.citizenMessage || body.message;
  const relatedEntity = `disease-outbreak:${body.wardNumber}:${body.diseaseId}`;

  // 1. Insert into alerts table for SMC Citizen Alert feed (/smc/alerts-notifications)
  const { error: alertError } = await supabase.from("alerts").insert({
    ward_number: body.wardNumber,
    alert_type: "Hot Alerts",
    message: alertText,
    severity: String(body.severity ?? "high").toLowerCase(),
    created_by: userId,
  });

  if (alertError) {
    return NextResponse.json(
      { error: alertError.message ?? "Unable to send alert." },
      { status: 400 },
    );
  }

  // 2. Insert into notifications table with related_entity so surveillance marks it "Approved / Sent"
  const isUuid = (val?: string | null) =>
    typeof val === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const normalizedPriority = ["critical", "high", "medium", "low"].includes(
    String(body.severity ?? "").toLowerCase()
  )
    ? String(body.severity).toLowerCase()
    : "high";

  const { error: notifError } = await supabase.from("notifications").insert({
    title: `Outbreak Advisory: ${body.diseaseName}`,
    message: alertText,
    type: "health_alert",
    priority: normalizedPriority,
    target_type: "ward",
    target_ward_number: body.wardNumber,
    related_entity: relatedEntity,
    created_by: isUuid(user?.id) ? user!.id : null,
  });

  if (notifError) {
    console.warn("Notice: notification insert error:", notifError.message);
  }

  return NextResponse.json({ ok: true, relatedEntity });
}
