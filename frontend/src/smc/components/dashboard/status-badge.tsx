import { cn, getRiskTone, getStatusTone, toTitleCase } from "@/smc/lib/utils";

export function StatusBadge({
  value,
  mode = "status",
}: {
  value: string | boolean | null | undefined;
  mode?: "status" | "risk";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold",
        mode === "risk" ? getRiskTone(String(value)) : getStatusTone(value),
      )}
    >
      {typeof value === "boolean"
        ? value
          ? "Verified"
          : "Pending"
        : toTitleCase(value)}
    </span>
  );
}

