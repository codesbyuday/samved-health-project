"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { sidebarItems } from "@/smc/lib/auth/roles";
import type { OfficialRole } from "@/smc/lib/types/schema";
import { cn } from "@/smc/lib/utils";
import { useSMCNavigation } from "@/smc/components/providers/smc-navigation-provider";

export function Sidebar({
  role,
  onItemClick,
  className,
}: {
  role: OfficialRole;
  onItemClick?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { pendingPath, navigateTo } = useSMCNavigation();

  const activeHref = pendingPath ?? pathname;

  return (
    <aside
      className={cn(
        "w-72 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0 overflow-y-auto",
        className
      )}
    >
      <div className="border-b border-sidebar-border px-6 py-5 shrink-0">
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
          const isActive = activeHref === item.href;
          const isActualRoute = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActualRoute ? "page" : undefined}
              onClick={(e) => {
                if (pathname !== item.href) {
                  e.preventDefault();
                  navigateTo(item.href);
                }
                if (onItemClick) {
                  onItemClick();
                }
              }}
              className={cn(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "text-slate-200 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-6 py-4 text-sm text-slate-300 shrink-0">
        Active role: <span className="font-semibold text-white">{role}</span>
      </div>
    </aside>
  );
}
