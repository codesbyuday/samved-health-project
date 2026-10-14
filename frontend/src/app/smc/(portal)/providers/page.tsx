"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Pill,
  FlaskConical,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Download,
  Search,
  Filter,
  Check,
  X,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Layers,
  ArrowRight,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/smc/components/layout/page-header";
import { toast } from "sonner";

interface PharmacyDocument {
  document_id: string;
  provider_id: string;
  pharmacy_name?: string;
  document_type: string;
  document_url: string;
  verification_status: "approved" | "rejected" | "pending";
  rejection_reason?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  submitted_at?: string | null;
}

interface ProviderItem {
  provider_id: string;
  user_id?: string | null;
  ward_id: number;
  name: string;
  role: "pharmacy" | "lab";
  address: string;
  email: string;
  phone: string;
  license: string;
  created_at: string;
  location?: any;
  status: "approved" | "pending" | "rejected";
  documents: PharmacyDocument[];
  documents_count: number;
}

export default function ProvidersManagementPage() {
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "requests">("all");

  // Tab 1 (All Providers) Filters
  const [allRoleFilter, setAllRoleFilter] = useState<"all" | "pharmacy" | "lab">("all");
  const [allWardFilter, setAllWardFilter] = useState<string>("all");
  const [allSearch, setAllSearch] = useState("");

  // Tab 2 (Requests) Filters
  const [reqRoleFilter, setReqRoleFilter] = useState<"all" | "pharmacy" | "lab">("all");
  const [reqStatusFilter, setReqStatusFilter] = useState<string>("all");
  const [reqSearch, setReqSearch] = useState("");

  // Modal State
  const [selectedProvider, setSelectedProvider] = useState<ProviderItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const fetchProviders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const res = await fetch("/api/smc/providers", { cache: "no-store" });
      const data = await res.json();

      if (res.ok && data.success) {
        setProviders(data.providers || []);
      } else {
        toast.error(data.error || "Failed to load providers list");
      }
    } catch (err) {
      console.error("fetchProviders error:", err);
      toast.error("Network error while loading providers.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = providers.length;
    const pharmacies = providers.filter((p) => p.role === "pharmacy").length;
    const labs = providers.filter((p) => p.role === "lab").length;
    const pending = providers.filter((p) => p.status === "pending").length;
    return { total, pharmacies, labs, pending };
  }, [providers]);

  // Tab 1 Filtered List
  const filteredAllProviders = useMemo(() => {
    return providers.filter((p) => {
      if (allRoleFilter !== "all" && p.role !== allRoleFilter) return false;
      if (allWardFilter !== "all" && String(p.ward_id) !== allWardFilter) return false;
      if (allSearch.trim()) {
        const query = allSearch.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(query);
        const matchId = p.provider_id?.toLowerCase().includes(query);
        const matchEmail = p.email?.toLowerCase().includes(query);
        const matchPhone = p.phone?.toLowerCase().includes(query);
        const matchLicense = p.license?.toLowerCase().includes(query);
        const matchAddress = p.address?.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchEmail && !matchPhone && !matchLicense && !matchAddress) {
          return false;
        }
      }
      return true;
    });
  }, [providers, allRoleFilter, allWardFilter, allSearch]);

  // Tab 2 Filtered Requests List
  const filteredRequests = useMemo(() => {
    return providers.filter((p) => {
      // Must have documents or be in non-approved status or have explicit request history
      const isRequest = p.documents_count > 0 || p.status === "pending" || p.status === "rejected";
      if (!isRequest) return false;

      if (reqRoleFilter !== "all" && p.role !== reqRoleFilter) return false;
      if (reqStatusFilter !== "all" && p.status !== reqStatusFilter) return false;

      if (reqSearch.trim()) {
        const query = reqSearch.toLowerCase();
        const matchName = p.name?.toLowerCase().includes(query);
        const matchId = p.provider_id?.toLowerCase().includes(query);
        const matchEmail = p.email?.toLowerCase().includes(query);
        const matchLicense = p.license?.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchEmail && !matchLicense) {
          return false;
        }
      }
      return true;
    });
  }, [providers, reqRoleFilter, reqStatusFilter, reqSearch]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info("Downloading file...");
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename || "document.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success("Download completed.");
    } catch (error) {
      console.error("Download failed:", error);
      // Fallback: open in new tab
      window.open(url, "_blank");
    }
  };

  const handleUpdateStatus = async (
    providerId: string,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      setActionLoading(true);
      const payload: any = {
        status: newStatus,
        reviewed_by: "SMC Health Officer",
      };
      if (newStatus === "rejected") {
        payload.rejection_reason = rejectionReason.trim() || "Documents failed validation criteria.";
      }

      const res = await fetch(`/api/smc/providers/${providerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(
          newStatus === "approved"
            ? "Provider application approved! Facility is now active."
            : "Provider application rejected."
        );
        setIsReviewOpen(false);
        setIsDetailsOpen(false);
        setShowRejectInput(false);
        setRejectionReason("");
        // Refresh provider data
        await fetchProviders(true);
      } else {
        toast.error(data.error || "Failed to update status.");
      }
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Network error while updating provider status.");
    } finally {
      setActionLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 font-semibold gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 font-semibold gap-1">
            <Clock className="w-3.5 h-3.5" /> Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 font-semibold gap-1">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
            {status}
          </Badge>
        );
    }
  };

  const renderRoleBadge = (role: string) => {
    if (role === "pharmacy") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
          <Pill className="w-3 h-3" /> Pharmacy
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
        <FlaskConical className="w-3 h-3" /> Diagnostic Lab
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Healthcare Providers & Registrations"
          description="Manage registered municipal pharmacies and diagnostic laboratories, review incoming registration applications, and inspect verification documents anytime."
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchProviders(true)}
          disabled={loading || refreshing}
          className="self-start sm:self-auto gap-2 border-slate-200 dark:border-slate-800 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh Records
        </Button>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Providers</span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics.total}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Across all Solapur wards</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Licensed Pharmacies</span>
            <Pill className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
            {metrics.pharmacies}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Retail & hospital chemists</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Diagnostic Labs</span>
            <FlaskConical className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {metrics.labs}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Clinical pathology units</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Requests</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics.pending}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Awaiting SMC officer review</p>
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "all" | "requests")}
        className="space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <TabsList className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <TabsTrigger
              value="all"
              className="rounded-lg font-semibold text-xs md:text-sm px-4 py-2 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
            >
              <Building2 className="w-4 h-4" />
              All Providers ({metrics.total})
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="rounded-lg font-semibold text-xs md:text-sm px-4 py-2 gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm"
            >
              <FileText className="w-4 h-4" />
              Provider Requests
              {metrics.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {metrics.pending}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: ALL PROVIDERS                                    */}
        {/* ======================================================== */}
        <TabsContent value="all" className="space-y-4 focus-visible:outline-none">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by facility name, ID, license, or phone..."
                value={allSearch}
                onChange={(e) => setAllSearch(e.target.value)}
                className="pl-10 text-sm bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Type:</span>
                <select
                  value={allRoleFilter}
                  onChange={(e) => setAllRoleFilter(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="pharmacy">Pharmacies Only</option>
                  <option value="lab">Diagnostic Labs Only</option>
                </select>
              </div>

              {/* Ward Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Ward:</span>
                <select
                  value={allWardFilter}
                  onChange={(e) => setAllWardFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Wards</option>
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={String(w)}>
                      Ward {w}
                    </option>
                  ))}
                </select>
              </div>

              {(allSearch || allRoleFilter !== "all" || allWardFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAllSearch("");
                    setAllRoleFilter("all");
                    setAllWardFilter("all");
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Providers Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">
                Loading providers registry...
              </div>
            ) : filteredAllProviders.length === 0 ? (
              <div className="p-12 text-center">
                <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No Providers Found
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search criteria or type filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase">Facility Name</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Ward & Location</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Contact</TableHead>
                      <TableHead className="font-bold text-xs uppercase">License / Reg</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Docs</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAllProviders.map((p) => (
                      <TableRow
                        key={p.provider_id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {p.name}
                            </span>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {p.provider_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{renderRoleBadge(p.role)}</TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Ward {p.ward_id}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                              {p.address || "Solapur"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <div className="text-slate-800 dark:text-slate-200 font-medium">
                              {p.phone || "—"}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                              {p.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {p.license || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>{renderStatusBadge(p.status)}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md ${
                              p.documents_count > 0
                                ? "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            <FileText className="w-3 h-3" />
                            {p.documents_count} {p.documents_count === 1 ? "doc" : "docs"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProvider(p);
                              setIsDetailsOpen(true);
                            }}
                            className="text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-700 dark:text-blue-300 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Details & Docs
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: PROVIDER REQUESTS                                */}
        {/* ======================================================== */}
        <TabsContent value="requests" className="space-y-4 focus-visible:outline-none">
          {/* Requests Filter Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search request by pharmacy name, license, email..."
                value={reqSearch}
                onChange={(e) => setReqSearch(e.target.value)}
                className="pl-10 text-sm bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Facility:</span>
                <select
                  value={reqRoleFilter}
                  onChange={(e) => setReqRoleFilter(e.target.value as any)}
                  className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Facilities</option>
                  <option value="pharmacy">Pharmacy Requests</option>
                  <option value="lab">Lab Requests</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
                <select
                  value={reqStatusFilter}
                  onChange={(e) => setReqStatusFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Request Statuses</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved Applications</option>
                  <option value="rejected">Rejected Applications</option>
                </select>
              </div>

              {(reqSearch || reqRoleFilter !== "all" || reqStatusFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReqSearch("");
                    setReqRoleFilter("all");
                    setReqStatusFilter("all");
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Requests Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">
                Loading registration requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500/80 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No Matching Registration Requests
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  All pharmacy and lab registration applications have been processed or none match the filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="font-bold text-xs uppercase">Facility Name</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Ward & Contact</TableHead>
                      <TableHead className="font-bold text-xs uppercase">License</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Uploaded Docs</TableHead>
                      <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-right">
                        Review Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => (
                      <TableRow
                        key={req.provider_id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <TableCell>
                          <div>
                            <span className="font-bold text-sm text-slate-900 dark:text-white">
                              {req.name}
                            </span>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              {req.provider_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{renderRoleBadge(req.role)}</TableCell>
                        <TableCell>
                          <div className="text-xs space-y-0.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              Ward {req.ward_id}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {req.phone || req.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {req.license || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <FileText className="w-3 h-3" />
                            {req.documents_count} Files
                          </span>
                        </TableCell>
                        <TableCell>{renderStatusBadge(req.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedProvider(req);
                              setShowRejectInput(false);
                              setRejectionReason("");
                              setIsReviewOpen(true);
                            }}
                            className={`text-xs gap-1.5 h-8 font-semibold cursor-pointer ${
                              req.status === "pending"
                                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                                : "bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700"
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {req.status === "pending" ? "Review & Decide" : "Inspect Application"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ======================================================== */}
      {/* MODAL 1: VIEW DETAILS & DOCUMENTS (ALL PROVIDERS)       */}
      {/* ======================================================== */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {selectedProvider?.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Provider ID: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedProvider?.provider_id}</span>
                </DialogDescription>
              </div>
              {selectedProvider && renderStatusBadge(selectedProvider.status)}
            </div>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6 pt-2">
              {/* Facility Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Facility Type
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">
                    {selectedProvider.role}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Ward Number
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Ward {selectedProvider.ward_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    {selectedProvider.role === "lab" ? "Clinical License (CEA) #" : "Drug License #"}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {selectedProvider.license || "Not recorded"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Contact Phone
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedProvider.phone || "Not recorded"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Registered Email
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {selectedProvider.email}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Physical Address
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {selectedProvider.address || "Solapur, Maharashtra"}
                  </span>
                </div>
              </div>

              {/* Uploaded Documents Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Uploaded Compliance Documents ({selectedProvider.documents.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Always accessible for SMC inspection
                  </span>
                </div>

                {selectedProvider.documents.length === 0 ? (
                  <div className="p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/50">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      No Digital Documents Uploaded
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      This is a seed/legacy registered provider verified via physical municipal registry records.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedProvider.documents.map((doc, idx) => (
                      <div
                        key={doc.document_id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {doc.document_type}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase ${
                                doc.verification_status === "approved"
                                  ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                  : doc.verification_status === "rejected"
                                  ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                                  : "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                              }`}
                            >
                              {doc.verification_status}
                            </span>
                          </div>
                          {doc.submitted_at && (
                            <p className="text-[11px] text-slate-400">
                              Uploaded: {new Date(doc.submitted_at).toLocaleDateString()}
                            </p>
                          )}
                          {doc.rejection_reason && (
                            <p className="text-[11px] text-rose-600 dark:text-rose-400">
                              Reason: {doc.rejection_reason}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.document_url, "_blank")}
                            className="text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                doc.document_url,
                                `${selectedProvider.name.replace(/\s+/g, "_")}_${doc.document_type.replace(/\s+/g, "_")}.pdf`
                              )
                            }
                            className="text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 2: REVIEW REQUEST APPLICATION (DECIDE APPROVE/REJECT)*/}
      {/* ======================================================== */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                  Review Registration Application
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1">
                  Inspect facility credentials and uploaded documents before approving or rejecting.
                </DialogDescription>
              </div>
              {selectedProvider && renderStatusBadge(selectedProvider.status)}
            </div>
          </DialogHeader>

          {selectedProvider && (
            <div className="space-y-6 pt-2">
              {/* Facility Details Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Facility Name
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedProvider.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Ward Number
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Ward {selectedProvider.ward_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    {selectedProvider.role === "lab" ? "Clinical License (CEA) #" : "Drug License #"}
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {selectedProvider.license || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Contact Phone
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedProvider.phone || "—"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Registered Email
                  </span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {selectedProvider.email}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-slate-400 uppercase text-[10px] font-bold block">
                    Premises Address
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {selectedProvider.address || "Solapur, Maharashtra"}
                  </span>
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Application Documents ({selectedProvider.documents.length})
                </h4>

                {selectedProvider.documents.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-300">
                    No uploaded document files recorded for this applicant.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedProvider.documents.map((doc, idx) => (
                      <div
                        key={doc.document_id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850"
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block">
                            {doc.document_type}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Status: <span className="capitalize font-semibold">{doc.verification_status}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.document_url, "_blank")}
                            className="text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                            View Document
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDownload(
                                doc.document_url,
                                `${selectedProvider.name.replace(/\s+/g, "_")}_${doc.document_type.replace(/\s+/g, "_")}.pdf`
                              )
                            }
                            className="text-xs gap-1.5 h-8 border-slate-200 dark:border-slate-700 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-500" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rejection Reason Form */}
              {showRejectInput && (
                <div className="space-y-2 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  <label className="block text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">
                    Reason for Rejection:
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Invalid Drug License Form 20/21 or expired pharmacist certificate."
                    className="w-full text-xs p-2.5 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowRejectInput(false)}
                      className="text-xs text-slate-500 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={actionLoading}
                      onClick={() => handleUpdateStatus(selectedProvider.provider_id, "rejected")}
                      className="text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                    >
                      Confirm Rejection
                    </Button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!showRejectInput && (
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectInput(true)}
                    disabled={actionLoading}
                    className="w-full sm:w-auto text-xs border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject Application
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus(selectedProvider.provider_id, "approved")}
                    disabled={actionLoading}
                    className="w-full sm:w-auto text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer gap-1.5 shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {selectedProvider.status === "approved" ? "Re-Approve Application" : "Approve Provider Application"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
