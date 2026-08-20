import { BarTrendChart } from "@/smc/components/charts/bar-trend-chart";
import { ChartCard } from "@/smc/components/charts/chart-card";
import { PieBreakdownChart } from "@/smc/components/charts/pie-breakdown-chart";
import { StatCard } from "@/smc/components/dashboard/stat-card";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getSystemMonitoringData } from "@/smc/lib/data/queries";
import { formatDate } from "@/smc/lib/utils";

export default async function SystemMonitoringPage() {
  const data = await getSystemMonitoringData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Monitoring"
        description="Operational monitoring of administrative activity, notifications, officials, and participating providers."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Alerts Logged" value={data.alertsCount} helper="Total alerts available in the system." />
        <StatCard label="Notifications Sent" value={data.notificationCount} helper="Administrative notifications issued from the portal." />
        <StatCard label="Active SMC Officials" value={data.activeOfficials} helper="Officials marked active in the SMC officials table." />
        <StatCard label="Registered Providers" value={data.providerCount} helper="External providers participating in the ecosystem." />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Official Status Distribution"
          description="Current active vs inactive split across SMC officials."
        >
          <PieBreakdownChart data={data.officialStatusBreakdown.filter((row) => row.value > 0)} />
        </ChartCard>
        <ChartCard
          title="Provider Participation By Ward"
          description="Top wards by number of registered providers."
        >
          <BarTrendChart data={data.providerWardBreakdown} />
        </ChartCard>
        <section className="surface p-5">
          <h3 className="text-lg font-semibold">Monitoring Snapshot</h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Latest alert
              </div>
              <div className="mt-2 font-semibold">
                {data.recentAlerts[0]?.alertType ?? "No recent alerts"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.recentAlerts[0]
                  ? `${data.recentAlerts[0].wardName} | ${formatDate(data.recentAlerts[0].createdAt, "dd MMM yyyy, p")}`
                  : "No alert activity captured yet."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Latest notification
              </div>
              <div className="mt-2 font-semibold">
                {data.recentNotifications[0]?.title ?? "No recent notifications"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.recentNotifications[0]
                  ? `${data.recentNotifications[0].targetType} target | ${formatDate(data.recentNotifications[0].createdAt, "dd MMM yyyy, p")}`
                  : "No notification traffic captured yet."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background/70 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Newest provider
              </div>
              <div className="mt-2 font-semibold">
                {data.providers[0]?.name ?? "No providers available"}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.providers[0]
                  ? `${data.providers[0].wardName} | ${formatDate(data.providers[0].createdAt, "dd MMM yyyy, p")}`
                  : "No provider onboarding data available."}
              </p>
            </div>
          </div>
        </section>
      </div>

      <TableCard
        title="Recent Alert Activity"
        columns={[
          { key: "ward", label: "Ward" },
          { key: "type", label: "Alert Type" },
          { key: "severity", label: "Severity" },
          { key: "created", label: "Created At" },
        ]}
        rows={data.recentAlerts.map((row) => ({
          id: row.id,
          ward: row.wardName,
          type: row.alertType,
          severity: <StatusBadge value={row.severity} mode="risk" />,
          created: formatDate(row.createdAt, "dd MMM yyyy, p"),
        }))}
        emptyMessage="No recent alert activity found."
      />

      <TableCard
        title="Recent Notification Traffic"
        columns={[
          { key: "title", label: "Title" },
          { key: "priority", label: "Priority" },
          { key: "target", label: "Target Type" },
          { key: "created", label: "Created At" },
        ]}
        rows={data.recentNotifications.map((row) => ({
          id: row.id,
          title: row.title,
          priority: <StatusBadge value={row.priority} />,
          target: row.targetType,
          created: formatDate(row.createdAt, "dd MMM yyyy, p"),
        }))}
        emptyMessage="No recent notification activity found."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <TableCard
          title="SMC Official Roster"
          columns={[
            { key: "name", label: "Name" },
            { key: "designation", label: "Designation" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            { key: "created", label: "Created At" },
          ]}
          rows={data.officials.map((row) => ({
            id: row.officialId,
            name: row.name,
            designation: row.designation,
            role: row.role,
            status: <StatusBadge value={row.status} />,
            created: formatDate(row.createdAt, "dd MMM yyyy, p"),
          }))}
          emptyMessage="No SMC official records are available."
        />

        <TableCard
          title="Registered Providers"
          columns={[
            { key: "name", label: "Provider" },
            { key: "role", label: "Role" },
            { key: "ward", label: "Ward" },
            { key: "email", label: "Email" },
            { key: "created", label: "Created At" },
          ]}
          rows={data.providers.map((row) => ({
            id: row.providerId,
            name: row.name,
            role: row.role,
            ward: row.wardName,
            email: row.email,
            created: formatDate(row.createdAt, "dd MMM yyyy, p"),
          }))}
          emptyMessage="No provider records are available."
        />
      </div>
    </div>
  );
}

