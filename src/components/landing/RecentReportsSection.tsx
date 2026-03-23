import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PublicRecentReport } from "@/components/landing/public-data";

interface RecentReportsSectionProps {
  reports: PublicRecentReport[];
}

export function RecentReportsSection({ reports }: RecentReportsSectionProps) {
  return (
    <section>
      <Card className="border-slate-200 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle>Recent Disease Reports</CardTitle>
          <CardDescription className="dark:text-slate-400">
            Latest non-sensitive reports with disease, ward, hospital, and reporting date only
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Disease Name</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Hospital Name</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-slate-500 dark:text-slate-400">
                      No public disease reports available yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report, index) => (
                    <TableRow key={`${report.diseaseName}-${report.date}-${index}`}>
                      <TableCell className="font-medium text-slate-900 dark:text-slate-100">{report.diseaseName}</TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{report.ward}</TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">{report.hospitalName}</TableCell>
                      <TableCell className="text-right">{report.date}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
