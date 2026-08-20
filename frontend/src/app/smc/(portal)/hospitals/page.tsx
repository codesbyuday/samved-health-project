import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { VerifyHospitalButton } from "@/smc/components/forms/verify-hospital-button";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getHospitalOverviewRows } from "@/smc/lib/data/queries";
import { formatNumber } from "@/smc/lib/utils";

export default async function HospitalsPage() {
  const rows = await getHospitalOverviewRows();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Network Management"
        description="Registered hospitals, ward coverage, capacity, contact details, and SMC verification workflow."
      />

      <TableCard
        title="Hospital Registry"
        columns={[
          { key: "name", label: "Hospital Name" },
          { key: "ward", label: "Ward" },
          { key: "type", label: "Type" },
          { key: "beds", label: "Beds" },
          { key: "contact", label: "Contact" },
          { key: "verified", label: "Verification" },
          { key: "action", label: "Action" },
        ]}
        rows={rows.map((row) => ({
          id: row.hospitalId,
          name: row.name,
          ward: row.wardName,
          type: row.type ?? "Not specified",
          beds: formatNumber(row.totalBeds),
          contact: row.contactNumber ?? "Not available",
          verified: <StatusBadge value={row.verified} />,
          action: <VerifyHospitalButton hospitalId={row.hospitalId} verified={row.verified} />,
        }))}
      />
    </div>
  );
}

