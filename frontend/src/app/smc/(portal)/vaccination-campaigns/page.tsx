import { CampaignCreateForm } from "@/smc/components/forms/campaign-create-form";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { ExportButtons } from "@/smc/components/reports/export-buttons";
import { TableCard } from "@/smc/components/tables/table-card";
import { getVaccinationCampaignRows } from "@/smc/lib/data/queries";
import { createClient } from "@/smc/lib/supabase/server";
import { formatDate, formatNumber } from "@/smc/lib/utils";

export default async function VaccinationCampaignsPage() {
  const supabase = await createClient();
  const [{ data: wards }, rows] = await Promise.all([
    supabase.from("wards").select("ward_id, ward_name").order("ward_id"),
    getVaccinationCampaignRows(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vaccination Campaign Manager"
        description="Create vaccination campaigns, monitor ward-level execution, and track administered doses."
        actions={
          <ExportButtons
            fileName="vaccination-campaigns"
            rows={rows.map((row) => ({
              campaign_name: row.name ?? "Untitled campaign",
              ward: `Ward ${row.wardId ?? "-"} - ${row.wardName}`,
              date: formatDate(row.date),
              vaccine_type: row.vaccineType ?? "Not specified",
              target_population: row.targetPopulation ?? "Not specified",
              doses_recorded: row.administeredDoses,
              status: row.status ?? "Not specified",
            }))}
          />
        }
      />

      <CampaignCreateForm wards={wards ?? []} />

      <TableCard
        title="Campaigns"
        columns={[
          { key: "name", label: "Campaign Name" },
          { key: "ward", label: "Ward" },
          { key: "date", label: "Date" },
          { key: "vaccine", label: "Vaccine Type" },
          { key: "target", label: "Target Population" },
          { key: "doses", label: "Doses Recorded" },
          { key: "status", label: "Status" },
        ]}
        rows={rows.map((row) => ({
          id: row.campaignId,
          name: row.name ?? "Untitled campaign",
          ward: `Ward ${row.wardId ?? "-"} - ${row.wardName}`,
          date: formatDate(row.date),
          vaccine: row.vaccineType ?? "Not specified",
          target: row.targetPopulation ?? "Not specified",
          doses: formatNumber(row.administeredDoses),
          status: <StatusBadge value={row.status} />,
        }))}
      />
    </div>
  );
}

