"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NotificationCreateForm({
  wards,
  hospitals,
}: {
  wards: { ward_id: number; ward_name: string | null }[];
  hospitals: { hospital_id: string; name: string | null }[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <form
      className="surface space-y-4 p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        setPending(true);

        try {
          const formData = new FormData(form);
          const response = await fetch("/api/smc/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(formData.entries())),
          });

          if (!response.ok) {
            throw new Error("Failed to send notification");
          }

          form.reset();
          router.refresh();
        } finally {
          setPending(false);
        }
      }}
    >
      <h3 className="text-lg font-semibold">Send Notification</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          name="title"
          required
          placeholder="Notification title"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <input
          name="type"
          required
          placeholder="Type"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <select
          name="priority"
          required
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select
          name="target_type"
          required
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        >
          <option value="user">Citizens</option>
          <option value="hospital">Hospitals</option>
          <option value="ward">Specific Wards</option>
        </select>
        <select
          name="target_ward_number"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        >
          <option value="">All wards</option>
          {wards.map((ward) => (
            <option key={ward.ward_id} value={ward.ward_id}>
              {ward.ward_name ?? `Ward ${ward.ward_id}`}
            </option>
          ))}
        </select>
        <select
          name="target_hospital_id"
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        >
          <option value="">All hospitals</option>
          {hospitals.map((hospital) => (
            <option key={hospital.hospital_id} value={hospital.hospital_id}>
              {hospital.name ?? hospital.hospital_id}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="message"
        required
        placeholder="Message"
        className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2.5"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground"
      >
        {pending ? "Sending..." : "Send notification"}
      </button>
    </form>
  );
}

