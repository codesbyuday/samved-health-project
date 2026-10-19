import { PageHeader } from "@/smc/components/layout/page-header";
import { getHospitalOverviewRows } from "@/smc/lib/data/queries";
import { HospitalRegistryTable } from "@/smc/components/hospital/hospital-registry-table";
import { RegistrationRequestsTab } from "@/smc/components/hospital/registration-requests-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, FileText } from "lucide-react";

export default async function HospitalsPage() {
  const rows = await getHospitalOverviewRows();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Network Management"
        description="Registered municipal hospitals, bed capacities, ward coverage, verification status, and uploaded clinical establishment documents."
      />

      <Tabs defaultValue="registry" className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          <TabsTrigger
            value="registry"
            className="rounded-lg font-semibold text-xs md:text-sm px-4 py-2 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            Hospital Registry ({rows.length})
          </TabsTrigger>
          <TabsTrigger
            value="requests"
            className="rounded-lg font-semibold text-xs md:text-sm px-4 py-2 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Pending Registration Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registry" className="space-y-4 focus-visible:outline-none">
          <HospitalRegistryTable hospitals={rows} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4 focus-visible:outline-none">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <RegistrationRequestsTab />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
