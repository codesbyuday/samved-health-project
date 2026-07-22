"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ComplaintResolveForm({ complaintId }: { complaintId: string }) {
  const router = useRouter();
  const [remarks, setRemarks] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <form
      className="flex min-w-72 flex-col gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        await fetch(`/api/smc/complaints/${complaintId}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remarks }),
        });
        router.refresh();
        setRemarks("");
        setPending(false);
      }}
    >
      <textarea
        value={remarks}
        onChange={(event) => setRemarks(event.target.value)}
        placeholder="Officer remarks"
        className="min-h-20 rounded-lg border border-input bg-background px-3 py-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-border bg-muted px-3 py-2 font-medium hover:bg-accent"
      >
        {pending ? "Updating..." : "Mark resolved"}
      </button>
    </form>
  );
}

