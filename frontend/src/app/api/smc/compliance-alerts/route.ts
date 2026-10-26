import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";
import { formatDate } from "@/smc/lib/utils";

type ComplianceAlertPayload = {
  hospitalId?: string;
  hospitalName?: string;
  wardName?: string;
  complianceStatus?: string;
  lastUpdatedAt?: string | null;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FALLBACK_OFFICIAL_UUID = "c3000001-0000-0000-0000-000000000001"; // SMC-OFF-001 in smc_officials

export async function POST(request: Request) {
  const user = await requireUserContext("/smc/data-compliance");
  const body = (await request.json()) as ComplianceAlertPayload;
  const supabase = await createClient();

  if (!body.hospitalId || !body.hospitalName) {
    return NextResponse.json({ error: "Missing hospital details for compliance alert." }, { status: 400 });
  }

  const normalizedStatus = String(body.complianceStatus ?? "").toLowerCase();
  if (normalizedStatus === "compliant") {
    return NextResponse.json({ error: "This hospital is currently compliant." }, { status: 400 });
  }

  const message = `${body.hospitalName} in ${body.wardName ?? "the assigned ward"} has not updated operational data on time. Last known update: ${formatDate(body.lastUpdatedAt, "dd MMM yyyy, p")}. Please update bed and medicine stock records immediately.`;

  const creatorUuid = user.id && UUID_REGEX.test(user.id) ? user.id : FALLBACK_OFFICIAL_UUID;

  const { error } = await supabase.from("notifications").insert({
    title: `Compliance Reminder: ${body.hospitalName}`,
    message,
    type: "system",
    priority: normalizedStatus === "critical" ? "high" : "medium",
    target_type: "hospital",
    target_hospital_id: body.hospitalId,
    related_entity: `compliance-alert:${body.hospitalId}`,
    created_by: creatorUuid,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Compliance reminder sent to hospital." });
}
