import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireUserContext("/smc/vaccination-campaigns");
  const body = (await request.json()) as {
    name?: string;
    vaccine_type?: string;
    ward_id?: string;
    date?: string;
    target_population?: string;
    status?: string;
  };
  const supabase = await createClient();

  if (!body.name || !body.vaccine_type || !body.ward_id || !body.date || !body.target_population) {
    return NextResponse.json({ error: "Missing required campaign fields." }, { status: 400 });
  }

  const { data: wards, error: wardsError } =
    body.ward_id === "all"
      ? await supabase.from("wards").select("ward_id, ward_name").order("ward_id")
      : await supabase
          .from("wards")
          .select("ward_id, ward_name")
          .eq("ward_id", Number(body.ward_id));

  if (wardsError) {
    return NextResponse.json({ error: wardsError.message }, { status: 400 });
  }

  const selectedWards = wards ?? [];

  if (selectedWards.length === 0) {
    return NextResponse.json({ error: "No wards available for this campaign." }, { status: 400 });
  }

  const campaignRows = selectedWards.map((ward) => ({
    name: body.name,
    vaccine_type: body.vaccine_type,
    ward_id: ward.ward_id,
    date: body.date,
    target_population: body.target_population,
    status: body.status || "scheduled",
  }));

  const { error: campaignError } = await supabase
    .from("vaccination_campaigns")
    .insert(campaignRows)
    .select("campaign_id, ward_id");

  if (campaignError) {
    return NextResponse.json({ error: campaignError.message }, { status: 400 });
  }

  const alertRows = selectedWards.map((ward) => {
    const wardLabel = ward.ward_name
      ? `Ward ${ward.ward_id} - ${ward.ward_name}`
      : `Ward ${ward.ward_id}`;

    return {
      ward_number: ward.ward_id,
      alert_type: "Vaccination Drive",
      message: `${body.name} is scheduled for ${wardLabel} on ${body.date}. Vaccine: ${body.vaccine_type}. Target population: ${body.target_population}. Please visit your assigned health center for updates.`,
      severity: "medium",
      created_by: user.officialId ?? user.id,
    };
  });

  const { error: alertError } = await supabase.from("alerts").insert(alertRows);

  if (alertError) {
    return NextResponse.json(
      {
        error: `Campaign created, but health alerts could not be sent: ${alertError.message}`,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}

