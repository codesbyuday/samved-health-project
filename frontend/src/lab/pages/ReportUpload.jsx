import React, { useMemo, useState } from 'react';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const initialForm = {
  citizen_id: '',
  test_type_id: '',
  result: '',
  description: '',
  report_file_url: '',
  test_date: new Date().toISOString().slice(0, 10),
  status: 'completed',
};

const ReportUpload = () => {
  const {
    currentProvider,
    providerReports,
    providerCatalog,
    citizens,
    createReport,
    uploadAndAttachReportDocument,
    openReportDocument,
    findCitizenById,
    saving,
  } = useAppData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [citizenInput, setCitizenInput] = useState('');
  const [verifiedCitizen, setVerifiedCitizen] = useState(null);
  const [isVerifyingCitizen, setIsVerifyingCitizen] = useState(false);
  const [citizenError, setCitizenError] = useState('');

  // Late Document Attachment Modal State
  const [attachModal, setAttachModal] = useState({
    isOpen: false,
    report: null,
    selectedFile: null,
    error: '',
    uploading: false,
  });

  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // View Report Slip Modal State
  const [selectedReportView, setSelectedReportView] = useState(null);

  // Filter reports
  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return providerReports;
    return providerReports.filter((r) => {
      const citizenName = r.citizens?.name || '';
      const testName = r.test_types?.test_name || '';
      const citizenId = r.citizen_id || '';
      const reportId = r.report_id || '';
      const result = r.result || '';

      return (
        reportId.toLowerCase().includes(term) ||
        citizenId.toLowerCase().includes(term) ||
        citizenName.toLowerCase().includes(term) ||
        testName.toLowerCase().includes(term) ||
        result.toLowerCase().includes(term)
      );
    });
  }, [providerReports, search]);

  const handleOpenModal = () => {
    setForm({
      ...initialForm,
      test_date: new Date().toISOString().slice(0, 10),
    });
    setSelectedFile(null);
    setCitizenInput('');
    setVerifiedCitizen(null);
    setCitizenError('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleVerifyCitizen = async (idToVerify) => {
    const cleanId = (idToVerify || citizenInput).trim();
    if (!cleanId) {
      setCitizenError('Please enter a valid Citizen Health ID.');
      setVerifiedCitizen(null);
      return;
    }

    setIsVerifyingCitizen(true);
    setCitizenError('');
    try {
      const found = await findCitizenById(cleanId);
      if (found) {
        setVerifiedCitizen(found);
        setForm((prev) => ({ ...prev, citizen_id: found.citizen_id }));
        setCitizenError('');
      } else {
        setVerifiedCitizen(null);
        setForm((prev) => ({ ...prev, citizen_id: '' }));
        setCitizenError(`Citizen ID "${cleanId}" not found in SMC registry.`);
      }
    } catch (err) {
      setCitizenError('Error verifying Citizen ID.');
    } finally {
      setIsVerifyingCitizen(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.citizen_id || !verifiedCitizen) {
      setFormError('Please enter and verify a valid Citizen Health ID.');
      return;
    }

    if (!form.test_type_id) {
      setFormError('Please select a test investigation from your catalog.');
      return;
    }

    if (!form.result.trim()) {
      setFormError('Please enter the clinical diagnostic finding / result value.');
      return;
    }

    try {
      await createReport(form, selectedFile);
      setIsModalOpen(false);
      setSelectedFile(null);
      setSuccessMsg(
        selectedFile
          ? 'Diagnostic report and document uploaded and linked successfully to patient health record.'
          : 'Diagnostic report released. You can upload the PDF document later at any time.'
      );
      setTimeout(() => setSuccessMsg(''), 4500);
    } catch (err) {
      setFormError(err?.message || 'Failed to submit diagnostic report.');
    }
  };

  // Late Document Attachment Handlers
  const handleOpenAttachModal = (report) => {
    setAttachModal({
      isOpen: true,
      report,
      selectedFile: null,
      error: '',
      uploading: false,
    });
  };

  const handleSubmitAttachModal = async (e) => {
    e.preventDefault();
    if (!attachModal.selectedFile) {
      setAttachModal((prev) => ({ ...prev, error: 'Please choose a PDF document or image to upload.' }));
      return;
    }

    setAttachModal((prev) => ({ ...prev, uploading: true, error: '' }));
    try {
      const reportId = attachModal.report?.report_id;
      const citizenId = attachModal.report?.citizen_id || 'patient';
      await uploadAndAttachReportDocument(reportId, attachModal.selectedFile, citizenId);

      setAttachModal({
        isOpen: false,
        report: null,
        selectedFile: null,
        error: '',
        uploading: false,
      });

      setSuccessMsg('Official report document uploaded to Supabase storage and attached to health record.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setAttachModal((prev) => ({
        ...prev,
        uploading: false,
        error: err?.message || 'Failed to upload report document.',
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Diagnostic Documentation
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Diagnostic Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Record clinical pathology findings, observations, and digital PDF document links directly into citizen records.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/25 cursor-pointer shrink-0 transition-all"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span>Release New Report</span>
        </button>
      </div>

      {successMsg && (
        <div className="surface-card rounded-2xl p-4 flex items-center gap-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-fade-in shadow-xs">
          <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="surface-card rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reports by citizen name, Health ID, report reference, investigation type, or findings..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="surface-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <i className="fa-solid fa-file-medical text-3xl mb-2 text-cyan-500"></i>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No diagnostic reports released yet</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {search
                ? 'Try clearing your search query.'
                : 'Click "Release New Report" or advance a sample in Sample Flow to publish the first investigation.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-left">
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Report Reference
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Patient Details
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Investigation
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Clinical Finding / Result
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Test Date
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReports.map((report) => (
                  <tr
                    key={report.report_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-file-waveform text-cyan-600 text-xs"></i>
                        <span>{report.report_id.slice(0, 13)}...</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {report.citizens?.name || report.citizen_id}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {report.citizen_id} • {report.citizens?.phone || 'No phone'}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {report.test_types?.test_name || `Investigation #${report.test_type_id}`}
                        </p>
                        <span className="inline-block mt-0.5 text-[10px] font-bold text-cyan-700 dark:text-cyan-300">
                          {report.test_types?.test_category || 'Diagnostic'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="max-w-xs">
                        <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                          {report.result}
                        </p>
                        {report.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(report.test_date || report.uploaded_at)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${
                          report.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : report.status === 'in_progress'
                            ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {report.status || 'completed'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedReportView(report)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors border border-cyan-200/60 dark:border-cyan-800/60 flex items-center gap-1 cursor-pointer"
                        >
                          <i className="fa-solid fa-eye text-xs"></i>
                          <span>View Slip</span>
                        </button>

                        {report.report_file_url ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openReportDocument(report.report_file_url)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors border border-rose-200/80 dark:border-rose-800/80 flex items-center gap-1 cursor-pointer"
                              title="Open attached PDF in new tab"
                            >
                              <i className="fa-solid fa-file-pdf text-xs text-rose-600"></i>
                              <span>PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenAttachModal(report)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 transition-colors cursor-pointer"
                              title="Replace / update attached PDF"
                            >
                              <i className="fa-solid fa-arrow-up-from-bracket text-xs"></i>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenAttachModal(report)}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors border border-amber-200/80 dark:border-amber-800/80 flex items-center gap-1 cursor-pointer"
                            title="Attach PDF report document"
                          >
                            <i className="fa-solid fa-cloud-arrow-up text-xs text-amber-600"></i>
                            <span>+ Attach PDF</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: RELEASE NEW REPORT */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Release Diagnostic Report"
        subtitle="Link clinical findings directly into citizen health records"
        icon="fa-file-circle-plus"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm shrink-0"></i>
              <span>{formError}</span>
            </div>
          )}

          {/* Citizen Health ID (NO predictive dropdown while typing) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-id-card text-cyan-600 text-xs"></i>
                <span>Citizen Health ID <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">e.g. SMC-2025-000010</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={citizenInput}
                onChange={(e) => {
                  setCitizenInput(e.target.value);
                  setVerifiedCitizen(null);
                  setCitizenError('');
                }}
                onBlur={() => {
                  if (citizenInput.trim() && !verifiedCitizen) {
                    handleVerifyCitizen();
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleVerifyCitizen();
                  }
                }}
                placeholder="Enter exact Citizen ID (e.g. SMC-2025-000010)"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-mono font-bold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none uppercase transition-all"
                required
              />
              <button
                type="button"
                onClick={() => handleVerifyCitizen()}
                disabled={isVerifyingCitizen || !citizenInput.trim()}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {isVerifyingCitizen ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-magnifying-glass text-xs"></i>
                    <span>Verify</span>
                  </>
                )}
              </button>
            </div>

            {citizenError && (
              <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1">
                <i className="fa-solid fa-circle-xmark"></i>
                <span>{citizenError}</span>
              </p>
            )}

            {verifiedCitizen && (
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/70 text-slate-800 dark:text-slate-100 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white text-xs font-bold">
                      <i className="fa-solid fa-check"></i>
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                        {verifiedCitizen.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {verifiedCitizen.citizen_id} • Ward {verifiedCitizen.ward_number || 'N/A'}{' '}
                        {verifiedCitizen.gender ? `• ${verifiedCitizen.gender}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                    Phone: {verifiedCitizen.phone || 'N/A'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Investigation Type from Catalog */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-vial text-cyan-600 text-xs"></i>
              <span>Investigation / Test Type <span className="text-rose-500">*</span></span>
            </label>
            <select
              value={form.test_type_id}
              onChange={(e) => setForm({ ...form, test_type_id: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none cursor-pointer transition-all"
              required
            >
              <option value="">-- Select Test from Laboratory Catalog --</option>
              {providerCatalog.map((item) => (
                <option key={item.lab_test_id} value={item.test_type_id}>
                  {item.test_types?.test_name} ({item.test_types?.test_category || 'Diagnostic'}) - ₹
                  {Number(item.price || 0).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Test Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-calendar-day text-cyan-600 text-xs"></i>
              <span>Investigation Date <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="date"
              value={form.test_date}
              onChange={(e) => setForm({ ...form, test_date: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              required
            />
          </div>

          {/* Result Findings */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-square-poll-vertical text-cyan-600 text-xs"></i>
              <span>Key Diagnostic Finding / Clinical Value <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              value={form.result}
              onChange={(e) => setForm({ ...form, result: e.target.value })}
              placeholder="e.g. Hemoglobin: 14.1 g/dL (Reference: 13.0 - 17.0) or Non-Reactive"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              required
            />
          </div>

          {/* Pathologist Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-notes-medical text-cyan-600 text-xs"></i>
              <span>Pathologist Impression / Follow-Up Advice</span>
              <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Clinical remarks or recommendations..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-medium focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Upload Official Report Document (PDF / Image) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-cloud-arrow-up text-cyan-600 text-xs"></i>
                <span>Attach Official Report Document (PDF or Image)</span>
              </label>
              <span className="text-[11px] font-normal text-slate-400">Optional (Can attach later)</span>
            </div>

            {!selectedFile ? (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        setFormError('File size exceeds 10 MB limit. Please select a smaller file.');
                        return;
                      }
                      setSelectedFile(file);
                      setFormError('');
                    }
                  }}
                />
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform mb-2">
                  <i className="fa-solid fa-file-arrow-up text-lg"></i>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to select PDF report or diagnostic image
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports .PDF, .PNG, .JPG (Max 10 MB) • Uploads to secure <span className="font-mono text-cyan-600">lab_reports</span> storage
                </p>
              </label>
            ) : (
              <div className="p-3.5 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shrink-0">
                    <i className={selectedFile.type.includes('pdf') ? 'fa-solid fa-file-pdf text-lg' : 'fa-solid fa-file-image text-lg'}></i>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatFileSize(selectedFile.size)} • Ready for Supabase storage
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                  title="Remove file"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !verifiedCitizen || !form.test_type_id}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Publishing & Uploading...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-xs"></i>
                  <span>Release Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: VIEW COMPLETE REPORT SLIP */}
      <Modal
        isOpen={!!selectedReportView}
        onClose={() => setSelectedReportView(null)}
        title="Diagnostic Pathology Investigation Slip"
        subtitle={`Report ID: ${selectedReportView?.report_id || ''}`}
        icon="fa-file-invoice"
        maxWidth="max-w-2xl"
      >
        {selectedReportView && (
          <div className="space-y-6 text-slate-900 dark:text-white">
            {/* Header Slip Branding */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/40 dark:to-teal-950/40 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-700 dark:text-cyan-400">
                  Solapur Municipal Corporation • Public Health Diagnostics
                </p>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {currentProvider?.name || 'Diagnostic Laboratory'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ward {currentProvider?.ward_id || 'Solapur'} • License: {currentProvider?.license || 'MH-LAB-ACTIVE'}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Verified Digital Release
                </span>
              </div>
            </div>

            {/* Patient & Test Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Patient Name</span>
                <p className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {selectedReportView.citizens?.name || selectedReportView.citizen_id}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Citizen Health ID</span>
                <p className="font-mono font-bold mt-0.5">{selectedReportView.citizen_id}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Phone Number</span>
                <p className="font-bold mt-0.5">{selectedReportView.citizens?.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Test Investigation</span>
                <p className="font-bold mt-0.5 text-cyan-600 dark:text-cyan-400">
                  {selectedReportView.test_types?.test_name || `Test #${selectedReportView.test_type_id}`}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Category</span>
                <p className="font-semibold mt-0.5">{selectedReportView.test_types?.test_category || 'Diagnostic'}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Investigation Date</span>
                <p className="font-semibold mt-0.5">{formatDate(selectedReportView.test_date || selectedReportView.uploaded_at)}</p>
              </div>
            </div>

            {/* Clinical Result Findings */}
            <div className="p-4 rounded-2xl border-2 border-cyan-500/30 bg-white dark:bg-slate-900 shadow-sm space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                Diagnostic Findings & Interpretation
              </span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">
                {selectedReportView.result}
              </p>
              {selectedReportView.description && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clinical Notes & Remarks
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {selectedReportView.description}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              {selectedReportView.report_file_url ? (
                <button
                  type="button"
                  onClick={() => openReportDocument(selectedReportView.report_file_url)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                >
                  <i className="fa-solid fa-file-pdf"></i>
                  <span>Open Attached PDF</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const r = selectedReportView;
                    setSelectedReportView(null);
                    handleOpenAttachModal(r);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer"
                >
                  <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                  <span>Attach PDF Document Now</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <i className="fa-solid fa-print"></i>
                <span>Print Report Slip</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: LATE ATTACHMENT MODAL */}
      <Modal
        isOpen={attachModal.isOpen}
        onClose={() => setAttachModal({ ...attachModal, isOpen: false })}
        title="Attach Diagnostic Report Document"
        subtitle={`Patient: ${attachModal.report?.citizens?.name || attachModal.report?.citizen_id || ''} • ${attachModal.report?.test_types?.test_name || 'Diagnostic Report'}`}
        icon="fa-cloud-arrow-up"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitAttachModal} className="space-y-4">
          {attachModal.error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm shrink-0"></i>
              <span>{attachModal.error}</span>
            </div>
          )}

          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Investigation: {attachModal.report?.test_types?.test_name || 'Laboratory Test'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Citizen ID: <span className="font-mono font-bold text-cyan-600">{attachModal.report?.citizen_id}</span>
            </p>
            {attachModal.report?.uploaded_at && (
              <p className="text-[11px] text-slate-400">
                Last updated: {formatDate(attachModal.report.uploaded_at)}
              </p>
            )}
          </div>

          {/* File Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-file-pdf text-rose-500 text-xs"></i>
              <span>Select PDF Document or Image to Attach <span className="text-rose-500">*</span></span>
            </label>

            {!attachModal.selectedFile ? (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        setAttachModal((prev) => ({
                          ...prev,
                          error: 'File size exceeds 10 MB limit.',
                        }));
                        return;
                      }
                      setAttachModal((prev) => ({ ...prev, selectedFile: file, error: '' }));
                    }
                  }}
                />
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform mb-2">
                  <i className="fa-solid fa-cloud-arrow-up text-xl"></i>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Click to select PDF or image file
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Stored securely in Supabase storage bucket <span className="font-mono text-cyan-600">lab_reports</span>
                </p>
              </label>
            ) : (
              <div className="p-3.5 rounded-2xl bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shrink-0">
                    <i className={attachModal.selectedFile.type.includes('pdf') ? 'fa-solid fa-file-pdf text-lg' : 'fa-solid fa-file-image text-lg'}></i>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {attachModal.selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatFileSize(attachModal.selectedFile.size)} • Ready to upload
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachModal((prev) => ({ ...prev, selectedFile: null }))}
                  className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-400 hover:text-rose-600 transition-colors shrink-0 cursor-pointer"
                  title="Remove file"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setAttachModal({ ...attachModal, isOpen: false })}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={attachModal.uploading || !attachModal.selectedFile}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              {attachModal.uploading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Uploading to Storage...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                  <span>Upload & Attach Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ReportUpload;
