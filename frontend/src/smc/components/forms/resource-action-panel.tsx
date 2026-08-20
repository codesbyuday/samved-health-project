"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActionKey =
  | "create_task"
  | "mark_review"
  | "notify_ops";

const ACTION_LABELS: Record<ActionKey, string> = {
  create_task: "Create Task",
  mark_review: "Mark Review",
  notify_ops: "Notify Ops",
};

export function ResourceActionPanel({
  hospitalId,
  hospitalName,
  wardId,
  wardName,
  occupancy,
  patientLoad,
  recommendation,
}: {
  hospitalId: string;
  hospitalName: string;
  wardId: number | null;
  wardName: string;
  occupancy: number;
  patientLoad: number;
  recommendation: string;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ActionKey | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAction(action: ActionKey) {
    setPendingAction(action);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/smc/resource-allocation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          hospitalId,
          hospitalName,
          wardId,
          wardName,
          occupancy,
          patientLoad,
          recommendation,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "Unable to complete resource action");
      }

      setMessage(result?.message || "Action completed.");
      router.refresh();
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to complete resource action",
      );
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ACTION_LABELS) as ActionKey[]).map((action) => (
          <button
            key={action}
            type="button"
            disabled={pendingAction !== null}
            onClick={() => runAction(action)}
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingAction === action ? "Working..." : ACTION_LABELS[action]}
          </button>
        ))}
      </div>
      {message ? <p className="text-xs text-green-700">{message}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

