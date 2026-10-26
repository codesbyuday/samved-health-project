import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { AlertCreateForm } from "@/smc/components/forms/alert-create-form";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getEmergencyResponseData } from "@/smc/lib/data/queries";
import { createClient } from "@/smc/lib/supabase/server";
import { formatDate, formatPercent } from "@/smc/lib/utils";

export default async function EmergencyResponsePage() {
  const supabase = await createClient();
  const [{ data: wards }, data] = await Promise.all([
    supabase.from("wards").select("ward_id, ward_name").order("ward_name"),
    getEmergencyResponseData(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Response System"
        description="Create emergency alerts, monitor critical wards, and detect hospital overload conditions."
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <AlertCreateForm wards={wards ?? []} />
        <TableCard
          title="Critical Wards"
          columns={[
            { key: "ward", label: "Ward" },
            { key: "index", label: "Health Index" },
            { key: "risk", label: "Risk Level" },
            { key: "cases", label: "Cases" },
          ]}
          rows={data.criticalWards.map((ward) => ({
            id: ward.wardId,
            ward: ward.wardName,
            index: ward.healthIndex.toFixed(2),
            risk: <StatusBadge value={ward.riskLevel} mode="risk" />,
            cases: ward.cases,
          }))}
        />
      </div>

      <TableCard
        title="Overloaded Hospitals"
        columns={[
          { key: "hospital", label: "Hospital" },
          { key: "ward", label: "Ward" },
          { key: "occupancy", label: "Occupancy" },
          { key: "beds", label: "Occupied / Total Beds" },
        ]}
        rows={data.overloadHospitals.map((row) => ({
          id: row.hospitalId,
          hospital: row.name,
          ward: row.wardName,
          occupancy: formatPercent(row.occupancy),
          beds: `${row.occupiedBeds} / ${row.totalBeds}`,
        }))}
      />

      <TableCard
        title="Active Alerts"
        columns={[
          { key: "type", label: "Type" },
          { key: "severity", label: "Severity" },
          { key: "message", label: "Message" },
          { key: "created", label: "Created At" },
        ]}
        rows={data.alerts.map((alert: { alert_id: string; alert_type: string | null; severity: string | null; message: string | null; created_at: string | null }) => ({
          id: alert.alert_id,
          type: alert.alert_type ?? "Not specified",
          severity: <StatusBadge value={alert.severity} />,
          message: alert.message ?? "No message",
          created: formatDate(alert.created_at, "dd MMM yyyy, p"),
        }))}
      />
    </div>
  );
}

