"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Stethoscope, Pill, FlaskConical } from "lucide-react";
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

export function LoginOptionsDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleNavigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-w-28">Login</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Choose Portal Access</DialogTitle>
          <DialogDescription>
            Continue to the appropriate operational portal.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Hospital Card */}
          <Card className="border-emerald-100 bg-gradient-to-br from-white via-emerald-50/70 to-amber-50/60 dark:border-emerald-900/60 dark:from-stone-950 dark:via-emerald-950/30 dark:to-amber-950/20">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-400 text-white shadow-lg shadow-emerald-900/20">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <Badge>Hospital</Badge>
              </div>
              <CardTitle className="text-lg">Hospital Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Access patient records, appointments, lab reports, referrals, inventory, and hospital dashboards.
              </p>
              <Button className="w-full" onClick={() => handleNavigate("/login")}>
                Continue to Hospital Portal
              </Button>
            </CardContent>
          </Card>

          {/* SMC Card */}
          <Card className="border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-slate-50 dark:border-sky-900/60 dark:from-stone-950 dark:via-sky-950/30 dark:to-slate-950/40">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-700 via-blue-600 to-cyan-400 text-white shadow-lg shadow-sky-900/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <Badge variant="outline">SMC</Badge>
              </div>
              <CardTitle className="text-lg">SMC Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Access municipal dashboards for disease surveillance, ward analytics, hospital compliance, complaints, and emergency response.
              </p>
              <Button variant="outline" className="w-full" onClick={() => handleNavigate("/smc/login")}>
                Continue to SMC Portal
              </Button>
            </CardContent>
          </Card>

          {/* Pharma Card */}
          <Card className="border-teal-100 bg-gradient-to-br from-white via-teal-50/70 to-emerald-50/60 dark:border-teal-900/60 dark:from-stone-950 dark:via-teal-950/30 dark:to-emerald-950/20">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 via-emerald-600 to-cyan-500 text-white shadow-lg shadow-teal-900/20">
                  <Pill className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300">Pharma</Badge>
              </div>
              <CardTitle className="text-lg">Pharma Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Access pharmacy inventory, prescription processing, stock alerts, sales analytics, demand signals, and rare medicine requests.
              </p>
              <Button className="w-full bg-teal-700 hover:bg-teal-800 text-white" onClick={() => handleNavigate("/pharma/login")}>
                Continue to Pharma Portal
              </Button>
            </CardContent>
          </Card>

          {/* Lab Card */}
          <Card className="border-purple-100 bg-gradient-to-br from-white via-purple-50/70 to-indigo-50/60 dark:border-purple-900/60 dark:from-stone-950 dark:via-purple-950/30 dark:to-indigo-950/20">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-500 text-white shadow-lg shadow-purple-900/20">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300">Lab</Badge>
              </div>
              <CardTitle className="text-lg">Lab Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Access diagnostic lab test bookings, sample collection workflows, report uploads, test catalogs, and disease surveillance.
              </p>
              <Button className="w-full bg-purple-700 hover:bg-purple-800 text-white" onClick={() => handleNavigate("/lab/login")}>
                Continue to Lab Portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
