import Link from "next/link";

import { cn } from "@/smc/lib/utils";

type Column = {
  key: string;
  label: string;
  className?: string;
};

type Row = Record<string, React.ReactNode> & {
  id: string | number;
};

export function TableCard({
  title,
  description,
  columns,
  rows,
  emptyMessage = "No records available.",
  pagination,
}: {
  title: string;
  description?: string;
  columns: Column[];
  rows: Row[];
  emptyMessage?: string;
  pagination?: {
    page: number;
    totalPages: number;
    makeHref: (page: number) => string;
  };
}) {
  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-border px-5 py-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left font-semibold text-muted-foreground",
                    column.className,
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length > 0 ? (
              rows.map((row, index) => (
                <tr key={row.id ?? row.caseId ?? row.hospital_id ?? row.wardId ?? row.citizen_id ?? `row-${index}`} className="align-top">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
          <span className="text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={pagination.makeHref(Math.max(1, pagination.page - 1))}
              className={cn(
                "rounded-lg border border-border px-3 py-2",
                pagination.page === 1 && "pointer-events-none opacity-50",
              )}
            >
              Previous
            </Link>
            <Link
              href={pagination.makeHref(
                Math.min(pagination.totalPages, pagination.page + 1),
              )}
              className={cn(
                "rounded-lg border border-border px-3 py-2",
                pagination.page === pagination.totalPages &&
                  "pointer-events-none opacity-50",
              )}
            >
              Next
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  );
}

