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

  const updatePayload: Record<string, any> = {
    remarks_by_officers: body.remarks ?? null,
  };
  if (body.status) {
    updatePayload.status = body.status;
  } else {
    updatePayload.status = "resolved";
  }
  if (updatePayload.status === "resolved") {
    updatePayload.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("complaints")
    .update(updatePayload)
    .eq("complaint_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

