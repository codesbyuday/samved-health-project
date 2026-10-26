"use client";

import React, { useState, useEffect } from "react";
import { useRBAC } from "@/hooks/use-rbac";
import { createClient } from "@/smc/lib/supabase/browser";
import { FileText, Eye, CheckCircle, UploadCloud, AlertCircle, Download, ShieldAlert, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const getApiBaseUrl = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
};
const API_BASE_URL = getApiBaseUrl();

interface Document {
  document_id: string;
  document_type: string;
  file_url: string;
  uploaded_at: string;
}

const MANDATORY_DOCS = [
  "Clinical Establishment Certificate",
  "Fire NOC",
  "Healthcare License"
];

export default function HospitalDocuments() {
  const { hospitalId, user, isAdmin, hasHospitalAccess } = useRBAC();
  const effectiveHospitalId = hospitalId || user?.hospital_id;
  const isAuthorized = isAdmin && hasHospitalAccess(effectiveHospitalId);
  const supabase = createClient();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    if (effectiveHospitalId) {
      fetchDocuments(effectiveHospitalId);
    } else {
      setLoading(false);
    }
  }, [effectiveHospitalId, isAuthorized]);

  const fetchDocuments = async (targetId: string) => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const qParams = new URLSearchParams();
      if (user?.staff_id) qParams.set('staff_id', user.staff_id);
      if (user?.role) qParams.set('role', user.role);

      const res = await fetch(`${API_BASE_URL}/hospitals/${targetId}/documents?${qParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      } else if (res.status === 403) {
        toast.error("Access denied: Hospital documents can only be accessed by the hospital administrator.");
        setDocuments([]);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  
  const handleDownload = async (url: string, filename: string) => {
    if (!isAuthorized) {
      toast.error("Access denied: Only hospital administrators can download hospital documents.");
      return;
    }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!isAuthorized) {
      toast.error("Access denied: Only hospital administrators can upload hospital documents.");
      return;
    }
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    setUploading(docType);
    try {
      if (!effectiveHospitalId) {
        throw new Error("Hospital ID not found for current session");
      }
      const hid = effectiveHospitalId;
      const fileExt = file.name.split('.').pop();
      const fileName = `${hid}/${docType.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("hospital_document")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const qParams = new URLSearchParams();
      if (user?.staff_id) qParams.set('staff_id', user.staff_id);
      if (user?.role) qParams.set('role', user.role);

      const res = await fetch(`${API_BASE_URL}/hospitals/${hid}/documents?${qParams.toString()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_id: hid,
          document_type: docType,
          file_url: fileName,
        }),
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("Access denied: Only hospital administrators can upload hospital documents.");
        }
        throw new Error("Failed to save document record");
      }

      toast.success(`${docType} uploaded successfully`);
      fetchDocuments(hid);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900/60 p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Hospital Administrator Access Only
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              Official hospital verification, licensing certificates, and regulatory compliance documents can only be viewed and uploaded by the authorized Administrator of this hospital.
            </p>
          </div>
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <span>Staff: <strong className="text-slate-800 dark:text-white">{user?.name || 'Staff Member'}</strong> ({user?.role || 'Medical Staff'})</span>
            <span>•</span>
            <span>Hospital: <strong className="text-slate-800 dark:text-white">{user?.hospital_name || effectiveHospitalId || 'Assigned Facility'}</strong></span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            If registration certificates or licenses need to be renewed or uploaded, please sign in with your Hospital Administrator credentials.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading documents...</div>;

  const uploadedTypes = documents.map(d => d.document_type);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Hospital Verification Documents</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage mandatory registration and licensing documents.</p>
      </div>

      <div className="bg-white rounded-xl border p-6 space-y-6 shadow-sm">
        <h3 className="text-lg font-semibold border-b pb-2">Mandatory Documents</h3>
        <div className="space-y-4">
          {MANDATORY_DOCS.map(docType => {
            const doc = documents.find(d => d.document_type === docType);
            const isUploaded = !!doc;
            
            return (
              <div key={docType} className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isUploaded ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                    {isUploaded ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{docType}</p>
                    <p className="text-sm text-slate-500">
                      {isUploaded ? `Uploaded on ${new Date(doc.uploaded_at).toLocaleDateString()}` : "Missing Document"}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 flex items-center gap-3">
                  {isUploaded ? (
                    <>
                      <Button variant="outline" className="text-blue-600 border-blue-200" onClick={() => window.open(doc.file_url, "_blank")}>
                        <Eye className="w-4 h-4 mr-2" /> View
                      </Button>
                      <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleDownload(doc.file_url, `${docType}.pdf`)}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                    </>
                  ) : (
                    <div>
                      <input 
                        type="file" 
                        id={`upload-${docType}`} 
                        className="hidden" 
                        accept=".pdf,image/*"
                        onChange={(e) => handleFileUpload(e, docType)}
                        disabled={uploading === docType}
                      />
                      <label htmlFor={`upload-${docType}`}>
                        <Button variant="default" className="bg-blue-600 hover:bg-blue-700 cursor-pointer" asChild disabled={uploading === docType}>
                          <span>
                            {uploading === docType ? (
                              <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <UploadCloud className="w-4 h-4 mr-2" />
                            )}
                            Upload
                          </span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {documents.filter(d => !MANDATORY_DOCS.includes(d.document_type)).length > 0 && (
        <div className="bg-white rounded-xl border p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-semibold border-b pb-2">Other Uploaded Documents</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {documents.filter(d => !MANDATORY_DOCS.includes(d.document_type)).map(doc => (
              <div key={doc.document_id} className="border p-4 rounded-lg flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <p className="font-medium text-sm line-clamp-1">{doc.document_type}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
