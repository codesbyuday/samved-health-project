import { formatNumber } from "@/smc/lib/utils";

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <article className="surface p-5">
      <div className="text-sm font-medium text-muted-foreground">{label}</div>
      <div className="metric-value mt-3">{formatNumber(value)}</div>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </article>
  );
}

