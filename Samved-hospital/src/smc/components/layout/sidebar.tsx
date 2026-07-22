"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { sidebarItems } from "@/smc/lib/auth/roles";
import type { OfficialRole } from "@/smc/lib/types/schema";
import { cn } from "@/smc/lib/utils";

export function Sidebar({
  role,
}: {
  role: OfficialRole;
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="border-b border-sidebar-border px-6 py-5">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-200">
          Solapur Municipal Corporation
        </div>
        <h1 className="mt-2 text-xl font-semibold leading-tight">
          SAMVED Health Control Center
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Administrative governance portal for official use only.
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {sidebarItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-200 hover:bg-sidebar-accent",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-6 py-4 text-sm text-slate-300">
        Active role: <span className="font-semibold text-white">{role}</span>
      </div>
    </aside>
  );
}

