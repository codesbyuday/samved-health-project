import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { AlertCreateForm } from "@/smc/components/forms/alert-create-form";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { createClient } from "@/smc/lib/supabase/server";
import { formatDate } from "@/smc/lib/utils";

export default async function AlertsNotificationsPage() {
  const supabase = await createClient();
  const [{ data: wards }, { data: alerts }] = await Promise.all([
    supabase.from("wards").select("ward_id, ward_name").order("ward_id"),
    supabase
      .from("alerts")
      .select("alert_id, ward_number, alert_type, severity, message, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const wardsMap = new Map((wards ?? []).map((ward) => [ward.ward_id, ward.ward_name]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citizen Alert Publishing"
        description="Publish citizen-facing vaccination drives, health advisories, and hot alerts. Personal user notifications are not shown in this admin view."
      />

      <AlertCreateForm wards={wards ?? []} />

      <TableCard
        title="Recent Citizen Alerts"
        columns={[
          { key: "ward", label: "Ward" },
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "message", label: "Message" },
          { key: "created", label: "Created At" },
        ]}
        rows={(alerts ?? []).map((row) => ({
          id: row.alert_id,
          ward: row.ward_number
            ? `Ward ${row.ward_number} - ${wardsMap.get(row.ward_number) ?? `Ward ${row.ward_number}`}`
            : "All Wards",
          title: row.alert_type ?? "Untitled",
          priority: <StatusBadge value={row.severity} />,
          message: row.message ?? "No message",
          created: formatDate(row.created_at, "dd MMM yyyy, p"),
        }))}
      />
    </div>
  );
}

