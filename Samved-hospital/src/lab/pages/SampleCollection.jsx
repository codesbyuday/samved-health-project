import React, { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const SampleCollection = () => {
  const { appointments, providerReports, updateAppointmentStatus, saving } = useAppData();

  const rows = useMemo(
    () =>
      appointments.map((appointment) => {
        const matchingReport = providerReports.find((report) => report.citizen_id === appointment.citizen_id);
        let pipelineStatus = 'Scheduled';
        let actionLabel = '';
        let nextDbStatus = null;

        if (matchingReport) {
          pipelineStatus = 'Report Ready';
        } else if (appointment.status === 'completed') {
          pipelineStatus = 'Processing';
        } else if (appointment.status === 'confirmed') {
          pipelineStatus = 'Sample Collected';
          actionLabel = 'Send to Processing';
          nextDbStatus = 'completed';
        } else {
          actionLabel = 'Mark Collected';
          nextDbStatus = 'confirmed';
        }

        return { ...appointment, pipelineStatus, actionLabel, nextDbStatus };
      }),
    [appointments, providerReports],
  );

  return (
    <div className="page-stack">
      <div>
        <p className="eyebrow">Operational Tracking</p>
        <h1 className="section-title">Sample flow</h1>
        <p className="section-copy">
          This view derives collection stages from appointment status and report presence because the provided schema does not include a dedicated sample-tracking table.
        </p>
      </div>

      <div className="panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Appointment</th>
              <th>Citizen</th>
              <th>Date</th>
              <th>Pipeline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.appointment_id}>
                <td>{row.appointment_id}</td>
                <td>{row.citizens?.name || row.citizen_id}</td>
                <td>{formatDate(row.appointment_date)}</td>
                <td><span className="status-pill">{row.pipelineStatus}</span></td>
                <td>
                  {row.nextDbStatus ? (
                    <button disabled={saving} onClick={() => updateAppointmentStatus(row.appointment_id, row.nextDbStatus)} className="btn-primary btn-small">
                      {row.actionLabel}
                    </button>
                  ) : (
                    <span className="text-[var(--muted)] text-sm">No action needed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SampleCollection;
