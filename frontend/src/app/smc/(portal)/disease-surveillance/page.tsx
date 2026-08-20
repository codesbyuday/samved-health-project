import { BarTrendChart } from "@/smc/components/charts/bar-trend-chart";
import { ChartCard } from "@/smc/components/charts/chart-card";
import { LineTrendChart } from "@/smc/components/charts/line-trend-chart";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { OutbreakAlertSendButton } from "@/smc/components/forms/outbreak-alert-send-button";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getDiseaseSurveillanceData } from "@/smc/lib/data/queries";
import { buildSearchParams, formatPercent } from "@/smc/lib/utils";

export default async function DiseaseSurveillancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const data = await getDiseaseSurveillanceData(resolvedParams);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disease Surveillance System"
        description="Monitor anonymized ward-level disease patterns, review early outbreak signals, and manually approve ward-specific alerts before citizens are notified."
      />

      <form className="surface grid gap-4 p-5 md:grid-cols-4">
        <input
          name="disease"
          placeholder="Disease name"
          defaultValue={String(resolvedParams.disease ?? "")}
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <input
          name="ward"
          placeholder="Ward number"
          defaultValue={String(resolvedParams.ward ?? "")}
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <input
          name="from"
          type="date"
          defaultValue={String(resolvedParams.from ?? "")}
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <input
          name="to"
          type="date"
          defaultValue={String(resolvedParams.to ?? "")}
          className="rounded-lg border border-input bg-background px-3 py-2.5"
        />
        <button className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground md:col-span-4 md:w-fit">
          Apply filters
        </button>
      </form>

      <div className="grid gap-6 xl:grid-cols-3">
        <ChartCard
          title="Citywide Trend"
          description="Aggregated ward-level surveillance counts by week."
        >
          <LineTrendChart data={data.trend} />
        </ChartCard>
        <ChartCard
          title="Weekly Comparison"
          description="Current week cases compared with the previous week."
        >
          <BarTrendChart data={data.weeklyComparison} />
        </ChartCard>
        <section className="surface p-5">
          <h3 className="text-lg font-semibold">Detection Summary</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-4xl font-semibold">{data.outbreakSignals}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                Early outbreak signals detected.
              </p>
            </div>
            <div>
              <div className="text-4xl font-semibold">{data.highRiskCount}</div>
              <p className="mt-2 text-sm text-muted-foreground">
                High-risk ward and disease combinations.
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Detection uses only rule-based thresholds, trend analysis, and abnormal
            statistical spike checks on aggregated ward-level data.
          </p>
        </section>
      </div>

      <section className="surface p-5">
        <div>
          <h3 className="text-lg font-semibold">Early Outbreak Detection Panel</h3>
          <p className="text-sm text-muted-foreground">
            Wards are highlighted only when abnormal disease behavior is detected.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {data.flaggedRows.length > 0 ? (
            data.flaggedRows.map((signal) => (
              <article
                key={`${signal.wardNumber}:${signal.diseaseId}`}
                className="rounded-xl border border-border bg-background/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {signal.wardName}
                    </div>
                    <h4 className="mt-1 text-lg font-semibold">{signal.diseaseName}</h4>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-red-600">
                      Early Outbreak Signal Detected
                    </p>
                  </div>
                  <StatusBadge value={signal.riskLevel} mode="risk" />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Current Week
                    </div>
                    <div className="mt-1 text-xl font-semibold">
                      {signal.currentWeekCases}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Previous Week
                    </div>
                    <div className="mt-1 text-xl font-semibold">
                      {signal.previousWeekCases}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Growth
                    </div>
                    <div className="mt-1 text-xl font-semibold">
                      {formatPercent(signal.growthRate)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
                    <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Abnormality
                    </div>
                    <div className="mt-1 text-xl font-semibold">
                      {signal.abnormalityScore}
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  {signal.explanation}
                </p>
              </article>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground lg:col-span-2 xl:col-span-3">
              No abnormal ward-level outbreak behavior is currently detected for the
              selected filters.
            </div>
          )}
        </div>
      </section>

      <TableCard
        title="Ward-wise Disease Monitoring"
        description="Current and previous case counts are aggregated by ward and disease only."
        columns={[
          { key: "ward", label: "Ward" },
          { key: "disease", label: "Disease" },
          { key: "currentCases", label: "Current Cases" },
          { key: "previousCases", label: "Previous Cases" },
          { key: "trend", label: "Growth Trend" },
          { key: "risk", label: "Risk Level" },
          { key: "signal", label: "Detection Result" },
        ]}
        rows={data.rows.map((row) => ({
          id: row.id,
          ward: `Ward ${row.wardNumber}`,
          disease: (
            <div>
              <div className="font-medium">{row.diseaseName}</div>
              <div className="text-xs text-muted-foreground">{row.wardName}</div>
            </div>
          ),
          currentCases: row.currentCases,
          previousCases: row.previousCases,
          trend: (
            <div>
              <div className="font-medium">{row.growthTrend}</div>
              <div className="text-xs text-muted-foreground">
                {formatPercent(row.growthRate)}
              </div>
            </div>
          ),
          risk: <StatusBadge value={row.riskLevel} mode="risk" />,
          signal: row.earlyOutbreakSignal ? (
            <div>
              <div className="font-medium text-red-600">EARLY OUTBREAK SIGNAL</div>
              <div className="text-xs text-muted-foreground">{row.explanation}</div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">Normal observation range</span>
          ),
        }))}
        emptyMessage="No ward-level surveillance rows matched the selected filters."
        pagination={{
          page: data.page,
          totalPages: data.totalPages,
          makeHref: (page) =>
            `/disease-surveillance?${buildSearchParams(resolvedParams, { page })}`,
        }}
      />

      <TableCard
        title="Alert Management"
        description="Alerts remain pending until an SMC official approves and sends a ward-targeted notification."
        columns={[
          { key: "ward", label: "Ward" },
          { key: "disease", label: "Disease" },
          { key: "message", label: "Message" },
          { key: "severity", label: "Severity" },
          { key: "status", label: "Status" },
          { key: "action", label: "Action" },
        ]}
        rows={data.alertRows.map((alert) => ({
          id: alert.id,
          ward: `Ward ${alert.wardNumber}`,
          disease: alert.diseaseName,
          message: (
            <div>
              <div className="font-medium">{alert.message}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Citizen app preview: {alert.citizenMessage}
              </div>
            </div>
          ),
          severity: <StatusBadge value={alert.severity} mode="risk" />,
          status: <StatusBadge value={alert.status} />,
          action: (
            <OutbreakAlertSendButton
              disabled={alert.status !== "Pending"}
              alert={{
                wardNumber: alert.wardNumber,
                diseaseId: alert.diseaseId,
                diseaseName: alert.diseaseName,
                severity: alert.severity,
                message: alert.message,
                citizenMessage: alert.citizenMessage,
              }}
            />
          ),
        }))}
        emptyMessage="No pending or sent outbreak alerts are available for the selected filters."
      />
    </div>
  );
}

