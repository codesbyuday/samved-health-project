"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
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
  Store,
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
    title: "Drug License (Form 20 / 21)",
    description: "Official FDA / State Drug Control retail pharmaceutical sales license.",
  },
  {
    key: "file_pharmacist",
    title: "Registered Pharmacist Certificate",
    description: "State Pharmacy Council registration certificate of the supervising pharmacist.",
  },
  {
    key: "file_gumasta",
    title: "Shop & Establishment License (Gumasta)",
    description: "Municipal Corporation trade certificate or establishment registration.",
  },
  {
    key: "file_gst",
    title: "GST Registration Certificate",
    description: "Goods and Services Tax registration certificate of the commercial entity.",
  },
];

const isValidEmail = (email: string) => {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
};

export default function PharmacyRegistrationPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submittedProviderId, setSubmittedProviderId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    ward_id: "5",
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
    file_pharmacist: null,
    file_gumasta: null,
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
      setError("Please provide a valid business email address (e.g. shastri.medicals@gmail.com).");
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
      setError(`Please upload all mandatory documents: ${missingFiles.join(", ")}`);
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

      const response = await fetch("/api/register/pharmacy", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Pharmacy registration failed. Please check your details.");
      }

      setSubmittedProviderId(result.provider_id || "PROV-PHM-NEW");
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during pharmacy registration.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 md:p-10 text-center border border-emerald-100 dark:border-emerald-900/60">
          <div className="w-18 h-18 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50 dark:ring-emerald-950/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            Application Submitted
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            Registration Under SMC Review
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed">
            Your pharmacy registration has been submitted and is currently{" "}
            <span className="font-bold text-amber-600 dark:text-amber-400">Pending Approval</span> by the Solapur
            Municipal Corporation Health Department.
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl text-xs text-slate-700 dark:text-slate-200 text-left mb-6 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Assigned Provider ID:</span>
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm">
                {submittedProviderId}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Pharmacy Name:</span>
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
              SMC officers will inspect your uploaded Drug License (Form 20/21) and Pharmacist credentials in the SMC Admin Portal. You will be able to sign in once your registration is approved.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/pharma/login" className="flex-1">
              <Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer">
                Proceed to Pharmacy Login
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full text-xs font-semibold py-2.5 rounded-xl cursor-pointer">
                Return to Landing Portal
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/pharma/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
          >
            ← Back to Pharmacy Sign In
          </Link>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            SMC Portal Form 2026-PHM
          </span>
        </div>

        {/* Header Hero */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-200 dark:border-slate-800 shadow-sm mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
                Solapur Municipal Corporation • Public Health Department
              </p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
                Pharmacy Facility Registration
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Apply for licensed pharmaceutical clinical provider onboarding under the Solapur Unified Healthcare ERP Network.
              </p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-bold">Registration Alert</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Section 1: Facility Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                1. Pharmacy Commercial & Facility Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official store name, physical location, ward classification, and drug license.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Pharmacy / Medical Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Sanjivani Medical Store & Pharmacy"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Business Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. sanjivani.pharma@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={() => handleBlur("email")}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
                {touched.email && !isEmailValid && (
                  <p className="text-[11px] text-rose-500 font-medium">Please enter a valid business email.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="e.g. 9890002008"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Drug License Number (Form 20 / 21) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="license"
                  required
                  placeholder="e.g. MH-PHM-2024-0089"
                  value={formData.license}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Municipal Corporation Ward <span className="text-rose-500">*</span>
                </label>
                <select
                  name="ward_id"
                  value={formData.ward_id}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                >
                  {SOLAPUR_WARDS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Full Store Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <textarea
                    name="address"
                    required
                    rows={2}
                    placeholder="e.g. Shop No. 4, Royal Arcade, Near Civil Hospital Chowk, Solapur"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Store Latitude (GPS)
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  placeholder="17.6599"
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Store Longitude (GPS)
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  placeholder="75.9064"
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Administrative Password */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-teal-600" />
                2. Pharmacy Administrator Security Password
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Credentials used to securely access your dedicated multi-tenant pharmacy dashboard.
              </p>
            </div>

            <div className="max-w-md space-y-3">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="admin_password"
                    required
                    placeholder="Create a strong password"
                    value={formData.admin_password}
                    onChange={handleChange}
                    onBlur={() => handleBlur("admin_password")}
                    className="w-full px-4 pr-10 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password checklist */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Password Requirements:</p>
                <div className="flex items-center gap-2">
                  {passwordCriteria.minLength ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={passwordCriteria.minLength ? "text-emerald-600 font-medium" : "text-slate-500"}>
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordCriteria.hasLetter ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={passwordCriteria.hasLetter ? "text-emerald-600 font-medium" : "text-slate-500"}>
                    Includes at least one letter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordCriteria.hasNumber ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={passwordCriteria.hasNumber ? "text-emerald-600 font-medium" : "text-slate-500"}>
                    Includes at least one number
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {passwordCriteria.hasSpecial ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={passwordCriteria.hasSpecial ? "text-emerald-600 font-medium" : "text-slate-500"}>
                    Includes special symbol (!@#$%^&*)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Mandatory Document Uploads */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-teal-600" />
                3. Mandatory Pharmaceutical Compliance Documents
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Upload clear PDF or Image copies. These documents are directly inspected by SMC officers before approval.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MANDATORY_DOCS.map((doc) => {
                const currentFile = files[doc.key];
                return (
                  <div
                    key={doc.key}
                    className={`p-5 rounded-2xl border transition-all ${
                      currentFile
                        ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {doc.title}
                          <span className="text-rose-500">*</span>
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {doc.description}
                        </p>
                      </div>
                      {currentFile && (
                        <span className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="flex flex-col items-center justify-center p-3.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-teal-500 dark:hover:border-teal-400 bg-white dark:bg-slate-800/80 cursor-pointer transition">
                        <UploadCloud className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                          {currentFile ? "Replace file" : "Upload document"}
                        </span>
                        <span className="text-[10px] text-slate-400">PDF, JPG, PNG up to 10MB</span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleFileChange(doc.key, e)}
                        />
                      </label>

                      {currentFile && (
                        <div className="mt-2.5 flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/60 p-2 rounded-lg truncate">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{currentFile.name}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            ({(currentFile.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submission Button */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>All documents are securely stored in the Solapur Municipal Corporation cloud repository.</span>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Submitting Registration & Uploading Documents..." : "Submit Pharmacy Registration"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
