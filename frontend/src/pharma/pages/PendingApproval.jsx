import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const PendingApproval = () => {
  const { pharmacyProfile, refreshStatus, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const providerId = pharmacyProfile?.provider_id;
  const isRejected = pharmacyProfile?.status === 'rejected';

  const fetchDocs = async () => {
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
      console.warn('Failed to load pharmacy documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [providerId]);

  const handleRefresh = async () => {
    setChecking(true);
    setStatusMessage('');
    try {
      const newStatus = await refreshStatus();
      await fetchDocs();
      if (newStatus === 'approved') {
        setStatusMessage('Congratulations! Your pharmacy registration has been approved. Loading dashboard...');
        // Re-render will automatically switch to the dashboard as pharmacyProfile.status is approved
      } else if (newStatus === 'rejected') {
        setStatusMessage('Application Status: Rejected. Please inspect rejection reasons below.');
      } else {
        setStatusMessage('Status: Your application is still under review by SMC officers. Please check back later.');
      }
    } catch (err) {
      setStatusMessage('Could not verify status. Please check your connection.');
    } finally {
      setChecking(false);
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 flex flex-col justify-between transition-colors">
      {/* Top Header */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-extrabold text-lg shadow-md shadow-teal-500/20">
            PD
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Solapur Municipal Corporation
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Public Health Pharmacy Governance Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={logout}
            className="py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl w-full mx-auto my-8 space-y-6">
        {/* Main Status Hero Card */}
        <div className={`rounded-3xl p-6 md:p-8 border shadow-xl text-center ${
          isRejected
            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
            : 'bg-white dark:bg-slate-900 border-amber-200/80 dark:border-amber-900/60'
        }`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner ${
            isRejected
              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 ring-8 ring-rose-50 dark:ring-rose-950/30'
              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 ring-8 ring-amber-50 dark:ring-amber-950/30'
          }`}>
            {isRejected ? (
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isRejected
              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
          }`}>
            {isRejected ? 'Application Rejected' : 'Registration Under Review'}
          </span>

          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
            {isRejected
              ? 'Pharmacy Application Requires Re-submission'
              : 'Your Registration Request Is Under Review'}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-2 leading-relaxed">
            {isRejected
              ? 'Solapur Municipal Corporation officials reviewed your submitted credentials and rejected the application due to discrepancies in documents or compliance records.'
              : 'Your pharmacy facility details and compliance documents have been submitted to Solapur Municipal Corporation. SMC health officers are currently reviewing your documents.'}
          </p>

          {/* Explanation Alert Box */}
          <div className="mt-6 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-left text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <svg className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="space-y-1">
              <p className="font-bold">What happens next?</p>
              <p className="opacity-90 leading-relaxed">
                SMC health department verifies your FDA Drug License (Form 20/21), supervising pharmacist registration, and establishment trade licenses. Once verified by an officer, refreshing this page will grant immediate access to your full private pharmacy dashboard.
              </p>
            </div>
          </div>

          {/* Refresh Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="w-full sm:w-auto py-3 px-6 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-md shadow-teal-600/20 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Checking Approval Status...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Verification Status</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto py-3 px-5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Reload Page
            </button>
          </div>

          {statusMessage && (
            <p className="mt-4 text-xs font-semibold text-teal-600 dark:text-teal-400 animate-fade-in">
              {statusMessage}
            </p>
          )}
        </div>

        {/* Facility Details Overview Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Registered Facility Summary
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Pharmacy Name</span>
              <span className="font-bold text-slate-900 dark:text-white mt-0.5 block truncate">
                {pharmacyProfile?.name || 'Solapur Pharmacy'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Provider ID</span>
              <span className="font-mono font-bold text-teal-600 dark:text-teal-400 mt-0.5 block truncate">
                {pharmacyProfile?.provider_id || 'PROV-PHM-PENDING'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Solapur Ward</span>
              <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block">
                {pharmacyProfile?.ward || `Ward ${pharmacyProfile?.ward_id || 5}`}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Drug License #</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                {pharmacyProfile?.license || 'MH-PHM-2026-PENDING'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 sm:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Business Email</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                {pharmacyProfile?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Uploaded Documents at Registration Time */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Uploaded Compliance Documents
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verification status of the documents uploaded during registration
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {documents.length} Files Uploaded
            </span>
          </div>

          {loadingDocs ? (
            <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
              Loading uploaded verification documents...
            </div>
          ) : documents.length === 0 ? (
            <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
              No compliance files found. If you registered previously, contact your SMC Ward Health Officer.
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, idx) => {
                const status = (doc.verification_status || 'pending').toLowerCase();
                const isDocApproved = status === 'approved' || status === 'verified' || status === 'confirm';
                const isDocRejected = status === 'rejected';

                return (
                  <div
                    key={doc.document_id || idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {doc.document_type}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isDocApproved
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : isDocRejected
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {isDocApproved ? '✓ Verified' : isDocRejected ? '✕ Rejected' : '⏳ Pending Review'}
                        </span>
                      </div>

                      {doc.submitted_at && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Submitted on: {new Date(doc.submitted_at).toLocaleDateString()}
                        </p>
                      )}

                      {doc.rejection_reason && (
                        <p className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                          Reason: {doc.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => window.open(doc.document_url, '_blank')}
                        className="py-1.5 px-3 rounded-xl border border-teal-200 dark:border-slate-700 bg-teal-50 dark:bg-slate-800 text-xs font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>View</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownload(doc.document_url, `${doc.document_type}.pdf`)}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
        Solapur Municipal Corporation • Public Health Directorate • Pharmacy Regulatory Division
      </footer>
    </div>
  );
};

export default PendingApproval;
