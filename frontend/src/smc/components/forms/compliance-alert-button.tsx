"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ComplianceAlertButton({
  hospitalId,
  hospitalName,
  wardName,
  complianceStatus,
  lastUpdatedAt,
  disabled,
}: {
  hospitalId: string;
  hospitalName: string;
  wardName: string;
  complianceStatus: string;
  lastUpdatedAt: string | null;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendReminder() {
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/smc/compliance-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId,
          hospitalName,
          wardName,
          complianceStatus,
          lastUpdatedAt,
        }),
      });

      const result = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;

      if (!response.ok) {
        throw new Error(result?.error || "Unable to send compliance alert.");
      }

      setMessage(result?.message || "Reminder sent.");
      router.refresh();
    } catch (alertError) {
      setError(
        alertError instanceof Error ? alertError.message : "Unable to send compliance alert.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={sendReminder}
        className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Sending..." : disabled ? "Compliant" : "Send Reminder"}
      </button>
      {message ? <p className="text-xs text-green-700">{message}</p> : null}
      {error ? <p className="max-w-44 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

