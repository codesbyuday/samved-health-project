import { NextResponse } from "next/server";

import { requireUserContext } from "@/smc/lib/auth/session";
import { createClient } from "@/smc/lib/supabase/server";

type TaskMutationPayload = {
  source?: "task" | "notification";
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  await requireUserContext("/smc/resource-allocation");
  const { taskId } = await context.params;
  const body = (await request.json()) as TaskMutationPayload;
  const supabase = await createClient();

  if (!taskId || !body.source) {
    return NextResponse.json({ error: "Missing task update details." }, { status: 400 });
  }

  if (body.source === "task") {
    const { error } = await supabase
      .from("resource_allocation_tasks")
      .update({ status: "resolved" })
      .eq("task_id", taskId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Task resolved." });
  }

  const { error } = await supabase
    .from("notifications")
    .update({ related_entity: "resource-task-resolved" })
    .eq("notification_id", taskId)
    .like("related_entity", "resource-task:%");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, message: "Task removed." });
}

