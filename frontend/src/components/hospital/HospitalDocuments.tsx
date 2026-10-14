"use client";

import React, { useState, useEffect } from "react";
import { useRBAC } from "@/hooks/use-rbac";
import { createClient } from "@/smc/lib/supabase/browser";
import { FileText, Eye, CheckCircle, UploadCloud, AlertCircle, Download } from "lucide-react";
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
  const { hospitalId, user } = useRBAC();
  const effectiveHospitalId = hospitalId || user?.hospital_id;
  const supabase = createClient();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (effectiveHospitalId) {
      fetchDocuments(effectiveHospitalId);
    } else {
      setLoading(false);
    }
  }, [effectiveHospitalId]);

  const fetchDocuments = async (targetId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/${targetId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
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

      const res = await fetch(`${API_BASE_URL}/hospitals/${hid}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_id: hid,
          document_type: docType,
          file_url: fileName,
        }),
      });

      if (!res.ok) throw new Error("Failed to save document record");

      toast.success(`${docType} uploaded successfully`);
      fetchDocuments(hid);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload document");
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Loading documents...</div>;

  const uploadedTypes = documents.map(d => d.document_type);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Hospital Verification Documents</h2>
        <p className="text-slate-500 mt-1">Manage mandatory registration and licensing documents.</p>
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
