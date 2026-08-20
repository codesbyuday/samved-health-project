import React, { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const TestHistory = () => {
  const { providerReports } = useAppData();
  const [search, setSearch] = useState('');

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return providerReports;

    return providerReports.filter(
      (report) =>
        report.citizen_id?.toLowerCase().includes(term) ||
        report.report_id?.toLowerCase().includes(term) ||
        report.test_types?.test_name?.toLowerCase().includes(term),
    );
  }, [providerReports, search]);

  return (
    <div className="page-stack">
      <div>
        <p className="eyebrow">Archive</p>
        <h1 className="section-title">Test history</h1>
        <p className="section-copy">Provider-scoped report archive with search across report ID, citizen ID, and test type.</p>
      </div>

      <div className="panel">
        <label className="field">
          <span>Search reports</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by citizen ID, report ID, or test type" />
        </label>
      </div>

      <div className="panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Citizen</th>
              <th>Test</th>
              <th>Result</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((report) => (
              <tr key={report.report_id}>
                <td>{report.report_id}</td>
                <td>{report.citizens?.name || report.citizen_id}</td>
                <td>{report.test_types?.test_name || report.test_type_id}</td>
                <td>{report.result}</td>
                <td>{formatDate(report.test_date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestHistory;
