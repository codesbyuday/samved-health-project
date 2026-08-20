"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CampaignCreateForm({
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
          const response = await fetch("/api/smc/campaigns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(formData.entries())),
          });

          if (!response.ok) {
            const result = (await response.json().catch(() => null)) as
              | { error?: string }
              | null;
            throw new Error(result?.error || "Failed to create campaign");
          }

          form.reset();
          router.refresh();
        } catch (submissionError) {
          setError(
            submissionError instanceof Error
              ? submissionError.message
              : "Failed to create campaign",
          );
        } finally {
          setPending(false);
        }
      }}
    >
      <h3 className="text-lg font-semibold">Create Vaccination Campaign</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Campaign name"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <input
          name="vaccine_type"
          required
          placeholder="Vaccine type"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <select
          name="ward_id"
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
          name="date"
          type="date"
          required
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <input
          name="target_population"
          required
          placeholder="Target population"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <select
          name="status"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        >
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground"
      >
        {pending ? "Creating..." : "Create campaign"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </form>
  );
}

