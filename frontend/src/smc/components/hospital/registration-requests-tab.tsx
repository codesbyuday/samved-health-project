"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X, FileText, Eye, MapPin, Download } from "lucide-react";
import { toast } from "sonner";

const getApiBaseUrl = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
};
const API_BASE_URL = getApiBaseUrl();

interface HospitalRequest {
  hospital_id: string;
  name: string;
  type: string;
  ward_id: number;
  contact_number: string;
  email: string;
  address: string;
  created_at: string;
}

interface HospitalDocument {
  document_id: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
}

export function RegistrationRequestsTab() {
  const [requests, setRequests] = useState<HospitalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHospital, setSelectedHospital] = useState<HospitalRequest | null>(null);
  const [documents, setDocuments] = useState<HospitalDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/hospitals/pending`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  
  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info("Starting download...");
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success("Download complete");
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const handleReview = async (hospital: HospitalRequest) => {
    setSelectedHospital(hospital);
    setIsDialogOpen(true);
    setDocsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/${hospital.hospital_id}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setDocsLoading(false);
    }
  };

  const updateStatus = async (hospitalId: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Hospital registration ${status} successfully.`);
        setIsDialogOpen(false);
        fetchRequests();
      } else {
        toast.error("Failed to update status.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No Pending Requests</h3>
        <p className="text-slate-500 mt-2">All hospital registrations have been reviewed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Hospital Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Ward</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Applied On</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((req) => (
            <TableRow key={req.hospital_id}>
              <TableCell className="font-medium">{req.name}</TableCell>
              <TableCell><Badge variant="outline">{req.type}</Badge></TableCell>
              <TableCell>Ward {req.ward_id || "N/A"}</TableCell>
              <TableCell>
                <div className="text-sm">{req.email}</div>
                <div className="text-sm text-slate-500">{req.contact_number}</div>
              </TableCell>
              <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => handleReview(req)} className="bg-blue-600 hover:bg-blue-700">
                  Review
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Review Registration Request</DialogTitle>
          </DialogHeader>
          
          {selectedHospital && (
            <div className="mt-4 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Hospital Name</p>
                  <p className="font-semibold">{selectedHospital.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Type</p>
                  <p className="font-semibold">{selectedHospital.type}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Contact Details</p>
                  <p className="font-semibold">{selectedHospital.email}</p>
                  <p className="text-sm">{selectedHospital.contact_number}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 font-medium">Address</p>
                  <div className="flex items-start gap-1">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                    <p className="text-sm">{selectedHospital.address}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-lg mb-3 border-b pb-2">Verification Documents</h4>
                {docsLoading ? (
                  <p className="text-sm text-slate-500 animate-pulse">Loading documents...</p>
                ) : documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <div key={doc.document_id} className="border rounded-lg p-3 flex flex-col justify-between hover:shadow-md transition-shadow bg-white">
                        <div className="flex items-start gap-2 mb-3">
                          <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                          <p className="text-sm font-medium line-clamp-2">{doc.document_type}</p>
                        </div>
                        <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-1/2 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => window.open(doc.file_url, "_blank")}
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-1/2 text-green-600 border-green-200 hover:bg-green-50"
                          onClick={() => handleDownload(doc.file_url, `${doc.document_type}.pdf`)}
                        >
                          <Download className="w-4 h-4 mr-1" /> Download
                        </Button>
                      </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No documents uploaded. Verification cannot be completed securely.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => updateStatus(selectedHospital.hospital_id, "rejected")}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" /> Reject Request
                </Button>
                <Button 
                  onClick={() => updateStatus(selectedHospital.hospital_id, "approved")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" /> Approve Hospital
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
