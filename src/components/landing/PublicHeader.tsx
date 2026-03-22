import { Activity, Building2 } from "lucide-react";
import { LoginOptionsDialog } from "@/components/landing/LoginOptionsDialog";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E88E5] to-blue-700 text-white shadow-lg">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Smart Public Health System
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Activity className="h-3.5 w-3.5" />
              Public disease intelligence dashboard
            </p>
          </div>
        </div>
        <LoginOptionsDialog />
      </div>
    </header>
  );
}
