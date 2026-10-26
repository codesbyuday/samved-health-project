"use client";

import React, { useState } from "react";
import {
  Building2,
  FileText,
  Eye,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ExternalLink,
  MapPin,
  Phone,
  Bed,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/smc/components/dashboard/status-badge";
import { formatNumber } from "@/smc/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export interface HospitalRowData {
  hospitalId: string;
  name: string;
  wardId: number;
  wardName: string;
  type: string | null;
  totalBeds: number;
  occupiedBeds: number;
  contactNumber: string | null;
  verified: boolean;
  address?: string | null;
}

interface HospitalDocument {
  document_id: string;
  hospital_id: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
}

export function HospitalRegistryTable({ hospitals }: { hospitals: HospitalRowData[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "verified" | "unverified">("all");
  const [selectedHospital, setSelectedHospital] = useState<HospitalRowData | null>(null);
  const [documents, setDocuments] = useState<HospitalDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const filtered = hospitals.filter((h) => {
    if (statusFilter === "verified" && !h.verified) return false;
    if (statusFilter === "unverified" && h.verified) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = h.name.toLowerCase().includes(q);
      const matchId = h.hospitalId.toLowerCase().includes(q);
      const matchWard = h.wardName.toLowerCase().includes(q);
      const matchContact = h.contactNumber?.toLowerCase().includes(q);
      if (!matchName && !matchId && !matchWard && !matchContact) return false;
    }
    return true;
  });

  const handleOpenDocs = async (hospital: HospitalRowData) => {
    setSelectedHospital(hospital);
    setIsDialogOpen(true);
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/smc/hospitals/${hospital.hospitalId}/documents`);
      const data = await res.json();
      if (res.ok && data.success) {
        setDocuments(data.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      console.error("Failed to load hospital documents:", err);
      toast.error("Could not load hospital documents.");
      setDocuments([]);
    } finally {
      setDocsLoading(false);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info("Downloading verification document...");
      if (url.startsWith("http")) {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "hospital_document.pdf";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        toast.success("Download completed.");
      } else {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.warn("Direct download failed, opening in new tab:", err);
      window.open(url, "_blank");
    }
  };

  const handleToggleVerification = async (hospitalId: string, currentStatus: boolean) => {
    try {
      setVerifyingId(hospitalId);
      const res = await fetch(`/api/smc/hospitals/${hospitalId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: !currentStatus }),
      });
      if (res.ok) {
        toast.success(
          !currentStatus
            ? "Hospital verified successfully by SMC."
            : "Hospital verification revoked."
        );
        if (selectedHospital && selectedHospital.hospitalId === hospitalId) {
          setSelectedHospital({ ...selectedHospital, verified: !currentStatus });
        }
        router.refresh();
      } else {
        toast.error("Failed to update verification status.");
      }
    } catch {
      toast.error("Network error during verification.");
    } finally {
      setVerifyingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search hospital by name, ID, ward, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 text-sm bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Verification:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all">All Hospitals</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
            </select>
          </div>

          {(search || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Hospital Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="font-bold text-xs uppercase">Hospital Name</TableHead>
                <TableHead className="font-bold text-xs uppercase">Ward</TableHead>
                <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                <TableHead className="font-bold text-xs uppercase">Beds (Total / Occ)</TableHead>
                <TableHead className="font-bold text-xs uppercase">Contact</TableHead>
                <TableHead className="font-bold text-xs uppercase">Verification</TableHead>
                <TableHead className="font-bold text-xs uppercase">Official Docs</TableHead>
                <TableHead className="font-bold text-xs uppercase text-right">Verification Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((hospital) => (
                <TableRow
                  key={hospital.hospitalId}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <TableCell>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {hospital.name}
                      </span>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                        {hospital.hospitalId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {hospital.wardName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-700 dark:text-slate-300">
                      {hospital.type ?? "General Facility"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Bed className="w-3.5 h-3.5 text-primary" />
                      <span>{formatNumber(hospital.totalBeds)}</span>
                      <span className="text-muted-foreground text-[11px]">
                        ({hospital.occupiedBeds} occ)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {hospital.contactNumber ?? "Not available"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge value={hospital.verified} />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDocs(hospital)}
                      className="text-xs gap-1.5 h-8 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 hover:text-blue-800 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View Documents
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      disabled={verifyingId === hospital.hospitalId}
                      onClick={() => handleToggleVerification(hospital.hospitalId, hospital.verified)}
                      className={`text-xs gap-1.5 h-8 font-semibold cursor-pointer ${
                        hospital.verified
                          ? "bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      }`}
                    >
                      {hospital.verified ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          Verified (Revoke)
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verify Hospital
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal: View Hospital Verification Documents */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {selectedHospital?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Hospital ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedHospital?.hospitalId}</span>
                </DialogDescription>
              </div>
              {selectedHospital && <StatusBadge value={selectedHospital.verified} />}
            </div>
          </DialogHeader>

          {selectedHospital && (
            <div className="space-y-6 pt-2">
              {/* Hospital Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Ward</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedHospital.wardName}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Facility Type</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedHospital.type ?? "General Hospital"}</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Bed Capacity</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedHospital.totalBeds} total beds</span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Contact Phone</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedHospital.contactNumber ?? "Not provided"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">Address</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedHospital.address || "Solapur, Maharashtra"}</span>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Uploaded Verification Documents ({documents.length})
                  </h4>
                  <span className="text-xs text-muted-foreground">Clinical & municipal certificates</span>
                </div>

                {docsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-500 animate-pulse">
                    Loading hospital verification certificates...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      No verification documents uploaded yet.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      The hospital administrator has not submitted certificates for review.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.document_id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 shadow-sm gap-3 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white block">
                              {doc.document_type}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                              <span>Uploaded on {new Date(doc.uploaded_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                              <span>•</span>
                              <span className="font-mono truncate max-w-[200px]">{doc.file_url.split("/").pop()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.file_url, "_blank")}
                            className="text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleDownload(doc.file_url, `${doc.document_type}.pdf`)}
                            className="text-xs gap-1.5 h-8 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Bar inside Dialog */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="cursor-pointer"
                >
                  Close
                </Button>

                <Button
                  onClick={() => handleToggleVerification(selectedHospital.hospitalId, selectedHospital.verified)}
                  disabled={verifyingId === selectedHospital.hospitalId}
                  className={`gap-2 cursor-pointer font-semibold ${
                    selectedHospital.verified
                      ? "bg-rose-600 hover:bg-rose-700 text-white"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  {selectedHospital.verified ? "Revoke Verification" : "Approve & Verify Hospital"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
