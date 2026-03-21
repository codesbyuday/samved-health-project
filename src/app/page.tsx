import Link from "next/link";
import { ArrowRight, Hospital, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-10 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <Card className="w-full border-slate-200 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="grid gap-10 p-8 md:grid-cols-[1.2fr_0.8fr] md:p-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                <ShieldCheck className="h-4 w-4" />
                <span>Hospital staff access portal</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white md:text-5xl">
                  SMC Smart Health System
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
                  Secure access for hospital teams to manage appointments, patient records, analytics,
                  referrals, and operational health services.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="min-w-36">
                  <Link href="/login">
                    Login
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center">
              <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E88E5] to-blue-700 text-white shadow-lg">
                  <Hospital className="h-8 w-8" />
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Portal Access</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Hospital Staff</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                    Log in with your registered email or phone number to enter the internal dashboard.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
