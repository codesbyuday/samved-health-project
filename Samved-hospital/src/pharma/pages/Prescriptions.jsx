import React from 'react';
import { useData } from '../context/DataContext';

const Prescriptions = () => {
  const { healthRecords, loading, mutating, verifyPrescription } = useData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Prescription Verification</h1>
        <p className="page-subtitle">Review and verify prescription records from the shared dataset.</p>
      </div>

      <div className="space-y-4">
        {loading && <div className="surface-card rounded-3xl p-6 text-soft">Loading prescriptions...</div>}

        {!loading && healthRecords.length === 0 && <div className="surface-card rounded-3xl p-6 text-soft">No prescription records found.</div>}

        {healthRecords.map((record) => (
          <div key={record.record_id} className="surface-card flex flex-col justify-between rounded-[1.5rem] p-6 md:flex-row md:items-center">
            <div className="mb-4 flex items-center gap-4 md:mb-0">
              <div className="brand-mark flex h-12 w-12 items-center justify-center rounded-2xl font-bold">
                {record.citizen_id.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-main">{record.citizen_id}</h3>
                  <span className="status-pill" style={{ background: 'var(--panel-muted)', color: 'var(--text-soft)' }}>
                    {record.staff_id}
                  </span>
                </div>
                <p className="text-sm text-soft">{record.diagnosis}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="surface-muted rounded-2xl p-3 text-sm text-main">
                <span className="mb-1 block text-xs uppercase tracking-[0.18em] text-faint">Prescription</span>
                {record.prescription}
              </div>

              {record.verified ? (
                <span className="status-pill" style={{ background: 'var(--success-soft)', color: '#15956e' }}>
                  Verified
                </span>
              ) : (
                <button onClick={() => verifyPrescription(record.record_id)} className="btn-primary" disabled={mutating}>
                  {mutating ? 'Saving...' : 'Verify'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Prescriptions;
