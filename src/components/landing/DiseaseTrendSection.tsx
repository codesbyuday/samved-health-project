"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicDiseaseChartPoint, PublicTimelinePoint } from "@/components/landing/public-data";

interface DiseaseTrendSectionProps {
  topDiseases: PublicDiseaseChartPoint[];
  timeline: PublicTimelinePoint[];
}

export function DiseaseTrendSection({ topDiseases, timeline }: DiseaseTrendSectionProps) {
  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle>Top Reported Diseases</CardTitle>
          <CardDescription>Highest case counts from the latest 30-day reporting window</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDiseases}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} interval={0} angle={-18} textAnchor="end" height={60} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="cases" fill="#1E88E5" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle>Cases Over Time</CardTitle>
          <CardDescription>Daily reporting trend across the latest 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} minTickGap={18} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="cases" stroke="#0F766E" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
