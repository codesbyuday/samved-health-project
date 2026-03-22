"use client";

import { ShieldAlert } from "lucide-react";

export default function AccessDenied({ message = "Access Denied" }: { message?: string }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-900 dark:bg-amber-950/20">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-600 dark:text-amber-400" />
        <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">Access Denied</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{message}</p>
      </div>
    </div>
  );
}
