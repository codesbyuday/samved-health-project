import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireUserContext("/smc/hospitals");
  const { id } = await context.params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("hospitals")
    .update({ verified_by_smc: true })
    .eq("hospital_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

