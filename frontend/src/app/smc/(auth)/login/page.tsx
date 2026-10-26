import { LoginForm } from "@/smc/components/forms/login-form";

export default function LoginPage() {
  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-border bg-gradient-to-br from-sidebar to-slate-900 p-10 text-white">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">
            SMC Health Governance
          </div>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
            Formal command dashboard for Solapur municipal health operations.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200">
            Monitor disease signals, hospital capacity, ward risk, complaints,
            emergency alerts, vaccination coverage, and system compliance from a
            single administrative control interface.
          </p>
        </section>

        <div className="flex items-center justify-center">
          <div className="w-full">
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}

