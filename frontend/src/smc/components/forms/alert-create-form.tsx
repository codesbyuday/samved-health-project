"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AlertCreateForm({
  wards,
}: {
  wards: { ward_id: number; ward_name: string | null }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sortedWards = [...wards].sort((a, b) => a.ward_id - b.ward_id);

  return (
    <form
      className="surface space-y-4 p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setError(null);
        setPending(true);

        try {
          const formData = new FormData(form);
          const response = await fetch("/api/smc/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(formData.entries())),
          });

          if (!response.ok) {
            const result = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;
            throw new Error(result?.error || "Failed to publish alert");
          }

          form.reset();
          router.refresh();
        } catch (submissionError) {
          setError(
            submissionError instanceof Error
              ? submissionError.message
              : "Failed to publish alert",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <h3 className="text-lg font-semibold">Create Emergency Alert</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <select
          name="alert_type"
          required
          className="rounded-lg border border-input bg-background px-3 py-2.5"
          defaultValue="Health Advisory"
        >
          <option value="Vaccination Campaign">Vaccination Campaign</option>
          <option value="Health Advisory">Health Advisory</option>
          <option value="Vaccination Drive">Vaccination Drive</option>
          <option value="Hot Alerts">Hot Alerts</option>
        </select>
        <select
          name="severity"
          required
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          name="ward_number"
          required
          className="rounded-lg border border-input bg-background px-3 py-2.5"
          defaultValue=""
        >
          <option value="" disabled>
            Select ward
          </option>
          <option value="all">All Wards</option>
          {sortedWards.map((ward) => (
            <option key={ward.ward_id} value={ward.ward_id}>
              {`Ward ${ward.ward_id} - ${ward.ward_name ?? `Ward ${ward.ward_id}`}`}
            </option>
          ))}
        </select>
        <input
          name="created_by"
          placeholder="Issued by"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
      </div>
      <textarea
        name="message"
        required
        placeholder="Emergency instructions"
        className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2.5"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground"
      >
        {pending ? "Publishing..." : "Publish alert"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

