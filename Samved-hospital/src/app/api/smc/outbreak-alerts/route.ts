import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
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
  const user = await requireUserContext("/smc/disease-surveillance");
  const body = (await request.json()) as RequestPayload;

  if (!body.wardNumber || !body.diseaseId || !body.diseaseName || !body.message) {
    return NextResponse.json({ error: "Missing required alert fields." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: alertError } = await supabase.from("alerts").insert({
    ward_number: body.wardNumber,
    alert_type: "Hot Alerts",
    message: body.message,
    severity: String(body.severity ?? "medium").toLowerCase(),
    created_by: user.officialId ?? user.id,
  });

  if (alertError) {
    return NextResponse.json(
      { error: alertError.message ?? "Unable to send alert." },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

