import { BarTrendChart } from "@/smc/components/charts/bar-trend-chart";
import { ChartCard } from "@/smc/components/charts/chart-card";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getWardHealthRows } from "@/smc/lib/data/queries";
import { formatNumber } from "@/smc/lib/utils";

export default async function WardHealthIndexPage() {
  const rows = await getWardHealthRows();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ward Health Index Monitor"
        description="Ward-wise health performance, infrastructure adequacy, and risk ranking."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TableCard
          title="Ward Health Index Table"
          columns={[
            { key: "ward", label: "Ward" },
            { key: "population", label: "Population" },
            { key: "doctors", label: "Doctors" },
            { key: "beds", label: "Beds" },
            { key: "cases", label: "Cases" },
            { key: "deaths", label: "Deaths" },
            { key: "healthIndex", label: "Health Index" },
            { key: "risk", label: "Risk Level" },
          ]}
          rows={rows.map((row) => ({
            id: row.wardId,
            ward: row.wardName,
            population: formatNumber(row.population),
            doctors: formatNumber(row.doctors),
            beds: formatNumber(row.beds),
            cases: formatNumber(row.cases),
            deaths: formatNumber(row.deaths),
            healthIndex: row.healthIndex.toFixed(2),
            risk: <StatusBadge value={row.riskLevel} mode="risk" />,
          }))}
        />

        <ChartCard title="Ward Ranking" description="Latest health index score comparison by ward.">
          <BarTrendChart
            data={rows.map((row) => ({
              label: row.wardName,
              value: row.healthIndex,
            }))}
          />
        </ChartCard>
      </div>
    </div>
  );
}

