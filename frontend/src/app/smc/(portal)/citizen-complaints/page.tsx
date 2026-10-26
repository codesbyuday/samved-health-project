import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Inbox,
  RotateCcw,
  Search,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { ComplaintResolveForm } from "@/smc/components/forms/complaint-resolve-form";
import { PageHeader } from "@/smc/components/layout/page-header";
import { TableCard } from "@/smc/components/tables/table-card";
import { getComplaintsData } from "@/smc/lib/data/queries";
import { buildSearchParams, cn, formatDate, formatNumber } from "@/smc/lib/utils";

function formatCategory(category?: string | null) {
  if (!category) return "General Grievance";
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function CitizenComplaintsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const data = await getComplaintsData(resolvedParams);

  const currentStatus = String(resolvedParams.status ?? "all");
  const currentPriority = String(resolvedParams.priority ?? "all");
  const currentSearch = String(resolvedParams.search ?? "");
  const hasFilters =
    (currentStatus && currentStatus !== "all") ||
    (currentPriority && currentPriority !== "all") ||
    Boolean(currentSearch.trim());

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citizen Complaint Register"
        description="Monitor citizen grievances against hospitals, track priority escalations, and record administrative resolutions."
      />

      {/* 4 Interactive Quick Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/smc/citizen-complaints"
          className={cn(
            "surface p-5 rounded-xl border transition-all hover:shadow-md cursor-pointer block",
            !hasFilters
              ? "border-primary ring-2 ring-primary/20 shadow-xs"
              : "border-border hover:border-border/80",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Grievances</span>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Inbox className="h-5 w-5" />
            </div>
          </div>
          <div className="metric-value mt-3 text-2xl font-bold">
            {formatNumber(data.summary.total)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">All logged complaints in system</p>
        </Link>

        <Link
          href="/smc/citizen-complaints?status=pending"
          className={cn(
            "surface p-5 rounded-xl border transition-all hover:shadow-md cursor-pointer block",
            currentStatus === "pending"
              ? "border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
              : "border-border hover:border-border/80",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Pending Action</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="metric-value mt-3 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatNumber(data.summary.pending)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Requires review or investigation</p>
        </Link>

        <Link
          href="/smc/citizen-complaints?priority=high_critical"
          className={cn(
            "surface p-5 rounded-xl border transition-all hover:shadow-md cursor-pointer block",
            currentPriority === "high_critical"
              ? "border-rose-500 ring-2 ring-rose-500/20 shadow-xs"
              : "border-border hover:border-border/80",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">High / Critical Priority</span>
            <div className="rounded-lg bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="metric-value mt-3 text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatNumber(data.summary.highPriority)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Urgent patient care & safety flags</p>
        </Link>

        <Link
          href="/smc/citizen-complaints?status=resolved"
          className={cn(
            "surface p-5 rounded-xl border transition-all hover:shadow-md cursor-pointer block",
            currentStatus === "resolved"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
              : "border-border hover:border-border/80",
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Resolved Grievances</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="metric-value mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatNumber(data.summary.resolved)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Addressed and closed by officers</p>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <form
        method="GET"
        action="/smc/citizen-complaints"
        className="surface flex flex-wrap items-center gap-3 p-4 rounded-xl border border-border shadow-xs"
      >
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="search"
            defaultValue={currentSearch}
            placeholder="Search complaint ID, category, or keywords..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Status:
          </label>
          <select
            name="status"
            defaultValue={currentStatus}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending (Unresolved)</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="in_progress">In Progress</option>
            <option value="escalated">Escalated</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Priority:</label>
          <select
            name="priority"
            defaultValue={currentPriority}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Priorities</option>
            <option value="high_critical">High & Critical</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Filter
        </button>

        {hasFilters ? (
          <Link
            href="/smc/citizen-complaints"
            className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </Link>
        ) : null}
      </form>

      {/* Complaint Register Table */}
      <TableCard
        title={`Complaint Register (${formatNumber(data.totalCount)} records)`}
        description="Comprehensive list of citizen complaints with priority status, timestamps, and resolution controls."
        columns={[
          { key: "complaintInfo", label: "Complaint Details" },
          { key: "parties", label: "Citizen & Facility" },
          { key: "priority", label: "Priority" },
          { key: "status", label: "Status" },
          { key: "created", label: "Registered At" },
          { key: "remarks", label: "Officer Remarks" },
          { key: "action", label: "Resolution Action" },
        ]}
        rows={data.rows.map((row) => ({
          id: row.complaintId,
          complaintInfo: (
            <div className="space-y-1 min-w-[200px] max-w-sm">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-primary">
                  {row.complaintId}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <Tag className="h-3 w-3" />
                  {formatCategory(row.category)}
                </span>
              </div>
              <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
                {row.description}
              </p>
            </div>
          ),
          parties: (
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span>{row.citizenName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span>{row.hospitalName}</span>
              </div>
            </div>
          ),
          priority: <StatusBadge value={row.priority} />,
          status: <StatusBadge value={row.status} />,
          created: (
            <div className="text-xs whitespace-nowrap text-muted-foreground">
              {formatDate(row.createdAt, "dd MMM yyyy, p")}
            </div>
          ),
          remarks: (
            <div className="text-xs max-w-xs text-muted-foreground italic">
              {row.remarks && row.remarks.trim() ? (
                <span className="text-foreground/80 not-italic font-normal block bg-muted/40 p-1.5 rounded-md border border-border/50">
                  {row.remarks}
                </span>
              ) : (
                <span className="text-muted-foreground/60">No remarks logged</span>
              )}
            </div>
          ),
          action: (
            <ComplaintResolveForm
              complaintId={row.complaintId}
              initialRemarks={row.remarks}
              currentStatus={row.status}
            />
          ),
        }))}
        pagination={{
          page: data.page,
          totalPages: data.totalPages,
          makeHref: (page) =>
            `/smc/citizen-complaints?${buildSearchParams(resolvedParams, { page })}`,
        }}
      />
    </div>
  );
}
