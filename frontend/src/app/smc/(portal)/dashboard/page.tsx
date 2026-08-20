import { BarTrendChart } from "@/smc/components/charts/bar-trend-chart";
import { ChartCard } from "@/smc/components/charts/chart-card";
import { LineTrendChart } from "@/smc/components/charts/line-trend-chart";
import { StatCard } from "@/smc/components/dashboard/stat-card";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { getDashboardData } from "@/smc/lib/data/queries";
import { formatDate } from "@/smc/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="City Health Command Dashboard"
        description="Municipal health operations overview with live indicators sourced from hospital, ward, medicine, and disease surveillance records."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.stats.map((item) => (
          <StatCard key={item.label} {...item} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard title="Disease Trend" description="Reported disease case volume over time.">
          <LineTrendChart data={data.diseaseTrend} />
        </ChartCard>
        <ChartCard
          title="Ward Health Index Comparison"
          description="Latest recorded health index by ward."
        >
          <BarTrendChart data={data.wardHealthComparison} />
        </ChartCard>
        <ChartCard title="Hospital Load Distribution" description="Occupied bed load by hospital.">
          <BarTrendChart data={data.hospitalLoadDistribution} />
        </ChartCard>
      </div>

      <section className="surface p-5">
        <h3 className="text-lg font-semibold">Emergency Alerts</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.recentAlerts.length > 0 ? (
            data.recentAlerts.map((alert: { alert_id: string; severity: string | null; created_at: string | null; message: string | null }) => (
              <article key={alert.alert_id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge value={alert.severity} />
                  <span className="text-xs text-muted-foreground">
                    {formatDate(alert.created_at, "dd MMM yyyy, p")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6">{alert.message ?? "No message provided."}</p>
              </article>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No alerts have been issued yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}

