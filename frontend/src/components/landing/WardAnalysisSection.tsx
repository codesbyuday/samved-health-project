"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PublicWardPoint } from "@/components/landing/public-data";

interface WardAnalysisSectionProps {
  wards: PublicWardPoint[];
}

export function WardAnalysisSection({ wards }: WardAnalysisSectionProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle>Ward-Wise Analysis</CardTitle>
          <CardDescription className="dark:text-slate-400">
            Top affected wards based on recent public disease reporting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wards} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="ward"
                  tickLine={false}
                  axisLine={false}
                  width={110}
                  fontSize={12}
                />
                <Tooltip />
                <Bar dataKey="cases" fill="#2563EB" radius={[0, 10, 10, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle>Top Affected Wards</CardTitle>
          <CardDescription className="dark:text-slate-400">
            Quick operational overview for recent public trends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {wards.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No ward data available yet.</p>
          ) : (
            wards.slice(0, 5).map((ward, index) => (
              <div
                key={ward.ward}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{ward.ward}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Rank #{index + 1} in recent case volume
                  </p>
                </div>
                <Badge variant={index === 0 ? "default" : "outline"}>{ward.cases} cases</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
