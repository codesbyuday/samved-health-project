"use client";

import { CheckCircle2, Edit3, MessageSquareQuote } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ComplaintResolveForm({
  complaintId,
  initialRemarks = "",
  currentStatus = "pending",
}: {
  complaintId: string;
  initialRemarks?: string | null;
  currentStatus?: string;
}) {
  const router = useRouter();
  const [remarks, setRemarks] = useState(initialRemarks ?? "");
  const [status, setStatus] = useState(currentStatus ?? "resolved");
  const [isOpen, setIsOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const isResolved = currentStatus?.toLowerCase() === "resolved";

  return (
    <div className="relative">
      {!isOpen ? (
        <div className="flex items-center gap-2">
          {isResolved ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolved
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setStatus(isResolved ? "resolved" : "resolved");
              setIsOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold shadow-xs hover:bg-muted transition-colors"
          >
            {isResolved ? (
              <>
                <Edit3 className="h-3 w-3" />
                Edit Remarks
              </>
            ) : (
              <>
                <MessageSquareQuote className="h-3.5 w-3.5 text-primary" />
                Resolve / Action
              </>
            )}
          </button>
        </div>
      ) : (
        <form
          className="w-72 rounded-xl border border-border bg-card p-3 shadow-xl space-y-2.5 z-20"
          onSubmit={async (event) => {
            event.preventDefault();
            setPending(true);
            try {
              await fetch(`/api/smc/complaints/${complaintId}/resolve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ remarks, status }),
              });
              router.refresh();
              setIsOpen(false);
            } catch (err) {
              console.error("Failed to resolve complaint:", err);
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="flex items-center justify-between border-b border-border pb-1.5">
            <span className="text-xs font-semibold text-foreground">Action: {complaintId}</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Update Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
            >
              <option value="resolved">Mark as Resolved</option>
              <option value="in_progress">In Progress</option>
              <option value="under_review">Under Review</option>
              <option value="escalated">Escalate to Head</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Officer Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Action taken or follow-up notes..."
              rows={2}
              className="w-full rounded-md border border-input bg-background p-2 text-xs focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {pending ? "Saving..." : "Save Action"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
