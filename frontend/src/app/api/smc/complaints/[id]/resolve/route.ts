import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await requireUserContext("/smc/citizen-complaints");
  const { id } = await context.params;
  const body = await request.json();
  const supabase = await createClient();

  const { error } = await supabase
    .from("complaints")
    .update({
      status: "resolved",
      remarks_by_officers: body.remarks ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("complaint_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

