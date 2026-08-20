"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VerifyHospitalButton({
  hospitalId,
  verified,
}: {
  hospitalId: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending || verified}
      onClick={async () => {
        setPending(true);
        await fetch(`/api/smc/hospitals/${hospitalId}/verify`, { method: "POST" });
        router.refresh();
        setPending(false);
      }}
      className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      {verified ? "Verified" : pending ? "Verifying..." : "Verify hospital"}
    </button>
  );
}

