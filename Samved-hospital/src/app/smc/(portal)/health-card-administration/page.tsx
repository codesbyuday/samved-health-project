import { BarTrendChart } from "@/smc/components/charts/bar-trend-chart";
import { ChartCard } from "@/smc/components/charts/chart-card";
import { StatCard } from "@/smc/components/dashboard/stat-card";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getHealthCardAdminData } from "@/smc/lib/data/queries";
import { formatDate, formatPercent } from "@/smc/lib/utils";

export default async function HealthCardAdministrationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const data = await getHealthCardAdminData(resolvedParams);
  const usageCoverage =
    data.totalRegistrations > 0 ? (data.activeUsage / data.totalRegistrations) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Health Card Administration"
        description="Filter health card registrations ward-wise and date-wise to see how many cards were created in a selected month or custom date range."
      />

      <form className="surface grid gap-4 p-5 md:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-medium">Ward</span>
          <select
            name="ward"
            defaultValue={String(data.filters.ward)}
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          >
            <option value="all">All wards</option>
            {data.wards.map((ward) => (
              <option key={ward.wardId} value={ward.wardId}>
                {ward.wardName}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">From date</span>
          <input
            name="from"
            type="date"
            defaultValue={data.filters.from}
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">To date</span>
          <input
            name="to"
            type="date"
            defaultValue={data.filters.to}
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          />
        </label>

        <div className="flex items-end gap-3">
          <button className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground">
            Apply filters
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Cards Created"
          value={data.totalRegistrations}
          helper="Health cards created in the selected ward/date range."
        />
        <StatCard
          label="Cards In Use"
          value={data.activeUsage}
          helper="Filtered citizens who also appear in health or vaccination records."
        />
        <StatCard
          label="Usage Coverage"
          value={Number(formatPercent(usageCoverage, 0).replace("%", ""))}
          helper="Percentage of created cards already linked to real usage."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Month-wise Health Card Creation"
          description="How many health cards were created month-wise for the selected filters."
        >
          <BarTrendChart data={data.monthlyAggregates} />
        </ChartCard>

        <section className="surface p-5">
          <h3 className="text-lg font-semibold">Selected Range Summary</h3>
          <div className="mt-4 space-y-4 text-sm">
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Date window
              </div>
              <div className="mt-2 font-medium">
                {formatDate(data.filters.from)} to {formatDate(data.filters.to)}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Ward scope
              </div>
              <div className="mt-2 font-medium">
                {data.filters.ward === "all"
                  ? "All wards"
                  : data.wards.find((ward) => String(ward.wardId) === data.filters.ward)?.wardName ??
                    `Ward ${data.filters.ward}`}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Duplicate signals
              </div>
              <div className="mt-2 font-medium">{data.duplicateCount} records need review</div>
            </div>
          </div>
        </section>
      </div>

      <TableCard
        title="Ward-wise Aggregated Health Cards"
        description="See how many cards were created and how many are already in use for each ward in the selected range."
        columns={[
          { key: "ward", label: "Ward" },
          { key: "created", label: "Cards Created" },
          { key: "used", label: "Cards In Use" },
          { key: "coverage", label: "Usage Coverage" },
          { key: "duplicates", label: "Duplicate Signals" },
        ]}
        rows={data.wardAggregates.map((row) => ({
          id: row.wardId,
          ward: row.wardName,
          created: row.created,
          used: row.used,
          coverage: formatPercent(row.created > 0 ? (row.used / row.created) * 100 : 0, 0),
          duplicates: row.duplicates,
        }))}
        emptyMessage="No health card registrations matched the selected ward/date filters."
      />

      <TableCard
        title="Recent Registrations In Selected Range"
        columns={[
          { key: "citizen", label: "Citizen ID" },
          { key: "ward", label: "Ward" },
          { key: "created", label: "Created At" },
        ]}
        rows={data.recentRegistrations.map((row) => ({
          id: row.citizen_id,
          citizen: row.citizen_id,
          ward:
            data.wards.find((ward) => ward.wardId === row.ward_number)?.wardName ??
            `Ward ${row.ward_number ?? "-"}`,
          created: formatDate(row.created_at, "dd MMM yyyy, p"),
        }))}
        emptyMessage="No recent registrations found for the selected filters."
      />
    </div>
  );
}

