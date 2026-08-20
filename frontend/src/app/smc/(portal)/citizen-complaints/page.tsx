import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { ComplaintResolveForm } from "@/smc/components/forms/complaint-resolve-form";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getComplaintsData } from "@/smc/lib/data/queries";
import { buildSearchParams, formatDate } from "@/smc/lib/utils";

export default async function CitizenComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const data = await getComplaintsData(resolvedParams);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citizen Complaint Dashboard"
        description="Resolve hospital complaints, track priority, and record officer remarks."
      />

      <form className="surface flex flex-wrap items-end gap-4 p-5">
        <label className="space-y-2">
          <span className="text-sm font-medium">Status filter</span>
          <input
            name="status"
            defaultValue={String(resolvedParams.status ?? "")}
            placeholder="resolved / pending"
            className="rounded-lg border border-input bg-background px-3 py-2.5"
          />
        </label>
        <button className="rounded-lg bg-primary px-4 py-2.5 font-medium text-primary-foreground">
          Apply
        </button>
      </form>

      <TableCard
        title="Complaint Register"
        columns={[
          { key: "idLabel", label: "Complaint ID" },
          { key: "citizen", label: "Citizen" },
          { key: "hospital", label: "Hospital" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "created", label: "Created At" },
          { key: "remarks", label: "Remarks" },
          { key: "action", label: "Resolve" },
        ]}
        rows={data.rows.map((row) => ({
          id: row.complaintId,
          idLabel: row.complaintId,
          citizen: row.citizenName,
          hospital: row.hospitalName,
          priority: <StatusBadge value={row.priority} />,
          status: <StatusBadge value={row.status} />,
          created: formatDate(row.createdAt, "dd MMM yyyy, p"),
          remarks: row.remarks ?? "No remarks",
          action: <ComplaintResolveForm complaintId={row.complaintId} />,
        }))}
        pagination={{
          page: data.page,
          totalPages: data.totalPages,
          makeHref: (page) =>
            `/citizen-complaints?${buildSearchParams(resolvedParams, { page })}`,
        }}
      />
    </div>
  );
}

