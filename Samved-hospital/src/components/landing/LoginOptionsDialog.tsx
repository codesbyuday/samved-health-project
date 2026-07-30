"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Stethoscope, Pill, FlaskConical, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LoginOptionsDialogProps {
  customTrigger?: React.ReactNode;
  triggerText?: string;
  triggerClassName?: string;
}

export function LoginOptionsDialog({
  customTrigger,
  triggerText = "Login",
  triggerClassName = "min-w-28 font-semibold",
}: LoginOptionsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger || (
          <Button className={triggerClassName}>
            {triggerText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-5xl rounded-[1.75rem] border border-slate-200/80 p-5 shadow-2xl backdrop-blur-xl sm:p-7 dark:border-slate-800 dark:bg-slate-950/95">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">
            Choose Portal Access
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            Select your operational workspace to log in to your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[72vh] overflow-y-auto pr-1 sm:max-h-[78vh] scrollbar-thin">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Hospital Card */}
            <Card className="flex flex-col justify-between border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-amber-50/60 shadow-md transition-transform hover:-translate-y-1 dark:border-emerald-900/60 dark:from-stone-950 dark:via-emerald-950/30 dark:to-amber-950/20">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-400 text-white shadow-lg shadow-emerald-900/20">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Hospital</Badge>
                </div>
                <CardTitle className="text-lg font-bold">Hospital Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  Access patient records, appointments, lab reports, referrals, bed inventory, and hospital dashboards.
                </p>
                <Button className="w-full bg-emerald-700 font-semibold text-white hover:bg-emerald-800" onClick={() => handleNavigate("/login")}>
                  Continue to Hospital <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* SMC Card */}
            <Card className="flex flex-col justify-between border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-slate-50 shadow-md transition-transform hover:-translate-y-1 dark:border-sky-900/60 dark:from-stone-950 dark:via-sky-950/30 dark:to-slate-950/40">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-700 via-blue-600 to-cyan-400 text-white shadow-lg shadow-sky-900/20">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="border-sky-300 text-sky-700 dark:text-sky-300">SMC</Badge>
                </div>
                <CardTitle className="text-lg font-bold">SMC Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  Access municipal dashboards for disease surveillance, ward analytics, hospital compliance, and emergency response.
                </p>
                <Button variant="outline" className="w-full border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100 dark:hover:bg-sky-900" onClick={() => handleNavigate("/smc/login")}>
                  Continue to SMC <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Pharma Card */}
            <Card className="flex flex-col justify-between border-teal-100 bg-gradient-to-br from-white via-teal-50/70 to-emerald-50/60 shadow-md transition-transform hover:-translate-y-1 dark:border-teal-900/60 dark:from-stone-950 dark:via-teal-950/30 dark:to-emerald-950/20">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-500 text-white shadow-lg shadow-teal-900/20">
                    <Pill className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">Pharma</Badge>
                </div>
                <CardTitle className="text-lg font-bold">Pharma Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  Access pharmacy inventory, prescription processing, stock alerts, sales analytics, and rare drug requests.
                </p>
                <Button className="w-full bg-teal-700 font-semibold text-white hover:bg-teal-800" onClick={() => handleNavigate("/pharma/login")}>
                  Continue to Pharma <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Lab Card */}
            <Card className="flex flex-col justify-between border-purple-100 bg-gradient-to-br from-white via-purple-50/70 to-indigo-50/60 shadow-md transition-transform hover:-translate-y-1 dark:border-purple-900/60 dark:from-stone-950 dark:via-purple-950/30 dark:to-indigo-950/20">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-500 text-white shadow-lg shadow-purple-900/20">
                    <FlaskConical className="h-5 w-5" />
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">Lab</Badge>
                </div>
                <CardTitle className="text-lg font-bold">Lab Login</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 sm:text-sm">
                  Access diagnostic lab test bookings, sample collection workflows, report uploads, and test catalogs.
                </p>
                <Button className="w-full bg-purple-700 font-semibold text-white hover:bg-purple-800" onClick={() => handleNavigate("/lab/login")}>
                  Continue to Lab <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
