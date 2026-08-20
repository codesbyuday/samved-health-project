"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useState,
} from "react";
import {
  Bell,
  BriefcaseMedical,
  Check,
  ChevronRight,
  Copy,
  LayoutDashboard,
  MoonStar,
  RefreshCcw,
  Save,
  Shield,
  Siren,
  SunMedium,
  TimerReset,
} from "lucide-react";
import { useTheme } from "@/smc/components/providers/theme-provider";

import { SignOutButton } from "@/smc/components/layout/sign-out-button";
import type { UserContext } from "@/smc/lib/types/schema";
import { cn } from "@/smc/lib/utils";

type ThemeMode = "light" | "dark" | "system";
type LandingPage =
  | "/smc/dashboard"
  | "/smc/ward-health-index"
  | "/smc/disease-surveillance"
  | "/smc/reports-analytics";
type EscalationChannel =
  | "district-control-room"
  | "field-response"
  | "hospital-nodal-desk";
type SessionTimeout = "15" | "30" | "60";
type DataExportMode = "redacted" | "official" | "full";

type PortalPreferences = {
  themeMode: ThemeMode;
  compactMode: boolean;
  reducedMotion: boolean;
  highContrastNav: boolean;
  emailNotifications: boolean;
  browserNotifications: boolean;
  dailyDigest: boolean;
  outbreakEscalation: boolean;
  quietHoursEnabled: boolean;
  quietHoursFrom: string;
  quietHoursTo: string;
  alertConfirmation: boolean;
  autoAttachWardSnapshot: boolean;
  landingPage: LandingPage;
  escalationChannel: EscalationChannel;
  sessionTimeout: SessionTimeout;
  dataExportMode: DataExportMode;
};

const STORAGE_KEY = "samved.portal.preferences";

const defaultPreferences: PortalPreferences = {
  themeMode: "system",
  compactMode: false,
  reducedMotion: false,
  highContrastNav: false,
  emailNotifications: true,
  browserNotifications: true,
  dailyDigest: true,
  outbreakEscalation: true,
  quietHoursEnabled: true,
  quietHoursFrom: "22:00",
  quietHoursTo: "06:00",
  alertConfirmation: true,
  autoAttachWardSnapshot: true,
  landingPage: "/smc/dashboard",
  escalationChannel: "district-control-room",
  sessionTimeout: "30",
  dataExportMode: "official",
};

const landingPageLabels: Record<LandingPage, string> = {
  "/smc/dashboard": "Executive dashboard",
  "/smc/ward-health-index": "Ward health index",
  "/smc/disease-surveillance": "Disease surveillance",
  "/smc/reports-analytics": "Reports and analytics",
};

const escalationLabels: Record<EscalationChannel, string> = {
  "district-control-room": "District control room",
  "field-response": "Field response unit",
  "hospital-nodal-desk": "Hospital nodal desk",
};

const exportLabels: Record<DataExportMode, string> = {
  redacted: "Redacted public brief",
  official: "Official inter-department export",
  full: "Full operational dataset",
};

function getTimestamp() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitialState() {
  if (typeof window === "undefined") {
    return {
      preferences: defaultPreferences,
      statusMessage: "Default administrative preferences are active on this device.",
      lastSavedAt: null as string | null,
    };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      preferences: defaultPreferences,
      statusMessage: "Default administrative preferences are active on this device.",
      lastSavedAt: null as string | null,
    };
  }

  try {
    return {
      preferences: {
        ...defaultPreferences,
        ...(JSON.parse(saved) as Partial<PortalPreferences>),
      },
      statusMessage: "Saved administrative preferences restored for this browser.",
      lastSavedAt: null as string | null,
    };
  } catch {
    return {
      preferences: defaultPreferences,
      statusMessage: "Saved settings were unreadable, so the portal reverted to defaults.",
      lastSavedAt: null as string | null,
    };
  }
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
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border/80 bg-background/70 px-4 py-4">
      <div className="min-w-0">
        <div className="font-semibold text-foreground">{label}</div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-7 w-[3.25rem] shrink-0 items-center rounded-full border transition",
          checked
            ? "border-primary bg-primary shadow-[0_8px_20px_-12px_rgba(37,99,235,0.8)]"
            : "border-border bg-muted",
        )}
      >
        <span
          className={cn(
            "ml-0.5 inline-block h-[1.375rem] w-[1.375rem] rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

function StatTile({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-white/95 backdrop-blur">
      <div className="text-xs uppercase tracking-[0.24em] text-white/65">{label}</div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-white/70">{helper}</div>
    </div>
  );
}

export function SettingsWorkspace({ user }: { user: UserContext }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [initialState] = useState(getInitialState);
  const [preferences, setPreferences] = useState(initialState.preferences);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialState.lastSavedAt);
  const [statusMessage, setStatusMessage] = useState(initialState.statusMessage);

  const deferredPreferences = useDeferredValue(preferences);

  const applyPreferences = useEffectEvent((next: PortalPreferences) => {
    setTheme(next.themeMode);

    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;

    root.dataset.density = next.compactMode ? "compact" : "comfortable";
    root.dataset.sidebarContrast = next.highContrastNav ? "high" : "standard";
    root.classList.toggle("reduce-motion", next.reducedMotion);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  });

  useEffect(() => {
    applyPreferences(preferences);
  }, [preferences]);

  const updatePreference = <K extends keyof PortalPreferences>(
    key: K,
    value: PortalPreferences[K],
  ) => {
    startTransition(() => {
      setPreferences((current) => ({
        ...current,
        [key]: value,
      }));
      setLastSavedAt(getTimestamp());
      setStatusMessage("Changes saved locally and applied to the portal shell.");
    });
  };

  const resetPreferences = () => {
    startTransition(() => {
      setPreferences(defaultPreferences);
      setLastSavedAt(getTimestamp());
      setStatusMessage("Defaults restored for this browser session.");
    });
  };

  const summaryText = [
    `Official: ${user.name}`,
    `Role: ${user.role}`,
    `Theme mode: ${deferredPreferences.themeMode}`,
    `Landing page: ${landingPageLabels[deferredPreferences.landingPage]}`,
    `Escalation route: ${escalationLabels[deferredPreferences.escalationChannel]}`,
    `Session timeout: ${deferredPreferences.sessionTimeout} minutes`,
    `Export mode: ${exportLabels[deferredPreferences.dataExportMode]}`,
    `Quiet hours: ${
      deferredPreferences.quietHoursEnabled
        ? `${deferredPreferences.quietHoursFrom} to ${deferredPreferences.quietHoursTo}`
        : "Disabled"
    }`,
  ].join("\n");

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setStatusMessage("Settings summary copied to clipboard for handoff notes.");
    } catch {
      setStatusMessage("Clipboard access was blocked. The summary is still visible on the page.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-[linear-gradient(135deg,#0f172a_0%,#172554_42%,#1d4ed8_100%)] p-6 text-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.85)] md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_48%)] lg:block" />
        <div className="relative grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
              Administrative settings
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              Personalize the SAMVED control room for faster ward-level operations.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/88 md:text-base">
              This workspace lets {user.name} tune appearance, alerting, security posture,
              and export behavior. Every change is applied instantly and saved locally to
              this device for the current official.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={copySummary}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-slate-950/15"
              >
                <Copy className="h-4 w-4" />
                Copy handoff summary
              </button>
              <button
                type="button"
                onClick={resetPreferences}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <RefreshCcw className="h-4 w-4" />
                Restore defaults
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <StatTile
              label="Theme status"
              value={
                preferences.themeMode === "system"
                  ? `System (${resolvedTheme ?? "light"})`
                  : preferences.themeMode
              }
              helper="Synced with the live portal theme toggle."
            />
            <StatTile
              label="Alert posture"
              value={preferences.outbreakEscalation ? "Escalation armed" : "Manual review only"}
              helper="Controls outbreak routing behavior for high-priority signals."
            />
            <StatTile
              label="Session guard"
              value={`${preferences.sessionTimeout} min timeout`}
              helper="Shorter sessions reduce unattended console risk."
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 2xl:grid-cols-[1.5fr_0.8fr]">
        <div className="space-y-6">
          <section className="surface overflow-hidden">
            <div className="border-b border-border/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Official profile</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Identity and access context pulled from the authenticated session.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-6 md:grid-cols-2">
              <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Official name
                </div>
                <div className="mt-3 text-lg font-semibold">{user.name}</div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Role</div>
                <div className="mt-3 text-lg font-semibold">{user.role}</div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</div>
                <div className="mt-3 text-base font-medium">{user.email ?? "Not available"}</div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Designation
                </div>
                <div className="mt-3 text-base font-medium">
                  {user.designation ?? "Ward administration official"}
                </div>
              </div>
            </div>
          </section>

          <section className="surface overflow-hidden">
            <div className="border-b border-border/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-300">
                  <SunMedium className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Appearance and comfort</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Configure the visual shell used during long monitoring shifts.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div>
                <div className="text-sm font-semibold text-foreground">Theme mode</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {[
                    { value: "light" as const, label: "Light", icon: SunMedium },
                    { value: "dark" as const, label: "Dark", icon: MoonStar },
                    { value: "system" as const, label: "System", icon: LayoutDashboard },
                  ].map((option) => {
                    const Icon = option.icon;
                    const active = preferences.themeMode === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => updatePreference("themeMode", option.value)}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-left transition",
                          active
                            ? "border-primary bg-primary/10 shadow-[0_14px_32px_-22px_rgba(37,99,235,0.85)]"
                            : "border-border/80 bg-background hover:border-primary/40",
                        )}
                      >
                        <Icon className="h-5 w-5 text-primary" />
                        <div className="mt-4 font-semibold">{option.label}</div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {option.value === "system"
                            ? "Follow device preference automatically."
                            : `Keep the portal in ${option.label.toLowerCase()} mode.`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4">
                <ToggleRow
                  label="Compact monitoring layout"
                  description="Reduce spacing in cards and containers to fit more ward intelligence on screen."
                  checked={preferences.compactMode}
                  onChange={(value) => updatePreference("compactMode", value)}
                />
                <ToggleRow
                  label="Reduced motion"
                  description="Tone down transitions and animated emphasis for distraction-free monitoring."
                  checked={preferences.reducedMotion}
                  onChange={(value) => updatePreference("reducedMotion", value)}
                />
                <ToggleRow
                  label="High-contrast sidebar"
                  description="Boost sidebar contrast for projector screens and low-light control rooms."
                  checked={preferences.highContrastNav}
                  onChange={(value) => updatePreference("highContrastNav", value)}
                />
              </div>
            </div>
          </section>

          <section className="surface overflow-hidden">
            <div className="border-b border-border/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-red-500/10 p-3 text-red-600 dark:text-red-300">
                  <Siren className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Operations and escalation defaults
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Set the routing rules used most often during outbreak and infrastructure events.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold">Default landing page</span>
                <select
                  value={preferences.landingPage}
                  onChange={(event) =>
                    updatePreference("landingPage", event.target.value as LandingPage)
                  }
                  className="w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm"
                >
                  {Object.entries(landingPageLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold">Primary escalation channel</span>
                <select
                  value={preferences.escalationChannel}
                  onChange={(event) =>
                    updatePreference(
                      "escalationChannel",
                      event.target.value as EscalationChannel,
                    )
                  }
                  className="w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm"
                >
                  {Object.entries(escalationLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold">Session timeout</span>
                <select
                  value={preferences.sessionTimeout}
                  onChange={(event) =>
                    updatePreference("sessionTimeout", event.target.value as SessionTimeout)
                  }
                  className="w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold">Default export profile</span>
                <select
                  value={preferences.dataExportMode}
                  onChange={(event) =>
                    updatePreference("dataExportMode", event.target.value as DataExportMode)
                  }
                  className="w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm"
                >
                  {Object.entries(exportLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="md:col-span-2 grid gap-4">
                <ToggleRow
                  label="Require confirmation before citizen alerts"
                  description="Keep a human review gate in place before ward-wide public advisories are sent."
                  checked={preferences.alertConfirmation}
                  onChange={(value) => updatePreference("alertConfirmation", value)}
                />
                <ToggleRow
                  label="Attach ward snapshot to escalation packets"
                  description="Include current ward metrics and recent risk context alongside routed cases."
                  checked={preferences.autoAttachWardSnapshot}
                  onChange={(value) => updatePreference("autoAttachWardSnapshot", value)}
                />
              </div>
            </div>
          </section>

          <section className="surface overflow-hidden">
            <div className="border-b border-border/80 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-300">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Notifications and quiet hours</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep urgent signals loud while reducing routine noise after hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <ToggleRow
                label="Email notifications"
                description="Receive outbreak approvals, hospital verifications, and escalations by email."
                checked={preferences.emailNotifications}
                onChange={(value) => updatePreference("emailNotifications", value)}
              />
              <ToggleRow
                label="Browser notifications"
                description="Show live in-browser alerts while the SAMVED control room is open."
                checked={preferences.browserNotifications}
                onChange={(value) => updatePreference("browserNotifications", value)}
              />
              <ToggleRow
                label="Daily operations digest"
                description="Bundle routine updates into a single morning summary for faster review."
                checked={preferences.dailyDigest}
                onChange={(value) => updatePreference("dailyDigest", value)}
              />
              <ToggleRow
                label="Automatic outbreak escalation"
                description="Escalate severe surveillance signals immediately using the selected primary channel."
                checked={preferences.outbreakEscalation}
                onChange={(value) => updatePreference("outbreakEscalation", value)}
              />
              <ToggleRow
                label="Enable quiet hours"
                description="Suppress non-critical reminders during scheduled night operations."
                checked={preferences.quietHoursEnabled}
                onChange={(value) => updatePreference("quietHoursEnabled", value)}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Quiet hours from</span>
                  <input
                    type="time"
                    value={preferences.quietHoursFrom}
                    disabled={!preferences.quietHoursEnabled}
                    onChange={(event) => updatePreference("quietHoursFrom", event.target.value)}
                    className="w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-55"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold">Quiet hours to</span>
                  <input
                    type="time"
                    value={preferences.quietHoursTo}
                    disabled={!preferences.quietHoursEnabled}
                    onChange={(event) => updatePreference("quietHoursTo", event.target.value)}
                    className="w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-55"
                  />
                </label>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="surface sticky top-24 overflow-hidden">
            <div className="border-b border-border/80 px-6 py-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">Live console preview</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A quick read on how the current profile will behave.
                  </p>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <Check className="mr-1 inline h-3.5 w-3.5" />
                  Applied
                </div>
              </div>
            </div>

            <div className="space-y-5 px-6 py-6">
              <div className="rounded-[1.75rem] border border-border/80 bg-[linear-gradient(180deg,rgba(37,99,235,0.12),rgba(37,99,235,0.02))] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Console mode
                    </div>
                    <div className="mt-2 text-xl font-semibold">
                      {preferences.compactMode ? "Compact operations view" : "Comfort view"}
                    </div>
                  </div>
                  <BriefcaseMedical className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    preferences.themeMode === "system"
                      ? `Theme: system (${resolvedTheme ?? "light"})`
                      : `Theme: ${preferences.themeMode}`,
                    preferences.reducedMotion ? "Reduced motion" : "Standard motion",
                    preferences.highContrastNav ? "High-contrast nav" : "Standard nav",
                  ].map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-primary/15 bg-background/80 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    label: "Landing page",
                    value: landingPageLabels[preferences.landingPage],
                  },
                  {
                    label: "Escalation route",
                    value: escalationLabels[preferences.escalationChannel],
                  },
                  {
                    label: "Export profile",
                    value: exportLabels[preferences.dataExportMode],
                  },
                  {
                    label: "Quiet hours",
                    value: preferences.quietHoursEnabled
                      ? `${preferences.quietHoursFrom} to ${preferences.quietHoursTo}`
                      : "Disabled",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 bg-background/75 px-4 py-3"
                  >
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {item.label}
                      </div>
                      <div className="mt-1 font-semibold">{item.value}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Save className="h-4 w-4 text-primary" />
                  Local persistence
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{statusMessage}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {lastSavedAt ? `Last updated at ${lastSavedAt}` : "Awaiting first save"}
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 bg-muted/35 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <TimerReset className="h-4 w-4 text-primary" />
                  Session safety
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  This page updates local preferences only. Account identity and authorization
                  remain controlled by the authenticated SAMVED session.
                </p>
                <div className="mt-4">
                  <SignOutButton />
                </div>
              </div>
            </div>
          </section>

          <section className="surface p-6">
            <div className="text-sm font-semibold">Clipboard-ready summary</div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use this when handing over the console between officers.
            </p>
            <textarea
              readOnly
              value={summaryText}
              className="mt-4 min-h-52 w-full rounded-2xl border border-border/80 bg-background px-4 py-3 text-sm leading-6"
            />
          </section>
        </aside>
      </div>
    </div>
  );
}

