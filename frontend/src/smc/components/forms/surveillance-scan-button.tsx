"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function SurveillanceScanButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleScan = async () => {
    setLoading(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/smc/outbreak-detection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || "Surveillance scan failed");
      }

      const result = await response.json();
      const detectedInfo =
        result.detected !== undefined
          ? ` (${result.detected} outbreak signals detected)`
          : "";
      setStatusMessage(
        `AI Surveillance completed! ${result.count ?? 0} ward-disease combinations analyzed${detectedInfo}.`
      );
      setIsError(false);

      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err?.message || "Failed to trigger AI surveillance scan");
    } finally {
      setLoading(false);
      setTimeout(() => {
        setStatusMessage(null);
      }, 6000);
    }
  };

  const busy = loading || isPending;

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={handleScan}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Scanning with AI...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Scan with AI Surveillance</span>
          </>
        )}
      </button>

      {statusMessage && (
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            isError ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {isError ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
