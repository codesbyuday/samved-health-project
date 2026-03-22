import { Badge } from "@/components/ui/badge";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-gradient-to-br from-slate-900 via-blue-950 to-blue-700 px-6 py-12 text-white shadow-2xl sm:px-10 lg:px-14 lg:py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.28),transparent_30%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
        <div className="space-y-5">
          <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">
            Public Health Dashboard
          </Badge>
          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              City Health Monitoring System
            </h1>
            <p className="max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">
              Real-time insights into disease trends and public health data
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-md">
            <p className="text-sm text-blue-100">Public Visibility</p>
            <p className="mt-2 text-2xl font-semibold">Open Analytics</p>
            <p className="mt-2 text-sm text-blue-100/90">
              Aggregated disease intelligence for citizens, hospitals, and civic stakeholders.
            </p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-slate-950/25 p-5 backdrop-blur-md">
            <p className="text-sm text-blue-100">Privacy Standard</p>
            <p className="mt-2 text-2xl font-semibold">No Personal Data</p>
            <p className="mt-2 text-sm text-blue-100/90">
              Only ward, hospital, and disease-level insights are displayed on this page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
