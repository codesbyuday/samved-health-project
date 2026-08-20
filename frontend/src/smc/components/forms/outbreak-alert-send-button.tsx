"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

export function OutbreakAlertSendButton({
  alert,
  disabled,
}: {
  alert: {
    wardNumber: number;
    diseaseId: string;
    diseaseName: string;
    severity: string;
    message: string;
    citizenMessage: string;
  };
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={async () => {
          setPending(true);
          setError(null);

          const response = await fetch("/api/smc/outbreak-alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(alert),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;
            setError(payload?.error ?? "Unable to send ward alert.");
            setPending(false);
            return;
          }

          setPending(false);
          startTransition(() => {
            router.refresh();
          });
        }}
        className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Approving..." : disabled ? "Alert Sent" : "Send Alert"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

