import { Badge } from "@/components/ui/badge";
import { Building2, Stethoscope, Pill, FlaskConical, LogIn } from "lucide-react";
import { LoginOptionsDialog } from "@/components/landing/LoginOptionsDialog";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-amber-200/40 bg-gradient-to-br from-stone-950 via-emerald-950 to-amber-800 px-5 py-10 text-white shadow-2xl shadow-emerald-950/20 sm:px-8 sm:py-12 lg:px-14 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.30),transparent_32%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <Badge className="border-white/20 bg-white/10 px-3.5 py-1 text-sm text-amber-200 hover:bg-white/10">
            SAMVED Smart City Ecosystem
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Smart City Health Management System
            </h1>
            <p className="max-w-2xl text-base leading-7 text-amber-50/90 sm:text-lg">
              Unified real-time health intelligence and operational command platform connecting Municipal Health Governance (SMC), Hospital Operations, Pharmacy Supply Chain, and Diagnostic Laboratories.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <LoginOptionsDialog
              customTrigger={
                <button className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 px-7 py-3.5 text-base font-bold text-slate-950 shadow-xl shadow-emerald-950/50 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]">
                  <LogIn className="h-5 w-5" />
                  <span>Click to Login & Access Dashboards</span>
                </button>
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-semibold uppercase tracking-wider text-amber-200/80">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <Stethoscope className="h-3.5 w-3.5 text-emerald-400" /> Hospital Portal
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <Building2 className="h-3.5 w-3.5 text-sky-400" /> SMC Portal
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <Pill className="h-3.5 w-3.5 text-teal-400" /> Pharma Portal
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <FlaskConical className="h-3.5 w-3.5 text-purple-400" /> Lab Portal
            </span>
          </div>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-emerald-300 font-semibold text-sm">
              <Stethoscope className="h-4 w-4" />
              <span>Hospital Operations</span>
            </div>
            <p className="mt-2 text-xs text-amber-100/90 leading-relaxed">
              Patient records, clinical workflows, bed allocation, lab reports, and referrals.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-slate-950/30 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-sky-300 font-semibold text-sm">
              <Building2 className="h-4 w-4" />
              <span>SMC Governance</span>
            </div>
            <p className="mt-2 text-xs text-amber-100/90 leading-relaxed">
              Citywide disease surveillance, ward analytics, hospital compliance & outbreak alerts.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-slate-950/30 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-teal-300 font-semibold text-sm">
              <Pill className="h-4 w-4" />
              <span>Pharma Command</span>
            </div>
            <p className="mt-2 text-xs text-amber-100/90 leading-relaxed">
              Medicine stock management, prescription fulfillment & rare medicine procurement.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2.5 text-purple-300 font-semibold text-sm">
              <FlaskConical className="h-4 w-4" />
              <span>Diagnostic Labs</span>
            </div>
            <p className="mt-2 text-xs text-amber-100/90 leading-relaxed">
              Diagnostic test catalog, sample processing flow & automated report generation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
