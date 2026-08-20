import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { formatDate, formatDateTime } from '../lib/format';

const Dashboard = () => {
  const { currentProvider, appointments, providerReports, providerNotifications, diseaseCases, error, hasSupabaseEnv } = useAppData();

  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaysAppointments = appointments.filter((item) => item.appointment_date === today);
    const todaysReports = providerReports.filter((item) => item.test_date === today);
    const pendingAppointments = appointments.filter((item) => item.status === 'pending');
    const highRiskCases = diseaseCases.filter((item) => item.severity?.toLowerCase() === 'high');

    return [
      { label: 'Tests Today', value: todaysAppointments.length, icon: 'fa-vial-circle-check', helper: 'Scheduled diagnostics' },
      { label: 'Pending Bookings', value: pendingAppointments.length, icon: 'fa-calendar-day', helper: 'Need action' },
      { label: 'Reports Uploaded', value: providerReports.length, icon: 'fa-file-waveform', helper: 'Provider reports' },
      { label: 'Active Alerts', value: providerNotifications.length, icon: 'fa-bell', helper: 'Role and ward alerts' },
      { label: 'High Risk Cases', value: highRiskCases.length, icon: 'fa-triangle-exclamation', helper: 'Surveillance watchlist' },
      { label: 'Reports Today', value: todaysReports.length, icon: 'fa-chart-column', helper: 'Uploaded today' },
    ];
  }, [appointments, diseaseCases, providerNotifications.length, providerReports]);

  const recentAppointments = useMemo(() => appointments.slice(0, 5), [appointments]);
  const recentReports = useMemo(() => providerReports.slice(0, 5), [providerReports]);

  return (
    <div className="page-grid">
      <section className="hero-panel panel">
        <div>
          <p className="eyebrow">SAMVED Health Command</p>
          <h1 className="section-title">{currentProvider.name}</h1>
          <p className="section-copy">
            Live lab operations connected to your provider profile, test catalog, reports, appointments, and ward-level health alerts.
          </p>
        </div>
        <div className="hero-meta">
          <div>
            <p className="hero-label">Provider ID</p>
            <p className="hero-value">{currentProvider.provider_id}</p>
          </div>
          <div>
            <p className="hero-label">Ward</p>
            <p className="hero-value">{currentProvider.ward_id || 'N/A'}</p>
          </div>
          <div>
            <p className="hero-label">Last Sync</p>
            <p className="hero-value">{formatDateTime(new Date().toISOString())}</p>
          </div>
        </div>
      </section>

      {!hasSupabaseEnv && <div className="notice-panel">Add Vite Supabase keys to enable the live database connection in every screen.</div>}
      {error && <div className="notice-panel notice-warning">{error}</div>}

      <section className="stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="panel stat-card">
            <div className="stat-icon">
              <i className={`fa-solid ${stat.icon}`}></i>
            </div>
            <p className="stat-label">{stat.label}</p>
            <h2 className="stat-value">{stat.value}</h2>
            <p className="stat-helper">{stat.helper}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Operations Queue</p>
            <h2 className="subsection-title">Recent bookings</h2>
          </div>
          <Link to="/bookings" className="text-link">Open bookings</Link>
        </div>
        <div className="list-stack">
          {recentAppointments.map((appointment) => (
            <div key={appointment.appointment_id} className="list-row">
              <div>
                <p className="row-title">{appointment.citizens?.name || appointment.citizen_id}</p>
                <p className="row-copy">{appointment.appointment_id} - {formatDate(appointment.appointment_date)} - {appointment.time_slot || 'No slot'}</p>
              </div>
              <span className="status-pill">{appointment.status || 'pending'}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <p className="eyebrow">Diagnostic Output</p>
            <h2 className="subsection-title">Latest reports</h2>
          </div>
          <Link to="/history" className="text-link">Open history</Link>
        </div>
        <div className="list-stack">
          {recentReports.map((report) => (
            <div key={report.report_id} className="list-row">
              <div>
                <p className="row-title">{report.test_types?.test_name || report.report_id}</p>
                <p className="row-copy">{report.citizen_id} - {report.result || 'Awaiting result'}</p>
              </div>
              <span className="row-meta">{formatDate(report.test_date || report.uploaded_at)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
