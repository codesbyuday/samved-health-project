import { Sidebar } from "@/smc/components/layout/sidebar";
import { Topbar } from "@/smc/components/layout/topbar";
import { requireUserContext } from "@/smc/lib/auth/session";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUserContext();

  return (
    <div className="page-shell flex">
      <Sidebar role={user.role} />
      <div className="min-w-0 flex-1">
        <Topbar user={user} />
        <main className="px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}

