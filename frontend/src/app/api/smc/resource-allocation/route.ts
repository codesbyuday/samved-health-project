import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

type ResourceActionPayload = {
  action?: "create_task" | "mark_review" | "notify_ops";
  hospitalId?: string;
  hospitalName?: string;
  wardId?: number | null;
  wardName?: string;
  occupancy?: number;
  patientLoad?: number;
  recommendation?: string;
};

function buildTaskEntityId(payload: ResourceActionPayload) {
  return `resource-task:${payload.action ?? "unknown"}:${payload.hospitalId ?? "unknown"}:${
    payload.wardId ?? "na"
  }`;
}

function buildNote(payload: ResourceActionPayload) {
  const wardPrefix = payload.wardId
    ? `Ward ${payload.wardId} - ${payload.wardName ?? `Ward ${payload.wardId}`}`
    : payload.wardName ?? "Unassigned ward";

  return `${payload.hospitalName} in ${wardPrefix} is currently at ${Number(
    payload.occupancy ?? 0,
  ).toFixed(1)}% bed occupancy with patient load ${payload.patientLoad ?? 0}. ${
    payload.recommendation ?? "Review current capacity."
  }`;
}

async function createFallbackTaskNotification({
  supabase,
  userId,
  payload,
  note,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  payload: ResourceActionPayload;
  note: string;
}) {
  return supabase.from("notifications").insert({
    title:
      payload.action === "mark_review"
        ? `Resource Review: ${payload.hospitalName}`
        : `Resource Task: ${payload.hospitalName}`,
    message: note,
    target_ward_number: payload.wardId ?? null,
    target_hospital_id: payload.hospitalId ?? null,
    related_entity: buildTaskEntityId(payload),
    created_by: userId,
  });
}

export async function POST(request: Request) {
  const user = await requireUserContext("/smc/resource-allocation");
  const body = (await request.json()) as ResourceActionPayload;
  const supabase = await createClient();

  if (!body.action || !body.hospitalId || !body.hospitalName) {
    return NextResponse.json({ error: "Missing required resource action fields." }, { status: 400 });
  }

  const note = buildNote(body);
  const priority =
    Number(body.occupancy ?? 0) >= 90 || Number(body.patientLoad ?? 0) >= 15
      ? "high"
      : Number(body.occupancy ?? 0) >= 75
        ? "medium"
        : "low";

  if (body.action === "create_task" || body.action === "mark_review") {
    const { error } = await supabase.from("resource_allocation_tasks").insert({
      hospital_id: body.hospitalId,
      ward_number: body.wardId ?? null,
      task_type: body.action === "create_task" ? "redistribution" : "review",
      status: body.action === "create_task" ? "open" : "under_review",
      message: note,
      created_by: user.id,
      assigned_official_id: user.officialId ?? null,
    });

    if (error) {
      const fallbackResult = await createFallbackTaskNotification({
        supabase,
        userId: user.id,
        payload: body,
        note,
      });

      if (fallbackResult.error) {
        return NextResponse.json(
          {
            error: `Unable to save internal task. ${fallbackResult.error.message}`,
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: body.action === "create_task" ? "Internal task created." : "Marked for review.",
    });
  }

  if (body.action === "notify_ops") {
    const [{ data: officials }, hospitalResult] = await Promise.all([
      supabase
        .from("smc_officials")
        .select("official_id, user_id, status")
        .not("user_id", "is", null),
      supabase.from("hospitals").select("hospital_id").eq("hospital_id", body.hospitalId).maybeSingle(),
    ]);

    const recipientRows = (officials ?? [])
      .filter((official) => String(official.status ?? "").toLowerCase().includes("active"))
      .map((official) => ({
        title: `Capacity Alert: ${body.hospitalName}`,
        message: note,
        type: "system",
        priority,
        target_type: "user",
        target_user_id: official.user_id,
        created_by: user.id,
      }));

    if (hospitalResult.data?.hospital_id) {
      recipientRows.push({
        title: `Capacity Alert: ${body.hospitalName}`,
        message: note,
        type: "system",
        priority,
        target_type: "hospital",
        target_hospital_id: body.hospitalId,
        created_by: user.id,
      } as {
        title: string;
        message: string;
        type: string;
        priority: string;
        target_type: string;
        target_hospital_id: string;
        created_by: string;
      });
    }

    if (recipientRows.length === 0) {
      return NextResponse.json({ error: "No active SMC officials or hospital recipient found." }, { status: 400 });
    }

    const { error } = await supabase.from("notifications").insert(recipientRows);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Operations teams notified." });
  }

  return NextResponse.json({ error: "Unsupported resource action." }, { status: 400 });
}

