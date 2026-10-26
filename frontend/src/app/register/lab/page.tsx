"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FlaskConical,
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
  UploadCloud,
  FileCheck2,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const SOLAPUR_WARDS = [
  { id: 1, name: "Ward 1 - Kasbe Peth / Old City" },
  { id: 2, name: "Ward 2 - Mangalwar Peth / Central" },
  { id: 3, name: "Ward 3 - Begam Peth / Market" },
  { id: 4, name: "Ward 4 - MIDC Industrial Area" },
  { id: 5, name: "Ward 5 - Shastri Nagar / South East" },
  { id: 6, name: "Ward 6 - Jule Solapur / New Extension" },
  { id: 7, name: "Ward 7 - Kumthe / Outer Ring" },
  { id: 8, name: "Ward 8 - Ashok Chowk / North" },
  { id: 9, name: "Ward 9 - Bhavani Peth / West" },
  { id: 10, name: "Ward 10 - Navi Peth / Commercial" },
  { id: 11, name: "Ward 11 - Budhwar Peth" },
  { id: 12, name: "Ward 12 - Guruwar Peth" },
  { id: 13, name: "Ward 13 - Somwar Peth" },
  { id: 14, name: "Ward 14 - Raviwar Peth" },
  { id: 15, name: "Ward 15 - Shukrawar Peth" },
  { id: 16, name: "Ward 16 - Shaniwar Peth" },
  { id: 17, name: "Ward 17 - Vijapur Road / South" },
  { id: 18, name: "Ward 18 - Hotgi Road / South West" },
  { id: 19, name: "Ward 19 - Degaon Road / North West" },
  { id: 20, name: "Ward 20 - Bale / Outer North" },
];

const MANDATORY_DOCS = [
  {
    key: "file_license",
    title: "Clinical Establishment Registration (CEA / SMC)",
    description: "Official Clinical Establishment Act registration or SMC Public Health Department diagnostic license.",
  },
  {
    key: "file_pathologist",
    title: "Consulting Pathologist MMC Registration Certificate",
    description: "Maharashtra Medical Council (MMC) certificate of the supervising registered MD/DNB Pathologist.",
  },
  {
    key: "file_bmw",
    title: "Bio-Medical Waste (BMW) Disposal Authorization",
    description: "Valid Bio-Medical Waste management authorization from Maharashtra Pollution Control Board (MPCB) or SMC.",
  },
  {
    key: "file_gst",
    title: "Establishment License (Gumasta / GST Certificate)",
    description: "Municipal trade license (Gumasta) or GST registration certificate of the diagnostic facility.",
  },
];

const isValidEmail = (email: string) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

export default function LabRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedProviderId, setSubmittedProviderId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    ward_id: "3",
    address: "",
    license: "",
    admin_password: "",
    latitude: "17.6599",
    longitude: "75.9064",
  });

  const [touched, setTouched] = useState({
    email: false,
    admin_password: false,
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    file_license: null,
    file_pathologist: null,
    file_bmw: null,
    file_gst: null,
  });

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

  const handleFileChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [key]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isEmailValid) {
      setError("Please provide a valid laboratory email address (e.g. solapur.pathology@gmail.com).");
      return;
    }

    if (!isPasswordValid) {
      setError(
        "Please meet all password requirements: at least 8 characters, with letters, numbers, and a special symbol."
      );
      return;
    }

    const missingFiles = MANDATORY_DOCS.filter((doc) => !files[doc.key]).map((doc) => doc.title);
    if (missingFiles.length > 0) {
      setError(`Please upload all mandatory laboratory documents: ${missingFiles.join(", ")}`);
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("email", formData.email.trim());
      data.append("phone", formData.phone.trim());
      data.append("ward_id", formData.ward_id);
      data.append("address", formData.address.trim());
      data.append("license", formData.license.trim());
      data.append("admin_password", formData.admin_password.trim());
      data.append("latitude", formData.latitude);
      data.append("longitude", formData.longitude);

      Object.entries(files).forEach(([key, file]) => {
        if (file) {
          data.append(key, file);
        }
      });

      const response = await fetch("/api/register/lab", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Laboratory registration failed. Please check your details.");
      }

      setSubmittedProviderId(result.provider_id || "PROV-LAB-NEW");
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during laboratory registration.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-cyan-100 dark:border-cyan-900/60">
          <div className="w-18 h-18 bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-cyan-50 dark:ring-cyan-950/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
            Application Submitted
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            Registration Under SMC Review
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed">
            Your laboratory registration has been submitted and is currently{" "}
            <span className="font-bold text-amber-600 dark:text-amber-400">Pending Approval</span> by the Solapur
            Municipal Corporation Health Department.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-200 text-left mb-6 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Assigned Provider ID:</span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                {submittedProviderId}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Laboratory Name:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{formData.name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Registered Email:</span>
              <span className="font-mono">{formData.email}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400">Reviewing Authority:</span>
              <span className="font-semibold">SMC Chief Health Officer Desk</span>
            </div>
          </div>

          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs mb-6 text-left flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              SMC medical officers will review your Clinical Establishment License and Pathologist credentials in the SMC Administration Portal. You will be able to access your dashboard once approved.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/lab" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer">
                Proceed to Laboratory Login
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full text-xs py-2.5 rounded-xl cursor-pointer">
                Return to Main Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Branding */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-105 transition-transform">
              <FlaskConical className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
              SAMVED <span className="text-cyan-600 dark:text-cyan-400">Health</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> Solapur Municipal Corporation Public Health Diagnostic Network
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Diagnostic Laboratory Registration
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base max-w-xl mx-auto">
            Apply to integrate your pathology laboratory, imaging center, or diagnostic clinic with Solapur Municipal Corporation. Upload statutory licenses for municipal review.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Laboratory Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Laboratory Facility Profile</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registered clinical identity, official communication channels, and municipal location.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Laboratory / Diagnostic Centre Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Solapur Metropolis Diagnostic Centre"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Official Laboratory Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur("email")}
                    placeholder="e.g. lab@solapurpath.com"
                    className={`w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-xs ${
                      touched.email && !isEmailValid
                        ? "border-rose-400 bg-rose-50/20"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                </div>
                {touched.email && !isEmailValid && (
                  <p className="mt-1.5 text-xs text-rose-500 font-medium">Please enter a valid business email address.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Contact Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 98230 12345"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Operating Ward (Solapur Municipal Corporation) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <select
                    name="ward_id"
                    value={formData.ward_id}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-xs"
                  >
                    {SOLAPUR_WARDS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Clinical Establishment License No. (CEA / SMC) *
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    name="license"
                    required
                    value={formData.license}
                    onChange={handleChange}
                    placeholder="e.g. MH-LAB-2024-0091"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all font-mono shadow-xs"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Full Laboratory Facility Address *
                </label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="e.g. Shop 12-14, Municipal Commercial Complex, Begam Peth, Solapur - 413002"
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-xs leading-relaxed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Admin Master Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="admin_password"
                    required
                    value={formData.admin_password}
                    onChange={handleChange}
                    onBlur={() => handleBlur("admin_password")}
                    placeholder="Minimum 8 characters with letters, numbers, and symbols"
                    className={`w-full pl-10 pr-11 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all shadow-xs ${
                      touched.admin_password && !isPasswordValid
                        ? "border-rose-400 bg-rose-50/20"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Criteria Feedback */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-medium ${
                      passwordCriteria.minLength ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {passwordCriteria.minLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>At least 8 chars</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-medium ${
                      passwordCriteria.hasLetter ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {passwordCriteria.hasLetter ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>Letters (A-Z)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-medium ${
                      passwordCriteria.hasNumber ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {passwordCriteria.hasNumber ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>Numbers (0-9)</span>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-medium ${
                      passwordCriteria.hasSpecial ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {passwordCriteria.hasSpecial ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>Special symbol (@#$)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Laboratory Documents */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Statutory Regulatory Documents</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload PDF or clear scanned copies of all mandatory regulatory documents for SMC verification.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {MANDATORY_DOCS.map((doc) => {
                const uploadedFile = files[doc.key];
                return (
                  <div
                    key={doc.key}
                    className={`p-5 rounded-2xl border transition-all ${
                      uploadedFile
                        ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText
                          className={`w-4 h-4 ${
                            uploadedFile ? "text-emerald-600 dark:text-emerald-400" : "text-cyan-600 dark:text-cyan-400"
                          }`}
                        />
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {doc.title}
                        </h3>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 shrink-0">
                        Mandatory
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                      {doc.description}
                    </p>

                    <div className="relative">
                      <input
                        type="file"
                        id={doc.key}
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileChange(doc.key, e)}
                        className="sr-only"
                      />
                      <label
                        htmlFor={doc.key}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${
                          uploadedFile
                            ? "border-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200"
                            : "border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-cyan-50/50"
                        }`}
                      >
                        {uploadedFile ? (
                          <>
                            <FileCheck2 className="w-4 h-4 text-emerald-600" />
                            <span className="truncate max-w-[200px]">{uploadedFile.name}</span>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4 text-cyan-600" />
                            <span>Select Document (PDF/JPG)</span>
                          </>
                        )}
                      </label>
                    </div>

                    {uploadedFile && (
                      <p className="mt-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                        ✓ {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB uploaded
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission Action */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Solapur Municipal Corporation Diagnostic Health Network
              </p>
              <p className="mt-0.5">By submitting, you affirm that all laboratory credentials provided are authentic.</p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/20 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading & Submitting Application...</span>
                </div>
              ) : (
                <span>Submit Laboratory Registration</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
