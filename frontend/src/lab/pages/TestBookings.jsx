import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const generateBookingRef = () => {
  return `LBK-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;
};

const TIME_SLOTS = [
  '08:00 AM - 08:30 AM',
  '08:30 AM - 09:00 AM',
  '09:00 AM - 09:30 AM',
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM',
  '04:00 PM - 04:30 PM',
];

const REJECTION_PRESETS = [
  'Patient did not follow fasting requirements (10-12h)',
  'Specialized specimen tube / reagent currently out of stock',
  'Patient requested cancellation / schedule conflict',
  'Duplicate booking for identical investigation',
  'Patient failed to report to phlebotomy station',
];

const initialBookingForm = {
  booking_id: '',
  appointment_id: '',
  citizen_id: '',
  test_type_id: '',
  booking_date: new Date().toISOString().slice(0, 10),
  appointment_date: new Date().toISOString().slice(0, 10),
  time_slot: '09:30 AM - 10:00 AM',
  status: 'booked',
  description: '',
  notes: '',
  price: 0,
};

const TestBookings = () => {
  const {
    bookings,
    appointments,
    providerCatalog,
    updateBookingStatus,
    updateAppointmentStatus,
    createBooking,
    createAppointment,
    findCitizenById,
    saving,
  } = useAppData();

  const activeBookings = bookings || appointments || [];
  const handleUpdateStatus = updateBookingStatus || updateAppointmentStatus;
  const handleCreateBooking = createBooking || createAppointment;

  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Manual Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [citizenInput, setCitizenInput] = useState('');
  const [verifiedCitizen, setVerifiedCitizen] = useState(null);
  const [isVerifyingCitizen, setIsVerifyingCitizen] = useState(false);
  const [citizenError, setCitizenError] = useState('');

  // Test Type Selection / Dynamic Search State
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Reason Modal State (for Cancel / Reject / Fail)
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    appointment: null,
    targetStatus: '',
    title: '',
    reason: '',
  });

  // Open Create Booking Modal
  const handleOpenCreateModal = () => {
    const newRef = generateBookingRef();
    const today = new Date().toISOString().slice(0, 10);
    setBookingForm({
      ...initialBookingForm,
      booking_id: newRef,
      appointment_id: newRef,
      booking_date: today,
      appointment_date: today,
    });
    setCitizenInput('');
    setVerifiedCitizen(null);
    setCitizenError('');
    setTestSearchQuery('');
    setSelectedCatalogItem(null);
    setIsTestDropdownOpen(false);
    setFormError('');
    setIsBookModalOpen(true);
  };

  // Verify Citizen on blur or button click (NO predictive autocomplete while typing)
  const handleVerifyCitizen = async (idToVerify) => {
    const cleanId = (idToVerify || citizenInput).trim();
    if (!cleanId) {
      setCitizenError('Please enter a Citizen Health ID (e.g. SMC-2025-000010)');
      setVerifiedCitizen(null);
      return;
    }

    setIsVerifyingCitizen(true);
    setCitizenError('');
    try {
      const found = await findCitizenById(cleanId);
      if (found) {
        setVerifiedCitizen(found);
        setBookingForm((prev) => ({ ...prev, citizen_id: found.citizen_id }));
        setCitizenError('');
      } else {
        setVerifiedCitizen(null);
        setBookingForm((prev) => ({ ...prev, citizen_id: '' }));
        setCitizenError(`Citizen ID "${cleanId}" not found in SMC registry. Please verify the Health ID.`);
      }
    } catch (err) {
      setCitizenError('Error verifying Citizen ID. Please try again.');
    } finally {
      setIsVerifyingCitizen(false);
    }
  };

  // Filter Catalog Tests for Search Dropdown
  const matchingCatalogTests = useMemo(() => {
    const q = testSearchQuery.trim().toLowerCase();
    if (!q) return providerCatalog;
    return providerCatalog.filter((item) => {
      const testName = item.test_types?.test_name || '';
      const cat = item.test_types?.test_category || '';
      return testName.toLowerCase().includes(q) || cat.toLowerCase().includes(q);
    });
  }, [providerCatalog, testSearchQuery]);

  const handleSelectTest = (catalogItem) => {
    setSelectedCatalogItem(catalogItem);
    setBookingForm((prev) => ({
      ...prev,
      test_type_id: catalogItem.test_type_id || catalogItem.test_types?.test_id,
      price: Number(catalogItem.price || 0),
    }));
    setTestSearchQuery(catalogItem.test_types?.test_name || '');
    setIsTestDropdownOpen(false);
    setFormError('');
  };

  // Submit Manual Booking
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!verifiedCitizen || !bookingForm.citizen_id) {
      setFormError('Please enter and verify a valid Citizen Health ID.');
      return;
    }

    if (!bookingForm.test_type_id) {
      setFormError('Please select a test investigation offered in your laboratory catalog.');
      return;
    }

    try {
      await handleCreateBooking(bookingForm);
      setIsBookModalOpen(false);
      setSuccessToast(`Test booking ${bookingForm.booking_id || bookingForm.appointment_id} scheduled successfully.`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err?.message || 'Failed to create test booking.');
    }
  };

  // Open Reason Modal for Reject or Cancel
  const handleOpenActionModal = (appointment, targetStatus, title) => {
    setActionModal({
      isOpen: true,
      appointment,
      targetStatus,
      title,
      reason: '',
    });
  };

  // Confirm Status Action with Reason
  const handleConfirmActionWithReason = async () => {
    if (!actionModal.appointment) return;
    try {
      const targetId = actionModal.appointment.booking_id || actionModal.appointment.appointment_id;
      await handleUpdateStatus(
        targetId,
        actionModal.targetStatus,
        actionModal.reason.trim() || null
      );
      setActionModal({ isOpen: false, appointment: null, targetStatus: '', title: '', reason: '' });
      setSuccessToast(`Booking status updated to ${actionModal.targetStatus} successfully.`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      alert(err?.message || 'Error updating booking status');
    }
  };

  // Filter Bookings for Main Table
  const filteredAppointments = useMemo(() => {
    return activeBookings.filter((appointment) => {
      const citizenName = appointment.citizens?.name || '';
      const citizenId = appointment.citizen_id || '';
      const apptId = appointment.booking_id || appointment.appointment_id || '';
      const testName = appointment.test_types?.test_name || '';
      const term = search.trim().toLowerCase();

      const matchesSearch =
        !term ||
        citizenName.toLowerCase().includes(term) ||
        citizenId.toLowerCase().includes(term) ||
        apptId.toLowerCase().includes(term) ||
        testName.toLowerCase().includes(term);

      const status = (appointment.status || 'pending').toLowerCase();
      let matchesStatus = true;
      if (filterStatus === 'pending') {
        matchesStatus = status === 'pending';
      } else if (filterStatus === 'booked') {
        matchesStatus = status === 'booked' || status === 'confirmed';
      } else if (filterStatus === 'sample_collected') {
        matchesStatus = status === 'sample_collected' || status === 'in_progress';
      } else if (filterStatus === 'completed') {
        matchesStatus = status === 'completed';
      } else if (filterStatus === 'cancelled') {
        matchesStatus = status === 'cancelled' || status === 'rejected' || status === 'failed';
      }

      return matchesSearch && matchesStatus;
    });
  }, [activeBookings, filterStatus, search]);

  const counts = useMemo(() => {
    return {
      all: activeBookings.length,
      pending: activeBookings.filter((a) => (a.status || 'pending') === 'pending').length,
      booked: activeBookings.filter((a) => ['booked', 'confirmed'].includes(a.status)).length,
      collected: activeBookings.filter((a) => ['sample_collected', 'in_progress'].includes(a.status)).length,
      completed: activeBookings.filter((a) => a.status === 'completed').length,
      cancelled: activeBookings.filter((a) => ['cancelled', 'rejected', 'failed'].includes(a.status)).length,
    };
  }, [activeBookings]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Laboratory Patient Queue
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Diagnostic Test Bookings
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Citizen phlebotomy intake queue. Receive app bookings or schedule manual citizen walk-in test requests.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/25 cursor-pointer shrink-0 transition-all"
        >
          <i className="fa-solid fa-plus text-xs"></i>
          <span>New Manual Booking</span>
        </button>
      </div>

      {successToast && (
        <div className="surface-card rounded-2xl p-4 flex items-center gap-3 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold animate-fade-in shadow-xs">
          <i className="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
          <span>{successToast}</span>
        </div>
      )}

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
              placeholder="Search by patient name, citizen Health ID, test type, or booking reference..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All', count: counts.all },
              { id: 'pending', label: 'Pending Requests', count: counts.pending },
              { id: 'booked', label: 'Booked / Confirmed', count: counts.booked },
              { id: 'sample_collected', label: 'Samples Drawn', count: counts.collected },
              { id: 'completed', label: 'Completed', count: counts.completed },
              { id: 'cancelled', label: 'Cancelled / Rejected', count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === tab.id
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

      {/* Bookings Table */}
      <div className="surface-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <i className="fa-solid fa-calendar-xmark text-3xl mb-2 text-cyan-500"></i>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No test appointments found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {search || filterStatus !== 'all'
                ? 'Try clearing your search query or filter.'
                : 'Click "New Manual Booking" to register a patient investigation walk-in.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-left">
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Booking Reference
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Patient Details
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Test Investigation
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Date & Slot
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Remarks / Reason
                  </th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Phlebotomy Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAppointments.map((appointment) => {
                  const status = (appointment.status || 'pending').toLowerCase();
                  const testName = appointment.test_types?.test_name || 'Diagnostic Blood Profile';
                  const testCat = appointment.test_types?.test_category || 'General Pathology';

                  return (
                    <tr
                      key={appointment.booking_id || appointment.appointment_id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Booking Reference */}
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <i className="fa-solid fa-receipt text-cyan-600 text-[11px]"></i>
                          <span>{appointment.booking_id || appointment.appointment_id}</span>
                        </div>
                      </td>

                      {/* Patient Details */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-sm">
                            {appointment.citizens?.name || appointment.citizen_id}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {appointment.citizen_id} • {appointment.citizens?.phone || 'No phone'}
                          </p>
                          <p className="text-[11px] text-faint">
                            Ward {appointment.citizens?.ward_number || 'Solapur'}{' '}
                            {appointment.citizens?.gender ? `• ${appointment.citizens.gender}` : ''}
                          </p>
                        </div>
                      </td>

                      {/* TEST INVESTIGATION COLUMN */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                            {testName}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                            {testCat}
                          </span>
                        </div>
                      </td>

                      {/* Date & Slot */}
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        <p className="font-semibold">{formatDate(appointment.booking_date || appointment.appointment_date)}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {appointment.time_slot || '09:30 AM'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${
                            status === 'confirmed' || status === 'booked'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                              : status === 'sample_collected' || status === 'in_progress'
                              ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                              : status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : status === 'cancelled' || status === 'rejected' || status === 'failed'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {status === 'booked' ? 'Booked' : status}
                        </span>
                      </td>

                      {/* Remarks / Reason */}
                      <td className="py-3.5 px-4 text-xs max-w-xs">
                        {appointment.rejection_reason || appointment.notes || appointment.description ? (
                          <p className="text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                            "{appointment.rejection_reason || appointment.notes || appointment.description}"
                          </p>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-normal">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Case 1: Pending Citizen Booking Request */}
                          {status === 'pending' && (
                            <>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => handleUpdateStatus(appointment.booking_id || appointment.appointment_id, 'booked')}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-sm shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5"
                                title="Accept citizen request and schedule test booking"
                              >
                                <i className="fa-solid fa-check text-xs"></i>
                                <span>Accept</span>
                              </button>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleOpenActionModal(
                                    appointment,
                                    'rejected',
                                    'Reject Citizen Booking Request'
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors border border-rose-200 dark:border-rose-800 cursor-pointer disabled:opacity-50"
                                title="Reject this test request with reason"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Case 2: Once Booked or Confirmed: cannot reject, can cancel or mark failed or proceed to sample collection */}
                          {(status === 'booked' || status === 'confirmed') && (
                            <>
                              <Link
                                to="/collection"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-sm shadow-cyan-600/20 transition-all"
                              >
                                <i className="fa-solid fa-flask-vial text-xs"></i>
                                <span>Draw Sample</span>
                              </Link>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleOpenActionModal(
                                    appointment,
                                    'cancelled',
                                    'Cancel Scheduled Test Booking'
                                  )
                                }
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                                title="Cancel appointment with recorded reason"
                              >
                                Cancel
                              </button>

                              <button
                                type="button"
                                disabled={saving}
                                onClick={() =>
                                  handleOpenActionModal(
                                    appointment,
                                    'failed',
                                    'Mark Phlebotomy Intake Failed'
                                  )
                                }
                                className="px-2 py-1.5 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                                title="Mark as failed (e.g. no-show, collapsed vein)"
                              >
                                Failed
                              </button>
                            </>
                          )}

                          {/* Case 3: Sample Collected / In Progress */}
                          {(status === 'sample_collected' || status === 'in_progress') && (
                            <Link
                              to="/collection"
                              className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                            >
                              <i className="fa-solid fa-microscope text-xs"></i>
                              <span>In Sample Pipeline →</span>
                            </Link>
                          )}

                          {/* Case 4: Completed */}
                          {status === 'completed' && (
                            <Link
                              to="/reports"
                              className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                            >
                              <i className="fa-solid fa-circle-check text-xs"></i>
                              <span>View Report →</span>
                            </Link>
                          )}

                          {/* Case 5: Cancelled / Rejected */}
                          {(status === 'cancelled' || status === 'rejected' || status === 'failed') && (
                            <span className="text-xs text-rose-500 font-semibold italic">Closed</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: NEW MANUAL TEST BOOKING */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Manual Test Booking Intake"
        subtitle="Schedule a laboratory investigation for an SMC citizen"
        icon="fa-calendar-plus"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5">
              <i className="fa-solid fa-circle-exclamation text-rose-500 text-sm shrink-0"></i>
              <span>{formError}</span>
            </div>
          )}

          {/* Booking Reference (Readonly, Guaranteed Authentic Format) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-receipt text-cyan-600 text-xs"></i>
                <span>Generated Booking Reference</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Original Database Reference</span>
            </label>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={bookingForm.booking_id || bookingForm.appointment_id}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-mono font-bold select-all outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs flex items-center gap-1">
                <i className="fa-solid fa-lock text-[10px]"></i>
                <span>System Verified</span>
              </span>
            </div>
          </div>

          {/* Citizen Health ID (NO predictive autocomplete dropdown while typing, checks on button/blur) */}
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
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-mono font-bold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all uppercase"
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
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-magnifying-glass text-xs"></i>
                    <span>Verify Citizen</span>
                  </>
                )}
              </button>
            </div>

            {citizenError && (
              <p className="text-xs font-bold text-rose-500 dark:text-rose-400 flex items-center gap-1 mt-1">
                <i className="fa-solid fa-circle-xmark"></i>
                <span>{citizenError}</span>
              </p>
            )}

            {/* Verified Citizen Details Card */}
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
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300">
                      Phone: {verifiedCitizen.phone || 'N/A'}
                    </span>
                    {verifiedCitizen.blood_group && (
                      <p className="text-[10px] font-mono font-bold text-rose-500">
                        Blood: {verifiedCitizen.blood_group}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Select Test Type from Laboratory Catalog with Dynamic Filter */}
          <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-vial text-cyan-600 text-xs"></i>
                <span>Select Test Type <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">
                Available in Your Catalog: {providerCatalog.length}
              </span>
            </label>

            <div className="relative">
              <input
                type="text"
                value={testSearchQuery}
                onFocus={() => setIsTestDropdownOpen(true)}
                onChange={(e) => {
                  setTestSearchQuery(e.target.value);
                  setIsTestDropdownOpen(true);
                  if (selectedCatalogItem && e.target.value !== selectedCatalogItem.test_types?.test_name) {
                    setSelectedCatalogItem(null);
                    setBookingForm((prev) => ({ ...prev, test_type_id: '' }));
                  }
                }}
                placeholder="Type test name to search laboratory catalog..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setIsTestDropdownOpen((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                <i className={`fa-solid fa-chevron-${isTestDropdownOpen ? 'up' : 'down'}`}></i>
              </button>
            </div>

            {/* Dropdown Options List */}
            {isTestDropdownOpen && (
              <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl divide-y divide-slate-100 dark:divide-slate-800 animate-fade-in">
                {matchingCatalogTests.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5">
                      <i className="fa-solid fa-triangle-exclamation"></i>
                      <span>Test type not present in your laboratory catalog.</span>
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      This investigation is not offered by your lab. Please select from your active catalog or add it via Test Catalog.
                    </p>
                  </div>
                ) : (
                  matchingCatalogTests.map((item) => (
                    <button
                      key={item.lab_test_id}
                      type="button"
                      onClick={() => handleSelectTest(item)}
                      className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {item.test_types?.test_name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {item.test_types?.test_category || 'Diagnostic'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                          ₹{Number(item.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Date and Time Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-calendar text-cyan-600 text-xs"></i>
                <span>Appointment Date <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="date"
                value={bookingForm.booking_date || bookingForm.appointment_date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setBookingForm({ ...bookingForm, booking_date: e.target.value, appointment_date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <i className="fa-solid fa-clock text-cyan-600 text-xs"></i>
                <span>Time Slot <span className="text-rose-500">*</span></span>
              </label>
              <select
                value={bookingForm.time_slot}
                onChange={(e) => setBookingForm({ ...bookingForm, time_slot: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-semibold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none cursor-pointer transition-all"
                required
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Field: Default is 'booked', option is 'pending' only */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <i className="fa-solid fa-list-check text-cyan-600 text-xs"></i>
                <span>Initial Booking Status</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Default: booked</span>
            </label>
            <select
              value={bookingForm.status}
              onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-bold focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none cursor-pointer transition-all"
            >
              <option value="booked">booked (Confirmed for Phlebotomy)</option>
              <option value="pending">pending (Citizen Awaiting Queue)</option>
            </select>
          </div>

          {/* Clinical Instructions / Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <i className="fa-solid fa-comment-medical text-cyan-600 text-xs"></i>
              <span>Special Preparation / Phlebotomy Remarks</span>
              <span className="text-[11px] font-normal text-slate-400">(Optional)</span>
            </label>
            <textarea
              value={bookingForm.description}
              onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
              rows="2"
              placeholder="e.g. 10 hours overnight fasting required, early morning urine sample..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-medium focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Modal Buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !verifiedCitizen || !bookingForm.test_type_id}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Saving Booking...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-calendar-check text-xs"></i>
                  <span>Confirm Test Booking</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: REASON MODAL (FOR CANCEL / REJECT / FAIL) */}
      <Modal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ ...actionModal, isOpen: false })}
        title={actionModal.title || 'Specify Reason'}
        subtitle={`Booking: ${actionModal.appointment?.appointment_id || ''} • Patient: ${actionModal.appointment?.citizens?.name || actionModal.appointment?.citizen_id || ''}`}
        icon="fa-circle-exclamation"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Please enter the reason for this action. This will be stored into the booking record description and visible in the public health system.
          </p>

          {/* Preset Reason Pills */}
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Common Quick Reasons
            </p>
            <div className="flex flex-wrap gap-1.5">
              {REJECTION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setActionModal({ ...actionModal, reason: preset })}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-700 transition-colors border border-slate-200 dark:border-slate-700 text-left"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Reason Text Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Reason / Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="3"
              value={actionModal.reason}
              onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
              placeholder="Provide reason for rejection or cancellation..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs md:text-sm font-medium focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none resize-none transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setActionModal({ ...actionModal, isOpen: false })}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Go Back
            </button>
            <button
              type="button"
              disabled={saving || !actionModal.reason.trim()}
              onClick={handleConfirmActionWithReason}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-rose-600/30"
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check text-xs"></i>
                  <span>Confirm Status Update</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TestBookings;
