import React, { useEffect, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../context/ThemeContext';

const MANDATORY_DOCS = [
  {
    type: "Clinical Establishment Registration (CEA / SMC)",
    description: "Official Clinical Establishment Act registration or SMC Public Health Department diagnostic license.",
  },
  {
    type: "Consulting Pathologist MMC Registration Certificate",
    description: "Maharashtra Medical Council (MMC) certificate of the supervising registered MD/DNB Pathologist.",
  },
  {
    type: "Bio-Medical Waste (BMW) Disposal Authorization",
    description: "Valid Bio-Medical Waste management authorization from Maharashtra Pollution Control Board (MPCB) or SMC.",
  },
  {
    type: "Establishment License (Gumasta / GST Certificate)",
    description: "Municipal trade license (Gumasta) or GST registration certificate of the diagnostic facility.",
  },
];

const Settings = () => {
  const { currentProvider, wards, updateProviderProfile, saving } = useAppData();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'documents'

  // Profile Form state
  const [form, setForm] = useState({
    name: currentProvider?.name || '',
    phone: currentProvider?.phone || '',
    address: currentProvider?.address || '',
    email: currentProvider?.email || '',
    license: currentProvider?.license || '',
    ward_id: currentProvider?.ward_id || '',
  });
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [docNotice, setDocNotice] = useState({ text: '', type: 'info' });

  useEffect(() => {
    if (currentProvider) {
      setForm({
        name: currentProvider.name || '',
        phone: currentProvider.phone || '',
        address: currentProvider.address || '',
        email: currentProvider.email || '',
        license: currentProvider.license || '',
        ward_id: currentProvider.ward_id || '',
      });
    }
  }, [currentProvider]);

  const providerId = currentProvider?.provider_id;

  const fetchDocuments = async () => {
    if (!providerId) return;
    try {
      setLoadingDocs(true);
      const res = await fetch(`/api/lab/documents?provider_id=${encodeURIComponent(providerId)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDocuments(data.documents || []);
        }
      }
    } catch (err) {
      console.warn('Failed to load laboratory documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, providerId]);

  const save = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    try {
      await updateProviderProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorMsg(err?.message || 'Failed to update profile settings.');
    }
  };

  const handleFileUpload = async (event, docType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    setDocNotice({ text: '', type: 'info' });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);
      formData.append('provider_id', providerId);
      formData.append('lab_name', currentProvider?.name || 'Solapur Pathology Lab');

      const res = await fetch('/api/lab/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDocNotice({
          text: `"${docType}" uploaded successfully! Submitted for SMC municipal verification.`,
          type: 'success',
        });
        await fetchDocuments();
      } else {
        setDocNotice({
          text: data.error || 'Failed to upload document. Please try again.',
          type: 'error',
        });
      }
    } catch (err) {
      setDocNotice({
        text: err?.message || 'Network error while uploading document.',
        type: 'error',
      });
    } finally {
      setUploadingDoc(null);
      event.target.value = '';
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'document.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  // Count verified documents
  const verifiedCount = documents.filter((d) => {
    const s = (d.verification_status || '').toLowerCase();
    return s === 'approved' || s === 'confirm' || s === 'accept' || s === 'verified';
  }).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
          Laboratory Administration
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
          Settings & Facility Profile
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Manage your official diagnostic laboratory profile, compliance documents, and operational configuration registered with the Solapur Municipal Corporation.
        </p>
      </div>

      {/* Lab Verification & Identity Card (matching Pharmacy) */}
      <div className="surface-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm bg-gradient-to-r from-cyan-50/50 via-slate-50 to-transparent dark:from-cyan-950/20 dark:via-slate-850 dark:to-transparent border-l-4 border-l-cyan-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-600 text-white font-black text-xl shadow-md shadow-cyan-600/20">
              {currentProvider?.name ? currentProvider.name.charAt(0) : 'L'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{currentProvider?.name || 'Diagnostic Laboratory'}</h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <i className="fa-solid fa-circle-check text-[10px]"></i>
                  SMC Certified Provider
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Provider ID: <span className="font-mono font-bold text-slate-900 dark:text-white">{currentProvider?.provider_id || 'PROV-LAB'}</span>
                {currentProvider?.license && (
                  <span className="ml-3">License: <span className="font-medium text-slate-800 dark:text-slate-200">{currentProvider.license}</span></span>
                )}
                <span className="ml-3">Ward: <span className="font-medium text-slate-800 dark:text-slate-200">{currentProvider?.ward_id || 'N/A'}</span></span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center">
            <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
              Role: Pathology & Diagnostic Center
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-sm font-bold'
              : 'text-slate-700 dark:text-soft hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-main font-semibold'
          }`}
        >
          <svg className="w-4 h-4 text-cyan-700 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Facility Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-sm font-bold'
              : 'text-slate-700 dark:text-soft hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-main font-semibold'
          }`}
        >
          <svg className="w-4 h-4 text-cyan-700 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Compliance & Documents</span>
          {documents.length > 0 && (
            <span className="py-0.5 px-2 rounded-full text-[10px] font-bold bg-cyan-200/90 dark:bg-cyan-500/30 text-cyan-950 dark:text-cyan-200 border border-cyan-300 dark:border-cyan-500/40">
              {documents.length}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: FACILITY PROFILE                                 */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="surface-card rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          {saved && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <i className="fa-solid fa-circle-check text-emerald-600"></i>
              <span>Laboratory profile updated successfully in the municipal registry.</span>
            </div>
          )}
          {errorMsg && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Laboratory Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Solapur Pathology Lab"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Operating Ward
              </label>
              <select
                value={form.ward_id}
                onChange={(e) => setForm({ ...form, ward_id: e.target.value ? Number(e.target.value) : '' })}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              >
                <option value="">Select ward</option>
                {wards.map((ward) => (
                  <option key={ward.ward_id} value={ward.ward_id}>
                    Ward {ward.ward_id} - {ward.ward_name || ward.zone || `Zone ${ward.zone || ''}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Contact Phone
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. 9890001001"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Official Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. solapur.lab1@gmail.com"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Clinical Establishment License
              </label>
              <input
                type="text"
                value={form.license}
                onChange={(e) => setForm({ ...form, license: e.target.value })}
                placeholder="e.g. MH-LAB-2019-0041"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Interface Display Mode
              </label>
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-semibold flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                  <span>Active: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                </span>
                <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                  Switch to {theme === 'dark' ? 'Light' : 'Dark'}
                </span>
              </button>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Full Physical Address
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows="3"
                placeholder="Street address, landmark, Solapur, Maharashtra"
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
              ></textarea>
            </div>

            <div className="md:col-span-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner animate-spin"></i>
                    <span>Saving Updates...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Save Profile Updates</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: COMPLIANCE DOCUMENTS                             */}
      {/* ======================================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="surface-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40">
                <svg className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                SMC Regulatory Compliance
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2.5">
                Laboratory Regulatory & Licensing Documents
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed max-w-2xl font-medium">
                Mandatory diagnostic laboratory registration documents required by Solapur Municipal Corporation. 
                Documents that have been <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Accepted or Confirmed</strong> by SMC officers are officially verified and locked — they cannot be re-uploaded. Missing or rejected documents can be uploaded directly below.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0 text-center min-w-[140px]">
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Verified Documents</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {verifiedCount} / {MANDATORY_DOCS.length}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">Officially Confirmed</p>
            </div>
          </div>

          {/* Feedback Notice Banner */}
          {docNotice.text && (
            <div
              className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between animate-fade-in ${
                docNotice.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-rose-100 dark:bg-rose-500/10 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
              }`}
            >
              <span>{docNotice.text}</span>
              <button
                type="button"
                onClick={() => setDocNotice({ text: '', type: 'info' })}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-bold px-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Mandatory Documents List */}
          <div className="space-y-3.5">
            {loadingDocs ? (
              <div className="surface-card rounded-2xl p-10 text-center text-slate-500 dark:text-slate-400 text-xs animate-pulse bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                Loading compliance documents status...
              </div>
            ) : (
              MANDATORY_DOCS.map((category) => {
                const doc = documents.find((d) => d.document_type === category.type);
                const isUploaded = Boolean(doc && doc.document_url);
                const status = (doc?.verification_status || '').toLowerCase();

                // Check whether status is confirmed/accepted/approved
                const isConfirmed =
                  isUploaded &&
                  (status === 'approved' ||
                    status === 'confirm' ||
                    status === 'accept' ||
                    status === 'verified');

                const isPending = isUploaded && status === 'pending';
                const isRejected = isUploaded && status === 'rejected';
                const isCurrentlyUploading = uploadingDoc === category.type;

                return (
                  <div
                    key={category.type}
                    className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Document Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{category.type}</h4>

                        {/* Status Badges */}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                            <svg className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Confirmed & Accepted
                          </span>
                        )}

                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                            <svg className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Pending SMC Verification
                          </span>
                        )}

                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-500/20 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30">
                            <svg className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Rejected
                          </span>
                        )}

                        {!isUploaded && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
                            ⚠ Not Uploaded
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{category.description}</p>

                      {isUploaded && doc.submitted_at && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Uploaded on: {new Date(doc.submitted_at).toLocaleDateString()}
                          {doc.reviewed_by && ` • Reviewed by: ${doc.reviewed_by}`}
                        </p>
                      )}

                      {isRejected && doc.rejection_reason && (
                        <p className="text-xs text-rose-800 dark:text-rose-300 font-bold mt-1">
                          Rejection Reason: {doc.rejection_reason}
                        </p>
                      )}

                      {isConfirmed && (
                        <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-bold flex items-center gap-1.5 mt-1">
                          <svg className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Officially verified by SMC. Document is locked — re-upload is disabled.
                        </p>
                      )}
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* VIEW & DOWNLOAD (Available for any uploaded document) */}
                      {isUploaded && (
                        <>
                          <button
                            type="button"
                            onClick={() => window.open(doc.document_url, '_blank')}
                            className="py-2 px-3.5 rounded-xl border border-cyan-300 dark:border-cyan-800/60 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <svg className="w-3.5 h-3.5 text-cyan-700 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDownload(
                                doc.document_url,
                                `${currentProvider?.name || 'Lab'}_${category.type}.pdf`
                              )
                            }
                            className="py-2 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download</span>
                          </button>
                        </>
                      )}

                      {/* UPLOAD / RE-UPLOAD (Only allowed if NOT confirmed) */}
                      {!isConfirmed && (
                        <div>
                          <input
                            type="file"
                            id={`file-upload-${category.type.replace(/[^a-zA-Z0-9]/g, '_')}`}
                            className="hidden"
                            accept=".pdf,image/png,image/jpeg,image/jpg"
                            onChange={(e) => handleFileUpload(e, category.type)}
                            disabled={isCurrentlyUploading}
                          />
                          <label htmlFor={`file-upload-${category.type.replace(/[^a-zA-Z0-9]/g, '_')}`}>
                            <span
                              className={`py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/20 cursor-pointer inline-flex items-center gap-1.5 ${
                                isCurrentlyUploading ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {isCurrentlyUploading ? (
                                <>
                                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Uploading...</span>
                                </>
                              ) : isRejected ? (
                                <>
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  <span>Upload Revised</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  <span>Upload Document</span>
                                </>
                              )}
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
