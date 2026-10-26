import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const getSpecimenType = (category, testName) => {
  const lower = `${category} ${testName}`.toLowerCase();
  if (lower.includes('urine')) return { type: 'Urine Specimen', tube: 'Sterile Container', color: 'amber' };
  if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('hemoglobin') || lower.includes('hematology'))
    return { type: 'Whole Blood', tube: 'EDTA (Purple Top)', color: 'purple' };
  if (lower.includes('glucose') || lower.includes('sugar') || lower.includes('fasting'))
    return { type: 'Fluoride Plasma', tube: 'Sodium Fluoride (Grey)', color: 'slate' };
  if (lower.includes('swab') || lower.includes('covid') || lower.includes('rt-pcr'))
    return { type: 'Nasopharyngeal Swab', tube: 'VTM Vial', color: 'sky' };
  if (lower.includes('lipid') || lower.includes('liver') || lower.includes('kidney') || lower.includes('thyroid') || lower.includes('serum'))
    return { type: 'Venous Blood', tube: 'SST Serum Separator (Gold/Red)', color: 'rose' };
  return { type: 'Venous Blood Specimen', tube: 'Vacuum Tube', color: 'cyan' };
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const SampleCollection = () => {
  const {
    bookings,
    appointments,
    providerReports,
    currentProvider,
    updateBookingStatus,
    updateAppointmentStatus,
    createReport,
    uploadAndAttachReportDocument,
    openReportDocument,
    saving,
  } = useAppData();

  const activeBookings = bookings || appointments || [];
  const handleUpdateStatus = updateBookingStatus || updateAppointmentStatus;

  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Result Release Modal State (with direct file upload)
  const [releaseModal, setReleaseModal] = useState({
    isOpen: false,
    appointment: null,
    testTypeId: null,
    testName: '',
    result: '',
    description: '',
    selectedFile: null,
    status: 'completed',
    error: '',
  });

  // Late Document Attachment Modal State
  const [attachModal, setAttachModal] = useState({
    isOpen: false,
    report: null,
    appointment: null,
    selectedFile: null,
    error: '',
    uploading: false,
  });

  // Pathology Slip View Modal State
  const [viewSlipModal, setViewSlipModal] = useState({
    isOpen: false,
    report: null,
    appointment: null,
  });

  // Calculate pipeline status for each booking
  const pipelineRows = useMemo(() => {
    return activeBookings.map((appointment) => {
      const apptStatus = (appointment.status || 'pending').toLowerCase();
      const bookingId = appointment.booking_id || appointment.appointment_id;
      const matchingReport = providerReports.find(
        (r) =>
          (r.booking_id && r.booking_id === bookingId) ||
          (r.citizen_id === appointment.citizen_id &&
            (appointment.test_type_id ? r.test_type_id === appointment.test_type_id : true))
      );

      let stage = 'awaiting';
      let stageLabel = 'Awaiting Phlebotomy';
      let badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';

      if (matchingReport && matchingReport.status === 'completed') {
        stage = 'dispatched';
        stageLabel = 'Report Dispatched';
        badgeClass = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      } else if (apptStatus === 'in_progress' || (matchingReport && matchingReport.status === 'in_progress')) {
        stage = 'analyzing';
        stageLabel = 'In Bench Analysis';
        badgeClass = 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      } else if (apptStatus === 'sample_collected' || apptStatus === 'confirmed') {
        stage = 'collected';
        stageLabel = 'Specimen Drawn';
        badgeClass = 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800';
      } else if (apptStatus === 'cancelled' || apptStatus === 'rejected' || apptStatus === 'failed') {
        stage = 'cancelled';
        stageLabel = 'Cancelled / Failed';
        badgeClass = 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      }

      const testName = appointment.test_types?.test_name || 'General Pathology Panel';
      const testCat = appointment.test_types?.test_category || 'Diagnostic Testing';
      const specimen = appointment.sample_type && appointment.specimen_tube
        ? { type: appointment.sample_type, tube: appointment.specimen_tube, color: 'cyan' }
        : getSpecimenType(testCat, testName);

      return {
        ...appointment,
        booking_id: bookingId,
        pipelineStage: stage,
        stageLabel,
        badgeClass,
        testName,
        testCat,
        specimen,
        matchingReport,
      };
    });
  }, [activeBookings, providerReports]);

  // Counts for pipeline summary cards
  const counts = useMemo(() => {
    return {
      all: pipelineRows.length,
      awaiting: pipelineRows.filter((r) => r.pipelineStage === 'awaiting').length,
      collected: pipelineRows.filter((r) => r.pipelineStage === 'collected').length,
      analyzing: pipelineRows.filter((r) => r.pipelineStage === 'analyzing').length,
      dispatched: pipelineRows.filter((r) => r.pipelineStage === 'dispatched').length,
    };
  }, [pipelineRows]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return pipelineRows.filter((row) => {
      const term = search.trim().toLowerCase();
      const citizenName = row.citizens?.name || '';
      const citizenId = row.citizen_id || '';
      const refId = row.booking_id || row.appointment_id || '';
      const testName = row.testName || '';

      const matchesSearch =
        !term ||
        citizenName.toLowerCase().includes(term) ||
        citizenId.toLowerCase().includes(term) ||
        refId.toLowerCase().includes(term) ||
        testName.toLowerCase().includes(term);

      const matchesStage = pipelineFilter === 'all' || row.pipelineStage === pipelineFilter;

      return matchesSearch && matchesStage;
    });
  }, [pipelineFilter, pipelineRows, search]);

  // Step 1: Draw Specimen -> marks 'sample_collected' and syncs diagnostic_reports to 'in_progress'
  const handleDrawSample = async (bookingId, row) => {
    try {
      await handleUpdateStatus(bookingId, 'sample_collected', null, {
        sample_type: row?.specimen?.type,
        specimen_tube: row?.specimen?.tube,
        sample_collected_at: new Date().toISOString(),
      });
      setSuccessToast(`Specimen collected and accessioned for booking ${bookingId}.`);
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err) {
      alert(err?.message || 'Failed to update sample collection status');
    }
  };

  // Step 2: Transfer to Bench Analysis -> marks 'in_progress'
  const handleTransferToBench = async (bookingId) => {
    try {
      await handleUpdateStatus(bookingId, 'in_progress', null, {
        analysis_started_at: new Date().toISOString(),
      });
      setSuccessToast(`Specimen transferred to analyzer bench for processing.`);
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err) {
      alert(err?.message || 'Failed to transfer specimen to bench');
    }
  };

  // Step 3: Open Result Release Modal
  const handleOpenReleaseModal = (row) => {
    setReleaseModal({
      isOpen: true,
      appointment: row,
      testTypeId: row.test_type_id || row.test_types?.test_id,
      testName: row.testName,
      result: '',
      description: '',
      selectedFile: null,
      status: 'completed',
      error: '',
    });
  };

  // Step 4: Submit Final Report from Modal (with optional file upload to lab_reports storage)
  const handleSubmitReleaseModal = async (e) => {
    e.preventDefault();
    if (!releaseModal.result.trim()) {
      setReleaseModal((prev) => ({ ...prev, error: 'Please enter clinical findings / result value.' }));
      return;
    }

    try {
      const bookingId = releaseModal.appointment.booking_id || releaseModal.appointment.appointment_id;
      await createReport(
        {
          citizen_id: releaseModal.appointment.citizen_id,
          booking_id: bookingId,
          appointment_id: bookingId,
          test_type_id: releaseModal.testTypeId,
          result: releaseModal.result.trim(),
          description: releaseModal.description.trim() || null,
          test_date:
            releaseModal.appointment.booking_date ||
            releaseModal.appointment.appointment_date ||
            new Date().toISOString().slice(0, 10),
          status: releaseModal.status,
        },
        releaseModal.selectedFile
      );

      const hadFile = Boolean(releaseModal.selectedFile);

      setReleaseModal({
        isOpen: false,
        appointment: null,
        testTypeId: null,
        testName: '',
        result: '',
        description: '',
        selectedFile: null,
        status: 'completed',
        error: '',
      });

      setSuccessToast(
        hadFile
          ? 'Diagnostic report and document uploaded and dispatched to citizen record.'
          : 'Diagnostic report released. You can upload or attach the PDF document later at any time.'
      );
      setTimeout(() => setSuccessToast(''), 4500);
    } catch (err) {
      setReleaseModal((prev) => ({ ...prev, error: err?.message || 'Failed to release report.' }));
    }
  };

  // Late Document Attachment Handlers
  const handleOpenAttachModal = (row) => {
    const report = row.matchingReport;
    setAttachModal({
      isOpen: true,
      report,
      appointment: row,
      selectedFile: null,
      error: '',
      uploading: false,
    });
  };

  const handleSubmitAttachModal = async (e) => {
    e.preventDefault();
    if (!attachModal.selectedFile) {
      setAttachModal((prev) => ({ ...prev, error: 'Please choose a PDF or image file to upload.' }));
      return;
    }

    setAttachModal((prev) => ({ ...prev, uploading: true, error: '' }));
    try {
      const reportId = attachModal.report?.report_id;
      const citizenId = attachModal.appointment?.citizen_id || attachModal.report?.citizen_id || 'patient';
      await uploadAndAttachReportDocument(reportId, attachModal.selectedFile, citizenId);

      setAttachModal({
        isOpen: false,
        report: null,
        appointment: null,
        selectedFile: null,
        error: '',
        uploading: false,
      });

      setSuccessToast('Official report document uploaded to storage and attached to health record.');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setAttachModal((prev) => ({
        ...prev,
        uploading: false,
        error: err?.message || 'Failed to upload report document.',
      }));
    }
  };

  // Pathology Slip Modal Handler
  const handleOpenViewSlip = (row) => {
    setViewSlipModal({
      isOpen: true,
      report: row.matchingReport,
      appointment: row,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
          Phlebotomy & Bench Pipeline
        </p>
        <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
          Diagnostic Sample Flow
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Real-world phlebotomy specimen accessioning, tube barcoding, bench analysis, and direct clinical findings release.
        </p>
      </div>

      {successToast && (
        <div className="surface-card rounded-2xl p-4 flex items-center gap-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-fade-in shadow-xs">
          <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
          <span>{successToast}</span>
        </div>
      )}

      {/* 4 Pipeline Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stage 1 */}
        <div
          onClick={() => setPipelineFilter('awaiting')}
          className={`surface-card rounded-3xl p-5 border cursor-pointer transition-all hover:-translate-y-0.5 ${
            pipelineFilter === 'awaiting' ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <i className="fa-solid fa-clock text-xl"></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Awaiting Phlebotomy</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{counts.awaiting}</h3>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Citizens queued for specimen draw</p>
        </div>

        {/* Stage 2 */}
        <div
          onClick={() => setPipelineFilter('collected')}
          className={`surface-card rounded-3xl p-5 border cursor-pointer transition-all hover:-translate-y-0.5 ${
            pipelineFilter === 'collected' ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
              <i className="fa-solid fa-vial text-xl"></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Specimens Drawn</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{counts.collected}</h3>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Accessioned in lab tubes</p>
        </div>

        {/* Stage 3 */}
        <div
          onClick={() => setPipelineFilter('analyzing')}
          className={`surface-card rounded-3xl p-5 border cursor-pointer transition-all hover:-translate-y-0.5 ${
            pipelineFilter === 'analyzing' ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/60 dark:text-teal-400">
              <i className="fa-solid fa-microscope text-xl"></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">In Bench Analysis</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{counts.analyzing}</h3>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Running on automated analyzers</p>
        </div>

        {/* Stage 4 */}
        <div
          onClick={() => setPipelineFilter('dispatched')}
          className={`surface-card rounded-3xl p-5 border cursor-pointer transition-all hover:-translate-y-0.5 ${
            pipelineFilter === 'dispatched' ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <i className="fa-solid fa-circle-check text-xl"></i>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Reports Released</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{counts.dispatched}</h3>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Findings synced to public health record</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="surface-card rounded-3xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
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
              placeholder="Search by accession barcode, patient name, Health ID, or investigation..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Specimens', count: counts.all },
              { id: 'awaiting', label: 'Awaiting Phlebotomy', count: counts.awaiting },
              { id: 'collected', label: 'Specimens Drawn', count: counts.collected },
              { id: 'analyzing', label: 'In Bench Analysis', count: counts.analyzing },
              { id: 'dispatched', label: 'Reports Released', count: counts.dispatched },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPipelineFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  pipelineFilter === tab.id
                    ? 'bg-cyan-600 dark:bg-cyan-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Specimen Pipeline Table */}
      <div className="surface-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <i className="fa-solid fa-flask text-3xl mb-2 text-cyan-500"></i>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No specimens in this workflow stage</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select another pipeline tab or check Diagnostic Test Bookings.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-left">
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Accession / Barcode
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Patient Details
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Investigation & Container
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Scheduled Time
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Pipeline Stage
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Clinical Workflow Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRows.map((row) => (
                  <tr
                    key={row.booking_id || row.appointment_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Barcode Reference */}
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <i className="fa-solid fa-barcode text-cyan-600 text-sm"></i>
                        <span>{row.booking_id || row.appointment_id}</span>
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {row.citizens?.name || row.citizen_id}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {row.citizen_id} • Ward {row.citizens?.ward_number || 'N/A'}
                        </p>
                      </div>
                    </td>

                    {/* Investigation & Specimen Container */}
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {row.testName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {row.specimen.type}
                          </span>
                          <span className="text-[10px] text-cyan-700 dark:text-cyan-400 font-mono">
                            {row.specimen.tube}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Scheduled Slot */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <p className="font-semibold">{formatDate(row.booking_date || row.appointment_date)}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {row.time_slot || '09:30 AM'}
                      </p>
                    </td>

                    {/* Pipeline Stage */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${row.badgeClass}`}>
                        {row.stageLabel}
                      </span>
                    </td>

                    {/* Step-by-Step Clinical Workflow Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {/* Stage 1: Awaiting Phlebotomy */}
                      {row.pipelineStage === 'awaiting' && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleDrawSample(row.booking_id || row.appointment_id, row)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-sm shadow-cyan-600/20 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          <i className="fa-solid fa-syringe text-xs"></i>
                          <span>Draw Specimen (Phlebotomy)</span>
                        </button>
                      )}

                      {/* Stage 2: Specimen Drawn -> Send to Bench */}
                      {row.pipelineStage === 'collected' && (
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => handleTransferToBench(row.booking_id || row.appointment_id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-sm shadow-teal-600/20 cursor-pointer disabled:opacity-50 transition-all"
                        >
                          <i className="fa-solid fa-microscope text-xs"></i>
                          <span>Transfer to Bench Analyzer</span>
                        </button>
                      )}

                      {/* Stage 3: In Bench Analysis -> Enter Results & Release */}
                      {row.pipelineStage === 'analyzing' && (
                        <button
                          type="button"
                          onClick={() => handleOpenReleaseModal(row)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm shadow-blue-600/25 cursor-pointer transition-all"
                        >
                          <i className="fa-solid fa-square-poll-vertical text-xs"></i>
                          <span>Enter Results & Release</span>
                        </button>
                      )}

                      {/* Stage 4: Dispatched / Completed */}
                      {row.pipelineStage === 'dispatched' && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Button 1: View Slip */}
                          <button
                            type="button"
                            onClick={() => handleOpenViewSlip(row)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800/80 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors cursor-pointer"
                            title="View Pathology Release Slip"
                          >
                            <i className="fa-solid fa-file-invoice text-xs"></i>
                            <span>View Slip</span>
                          </button>

                          {/* Button 2: View PDF or Upload PDF */}
                          {row.matchingReport?.report_file_url ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openReportDocument(row.matchingReport.report_file_url)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/80 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                                title="Open attached official PDF in new tab"
                              >
                                <i className="fa-solid fa-file-pdf text-xs text-rose-600"></i>
                                <span>View PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenAttachModal(row)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 transition-colors cursor-pointer"
                                title="Update or replace attached PDF"
                              >
                                <i className="fa-solid fa-arrow-up-from-bracket text-xs"></i>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenAttachModal(row)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                              title="Attach official PDF report document to this completed investigation"
                            >
                              <i className="fa-solid fa-cloud-arrow-up text-xs text-amber-600"></i>
                              <span>+ Upload PDF</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Cancelled / Failed */}
                      {row.pipelineStage === 'cancelled' && (
                        <span className="text-xs text-rose-500 font-semibold italic">Terminated</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QUICK REPORT RELEASE MODAL IN SAMPLE FLOW */}
      <Modal
        isOpen={releaseModal.isOpen}
        onClose={() => setReleaseModal({ ...releaseModal, isOpen: false })}
        title="Release Diagnostic Investigation Findings"
        subtitle={`Patient: ${releaseModal.appointment?.citizens?.name || releaseModal.appointment?.citizen_id || ''} • ${releaseModal.testName}`}
        icon="fa-file-circle-check"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmitReleaseModal} className="space-y-4">
          {releaseModal.error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm shrink-0"></i>
              <span>{releaseModal.error}</span>
            </div>
          )}

          {/* Test & Patient Readonly Overview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Investigation</p>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-0.5">
                {releaseModal.testName}
              </h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Specimen</p>
              <p className="font-mono text-xs font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                {releaseModal.appointment?.booking_id || releaseModal.appointment?.appointment_id}
              </p>
            </div>
          </div>

          {/* Key Findings / Result */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-square-poll-vertical text-cyan-600 text-xs"></i>
              <span>Clinical Finding / Result Value <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              value={releaseModal.result}
              onChange={(e) => setReleaseModal({ ...releaseModal, result: e.target.value })}
              placeholder="e.g. Hemoglobin: 14.1 g/dL (Normal Range) or Blood Glucose Fasting: 92 mg/dL"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              required
            />
          </div>

          {/* Clinical Interpretation / Remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-notes-medical text-cyan-600 text-xs"></i>
              <span>Pathologist Impression / Observations</span>
              <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              rows="3"
              value={releaseModal.description}
              onChange={(e) => setReleaseModal({ ...releaseModal, description: e.target.value })}
              placeholder="Clinical interpretation, reference interval notes, or recommendation for follow-up..."
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

            {!releaseModal.selectedFile ? (
              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50/20 dark:hover:bg-cyan-950/20 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group">
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        setReleaseModal((prev) => ({
                          ...prev,
                          error: 'File size exceeds 10 MB limit. Please select a smaller file.',
                        }));
                        return;
                      }
                      setReleaseModal((prev) => ({ ...prev, selectedFile: file, error: '' }));
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
                    <i className={releaseModal.selectedFile.type.includes('pdf') ? 'fa-solid fa-file-pdf text-lg' : 'fa-solid fa-file-image text-lg'}></i>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {releaseModal.selectedFile.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatFileSize(releaseModal.selectedFile.size)} • Ready for Supabase storage
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReleaseModal((prev) => ({ ...prev, selectedFile: null }))}
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
              onClick={() => setReleaseModal({ ...releaseModal, isOpen: false })}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Publishing & Uploading...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-xs"></i>
                  <span>Finalize & Release to Citizen Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* LATE ATTACHMENT MODAL: ATTACH PDF / DOCUMENT LATER */}
      <Modal
        isOpen={attachModal.isOpen}
        onClose={() => setAttachModal({ ...attachModal, isOpen: false })}
        title="Attach Diagnostic Report Document"
        subtitle={`Patient: ${attachModal.appointment?.citizens?.name || attachModal.report?.citizens?.name || attachModal.appointment?.citizen_id || ''} • ${attachModal.appointment?.testName || attachModal.report?.test_types?.test_name || 'Diagnostic Report'}`}
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
              Investigation: {attachModal.appointment?.testName || attachModal.report?.test_types?.test_name || 'Laboratory Test'}
            </p>
            <p className="text-slate-500 dark:text-slate-400">
              Citizen ID: <span className="font-mono font-bold text-cyan-600">{attachModal.appointment?.citizen_id || attachModal.report?.citizen_id}</span>
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

      {/* VIEW DIGITAL PATHOLOGY SLIP MODAL */}
      <Modal
        isOpen={viewSlipModal.isOpen}
        onClose={() => setViewSlipModal({ ...viewSlipModal, isOpen: false })}
        title="Diagnostic Pathology Investigation Slip"
        subtitle={`Booking / Accession: ${viewSlipModal.appointment?.booking_id || viewSlipModal.appointment?.appointment_id || ''}`}
        icon="fa-file-invoice"
        maxWidth="max-w-2xl"
      >
        {viewSlipModal.appointment && (
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
                  {viewSlipModal.appointment?.citizens?.name || viewSlipModal.appointment?.citizen_id}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Citizen Health ID</span>
                <p className="font-mono font-bold mt-0.5">{viewSlipModal.appointment?.citizen_id}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Specimen Accession</span>
                <p className="font-mono font-bold mt-0.5 text-cyan-600">
                  {viewSlipModal.appointment?.booking_id || viewSlipModal.appointment?.appointment_id}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Test Investigation</span>
                <p className="font-bold mt-0.5 text-cyan-600 dark:text-cyan-400">
                  {viewSlipModal.appointment?.testName || 'Diagnostic Investigation'}
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Container / Specimen</span>
                <p className="font-semibold mt-0.5">
                  {viewSlipModal.appointment?.specimen?.type} ({viewSlipModal.appointment?.specimen?.tube})
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Investigation Date</span>
                <p className="font-semibold mt-0.5">
                  {formatDate(viewSlipModal.report?.test_date || viewSlipModal.appointment?.booking_date || viewSlipModal.appointment?.appointment_date)}
                </p>
              </div>
            </div>

            {/* Clinical Result Findings */}
            <div className="p-4 rounded-2xl border-2 border-cyan-500/30 bg-white dark:bg-slate-900 shadow-sm space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                Diagnostic Findings & Interpretation
              </span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white">
                {viewSlipModal.report?.result || 'Clinical finding recorded in laboratory system.'}
              </p>
              {viewSlipModal.report?.description && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Pathologist Clinical Remarks
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {viewSlipModal.report.description}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              {viewSlipModal.report?.report_file_url ? (
                <button
                  type="button"
                  onClick={() => openReportDocument(viewSlipModal.report.report_file_url)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                >
                  <i className="fa-solid fa-file-pdf"></i>
                  <span>Open Attached PDF</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const row = viewSlipModal.appointment;
                    setViewSlipModal({ isOpen: false, report: null, appointment: null });
                    handleOpenAttachModal(row);
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
    </div>
  );
};

export default SampleCollection;
