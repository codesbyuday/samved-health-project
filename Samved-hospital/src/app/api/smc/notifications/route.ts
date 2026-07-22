import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

export async function POST(request: Request) {
  const user = await requireUserContext("/smc/alerts-notifications");
  const body = await request.json();
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    title: body.title,
    message: body.message,
    type: body.type,
    priority: body.priority,
    target_type: body.target_type,
    target_ward_number: body.target_ward_number
      ? Number(body.target_ward_number)
      : null,
    target_hospital_id: body.target_hospital_id || null,
    created_by: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

