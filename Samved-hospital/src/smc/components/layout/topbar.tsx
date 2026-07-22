import { Bell, ShieldCheck } from "lucide-react";

import { SignOutButton } from "@/smc/components/layout/sign-out-button";
import { ThemeToggle } from "@/smc/components/layout/theme-toggle";
import type { UserContext } from "@/smc/lib/types/schema";

export function Topbar({ user }: { user: UserContext }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Government Administrative Portal
          </div>
          <div className="mt-1 flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-5 w-5 text-primary" />
            SAMVED Smart Health Ecosystem
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 md:flex">
            <Bell className="h-4 w-4 text-primary" />
            <div className="text-sm">
              <div className="font-medium">{user.name}</div>
              <div className="text-muted-foreground">{user.role}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

