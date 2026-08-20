"use client";

import Papa from "papaparse";

export function ExportButtons({
  fileName,
  rows,
}: {
  fileName: string;
  rows: Record<string, string | number | null>[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => {
          const csv = Papa.unparse(rows);
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `${fileName}.csv`);
          link.click();
          URL.revokeObjectURL(url);
        }}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
      >
        Export Excel
      </button>
      <button
        type="button"
        onClick={async () => {
          const [{ jsPDF }, { default: autoTable }] = await Promise.all([
            import("jspdf/dist/jspdf.umd.min.js"),
            import("jspdf-autotable"),
          ]);
          const pdf = new jsPDF();
          const keys = Object.keys(rows[0] ?? {});
          autoTable(pdf, {
            head: [keys],
            body: rows.map((row) => keys.map((key) => row[key] ?? "")),
          });
          pdf.save(`${fileName}.pdf`);
        }}
        className="rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-accent"
      >
        Export PDF
      </button>
    </div>
  );
}

