"use client";

import { useState } from "react";
import { Bell, Menu, ShieldCheck, X } from "lucide-react";

import { Sidebar } from "@/smc/components/layout/sidebar";
import { SignOutButton } from "@/smc/components/layout/sign-out-button";
import { ThemeToggle } from "@/smc/components/layout/theme-toggle";
import type { UserContext } from "@/smc/lib/types/schema";

export function Topbar({ user }: { user: UserContext }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur shrink-0">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open mobile menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background text-foreground transition hover:bg-muted lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Government Administrative Portal
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-base font-semibold leading-none">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>SAMVED Smart Health</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs md:flex">
              <Bell className="h-3.5 w-3.5 text-primary shrink-0" />
              <div>
                <div className="font-medium leading-tight">{user.name}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{user.role}</div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Responsive Slide-over Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />

          {/* Slide-over Drawer Content */}
          <div className="relative z-10 flex w-72 max-w-[80vw] flex-col bg-sidebar text-sidebar-foreground shadow-2xl">
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Navigation</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1 text-slate-300 hover:bg-sidebar-accent hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Sidebar role={user.role} onItemClick={() => setMobileOpen(false)} className="w-full border-r-0 h-full sticky-none" />
          </div>
        </div>
      )}
    </>
  );
}

