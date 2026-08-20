"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useTheme } from "@/smc/components/providers/theme-provider";

import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import type { WardHealthRow } from "@/smc/lib/types/schema";
import { cn } from "@/smc/lib/utils";

type PolygonFeature = {
  type: "Feature";
  properties: {
    ward: number;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

type WardRiskMapProps = {
  wards: WardHealthRow[];
  hospitalCounts: Record<number, number>;
  features: PolygonFeature[];
};

type ProjectedFeature = {
  wardId: number;
  path: string;
  centroid: { x: number; y: number };
};

const SVG_WIDTH = 900;
const SVG_HEIGHT = 760;
const PADDING = 32;
const emptySubscribe = () => () => {};

function getRiskColor(riskLevel: string) {
  const token = riskLevel.toLowerCase();

  if (token.includes("high") || token.includes("critical")) {
    return {
      fill: "#dc2626",
      stroke: "#7f1d1d",
      accent: "bg-red-100 text-red-900",
    };
  }

  if (token.includes("moderate")) {
    return {
      fill: "#facc15",
      stroke: "#a16207",
      accent: "bg-yellow-100 text-yellow-900",
    };
  }

  return {
    fill: "#22c55e",
    stroke: "#166534",
    accent: "bg-emerald-100 text-emerald-900",
  };
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export function WardRiskMap({
  wards,
  hospitalCounts,
  features,
}: WardRiskMapProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const wardMap = useMemo(
    () => new Map(wards.map((ward) => [ward.wardId, ward])),
    [wards],
  );

  const [selectedWardId, setSelectedWardId] = useState<number>(wards[0]?.wardId ?? 0);

  const projected = useMemo<ProjectedFeature[]>(() => {
    if (!features || features.length === 0) {
      return [];
    }
    const allPoints = features.flatMap((feature) => feature.geometry?.coordinates?.[0] || []);
    if (allPoints.length === 0) {
      return [];
    }
    const xs = allPoints.map((point) => point[0]);
    const ys = allPoints.map((point) => point[1]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const drawableWidth = SVG_WIDTH - PADDING * 2;
    const drawableHeight = SVG_HEIGHT - PADDING * 2;
    const scale = Math.min(
      drawableWidth / Math.max(maxX - minX, 1e-6),
      drawableHeight / Math.max(maxY - minY, 1e-6),
    );

    const projectPoint = ([longitude, latitude]: number[]) => {
      const x = PADDING + (longitude - minX) * scale;
      const y = SVG_HEIGHT - PADDING - (latitude - minY) * scale;
      return { x, y };
    };

    return features.map((feature) => {
      const points = feature.geometry.coordinates[0].map(projectPoint);
      const path = points
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
        .join(" ")
        .concat(" Z");

      const centroid = points.reduce(
        (accumulator, point) => ({
          x: accumulator.x + point.x / points.length,
          y: accumulator.y + point.y / points.length,
        }),
        { x: 0, y: 0 },
      );

      return {
        wardId: feature.properties.ward,
        path,
        centroid,
      };
    });
  }, [features]);

  const selectedWard = wardMap.get(selectedWardId) ?? wards[0];
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <section className="surface p-5">
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div
          className="overflow-hidden rounded-[1.75rem] border p-4"
          style={{
            borderColor: isDark ? "#334155" : "#e2e8f0",
            background: isDark ? "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)" : "#ffffff",
            boxShadow: isDark
              ? "0 24px 80px -48px rgba(15, 23, 42, 0.45)"
              : "0 24px 80px -48px rgba(15, 23, 42, 0.12)",
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Solapur Ward Risk Choropleth</h2>
              <p className="text-sm text-muted-foreground">
                Ward polygons are filled by live health risk classification from the current HI dataset.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              {["low", "moderate", "high"].map((risk) => {
                const palette = getRiskColor(risk);
                return (
                  <div
                    key={risk}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm"
                    style={{
                      borderColor: isDark ? "#475569" : "#e2e8f0",
                      backgroundColor: isDark ? "rgba(15, 23, 42, 0.72)" : "#ffffff",
                    }}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: palette.fill }}
                    />
                    <span>{toTitleCase(risk)} Risk</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="relative rounded-[1.5rem] border p-3"
            style={{
              borderColor: isDark ? "#475569" : "#e2e8f0",
              backgroundColor: isDark ? "#0f172a" : "#f8fafc",
            }}
          >
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="h-auto w-full"
              role="img"
              aria-label="Ward risk map of Solapur"
            >
              <defs>
                <filter id="ward-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity="0.18" />
                </filter>
              </defs>

              <rect
                x="0"
                y="0"
                width={SVG_WIDTH}
                height={SVG_HEIGHT}
                rx="28"
                fill={isDark ? "#1e293b" : "#f8fafc"}
              />

              {projected.map((feature) => {
                const ward = wardMap.get(feature.wardId);
                const palette = getRiskColor(ward?.riskLevel ?? "moderate");
                const isSelected = feature.wardId === selectedWardId;

                return (
                  <g key={feature.wardId}>
                    <path
                      d={feature.path}
                      onClick={() => setSelectedWardId(feature.wardId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedWardId(feature.wardId);
                        }
                      }}
                      tabIndex={0}
                      className="cursor-pointer transition-all duration-200"
                      style={{
                        fill: palette.fill,
                        stroke: palette.stroke,
                        strokeWidth: isSelected ? 4 : 2.2,
                        opacity: isSelected ? 1 : 0.9,
                        filter: isSelected ? "url(#ward-shadow)" : undefined,
                      }}
                    />
                    <text
                      x={feature.centroid.x}
                      y={feature.centroid.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="pointer-events-none select-none fill-white text-[18px] font-bold drop-shadow-[0_1px_2px_rgba(15,23,42,0.75)]"
                    >
                      {feature.wardId}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {selectedWard ? (
          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Selected Ward
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight">
                    {selectedWard.wardName}
                  </h3>
                </div>
                <StatusBadge value={selectedWard.riskLevel} mode="risk" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  { label: "Health Index", value: selectedWard.healthIndex.toFixed(2) },
                  { label: "Population", value: selectedWard.population.toLocaleString("en-IN") },
                  { label: "Doctors", value: selectedWard.doctors.toString() },
                  { label: "Beds", value: selectedWard.beds.toString() },
                  { label: "Cases", value: selectedWard.cases.toString() },
                  { label: "Deaths", value: selectedWard.deaths.toString() },
                  {
                    label: "Hospitals",
                    value: (hospitalCounts[selectedWard.wardId] ?? 0).toString(),
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xl font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border bg-card/95 p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Ward Index Order
              </h4>
              <div className="mt-4 space-y-2">
                {wards.slice(0, 8).map((ward, index) => {
                  const palette = getRiskColor(ward.riskLevel);
                  const isActive = ward.wardId === selectedWardId;

                  return (
                    <button
                      key={ward.wardId}
                      type="button"
                      onClick={() => setSelectedWardId(ward.wardId)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border/70 bg-background/50 hover:bg-muted/60",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                            palette.accent,
                          )}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <div className="font-medium">{ward.wardName}</div>
                          <div className="text-sm text-muted-foreground">
                            HI {ward.healthIndex.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <StatusBadge value={ward.riskLevel} mode="risk" />
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </section>
  );
}

