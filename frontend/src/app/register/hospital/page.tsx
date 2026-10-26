"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/smc/lib/supabase/browser";
import {
  Hospital,
  Building,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const getApiBaseUrl = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");
  return base.endsWith("/api/v1") ? base : `${base}/api/v1`;
};
const API_BASE_URL = getApiBaseUrl();

// Email validation helper
const isValidEmail = (email: string) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

export default function HospitalRegistrationPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    type: "Public",
    address: "",
    ward_id: "",
    contact_number: "",
    email: "",
    admin_password: "",
    latitude: "",
    longitude: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    admin_password: false,
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    "Clinical Establishment Certificate": null,
    "Fire NOC": null,
    "Healthcare License": null,
  });

  // Password criteria checker
  const passwordCriteria = useMemo(() => {
    const pwd = formData.admin_password;
    return {
      minLength: pwd.length >= 8,
      hasLetter: /[a-zA-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>_~`\-=+[\]\\;/]/.test(pwd),
    };
  }, [formData.admin_password]);

  const isPasswordValid = useMemo(() => {
    return (
      passwordCriteria.minLength &&
      passwordCriteria.hasLetter &&
      passwordCriteria.hasNumber &&
      passwordCriteria.hasSpecial
    );
  }, [passwordCriteria]);

  const isEmailValid = useMemo(() => {
    return isValidEmail(formData.email);
  }, [formData.email]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleBlur = (field: "email" | "admin_password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFileChange = (documentType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [documentType]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Email check
    if (!isEmailValid) {
      setError("Please provide a valid email address (e.g., admin@hospital.com).");
      return;
    }

    // 2. Password check
    if (!isPasswordValid) {
      setError(
        "Please meet all password requirements: at least 8 characters, with letters, numbers, and a special symbol."
      );
      return;
    }

    // 3. Mandatory files check
    const missingFiles = Object.entries(files)
      .filter(([_, file]) => file === null)
      .map(([type]) => type);

    if (missingFiles.length > 0) {
      setError(`Please upload mandatory documents: ${missingFiles.join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      // 1. Register hospital
      const regResponse = await fetch(`${API_BASE_URL}/hospitals/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ward_id: formData.ward_id ? parseInt(formData.ward_id) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      if (!regResponse.ok) {
        let errMessage = "Registration failed.";
        try {
          const errData = await regResponse.json();
          errMessage = errData.detail || errData.message || JSON.stringify(errData);
        } catch {
          const raw = await regResponse.text();
          if (raw) errMessage = raw;
        }
        throw new Error(errMessage);
      }

      const hospitalData = await regResponse.json();
      const hospitalId = hospitalData.hospital_id;

      // 2. Upload Documents to Supabase Storage
      for (const [docType, file] of Object.entries(files)) {
        if (!file) continue;

        const fileExt = file.name.split(".").pop();
        const fileName = `${hospitalId}/${docType.replace(/\s+/g, "_")}_${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage bucket 'hospital_document'
        const { error: uploadError } = await supabase.storage
          .from("hospital_document")
          .upload(fileName, file);

        if (uploadError) {
          console.error("Storage upload error for", docType, uploadError);
          throw new Error(`Storage upload failed for ${docType}: ${uploadError.message}`);
        }

        // Record in database table 'hospital_documents'
        const docRes = await fetch(`${API_BASE_URL}/hospitals/${hospitalId}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hospital_id: hospitalId,
            document_type: docType,
            file_url: fileName,
          }),
        });

        if (!docRes.ok) {
          const errDetail = await docRes.text();
          console.error("Document DB save failed:", errDetail);
          throw new Error(`Failed to save ${docType} in database: ${errDetail}`);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center border border-green-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Registration Submitted</h2>
          <p className="text-slate-600 mb-6">
            Your hospital registration has been successfully submitted and is currently{" "}
            <span className="font-semibold text-amber-600">Pending Approval</span> by the Solapur
            Municipal Corporation.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 text-left mb-6 border border-slate-100">
            <p className="mb-2 font-medium">What happens next?</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>SMC officers will verify your provided information and documents.</li>
              <li>You can log in to check your approval status.</li>
              <li>Once approved, you will gain full access to the Hospital Dashboard.</li>
            </ul>
          </div>
          <Button onClick={() => router.push("/login")} className="w-full bg-blue-600 hover:bg-blue-700">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
            <Hospital className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Hospital Partner Registration</h1>
          <p className="mt-2 text-slate-600">
            Register your healthcare facility with the SMC Smart Health Ecosystem.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 flex items-start gap-3 border border-red-200">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Information */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-slate-900 border-b pb-2 mb-4">
                General Information
              </h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Hospital Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                      placeholder="Enter full hospital name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Hospital Type</label>
                  <select
                    name="type"
                    required
                    value={formData.type}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border bg-white"
                  >
                    <option value="Public">Public (Government)</option>
                    <option value="Private">Private</option>
                    <option value="Trust">Trust / NGO</option>
                    <option value="Clinic">Clinic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Ward Number</label>
                  <input
                    type="number"
                    name="ward_id"
                    value={formData.ward_id}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                    placeholder="e.g. 1"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Complete Address</label>
                  <textarea
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                    placeholder="Full physical address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                    placeholder="e.g. 17.6599"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 px-3 border"
                    placeholder="e.g. 75.9064"
                  />
                </div>
              </div>
            </div>

            {/* Admin Credentials */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-slate-900 border-b pb-2 mb-4">
                Contact & Admin Credentials
              </h3>
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Admin Email Address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                      className={`pl-10 block w-full rounded-md shadow-sm sm:text-sm py-2 border ${
                        touched.email && !isEmailValid
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                          : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="admin@hospital.com"
                    />
                  </div>
                  {touched.email && !isEmailValid && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <X className="w-3.5 h-3.5" /> Please enter a valid email format.
                    </p>
                  )}
                  {touched.email && isEmailValid && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Valid email address.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      name="contact_number"
                      required
                      value={formData.contact_number}
                      onChange={handleChange}
                      className="pl-10 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 border"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700">Admin Password</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="admin_password"
                      required
                      value={formData.admin_password}
                      onChange={handleChange}
                      onBlur={() => handleBlur("admin_password")}
                      className={`pl-10 pr-10 block w-full rounded-md shadow-sm sm:text-sm py-2 border ${
                        touched.admin_password && !isPasswordValid
                          ? "border-amber-400 focus:border-amber-500 focus:ring-amber-500"
                          : "border-slate-300 focus:border-blue-500 focus:ring-blue-500"
                      }`}
                      placeholder="Create a strong password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password requirement checklist */}
                  <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Password Requirements:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordCriteria.minLength ? "text-green-600 font-medium" : "text-slate-500"
                        }`}
                      >
                        {passwordCriteria.minLength ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1 mr-1" />
                        )}
                        At least 8 characters
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordCriteria.hasLetter ? "text-green-600 font-medium" : "text-slate-500"
                        }`}
                      >
                        {passwordCriteria.hasLetter ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1 mr-1" />
                        )}
                        Includes alphabets (a-z, A-Z)
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordCriteria.hasNumber ? "text-green-600 font-medium" : "text-slate-500"
                        }`}
                      >
                        {passwordCriteria.hasNumber ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1 mr-1" />
                        )}
                        Includes numbers (0-9)
                      </div>
                      <div
                        className={`flex items-center gap-1.5 ${
                          passwordCriteria.hasSpecial ? "text-green-600 font-medium" : "text-slate-500"
                        }`}
                      >
                        {passwordCriteria.hasSpecial ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400 ml-1 mr-1" />
                        )}
                        Includes symbol (!@#$%^&* etc.)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-slate-900 border-b pb-2 mb-4">
                Mandatory Documents Verification
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Please upload clear, legible copies of the following documents. Max size: 5MB per
                file.
              </p>

              <div className="space-y-4">
                {Object.keys(files).map((docType) => (
                  <div
                    key={docType}
                    className="border rounded-lg p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 p-2 bg-blue-100 rounded text-blue-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">
                          {docType} <span className="text-red-500">*</span>
                        </h4>
                        <p className="text-xs text-slate-500">PDF, JPG, or PNG</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        required
                        onChange={(e) => handleFileChange(docType, e)}
                        className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                type="submit"
                disabled={loading || !isPasswordValid || !isEmailValid}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 h-auto flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Application...
                  </>
                ) : (
                  <>Submit Registration for Verification</>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
