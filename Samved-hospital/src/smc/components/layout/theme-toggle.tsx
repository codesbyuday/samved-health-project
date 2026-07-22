"use client";

import { useSyncExternalStore } from "react";
import { Sun } from "lucide-react";
import { useTheme } from "@/smc/components/providers/theme-provider";

import { cn } from "@/smc/lib/utils";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      className={cn(
        "relative inline-flex h-11 w-22 items-center overflow-hidden rounded-full px-1 transition-[background,box-shadow] duration-300 ease-out",
        isDark
          ? "bg-[#2c4b98] shadow-[3px_3px_20px_-6px_rgba(0,0,0,0.5)]"
          : "bg-[#e6a555] shadow-[3px_3px_20px_-6px_rgba(0,0,0,0.5)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute left-1 top-1 h-9 w-9 rounded-full bg-white transition-transform duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
          isDark ? "translate-x-[2.75rem]" : "translate-x-0",
        )}
      >
        <div className="relative flex h-full w-full items-center justify-center rounded-full">
          <Sun
            className={cn(
              "h-4 w-4 text-[#e6a555] transition-opacity duration-200",
              isDark ? "opacity-0" : "opacity-100",
            )}
          />
          <div
            className={cn(
              "absolute h-4 w-4 rounded-full bg-[#2c4b98] transition-opacity duration-200",
              isDark ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            className={cn(
              "absolute h-4 w-4 rounded-full bg-white transition-[transform,opacity] duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
              isDark ? "-translate-x-1 opacity-100" : "translate-x-0 opacity-0",
            )}
          />
        </div>
      </div>
    </button>
  );
}

