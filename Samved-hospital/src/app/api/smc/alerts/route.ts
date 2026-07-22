import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

const ALLOWED_ALERT_TYPES = new Set([
  "Vaccination Campaign",
  "Health Advisory",
  "Vaccination Drive",
  "Hot Alerts",
]);

export async function POST(request: Request) {
  const user = await requireUserContext("/smc/emergency-response");
  const body = await request.json();
  const supabase = await createClient();

  if (!ALLOWED_ALERT_TYPES.has(String(body.alert_type ?? ""))) {
    return NextResponse.json(
      {
        error:
          "Alert type must be one of: Vaccination Campaign, Health Advisory, Vaccination Drive, Hot Alerts.",
      },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("alerts").insert({
    ward_number: Number(body.ward_number),
    alert_type: body.alert_type,
    message: body.message,
    severity: body.severity,
    created_by: body.created_by || user.officialId || user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

