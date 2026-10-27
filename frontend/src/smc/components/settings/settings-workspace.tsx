"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Eye,
  Info,
  LayoutDashboard,
  MoonStar,
  RefreshCcw,
  Shield,
  Siren,
  Sliders,
  SunMedium,
  Volume2,
} from "lucide-react";

import { SignOutButton } from "@/smc/components/layout/sign-out-button";
import { useTheme } from "@/smc/components/providers/theme-provider";
import type { UserContext } from "@/smc/lib/types/schema";
import { cn } from "@/smc/lib/utils";

type PortalPreferences = {
  compactMode: boolean;
  reducedMotion: boolean;
  highContrastNav: boolean;
  outbreakAlerts: boolean;
  complianceReminders: boolean;
  audioAlerts: boolean;
};

const STORAGE_KEY = "samved.portal.preferences";

const defaultPreferences: PortalPreferences = {
  compactMode: false,
  reducedMotion: false,
  highContrastNav: false,
  outbreakAlerts: true,
  complianceReminders: true,
  audioAlerts: false,
};

function getInitialPreferences(): PortalPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.error("Failed to parse portal preferences:", err);
  }
  return defaultPreferences;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/40">
      <div className="space-y-0.5">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

export function SettingsWorkspace({ user }: { user: UserContext }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [preferences, setPreferences] = useState<PortalPreferences>(defaultPreferences);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPreferences(getInitialPreferences());
    setMounted(true);
  }, []);

  const updatePreference = <K extends keyof PortalPreferences>(
    key: K,
    value: PortalPreferences[K],
  ) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      // Apply root DOM attributes
      const root = document.documentElement;
      if (key === "compactMode") {
        root.dataset.density = value ? "compact" : "comfortable";
      } else if (key === "highContrastNav") {
        root.dataset.sidebarContrast = value ? "high" : "standard";
      } else if (key === "reducedMotion") {
        root.classList.toggle("reduce-motion", Boolean(value));
      }
    }

    setStatusMessage("Preference updated and saved.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const resetPreferences = () => {
    setPreferences(defaultPreferences);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences));
      const root = document.documentElement;
      root.dataset.density = "comfortable";
      root.dataset.sidebarContrast = "standard";
      root.classList.remove("reduce-motion");
    }
    setStatusMessage("Settings restored to defaults.");
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const currentTheme = theme || "light";

  return (
    <div className="space-y-6">
      {/* Officer Header Card */}
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-900 p-6 text-white shadow-xl md:p-8">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wider text-blue-200">
              <Shield className="h-3.5 w-3.5" />
              SMC Control Room Settings
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">
              Portal Preferences & Configuration
            </h1>
            <p className="mt-1 text-sm text-blue-100/80 max-w-xl">
              Customize your administrative workspace for Solapur Municipal Corporation. Preferences are saved locally to this device.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={resetPreferences}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <RefreshCcw className="h-4 w-4" />
              Reset Defaults
            </button>
            <div className="rounded-xl bg-white/10 px-4 py-2 text-xs font-medium text-blue-100 border border-white/10">
              Active Official: <strong className="text-white">{user.name}</strong>
            </div>
          </div>
        </div>

        {statusMessage ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {statusMessage}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Appearance & Theme Card */}
          <section className="surface rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border px-6 py-4 flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                <SunMedium className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Appearance & Theme</h2>
                <p className="text-xs text-muted-foreground">
                  Select interface theme and layout density
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
                  Theme Mode
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "light",
                      label: "Light Mode",
                      desc: "Clean, high-visibility daytime palette",
                      icon: SunMedium,
                    },
                    {
                      value: "dark",
                      label: "Dark Mode",
                      desc: "Reduced glare for low-light night shifts",
                      icon: MoonStar,
                    },
                    {
                      value: "system",
                      label: "System Sync",
                      desc: "Automatically adapts to operating system",
                      icon: LayoutDashboard,
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isActive = mounted && currentTheme === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setTheme(option.value);
                          setStatusMessage(`Theme set to ${option.label}.`);
                          setTimeout(() => setStatusMessage(null), 3000);
                        }}
                        className={cn(
                          "flex flex-col text-left p-4 rounded-xl border transition-all cursor-pointer",
                          isActive
                            ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/20"
                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
                        )}
                      >
                        <div className="flex items-center justify-between w-full">
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isActive ? "text-primary" : "text-muted-foreground",
                            )}
                          />
                          {isActive ? (
                            <span className="flex h-2 w-2 rounded-full bg-primary" />
                          ) : null}
                        </div>
                        <div className="mt-3 font-semibold text-sm">{option.label}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{option.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Display & Ergonomics
                </label>
                <ToggleRow
                  label="Compact Monitoring Density"
                  description="Reduces card and table padding to display more surveillance data on screen."
                  checked={preferences.compactMode}
                  onChange={(val) => updatePreference("compactMode", val)}
                />
                <ToggleRow
                  label="High-Contrast Navigation"
                  description="Enforces elevated contrast on sidebar links for presentation monitors."
                  checked={preferences.highContrastNav}
                  onChange={(val) => updatePreference("highContrastNav", val)}
                />
                <ToggleRow
                  label="Reduced Motion"
                  description="Suppresses UI transitions and animated emphasis for faster visual scanning."
                  checked={preferences.reducedMotion}
                  onChange={(val) => updatePreference("reducedMotion", val)}
                />
              </div>
            </div>
          </section>

          {/* Operational Alerts & Notifications */}
          <section className="surface rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border px-6 py-4 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Alerts & Notifications</h2>
                <p className="text-xs text-muted-foreground">
                  Configure incident escalation and compliance notification behavior
                </p>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <ToggleRow
                label="Outbreak Escalation Banners"
                description="Surface urgent notification banners when ward disease positivity triggers risk thresholds."
                checked={preferences.outbreakAlerts}
                onChange={(val) => updatePreference("outbreakAlerts", val)}
              />
              <ToggleRow
                label="Hospital Compliance Reminders"
                description="Highlight facilities that have not reported bed occupancy or stock metrics within 24 hours."
                checked={preferences.complianceReminders}
                onChange={(val) => updatePreference("complianceReminders", val)}
              />
              <ToggleRow
                label="Emergency Audio Chime"
                description="Play an audible chime when new critical citizen complaints or outbreaks are logged."
                checked={preferences.audioAlerts}
                onChange={(val) => updatePreference("audioAlerts", val)}
              />
            </div>
          </section>
        </div>

        {/* Right Sidebar: Profile & Session Info */}
        <div className="space-y-6">
          <section className="surface rounded-2xl border border-border overflow-hidden">
            <div className="border-b border-border px-6 py-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Officer Profile</h2>
                <p className="text-xs text-muted-foreground">Authenticated session details</p>
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <div className="text-muted-foreground font-medium">Full Name</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">{user.name}</div>
              </div>

              <div>
                <div className="text-muted-foreground font-medium">Designation</div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {user.designation ?? "Municipal Health Officer"}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground font-medium">System Role</div>
                <div className="mt-1">
                  <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                    {user.role}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground font-medium">Official ID</div>
                <div className="font-mono text-xs text-foreground mt-0.5">
                  {user.officialId ?? user.id}
                </div>
              </div>

              <div>
                <div className="text-muted-foreground font-medium">Contact Phone</div>
                <div className="text-xs text-foreground mt-0.5">{user.phone ?? "9860001001"}</div>
              </div>

              <div>
                <div className="text-muted-foreground font-medium">Account Status</div>
                <div className="text-xs text-foreground mt-0.5">
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                    {user.status ?? "active"}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-muted-foreground font-medium">Email</div>
                <div className="text-xs text-foreground mt-0.5">{user.email ?? "smc-health@solapurcorporation.gov.in"}</div>
              </div>

              <div className="pt-4 border-t border-border">
                <SignOutButton />
              </div>
            </div>
          </section>

          {/* System Environment Info */}
          <section className="surface rounded-2xl border border-border p-6 text-xs space-y-3">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Info className="h-4 w-4 text-primary" />
              SAMVED Municipal Platform
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Connected to Solapur Municipal Corporation Central Healthcare Infrastructure. Live synchronized with municipal wards, private and government hospital registries.
            </p>
            <div className="flex items-center justify-between text-muted-foreground pt-2 border-t border-border">
              <span>Environment</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">Production Live</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Jurisdiction</span>
              <span className="font-medium text-foreground">Solapur City (Wards 1–20)</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
