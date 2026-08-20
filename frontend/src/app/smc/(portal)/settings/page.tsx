import { SettingsWorkspace } from "@/smc/components/settings/settings-workspace";
import { requireUserContext } from "@/smc/lib/auth/session";

export default async function SettingsPage() {
  const user = await requireUserContext("/smc/settings");

  return <SettingsWorkspace user={user} />;
}

