import { BarTrendChart } from "@/smc/components/charts/bar-trend-chart";
import { ChartCard } from "@/smc/components/charts/chart-card";
import { PieBreakdownChart } from "@/smc/components/charts/pie-breakdown-chart";
import { ComplianceAlertButton } from "@/smc/components/forms/compliance-alert-button";
import { StatCard } from "@/smc/components/dashboard/stat-card";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getComplianceData } from "@/smc/lib/data/queries";
import { formatDate } from "@/smc/lib/utils";

export default async function DataCompliancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const data = await getComplianceData(resolvedParams);
  const breakdown = [
    { label: "Critical", value: data.summary.critical },
    { label: "Warning", value: data.summary.warning },
    { label: "No Data", value: data.summary.noData },
    { label: "Compliant", value: data.summary.compliant },
  ].filter((row) => row.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Compliance Monitor"
        description="Identify hospitals that are not updating operational data on time based on the latest bed and medicine stock timestamps."
      />

      <form className="surface grid gap-4 p-5 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium">Ward</span>
          <select
            name="ward"
            defaultValue={String(data.filters.ward)}
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          >
            <option value="all">All wards</option>
            {(data.wards || []).map((ward) => (
              <option key={ward.wardId} value={ward.wardId}>
                {ward.wardName}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Status</span>
          <select
            name="status"
            defaultValue={String(data.filters.status)}
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          >
            <option value="all">All statuses</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="no data">No Data</option>
            <option value="compliant">Compliant</option>
          </select>
        </label>
        <div className="flex items-end">
          <button className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground">
            Apply filters
          </button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Critical Hospitals" value={data.summary.critical} helper="Need immediate compliance action." />
        <StatCard label="Warning Hospitals" value={data.summary.warning} helper="Approaching critical update delay." />
        <StatCard label="No Data Hospitals" value={data.summary.noData} helper="No valid update timestamp is available." />
        <StatCard label="Compliant Hospitals" value={data.summary.compliant} helper="Currently updating within the expected window." />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Compliance Distribution"
          description="Status split for the currently selected hospitals."
        >
          <PieBreakdownChart data={breakdown} />
        </ChartCard>
        <ChartCard
          title="Most Delayed Hospitals"
          description="Hours since last operational update for the most stale facilities."
        >
          <BarTrendChart data={data.staleRanking || []} />
        </ChartCard>
        <TableCard
          title="Recent Reminder Activity"
          columns={[
            { key: "hospital", label: "Hospital" },
            { key: "created", label: "Reminder Sent At" },
          ]}
          rows={(data.recentReminders || []).map((row) => ({
            id: row.id,
            hospital: row.hospitalName,
            created: formatDate(row.createdAt, "dd MMM yyyy, p"),
          }))}
          emptyMessage="No compliance reminders sent yet."
        />
      </div>

      <TableCard
        title="Hospital Compliance Status"
        columns={[
          { key: "hospital", label: "Hospital" },
          { key: "ward", label: "Ward" },
          { key: "updated", label: "Last Update Time" },
          { key: "staleHours", label: "Hours Since Update" },
          { key: "status", label: "Compliance Status" },
          { key: "lastAlert", label: "Last Reminder" },
          { key: "action", label: "Action" },
        ]}
        rows={(data.rows || []).map((row) => ({
          id: row.hospitalId,
          hospital: row.name,
          ward: row.wardName,
          updated: formatDate(row.lastUpdatedAt, "dd MMM yyyy, p"),
          staleHours: (row as any).staleHours ?? (row as any).hoursSinceUpdate ?? "No data",
          status: <StatusBadge value={row.status} />,
          lastAlert: row.lastAlertSentAt
            ? formatDate(row.lastAlertSentAt, "dd MMM yyyy, p")
            : "No reminder sent",
          action: (
            <ComplianceAlertButton
              hospitalId={row.hospitalId}
              hospitalName={row.name}
              wardName={row.wardName}
              complianceStatus={row.complianceStatus}
              lastUpdatedAt={row.lastUpdatedAt}
              disabled={row.complianceStatus === "compliant"}
            />
          ),
        }))}
        emptyMessage="No hospitals matched the selected compliance filters."
      />
    </div>
  );
}

