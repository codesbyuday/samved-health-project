"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, Send, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/services/apiClient";

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
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [officialMessage, setOfficialMessage] = useState(alert.message);
  const [citizenMessage, setCitizenMessage] = useState(alert.citizenMessage);

  if (disabled || isSent) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-sm">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        Alert Sent
      </span>
    );
  }

  const handleAiRewrite = async () => {
    setAiGenerating(true);
    setError(null);
    try {
      const res = await apiClient.post<{ alert_message: string; source: string }>(
        "/ai/generate-citizen-alert",
        {
          ward_number: alert.wardNumber,
          disease_name: alert.diseaseName,
          default_message: citizenMessage || officialMessage,
        }
      );

      if (res.data?.alert_message) {
        setCitizenMessage(res.data.alert_message);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to generate AI citizen alert");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSendAlert = async () => {
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/smc/outbreak-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wardNumber: alert.wardNumber,
          diseaseId: alert.diseaseId,
          diseaseName: alert.diseaseName,
          severity: alert.severity,
          message: officialMessage,
          citizenMessage: citizenMessage,
        }),
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
      setIsSent(true);
      setOpen(false);
      toast.success("Outbreak alert dispatched successfully!", {
        description: `Published to Citizen Alert Portal and notification sent to Ward ${alert.wardNumber}.`,
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (err: any) {
      setError(err?.message || "Failed to dispatch alert");
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
        >
          <Send className="h-3.5 w-3.5" />
          <span>Review & Send</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Review & Dispatch Ward Outbreak Alert
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded bg-muted px-2 py-1 font-medium text-foreground">
              Ward {alert.wardNumber}
            </span>
            <span className="rounded bg-red-100 dark:bg-red-950 px-2 py-1 font-semibold text-red-700 dark:text-red-300">
              {alert.diseaseName}
            </span>
            <span className="rounded bg-amber-100 dark:bg-amber-950 px-2 py-1 font-semibold text-amber-700 dark:text-amber-300 uppercase">
              Severity: {alert.severity}
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Internal Command / Operational Message
            </label>
            <textarea
              rows={2}
              value={officialMessage}
              onChange={(e) => setOfficialMessage(e.target.value)}
              className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5 rounded-xl border border-blue-200/70 bg-blue-50/40 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-blue-950 dark:text-blue-100">
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                Citizen Mobile App Notification
              </label>

              <button
                type="button"
                onClick={handleAiRewrite}
                disabled={aiGenerating}
                className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:bg-blue-700 disabled:opacity-60"
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3 w-3" />
                    <span>AI Rewrite with Gemini</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Gemini rewrites this alert into a calm, actionable 2-sentence public advisory avoiding panic.
            </p>

            <textarea
              rows={3}
              value={citizenMessage}
              onChange={(e) => setCitizenMessage(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-2 text-xs font-medium text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending || aiGenerating}
            onClick={handleSendAlert}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>Confirm & Dispatch Alert</span>
              </>
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
