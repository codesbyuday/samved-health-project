import React, { useState } from 'react';
import { useData } from '../context/DataContext';

const Prescriptions = () => {
  const { healthRecords, loading, mutating, verifyPrescription } = useData();
  const [verifiedIds, setVerifiedIds] = useState(new Set());
  const [filterSearch, setFilterSearch] = useState('');

  const handleVerify = async (recordId) => {
    const res = await verifyPrescription(recordId);
    if (res.success) {
      setVerifiedIds((prev) => new Set([...prev, recordId]));
    }
  };

  const filteredRecords = (healthRecords || []).filter((r) => {
    const term = filterSearch.toLowerCase();
    const name = (r.citizen_name || '').toLowerCase();
    const id = (r.citizen_id || '').toLowerCase();
    const diag = (r.diagnosis || '').toLowerCase();
    const pres = (r.prescription || '').toLowerCase();
    return name.includes(term) || id.includes(term) || diag.includes(term) || pres.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Electronic Prescription Verification</h1>
          <p className="page-subtitle">
            Validate citizen prescriptions issued by Solapur municipal and hospital clinicians.
          </p>
        </div>
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Filter patient, diagnosis, medicine..."
            className="input-shell w-full text-xs"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="surface-card rounded-3xl p-8 text-center text-soft">
            Loading hospital prescriptions...
          </div>
        )}

        {!loading && filteredRecords.length === 0 && (
          <div className="surface-card rounded-3xl p-8 text-center text-soft">
            No prescription records matched your query.
          </div>
        )}

        {filteredRecords.map((record) => {
          const isVerified = record.verified || verifiedIds.has(record.record_id);

          return (
            <div
              key={record.record_id}
              className="surface-card flex flex-col justify-between rounded-[1.75rem] p-6 md:flex-row md:items-center border border-white/5 transition-all hover:border-white/10"
            >
              <div className="mb-4 flex items-start gap-4 md:mb-0">
                <div className="brand-mark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-bold shadow-md">
                  {(record.citizen_name || record.citizen_id || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-main">{record.citizen_name || record.citizen_id}</h3>
                    <span className="text-xs font-mono text-faint">({record.citizen_id})</span>
                    <span className="status-pill text-[11px]" style={{ background: 'var(--panel-muted)', color: 'var(--text-soft)' }}>
                      Date: {record.visit_date}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#47c2bf] mt-0.5">{record.diagnosis}</p>
                  {record.notes && <p className="text-xs text-faint mt-1">Doctor's Clinical Notes: {record.notes}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="surface-muted rounded-2xl p-3.5 text-xs text-main max-w-md">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-faint">
                    Prescribed Dosage & Regimen
                  </span>
                  <p className="font-semibold">{record.prescription}</p>
                </div>

                {isVerified ? (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-xs font-semibold text-emerald-400">
                    <span>✓ Verified & Dispensed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleVerify(record.record_id)}
                    className="btn-primary py-2.5 px-5 text-xs font-semibold whitespace-nowrap shadow-md"
                    disabled={mutating}
                  >
                    {mutating ? 'Processing...' : 'Verify & Dispense'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Prescriptions;
