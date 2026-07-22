import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const TestBookings = () => {
  const { appointments, updateAppointmentStatus, saving } = useAppData();

  return (
    <div className="page-stack">
      <div>
        <p className="eyebrow">Appointments</p>
        <h1 className="section-title">Test bookings</h1>
        <p className="section-copy">Live appointment queue from the `appointments` table with citizen details joined from your schema.</p>
      </div>

      <div className="panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Appointment</th>
              <th>Citizen</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.appointment_id}>
                <td>{appointment.appointment_id}</td>
                <td>
                  <div className="cell-stack">
                    <span className="font-semibold text-[var(--foreground)]">{appointment.citizens?.name || appointment.citizen_id}</span>
                    <span>{appointment.citizen_id}</span>
                  </div>
                </td>
                <td>{formatDate(appointment.appointment_date)}</td>
                <td><span className="status-pill">{appointment.status || 'pending'}</span></td>
                <td>
                  <div className="flex gap-2">
                    {appointment.status === 'pending' && (
                      <>
                        <button disabled={saving} onClick={() => updateAppointmentStatus(appointment.appointment_id, 'confirmed')} className="btn-primary btn-small">Confirm</button>
                        <button disabled={saving} onClick={() => updateAppointmentStatus(appointment.appointment_id, 'rejected')} className="btn-secondary btn-small">Reject</button>
                      </>
                    )}
                    {appointment.status === 'confirmed' && (
                      <button disabled={saving} onClick={() => updateAppointmentStatus(appointment.appointment_id, 'completed')} className="btn-primary btn-small">Mark Completed</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestBookings;
