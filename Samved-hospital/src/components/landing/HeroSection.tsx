import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/40 bg-gradient-to-br from-stone-950 via-emerald-950 to-amber-700 px-5 py-10 text-white shadow-2xl shadow-emerald-950/20 sm:px-8 sm:py-12 lg:px-14 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.20),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.28),transparent_30%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="space-y-5">
          <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
            Premium Hospital Portal
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Hospital Operations Command Center
            </h1>
            <p className="max-w-2xl text-base leading-7 text-amber-50 sm:text-lg">
              A secure, role-based workspace for patient records, beds, referrals, lab reports, medicines, and hospital analytics.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-sm text-amber-100">Operational Clarity</p>
            <p className="mt-2 text-2xl font-semibold">Live Dashboards</p>
            <p className="mt-2 text-sm text-amber-100/90">
              Clean summaries for clinical, administrative, and infrastructure teams.
            </p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-slate-950/25 p-5 backdrop-blur-md">
            <p className="text-sm text-amber-100">Secure Access</p>
            <p className="mt-2 text-2xl font-semibold">RBAC Ready</p>
            <p className="mt-2 text-sm text-amber-100/90">
              Hospital staff see only the modules and data their role is allowed to use.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
