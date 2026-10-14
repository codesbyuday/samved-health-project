import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

const MANDATORY_DOCS = [
  {
    type: "Drug License Form 20/21",
    description: "Official FDA / State Drug Control retail pharmaceutical sales license.",
  },
  {
    type: "Pharmacist Registration Certificate",
    description: "State Pharmacy Council registration certificate of the supervising pharmacist.",
  },
  {
    type: "Shop & Establishment License (Gumasta)",
    description: "Municipal Corporation trade certificate or establishment registration.",
  },
  {
    type: "GST Registration Certificate",
    description: "Goods and Services Tax registration certificate of the commercial entity.",
  },
];

const Settings = () => {
  const { pharmacyProfile, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { databaseMode } = useData();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'documents'
  const [formData, setFormData] = useState(pharmacyProfile);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [docNotice, setDocNotice] = useState({ text: '', type: 'info' });

  useEffect(() => {
    setFormData(pharmacyProfile);
  }, [pharmacyProfile]);

  const providerId = pharmacyProfile?.provider_id;

  const fetchDocuments = async () => {
    if (!providerId) return;
    try {
      setLoadingDocs(true);
      const res = await fetch(`/api/pharmacy/documents?provider_id=${providerId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDocuments(data.documents || []);
        }
      }
    } catch (err) {
      console.warn('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, providerId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((currentData) => ({ ...currentData, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');
    try {
      const result = await updateProfile(formData);
      setNotice(result.success ? 'Pharmacy profile updated successfully.' : result.error);
    } catch (err) {
      setNotice(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event, docType) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    setDocNotice({ text: '', type: 'info' });

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('document_type', docType);
      form.append('provider_id', providerId);
      form.append('pharmacy_name', pharmacyProfile?.name || 'Solapur Pharmacy');

      const res = await fetch('/api/pharmacy/documents', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDocNotice({
          text: `"${docType}" uploaded successfully! Submitted for SMC verification.`,
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

  if (!formData) {
    return (
      <div className="surface-card rounded-3xl p-8 text-center text-slate-600 dark:text-soft font-medium">
        Loading pharmacy profile settings...
      </div>
    );
  }

  // Count verified documents
  const verifiedCount = documents.filter((d) => {
    const s = (d.verification_status || '').toLowerCase();
    return s === 'approved' || s === 'confirm' || s === 'accept' || s === 'verified';
  }).length;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="page-title text-slate-900 dark:text-main">Pharmacy Settings & Facility Profile</h1>
        <p className="page-subtitle text-slate-600 dark:text-soft">
          Manage your pharmacy business information, compliance documents, operating hours, and appearance.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40 shadow-sm font-bold'
              : 'text-slate-700 dark:text-soft hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-main font-semibold'
          }`}
        >
          <svg className="w-4 h-4 text-teal-700 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Facility Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`py-2 px-4 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40 shadow-sm font-bold'
              : 'text-slate-700 dark:text-soft hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-main font-semibold'
          }`}
        >
          <svg className="w-4 h-4 text-teal-700 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Compliance & Documents</span>
          {documents.length > 0 && (
            <span className="py-0.5 px-2 rounded-full text-[10px] font-bold bg-teal-200/90 dark:bg-teal-500/30 text-teal-950 dark:text-teal-200 border border-teal-300 dark:border-teal-500/40">
              {documents.length}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: FACILITY PROFILE                                 */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="surface-card rounded-[1.75rem] p-6 md:p-8 border border-slate-200 dark:border-white/5 shadow-md bg-white dark:bg-panel-strong">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-soft">
                    Pharmacy Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name || ''}
                    onChange={handleChange}
                    className="input-shell w-full text-sm font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-soft">
                    Assigned Ward (SMC Registration)
                  </label>
                  <input
                    type="text"
                    name="ward"
                    value={formData.ward || `Ward ${formData.ward_id || 5}`}
                    disabled
                    className="input-shell w-full text-sm font-medium opacity-75 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-soft">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone || ''}
                    onChange={handleChange}
                    className="input-shell w-full text-sm font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-soft">
                    Drug License Number
                  </label>
                  <input
                    type="text"
                    name="license"
                    value={formData.license || ''}
                    disabled
                    className="input-shell w-full text-sm font-mono font-medium opacity-75 cursor-not-allowed bg-slate-100 dark:bg-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-soft">
                    Physical Store Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address || ''}
                    onChange={handleChange}
                    className="input-shell w-full text-sm font-medium"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-soft">
                    Operating Hours
                  </label>
                  <input
                    type="text"
                    name="operating_hours"
                    value={formData.operating_hours || 'Mon-Sat: 08:30 - 21:00'}
                    onChange={handleChange}
                    className="input-shell w-full text-sm font-medium"
                  />
                </div>
              </div>

              {notice && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold ${
                    notice.includes('successfully')
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20'
                      : 'bg-red-100 dark:bg-red-500/10 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-500/20'
                  }`}
                >
                  {notice}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-6 text-xs font-bold shadow-md cursor-pointer"
                  disabled={saving}
                >
                  {saving ? 'Saving Updates...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            {/* Theme Settings */}
            <div className="surface-card rounded-[1.75rem] p-6 border border-slate-200 dark:border-white/5 bg-white dark:bg-panel-strong shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-faint">Theme Preference</p>
              <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-main">{theme === 'dark' ? 'Night mode' : 'Day mode'}</h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-soft leading-relaxed">
                Switch between high-contrast daylight mode and relaxed evening dark mode.
              </p>
              <button
                type="button"
                onClick={toggleTheme}
                className="btn-secondary mt-4 w-full py-2.5 text-xs font-bold cursor-pointer"
              >
                Toggle Color Theme
              </button>
            </div>

            {/* Database Connection */}
            <div className="surface-card rounded-[1.75rem] p-6 border border-slate-200 dark:border-white/5 bg-white dark:bg-panel-strong shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-faint">System Integration</p>
              <h3 className="mt-2 text-xl font-bold text-emerald-800 dark:text-emerald-400">
                {databaseMode === 'supabase' ? 'Supabase Live DB' : 'Integrated'}
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-soft leading-relaxed">
                Provider profile, medicine catalog, and customer sales orders are synced with PostgreSQL database.
              </p>
              <div className="mt-4 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-transparent p-3 text-xs text-slate-700 dark:text-soft font-mono font-medium">
                Provider ID: <strong className="text-slate-900 dark:text-main">{formData.provider_id || 'PROV-PHM-001'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: COMPLIANCE DOCUMENTS                             */}
      {/* ======================================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="surface-card rounded-[1.75rem] p-6 border border-slate-200 dark:border-white/5 shadow-md bg-white dark:bg-panel-strong flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-500/20 text-teal-900 dark:text-teal-300 border border-teal-300 dark:border-teal-500/40">
                <svg className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                SMC Regulatory Compliance
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-main mt-2.5">
                Pharmacy Regulatory & Licensing Documents
              </h2>
              <p className="text-xs text-slate-600 dark:text-soft mt-1 leading-relaxed max-w-2xl font-medium">
                Mandatory pharmaceutical registration documents required by Solapur Municipal Corporation. 
                Documents that have been <strong className="text-emerald-800 dark:text-emerald-400 font-bold">Accepted or Confirmed</strong> by SMC officers are officially verified and locked — they cannot be re-uploaded. Missing or rejected documents can be uploaded directly below.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 shrink-0 text-center min-w-[140px]">
              <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-faint">Verified Documents</p>
              <p className="text-2xl font-black text-emerald-800 dark:text-emerald-400 mt-1">
                {verifiedCount} / {MANDATORY_DOCS.length}
              </p>
              <p className="text-[10px] text-slate-600 dark:text-soft mt-0.5 font-semibold">Officially Confirmed</p>
            </div>
          </div>

          {/* Feedback Notice Banner */}
          {docNotice.text && (
            <div
              className={`rounded-2xl p-4 text-xs font-semibold flex items-center justify-between ${
                docNotice.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                  : 'bg-rose-100 dark:bg-rose-500/10 text-rose-900 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
              }`}
            >
              <span>{docNotice.text}</span>
              <button
                type="button"
                onClick={() => setDocNotice({ text: '', type: 'info' })}
                className="text-slate-600 dark:text-soft hover:text-slate-900 dark:hover:text-main cursor-pointer font-bold px-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Mandatory Documents List */}
          <div className="space-y-3.5">
            {loadingDocs ? (
              <div className="surface-card rounded-2xl p-10 text-center text-slate-500 dark:text-soft text-xs animate-pulse bg-white dark:bg-panel-strong border border-slate-200 dark:border-white/5">
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
                    className="surface-card rounded-2xl p-5 border border-slate-200 dark:border-white/5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-white/10 bg-white dark:bg-panel-strong flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Document Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-main">{category.type}</h4>

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

                      <p className="text-xs text-slate-600 dark:text-soft font-medium">{category.description}</p>

                      {isUploaded && doc.submitted_at && (
                        <p className="text-[11px] text-slate-500 dark:text-faint font-medium">
                          Uploaded on: {new Date(doc.submitted_at).toLocaleDateString()}
                          {doc.reviewed_by && ` • Reviewed by: ${doc.reviewed_by}`}
                        </p>
                      )}

                      {isRejected && doc.rejection_reason && (
                        <p className="text-xs text-rose-800 dark:text-rose-400 font-bold mt-1">
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
                            className="py-2 px-3.5 rounded-xl border border-teal-300 dark:border-teal-800/60 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          >
                            <svg className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                `${pharmacyProfile.name}_${category.type}.pdf`
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
                            id={`file-upload-${category.type}`}
                            className="hidden"
                            accept=".pdf,image/png,image/jpeg,image/jpg"
                            onChange={(e) => handleFileUpload(e, category.type)}
                            disabled={isCurrentlyUploading}
                          />
                          <label htmlFor={`file-upload-${category.type}`}>
                            <span
                              className={`py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-700 to-emerald-700 dark:from-teal-600 dark:to-emerald-600 hover:from-teal-800 hover:to-emerald-800 shadow-md shadow-teal-700/20 cursor-pointer inline-flex items-center gap-1.5 ${
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
