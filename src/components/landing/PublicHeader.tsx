"use client";

import { Activity, Hospital, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoginOptionsDialog } from "@/components/landing/LoginOptionsDialog";
import { useTheme } from "@/contexts/ThemeContext";

export function PublicHeader() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 via-teal-600 to-amber-400 text-white shadow-lg shadow-emerald-900/20">
            <Hospital className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
              Hospital Management Portal
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
              <Activity className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Tech-Lifter hospital operations suite</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 shrink-0 border-stone-200 bg-white/90 text-stone-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/70 dark:bg-stone-950/60 dark:text-stone-200 dark:hover:bg-emerald-950/40"
            aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {!mounted ? (
              <Moon className="h-4 w-4" />
            ) : theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-300" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          <LoginOptionsDialog />
        </div>
      </div>
    </header>
  );
}
