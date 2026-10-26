"use client";

import { useMemo, useState, useEffect, useRef, useSyncExternalStore } from "react";
import { useTheme } from "@/smc/components/providers/theme-provider";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import type { WardHealthRow } from "@/smc/lib/types/schema";
import { cn } from "@/smc/lib/utils";

export type PolygonFeature = {
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
  features?: PolygonFeature[];
};

type ProjectedFeature = {
  wardId: number;
  path: string;
  centroid: { x: number; y: number };
};

const SVG_WIDTH = 840;
const SVG_HEIGHT = 840;
const PADDING = 28;
const emptySubscribe = () => () => {};

function getRiskColor(
  riskLevel: string | undefined | null,
  hasData: boolean,
  isDark: boolean
) {
  if (!hasData || !riskLevel) {
    return {
      fill: isDark ? "#1e293b" : "#f1f5f9",
      stroke: isDark ? "#475569" : "#cbd5e1",
      hoverFill: isDark ? "#334155" : "#e2e8f0",
      accent: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };
  }

  const token = riskLevel.toLowerCase();

  if (token.includes("high") || token.includes("critical")) {
    return {
      fill: "#dc2626",
      stroke: "#991b1b",
      hoverFill: "#ef4444",
      accent: "bg-red-100 text-red-900",
    };
  }

  if (token.includes("moderate")) {
    return {
      fill: "#facc15",
      stroke: "#ca8a04",
      hoverFill: "#fbbf24",
      accent: "bg-yellow-100 text-yellow-900",
    };
  }

  return {
    fill: "#22c55e",
    stroke: "#15803d",
    hoverFill: "#4ade80",
    accent: "bg-emerald-100 text-emerald-900",
  };
}

export function WardRiskMap({
  wards,
  hospitalCounts,
  features,
}: WardRiskMapProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";

  const containerRef = useRef<HTMLDivElement>(null);

  // Features with fallback client loading
  const [mapFeatures, setMapFeatures] = useState<PolygonFeature[]>(features || []);
  const [selectedWardId, setSelectedWardId] = useState<number>(wards[0]?.wardId ?? 1);
  const [hoveredWardId, setHoveredWardId] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!features || features.length === 0) {
      fetch("/data/solapur_maps.geojson")
        .then((res) => {
          if (!res.ok) return fetch("/solapur_maps.geojson");
          return res;
        })
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.features) && data.features.length > 0) {
            setMapFeatures(data.features);
          }
        })
        .catch((err) => console.warn("Failed to load map geojson on client:", err));
    } else {
      setMapFeatures(features);
    }
  }, [features]);

  const wardMap = useMemo(
    () => new Map(wards.map((ward) => [ward.wardId, ward])),
    [wards]
  );

  const projected = useMemo<ProjectedFeature[]>(() => {
    if (!mapFeatures || mapFeatures.length === 0) {
      return [];
    }
    const allPoints = mapFeatures.flatMap(
      (feature) => feature.geometry?.coordinates?.[0] || []
    );
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
      drawableHeight / Math.max(maxY - minY, 1e-6)
    );

    const offsetX = PADDING + (drawableWidth - (maxX - minX) * scale) / 2;
    const offsetY = PADDING + (drawableHeight - (maxY - minY) * scale) / 2;

    const projectPoint = ([longitude, latitude]: number[]) => {
      const x = offsetX + (longitude - minX) * scale;
      const y = SVG_HEIGHT - offsetY - (latitude - minY) * scale;
      return { x, y };
    };

    return mapFeatures.map((feature) => {
      const points = feature.geometry.coordinates[0].map(projectPoint);
      const path = points
        .map(
          (point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
        )
        .join(" ")
        .concat(" Z");

      const centroid = points.reduce(
        (accumulator, point) => ({
          x: accumulator.x + point.x / points.length,
          y: accumulator.y + point.y / points.length,
        }),
        { x: 0, y: 0 }
      );

      return {
        wardId: feature.properties.ward,
        path,
        centroid,
      };
    });
  }, [mapFeatures]);

  // Sort SVG rendering so hovered and selected polygons render on top
  const sortedProjected = useMemo(() => {
    return [...projected].sort((a, b) => {
      if (a.wardId === selectedWardId) return 1;
      if (b.wardId === selectedWardId) return -1;
      if (a.wardId === hoveredWardId) return 1;
      if (b.wardId === hoveredWardId) return -1;
      return 0;
    });
  }, [projected, selectedWardId, hoveredWardId]);

  const selectedWard = wardMap.get(selectedWardId) ?? wards[0];
  const selectedWardHasData = Boolean(
    selectedWard && selectedWard.healthIndex && selectedWard.healthIndex > 0
  );

  const hoveredWard = hoveredWardId ? wardMap.get(hoveredWardId) : null;

  const handleMouseMove = (e: React.MouseEvent, wardId: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setHoveredWardId(wardId);
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredWardId(null);
    setTooltipPos(null);
  };

  return (
    <section className="surface p-5">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1.25fr_0.75fr] items-start">
        {/* Left Column: Map Card (Snugly sized, pinned to top, no stretching) */}
        <div
          className="overflow-hidden rounded-[1.75rem] border p-4 flex flex-col gap-3 lg:sticky lg:top-4 self-start"
          style={{
            borderColor: isDark ? "#334155" : "#e2e8f0",
            background: isDark
              ? "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)"
              : "#ffffff",
            boxShadow: isDark
              ? "0 24px 80px -48px rgba(15, 23, 42, 0.45)"
              : "0 24px 80px -48px rgba(15, 23, 42, 0.12)",
          }}
        >
          {/* Header & Legend at top */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Solapur Ward Risk Choropleth
              </h2>
              <p className="text-sm text-muted-foreground">
                Ward polygons are filled by live health risk classification from the current HI dataset.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              {[
                { label: "Low Risk", color: "#22c55e" },
                { label: "Moderate Risk", color: "#facc15" },
                { label: "High Risk", color: "#dc2626" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 shadow-sm"
                  style={{
                    borderColor: isDark ? "#475569" : "#e2e8f0",
                    backgroundColor: isDark ? "rgba(15, 23, 42, 0.72)" : "#ffffff",
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 dark:text-slate-200">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* SVG Map Container (Sits immediately below header, no empty gap) */}
          <div
            ref={containerRef}
            className="relative rounded-[1.5rem] border p-2 flex items-center justify-center overflow-hidden"
            style={{
              borderColor: isDark ? "#475569" : "#e2e8f0",
              backgroundColor: isDark ? "#0f172a" : "#f8fafc",
            }}
            onMouseLeave={handleMouseLeave}
          >
            <svg
              viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
              className="h-auto w-full max-h-[500px] select-none outline-none focus:outline-none"
              role="img"
              aria-label="Ward risk map of Solapur"
              style={{ outline: "none" }}
            >
              <defs>
                <style>{`
                  .ward-path {
                    outline: none !important;
                    -webkit-tap-highlight-color: transparent;
                  }
                  .ward-path:focus,
                  .ward-path:focus-visible,
                  .ward-path:active {
                    outline: none !important;
                    box-shadow: none !important;
                  }
                `}</style>

                {/* Soft elevation shadow for hovered wards */}
                <filter
                  id="ward-hover-shadow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="10"
                    floodColor="#000000"
                    floodOpacity="0.28"
                  />
                </filter>

                {/* Vibrant glow + elevation for selected ward */}
                <filter
                  id="ward-selected-glow"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feDropShadow
                    dx="0"
                    dy="4"
                    stdDeviation="6"
                    floodColor={isDark ? "#38bdf8" : "#0284c7"}
                    floodOpacity="0.6"
                  />
                  <feDropShadow
                    dx="0"
                    dy="10"
                    stdDeviation="14"
                    floodColor="#0f172a"
                    floodOpacity="0.32"
                  />
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

              {sortedProjected.map((feature) => {
                const ward = wardMap.get(feature.wardId);
                const hasData = Boolean(
                  ward && ward.healthIndex && ward.healthIndex > 0
                );
                const palette = getRiskColor(ward?.riskLevel, hasData, isDark);
                const isSelected = feature.wardId === selectedWardId;
                const isHovered = feature.wardId === hoveredWardId;

                return (
                  <g
                    key={feature.wardId}
                    className="outline-none focus:outline-none"
                    style={{ outline: "none" }}
                  >
                    <path
                      d={feature.path}
                      onClick={() => setSelectedWardId(feature.wardId)}
                      onMouseMove={(e) => handleMouseMove(e, feature.wardId)}
                      className="ward-path cursor-pointer transition-all duration-200 outline-none focus:outline-none"
                      style={{
                        outline: "none",
                        fill: isHovered ? palette.hoverFill : palette.fill,
                        stroke: isSelected
                          ? isDark
                            ? "#38bdf8"
                            : "#0284c7"
                          : isHovered
                          ? isDark
                            ? "#ffffff"
                            : "#1e293b"
                          : palette.stroke,
                        strokeWidth: isSelected ? 4.5 : isHovered ? 3.5 : 2,
                        opacity: isSelected ? 1 : isHovered ? 0.98 : 0.9,
                        filter: isSelected
                          ? "url(#ward-selected-glow)"
                          : isHovered
                          ? "url(#ward-hover-shadow)"
                          : undefined,
                      }}
                    />

                    {/* Centroid Ward Number */}
                    <text
                      x={feature.centroid.x}
                      y={feature.centroid.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={cn(
                        "pointer-events-none select-none transition-all duration-150",
                        isSelected
                          ? "text-[18px] font-extrabold fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                          : isHovered
                          ? "text-[17px] font-bold fill-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                          : "text-[15px] font-bold",
                        hasData
                          ? "fill-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.85)]"
                          : isDark
                          ? "fill-slate-400"
                          : "fill-slate-500"
                      )}
                    >
                      {feature.wardId}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Enhanced Floating Hover Tooltip */}
            {tooltipPos && hoveredWard && (
              <div
                className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full mb-3 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 transition-all duration-75"
                style={{
                  left: tooltipPos.x,
                  top: tooltipPos.y - 10,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    Ward {hoveredWard.wardId}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {hoveredWard.wardName}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge
                    value={hoveredWard.healthIndex > 0 ? hoveredWard.riskLevel : "No Data"}
                    mode="risk"
                  />
                  {hoveredWard.healthIndex > 0 && (
                    <span className="font-semibold text-primary">
                      HI {hoveredWard.healthIndex.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Ward Details & Index Order */}
        {selectedWard ? (
          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-border bg-card/95 p-5 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.4)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Selected Ward
                  </div>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight text-slate-900 dark:text-white">
                    {selectedWard.wardName}
                  </h3>
                </div>
                <StatusBadge
                  value={selectedWardHasData ? selectedWard.riskLevel : "No Data"}
                  mode="risk"
                />
              </div>

              <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  {
                    label: "Health Index",
                    value: selectedWardHasData
                      ? selectedWard.healthIndex.toFixed(2)
                      : "No Data",
                  },
                  {
                    label: "Population",
                    value: selectedWard?.population
                      ? selectedWard.population.toLocaleString("en-IN")
                      : "Not specified",
                  },
                  {
                    label: "Doctors",
                    value: selectedWardHasData
                      ? selectedWard.doctors.toString()
                      : "0",
                  },
                  {
                    label: "Beds",
                    value: selectedWardHasData ? selectedWard.beds.toString() : "0",
                  },
                  {
                    label: "Cases",
                    value: selectedWardHasData ? selectedWard.cases.toString() : "0",
                  },
                  {
                    label: "Deaths",
                    value: selectedWardHasData ? selectedWard.deaths.toString() : "0",
                  },
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
                    <div className="mt-1 text-xl font-semibold text-slate-800 dark:text-white">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-border bg-card/95 p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Ward Index Order
              </h4>
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
                {wards.slice(0, 10).map((ward, index) => {
                  const hasData = Boolean(
                    ward.healthIndex && ward.healthIndex > 0
                  );
                  const palette = getRiskColor(ward.riskLevel, hasData, isDark);
                  const isActive = ward.wardId === selectedWardId;

                  return (
                    <button
                      key={ward.wardId}
                      type="button"
                      onClick={() => setSelectedWardId(ward.wardId)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border/70 bg-background/50 hover:bg-muted/60"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                            palette.accent
                          )}
                        >
                          #{index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-white">
                            {ward.wardName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {hasData
                              ? `HI ${ward.healthIndex.toFixed(2)}`
                              : "No data"}
                          </div>
                        </div>
                      </div>
                      <StatusBadge
                        value={hasData ? ward.riskLevel : "No Data"}
                        mode="risk"
                      />
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
