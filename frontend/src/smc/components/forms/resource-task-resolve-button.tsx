"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ResourceTaskResolveButton({
  taskId,
  source,
}: {
  taskId: string;
  source: "task" | "notification";
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveTask() {
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/smc/resource-allocation/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "Unable to update resource task");
      }

      router.refresh();
    } catch (taskError) {
      setError(
        taskError instanceof Error ? taskError.message : "Unable to update resource task",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={resolveTask}
        className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Updating..." : "Resolve"}
      </button>
      {error ? <p className="max-w-40 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

