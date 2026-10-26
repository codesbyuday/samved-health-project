import { BarTrendChart } from "@/smc/components/charts/bar-trend-chart";
import { ChartCard } from "@/smc/components/charts/chart-card";
import { LineTrendChart } from "@/smc/components/charts/line-trend-chart";
import { PieBreakdownChart } from "@/smc/components/charts/pie-breakdown-chart";
import { StatCard } from "@/smc/components/dashboard/stat-card";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { ExportButtons } from "@/smc/components/reports/export-buttons";
import { TableCard } from "@/smc/components/tables/table-card";
import { getReportsData } from "@/smc/lib/data/queries";
import { formatNumber, formatPercent } from "@/smc/lib/utils";

export default async function ReportsAnalyticsPage() {
  const data = await getReportsData();
  const hospitalCapacityRows = data.hospitals.map((row) => ({
    ...row,
    occupancy: row.totalBeds > 0 ? (row.occupiedBeds / row.totalBeds) * 100 : 0,
  }));
  const highestOccupancyHospitals = hospitalCapacityRows
    .slice()
    .sort((a, b) => b.occupancy - a.occupancy)
    .slice(0, 6);
  const topWards = data.wardHealth.slice(0, 6);
  const lowWards = data.wardHealth.slice().reverse().slice(0, 6);
  const riskBreakdown = ["critical", "moderate", "healthy"].map((risk) => ({
    label: risk === "critical" ? "Critical/High" : risk === "moderate" ? "Moderate" : "Healthy/Low",
    value: data.wardHealth.filter((row) =>
      risk === "critical"
        ? String(row.riskLevel).toLowerCase().includes("critical") ||
          String(row.riskLevel).toLowerCase().includes("high")
        : risk === "moderate"
          ? String(row.riskLevel).toLowerCase().includes("moderate") ||
            String(row.riskLevel).toLowerCase().includes("medium")
          : !String(row.riskLevel).toLowerCase().includes("critical") &&
            !String(row.riskLevel).toLowerCase().includes("high") &&
            !String(row.riskLevel).toLowerCase().includes("moderate") &&
            !String(row.riskLevel).toLowerCase().includes("medium"),
    ).length,
  }));
  const totalBeds = data.hospitals.reduce((sum, hospital) => sum + hospital.totalBeds, 0);
  const totalOccupiedBeds = data.hospitals.reduce((sum, hospital) => sum + hospital.occupiedBeds, 0);
  const cityOccupancy = totalBeds > 0 ? (totalOccupiedBeds / totalBeds) * 100 : 0;
  const totalCases = data.wardHealth.reduce((sum, ward) => sum + ward.cases, 0);
  const avgHealthIndex =
    data.wardHealth.length > 0
      ? data.wardHealth.reduce((sum, ward) => sum + ward.healthIndex, 0) / data.wardHealth.length
      : 0;
  const exportRows = data.hospitals.map((hospital) => ({
    hospital: hospital.name,
    ward: hospital.wardName,
    total_beds: hospital.totalBeds,
    occupied_beds: hospital.occupiedBeds,
    occupancy_percent: Number(
      (hospital.totalBeds > 0 ? (hospital.occupiedBeds / hospital.totalBeds) * 100 : 0).toFixed(1),
    ),
    doctors: hospital.doctors,
    low_stock_medicines: hospital.lowStockMedicines,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics & Reports"
        description="Generate disease trend, ward health performance, and hospital capacity reporting directly from the operational datasets."
        actions={
          <ExportButtons
            fileName="samved-operational-report"
            rows={exportRows}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Registered Hospitals"
          value={data.hospitals.length}
          helper="Facilities contributing capacity and infrastructure data."
        />
        <StatCard
          label="City Bed Occupancy"
          value={Number(cityOccupancy.toFixed(0))}
          helper={`${formatNumber(totalOccupiedBeds)} occupied of ${formatNumber(totalBeds)} total beds.`}
        />
        <StatCard
          label="Average Ward Health Index"
          value={Number(avgHealthIndex.toFixed(0))}
          helper="Average ward health performance across the reporting grid."
        />
        <StatCard
          label="Tracked Cases"
          value={totalCases}
          helper="Confirmed or active case volume represented in ward health reporting."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Disease Trend Report"
          description="Time-series view of tracked disease cases across the current reporting dataset."
        >
          <LineTrendChart data={data.diseaseTrend} />
        </ChartCard>
        <ChartCard
          title="Ward Health Performance"
          description="Highest health-index wards at the top of the distribution."
        >
          <BarTrendChart
            data={data.wardHealth.map((row) => ({ label: row.wardName, value: row.healthIndex }))}
          />
        </ChartCard>
        <ChartCard
          title="Hospital Capacity Report"
          description="Total bed capacity available at each hospital."
        >
          <BarTrendChart data={data.hospitals.map((row) => ({ label: row.name, value: row.totalBeds }))} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Ward Risk Distribution"
          description="How wards are distributed by current health risk classification."
        >
          <PieBreakdownChart data={riskBreakdown.filter((row) => row.value > 0)} />
        </ChartCard>
        <ChartCard
          title="Highest Occupancy Hospitals"
          description="Hospitals most likely to need active monitoring or redistribution support."
        >
          <BarTrendChart
            data={highestOccupancyHospitals.map((row) => ({
              label: row.name,
              value: Number(row.occupancy.toFixed(0)),
            }))}
          />
        </ChartCard>
        <section className="surface p-5">
          <h3 className="text-lg font-semibold">Operations Snapshot</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Highest load hospital
              </div>
              <div className="mt-2 text-lg font-semibold">
                {highestOccupancyHospitals[0]?.name ?? "Not available"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {highestOccupancyHospitals[0]
                  ? `${formatPercent(highestOccupancyHospitals[0].occupancy, 0)} occupancy in ${highestOccupancyHospitals[0].wardName}.`
                  : "No occupancy data available."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Best performing ward
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{topWards[0]?.wardName ?? "Not available"}</div>
                  <p className="text-sm text-muted-foreground">
                    Health index {topWards[0] ? topWards[0].healthIndex.toFixed(1) : "0"} with{" "}
                    {topWards[0]?.cases ?? 0} tracked cases.
                  </p>
                </div>
                {topWards[0] ? <StatusBadge value={topWards[0].riskLevel} mode="risk" /> : null}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Lowest performing ward
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{lowWards[0]?.wardName ?? "Not available"}</div>
                  <p className="text-sm text-muted-foreground">
                    Health index {lowWards[0] ? lowWards[0].healthIndex.toFixed(1) : "0"} with{" "}
                    {lowWards[0]?.cases ?? 0} tracked cases.
                  </p>
                </div>
                {lowWards[0] ? <StatusBadge value={lowWards[0].riskLevel} mode="risk" /> : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      <TableCard
        title="Ward Performance Ranking"
        description="Compare ward performance, current health load, and risk levels in one view."
        columns={[
          { key: "ward", label: "Ward" },
          { key: "healthIndex", label: "Health Index" },
          { key: "cases", label: "Tracked Cases" },
          { key: "beds", label: "Beds" },
          { key: "doctors", label: "Doctors" },
          { key: "risk", label: "Risk Level" },
        ]}
        rows={data.wardHealth.map((row) => ({
          id: row.wardId,
          ward: row.wardName,
          healthIndex: row.healthIndex.toFixed(1),
          cases: row.cases,
          beds: row.beds,
          doctors: row.doctors,
          risk: <StatusBadge value={row.riskLevel} mode="risk" />,
        }))}
        emptyMessage="No ward health reporting data is available."
      />

      <TableCard
        title="Hospital Capacity Detail"
        description="Detailed capacity report for planning redistribution and facility support."
        columns={[
          { key: "hospital", label: "Hospital" },
          { key: "ward", label: "Ward" },
          { key: "beds", label: "Beds" },
          { key: "occupied", label: "Occupied" },
          { key: "occupancy", label: "Occupancy" },
          { key: "doctors", label: "Doctors" },
          { key: "lowStock", label: "Low Stock Medicines" },
        ]}
        rows={hospitalCapacityRows
          .slice()
          .sort((a, b) => b.occupancy - a.occupancy)
          .map((row) => ({
            id: row.hospitalId,
            hospital: row.name,
            ward: row.wardName,
            beds: row.totalBeds,
            occupied: row.occupiedBeds,
            occupancy: formatPercent(row.occupancy, 0),
            doctors: row.doctors,
            lowStock: row.lowStockMedicines,
          }))}
        emptyMessage="No hospital capacity data is available."
      />
    </div>
  );
}

