import { Activity, AlertTriangle, CheckCircle2, HeartPulse, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PublicLandingSummary } from "@/components/landing/public-data";

interface SummaryCardsProps {
  summary: PublicLandingSummary;
}

export function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: "Total Cases",
      value: `${summary.totalToday} / ${summary.totalWeek} / ${summary.totalMonth}`,
      helper: "Today / 7 days / 30 days",
      icon: Activity,
      accent: "from-blue-100 to-white text-blue-700 dark:from-blue-950/40 dark:to-slate-900 dark:text-blue-300",
    },
    {
      label: "Active Cases",
      value: summary.activeCases.toLocaleString(),
      helper: "Current active or under treatment",
      icon: HeartPulse,
      accent: "from-amber-100 to-white text-amber-700 dark:from-amber-950/40 dark:to-slate-900 dark:text-amber-300",
    },
    {
      label: "Recovered Cases",
      value: summary.recoveredCases.toLocaleString(),
      helper: "Recorded recoveries",
      icon: CheckCircle2,
      accent: "from-green-100 to-white text-green-700 dark:from-green-950/40 dark:to-slate-900 dark:text-green-300",
    },
    {
      label: "Critical Cases",
      value: summary.criticalCases.toLocaleString(),
      helper: "High severity alerts",
      icon: ShieldAlert,
      accent: "from-red-100 to-white text-red-700 dark:from-red-950/40 dark:to-slate-900 dark:text-red-300",
    },
    {
      label: "Most Reported Disease",
      value: summary.mostReportedDisease,
      helper: "Based on the latest 30-day trend",
      icon: AlertTriangle,
      accent: "from-purple-100 to-white text-purple-700 dark:from-purple-950/40 dark:to-slate-900 dark:text-purple-300",
    },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.label} className="overflow-hidden border-slate-200 shadow-sm dark:border-slate-800">
            <CardContent className={`bg-gradient-to-br p-5 ${card.accent}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{card.label}</p>
                  <p className="text-2xl font-bold leading-tight text-slate-900 dark:text-white">
                    {card.value}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{card.helper}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 shadow-sm dark:bg-slate-900/60">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
