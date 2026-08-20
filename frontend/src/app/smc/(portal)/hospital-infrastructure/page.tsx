import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getHospitalOverviewRows } from "@/smc/lib/data/queries";
import { formatDate, formatNumber } from "@/smc/lib/utils";

export default async function HospitalInfrastructurePage() {
  const rows = await getHospitalOverviewRows();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital Infrastructure Monitoring"
        description="Bed capacity, equipment coverage, doctor distribution, and medicine stock risk by hospital."
      />

      <TableCard
        title="Infrastructure Overview"
        columns={[
          { key: "hospital", label: "Hospital" },
          { key: "ward", label: "Ward" },
          { key: "beds", label: "Beds" },
          { key: "occupied", label: "Occupied" },
          { key: "doctors", label: "Doctors" },
          { key: "equipment", label: "Equipment" },
          { key: "stock", label: "Medicine Alerts" },
          { key: "updated", label: "Last Update" },
          { key: "status", label: "Verification" },
        ]}
        rows={rows.map((row) => ({
          id: row.hospitalId,
          hospital: row.name,
          ward: row.wardName,
          beds: formatNumber(row.totalBeds),
          occupied: formatNumber(row.occupiedBeds),
          doctors: formatNumber(row.doctors),
          equipment: formatNumber(row.equipment),
          stock: formatNumber(row.lowStockMedicines),
          updated: formatDate(row.lastUpdatedAt, "dd MMM yyyy, p"),
          status: <StatusBadge value={row.verified} />,
        }))}
      />
    </div>
  );
}

