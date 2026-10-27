import { BarTrendChart } from "@/smc/components/charts/bar-trend-chart";
import { ChartCard } from "@/smc/components/charts/chart-card";
import { LineTrendChart } from "@/smc/components/charts/line-trend-chart";
import { StatCard } from "@/smc/components/dashboard/stat-card";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { getDashboardData } from "@/smc/lib/data/queries";
import { requireUserContext } from "@/smc/lib/auth/session";
import { formatDate } from "@/smc/lib/utils";
import { UserCheck, Shield, Phone, Mail, Building2 } from "lucide-react";

export default async function DashboardPage() {
  const [data, user] = await Promise.all([
    getDashboardData(),
    requireUserContext(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="City Health Command Dashboard"
        description="Municipal health operations overview with live indicators sourced from hospital, ward, medicine, and disease surveillance records."
      />

      {/* Authenticated SMC Official Administrative Profile Banner */}
      <section className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-5 md:p-6 text-white shadow-lg dark:border-blue-900/50">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600/30 border border-blue-400/30 text-blue-200 shadow-inner">
              <UserCheck className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  Duty Officer Command Profile
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {user.status ? String(user.status).toUpperCase() : "ACTIVE DUTY"}
                </span>
              </div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">
                {user.name}
              </h2>
              <p className="text-sm font-medium text-blue-200/90">
                {user.designation || "Municipal Health Officer"} • Solapur Municipal Corporation
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-4 lg:border-t-0 lg:pt-0">
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <span className="text-[10px] font-medium uppercase text-blue-200/70 block">Official ID</span>
              <span className="font-mono text-xs font-bold text-white block mt-0.5">{user.officialId || "SMC-OFF"}</span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <span className="text-[10px] font-medium uppercase text-blue-200/70 block">System Role</span>
              <span className="text-xs font-bold text-white block mt-0.5">{user.role}</span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <span className="text-[10px] font-medium uppercase text-blue-200/70 block">Official Contact</span>
              <span className="text-xs font-bold text-white block mt-0.5">{user.phone || "—"}</span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
              <span className="text-[10px] font-medium uppercase text-blue-200/70 block">Gov Email</span>
              <span className="text-xs font-bold text-white block mt-0.5 truncate max-w-[140px]">{user.email || "—"}</span>
            </div>
          </div>
        </div>
      </section>

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

