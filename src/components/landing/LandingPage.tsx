"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { PublicHeader } from "@/components/landing/PublicHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { SummaryCards } from "@/components/landing/SummaryCards";
import { DiseaseTrendSection } from "@/components/landing/DiseaseTrendSection";
import { WardAnalysisSection } from "@/components/landing/WardAnalysisSection";
import { RecentReportsSection } from "@/components/landing/RecentReportsSection";
import { toast } from "@/hooks/use-toast";
import {
  emptyPublicLandingData,
  type PublicLandingData,
} from "@/components/landing/public-data";

export function LandingPage() {
  const [data, setData] = useState<PublicLandingData>(emptyPublicLandingData());
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch("/api/public-analytics", {
          method: "GET",
          cache: "no-store",
        });
        const result = (await response.json()) as {
          success?: boolean;
          data?: PublicLandingData;
          error?: string;
        };

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || "Failed to load public analytics");
        }

        setData(result.data);
      } catch (error) {
        setHasError(true);
        toast({
          title: "Unable to load live public analytics",
          description:
            error instanceof Error ? error.message : "Please try again in a moment.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(30,136,229,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.10),transparent_28%)] bg-slate-50 dark:bg-slate-950">
      <PublicHeader />
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <HeroSection />
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <span>Public health analytics are updated from the live disease reporting database.</span>
          <span className="font-medium">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading live data...
              </span>
            ) : hasError ? (
              "Live data unavailable"
            ) : (
              `Last updated: ${format(new Date(data.lastUpdatedAt), "MMM dd, yyyy HH:mm")}`
            )}
          </span>
        </div>
        <SummaryCards summary={data.summary} />
        <DiseaseTrendSection topDiseases={data.topDiseases} timeline={data.timeline} />
        <WardAnalysisSection wards={data.wards} />
        <RecentReportsSection reports={data.recentReports} />
      </div>
    </main>
  );
}
