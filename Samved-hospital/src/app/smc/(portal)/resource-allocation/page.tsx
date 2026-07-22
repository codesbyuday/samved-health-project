import { ResourceActionPanel } from "@/smc/components/forms/resource-action-panel";
import { ResourceTaskResolveButton } from "@/smc/components/forms/resource-task-resolve-button";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import {
  getResourceAllocationData,
  getResourceAllocationTaskRows,
} from "@/smc/lib/data/queries";
import { formatDate, formatPercent, toTitleCase } from "@/smc/lib/utils";

export default async function ResourceAllocationPage() {
  const [rows, taskRows] = await Promise.all([
    getResourceAllocationData(),
    getResourceAllocationTaskRows(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Allocation Dashboard"
        description="Detect overloaded hospitals, create internal tasks, and notify hospital and SMC operations teams when intervention is needed."
      />

      <TableCard
        title="Capacity Redistribution"
        columns={[
          { key: "hospital", label: "Hospital" },
          { key: "ward", label: "Ward" },
          { key: "occupancy", label: "Bed Occupancy" },
          { key: "patients", label: "Patient Load" },
          { key: "recommendation", label: "Recommendation" },
          { key: "action", label: "SMC Action" },
        ]}
        rows={rows.map((row) => ({
          id: row.hospitalId,
          hospital: row.name,
          ward: row.wardName,
          occupancy: formatPercent(row.occupancy),
          patients: row.patientLoad,
          recommendation: row.recommendation,
          action: (
            <ResourceActionPanel
              hospitalId={row.hospitalId}
              wardId={row.wardId}
              hospitalName={row.name}
              wardName={row.wardName}
              occupancy={row.occupancy}
              patientLoad={row.patientLoad}
              recommendation={row.recommendation}
            />
          ),
        }))}
      />

      <TableCard
        title="Recent Resource Tasks"
        columns={[
          { key: "hospital", label: "Hospital" },
          { key: "ward", label: "Ward" },
          { key: "type", label: "Task Type" },
          { key: "status", label: "Status" },
          { key: "message", label: "Message" },
          { key: "created", label: "Created At" },
          { key: "action", label: "Action" },
        ]}
        rows={taskRows.map((row) => ({
          id: row.taskId,
          hospital: row.hospitalName,
          ward: row.wardName,
          type: toTitleCase(row.taskType),
          status: <StatusBadge value={row.status} />,
          message: row.message,
          created: formatDate(row.createdAt, "dd MMM yyyy, p"),
          action: <ResourceTaskResolveButton taskId={row.taskId} source={row.source} />,
        }))}
        emptyMessage="No internal resource tasks yet. Apply the SQL setup and create one from the table above."
      />
    </div>
  );
}

