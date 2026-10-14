import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const DashboardCard = ({ title, value, icon, tone, link, helper }) => (
  <Link
    to={link}
    className="rounded-[1.5rem] p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm block group"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-soft">{title}</p>
        <p className="mt-1.5 sm:mt-2 text-2xl sm:text-3xl font-extrabold text-main group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
          {value}
        </p>
        <p className="mt-1 text-xs text-faint">{helper}</p>
      </div>
      <div
        className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl shadow-inner shrink-0"
        style={{ background: tone }}
      >
        <i className={`fa-solid ${icon} text-lg sm:text-xl text-cyan-600 dark:text-cyan-300`}></i>
      </div>
    </div>
  </Link>
);

const Dashboard = () => {
  const {
    currentProvider,
    bookings,
    appointments,
    providerReports,
    providerCatalog,
    providerNotifications,
    diseaseCases,
    error,
    loading,
    hasSupabaseEnv,
  } = useAppData();

  const activeBookings = bookings || appointments || [];

  const pendingAppointments = useMemo(
    () => activeBookings.filter((item) => String(item.status || '').toLowerCase() === 'pending'),
    [activeBookings]
  );

  const completedAppointments = useMemo(
    () => activeBookings.filter((item) => ['completed', 'confirmed'].includes(String(item.status || '').toLowerCase())),
    [activeBookings]
  );

  const highRiskCases = useMemo(
    () => diseaseCases.filter((item) => String(item.severity || '').toLowerCase() === 'high'),
    [diseaseCases]
  );

  const recentAppointments = useMemo(() => activeBookings.slice(0, 5), [activeBookings]);
  const recentReports = useMemo(() => providerReports.slice(0, 5), [providerReports]);

  const providerName = currentProvider?.name || 'Diagnostic Laboratory';
  const providerWard = currentProvider?.ward_id ? `Ward ${currentProvider.ward_id}` : 'Ward Solapur';
  const providerLicense = currentProvider?.license || 'MH-LAB-ACTIVE';

  return (
    <div className="space-y-6">
      {/* Laboratory Identity Banner (matching Pharmacy style) */}
      <div className="rounded-[2rem] p-5 sm:p-6 md:p-8 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-col gap-4 lab-banner-flex sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-600 to-teal-600 dark:from-cyan-500 dark:to-teal-600 text-white font-bold text-2xl shadow-lg shadow-cyan-600/25 shrink-0">
              <i className="fa-solid fa-flask-vial text-xl sm:text-2xl text-white"></i>
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <h2 className="text-xl sm:text-2xl font-bold text-main">{providerName}</h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Verified Laboratory
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-soft">
                License: <span className="font-mono text-main font-semibold">{providerLicense}</span> •{' '}
                Operating Ward:{' '}
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold">{providerWard}</span> • Facility ID:{' '}
                <span className="font-mono text-faint">{currentProvider?.provider_id || 'PROV-LAB'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Test Catalog
              </p>
              <p className="mt-0.5 text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-400">
                {providerCatalog.length} Investigations
              </p>
            </div>
            <div className="rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Data Connection
              </p>
              <p className="mt-0.5 font-bold uppercase tracking-[0.15em] text-teal-600 dark:text-teal-400 text-xs">
                {hasSupabaseEnv ? '● Live Supabase' : '● Local Store'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {!hasSupabaseEnv && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-bold">
          Database connection configuration is missing. Configure Supabase environment variables.
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold">
          {error}
        </div>
      )}

      {/* 6 KPI Cards in 3-column / 2-row grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 lab-dashboard-grid gap-4 md:gap-5">
        <DashboardCard
          title="Patient Bookings"
          value={loading ? '...' : appointments.length}
          helper="Citizens scheduled for diagnostic intake"
          icon="fa-calendar-check"
          tone="rgba(8, 145, 178, 0.12)"
          link="/bookings"
        />
        <DashboardCard
          title="Pending Phlebotomy"
          value={loading ? '...' : pendingAppointments.length}
          helper="Citizens awaiting specimen intake"
          icon="fa-flask-vial"
          tone="rgba(217, 119, 6, 0.14)"
          link="/collection"
        />
        <DashboardCard
          title="Diagnostic Reports"
          value={loading ? '...' : providerReports.length}
          helper="Digital pathology reports released"
          icon="fa-file-waveform"
          tone="rgba(16, 185, 129, 0.14)"
          link="/reports"
        />
        <DashboardCard
          title="Configured Investigations"
          value={loading ? '...' : providerCatalog.length}
          helper="Active laboratory test catalog offerings"
          icon="fa-vials"
          tone="rgba(99, 102, 241, 0.14)"
          link="/catalog"
        />
        <DashboardCard
          title="SMC Health Alerts"
          value={loading ? '...' : providerNotifications.length}
          helper="Solapur Municipal Corporation advisories"
          icon="fa-bell"
          tone="rgba(14, 165, 233, 0.14)"
          link="/notifications"
        />
        <DashboardCard
          title="Surveillance Watchlist"
          value={loading ? '...' : highRiskCases.length}
          helper="Epidemic alerts in Solapur municipal area"
          icon="fa-triangle-exclamation"
          tone="rgba(239, 68, 68, 0.14)"
          link="/surveillance"
        />
      </div>

      {/* Quick Action Operational Tables Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Phlebotomy Intake Queue */}
        <div className="rounded-[1.75rem] p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-main">Phlebotomy Intake Queue</h3>
                <p className="text-xs text-soft">Upcoming patient diagnostic test appointments</p>
              </div>
              <Link to="/bookings" className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                View All Bookings →
              </Link>
            </div>

            <div className="space-y-3">
              {recentAppointments.length === 0 ? (
                <div className="py-8 text-center text-xs text-soft">
                  <i className="fa-solid fa-calendar-check text-2xl text-cyan-500/60 mb-2 block"></i>
                  No diagnostic test bookings scheduled in your queue.
                </div>
              ) : (
                recentAppointments.map((appointment) => (
                  <div
                    key={appointment.booking_id || appointment.appointment_id}
                    className="surface-muted flex items-center justify-between rounded-2xl p-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-main text-sm">
                        {appointment.citizens?.name || appointment.citizen_id || 'Patient'}
                      </p>
                      <p className="text-xs text-faint">
                        Ref: <span className="font-mono">{appointment.booking_id || appointment.appointment_id}</span> •{' '}
                        {formatDate(appointment.booking_date || appointment.appointment_date)} • Slot: {appointment.time_slot || 'Morning'}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border ${
                          appointment.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : appointment.status === 'completed'
                            ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {appointment.status || 'pending'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-soft">
            <span>Need to collect blood or tissue specimens?</span>
            <Link to="/collection" className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
              Go to Sample Collection →
            </Link>
          </div>
        </div>

        {/* Latest Diagnostic Releases */}
        <div className="rounded-[1.75rem] p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-main">Latest Diagnostic Releases</h3>
                <p className="text-xs text-soft">Pathology results submitted to municipal health network</p>
              </div>
              <Link to="/reports" className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold hover:underline">
                Upload New Report +
              </Link>
            </div>

            <div className="space-y-3">
              {recentReports.length === 0 ? (
                <div className="py-8 text-center text-xs text-soft">
                  <i className="fa-solid fa-file-medical text-2xl text-cyan-500/60 mb-2 block"></i>
                  No reports released yet by this facility.
                  <div className="mt-3">
                    <Link
                      to="/reports"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 shadow-xs hover:from-cyan-700 hover:to-teal-700"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      <span>Create First Report</span>
                    </Link>
                  </div>
                </div>
              ) : (
                recentReports.map((report) => (
                  <div
                    key={report.report_id}
                    className="surface-muted flex items-center justify-between rounded-2xl p-3 hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-main text-sm">
                        {report.test_types?.test_name || `Investigation #${report.test_type_id}`}
                      </p>
                      <p className="text-xs text-faint">
                        Patient:{' '}
                        <span className="font-medium text-main">{report.citizens?.name || report.citizen_id}</span> •{' '}
                        {formatDate(report.test_date || report.uploaded_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                        {report.result || 'Normal'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-soft">
            <span>Historical pathology reports archive</span>
            <Link to="/history" className="font-bold text-cyan-600 dark:text-cyan-400 hover:underline">
              View Complete Archive →
            </Link>
          </div>
        </div>
      </div>

      {/* Fast Operational Shortcuts */}
      <div className="rounded-[1.75rem] p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <h3 className="font-bold text-main mb-4">Laboratory Workflow Operations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/collection"
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 transition-all flex flex-col items-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-flask-vial text-lg"></i>
            </div>
            <p className="text-xs font-bold text-main">Sample Flow</p>
            <p className="text-[11px] text-faint mt-0.5">Collect & track samples</p>
          </Link>

          <Link
            to="/reports"
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-teal-500 hover:bg-teal-50/40 dark:hover:bg-teal-950/30 transition-all flex flex-col items-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-file-medical text-lg"></i>
            </div>
            <p className="text-xs font-bold text-main">Release Report</p>
            <p className="text-[11px] text-faint mt-0.5">Upload verified results</p>
          </Link>

          <Link
            to="/catalog"
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-all flex flex-col items-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-vials text-lg"></i>
            </div>
            <p className="text-xs font-bold text-main">Test Catalog</p>
            <p className="text-[11px] text-faint mt-0.5">Pricing & investigation list</p>
          </Link>

          <Link
            to="/surveillance"
            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/30 transition-all flex flex-col items-center text-center group"
          >
            <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-shield-virus text-lg"></i>
            </div>
            <p className="text-xs font-bold text-main">Surveillance</p>
            <p className="text-[11px] text-faint mt-0.5">Epidemic disease alerts</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
