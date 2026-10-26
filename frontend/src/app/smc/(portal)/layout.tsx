import { Sidebar } from "@/smc/components/layout/sidebar";
import { Topbar } from "@/smc/components/layout/topbar";
import { requireUserContext } from "@/smc/lib/auth/session";
import { SMCNavigationProvider, SMCContentShell } from "@/smc/components/providers/smc-navigation-provider";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUserContext();

  return (
    <SMCNavigationProvider>
      <div className="page-shell flex h-screen overflow-hidden">
        <Sidebar role={user.role} className="hidden lg:flex" />
        <div className="min-w-0 flex-1 flex flex-col h-screen overflow-hidden">
          <Topbar user={user} />
          <SMCContentShell>{children}</SMCContentShell>
        </div>
      </div>
    </SMCNavigationProvider>
  );
}

