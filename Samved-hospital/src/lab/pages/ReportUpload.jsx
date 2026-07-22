import React, { useState } from 'react';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const initialForm = {
  citizen_id: '',
  test_type_id: '',
  result: '',
  description: '',
  report_file_url: '',
  test_date: '',
};

const ReportUpload = () => {
  const { providerReports, citizens, testTypes, createReport, saving } = useAppData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await createReport(form);
    setForm(initialForm);
    setIsModalOpen(false);
  };

  return (
    <div className="page-stack">
      <div className="section-header">
        <div>
          <p className="eyebrow">Diagnostic Reports</p>
          <h1 className="section-title">Report upload</h1>
          <p className="section-copy">Create new records directly in `diagnostic_reports` and show the provider-scoped history below.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <i className="fa-solid fa-plus"></i>
          <span>New Report</span>
        </button>
      </div>

      <div className="panel overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Citizen</th>
              <th>Test</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {providerReports.map((report) => (
              <tr key={report.report_id}>
                <td>{report.report_id}</td>
                <td>{report.citizens?.name || report.citizen_id}</td>
                <td>{report.test_types?.test_name || report.test_type_id}</td>
                <td>{formatDate(report.test_date)}</td>
                <td><span className="status-pill">{report.status || 'completed'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Diagnostic Report">
        <form onSubmit={handleSubmit} className="form-stack">
          <label className="field">
            <span>Citizen</span>
            <select value={form.citizen_id} onChange={(e) => setForm({ ...form, citizen_id: e.target.value })} required>
              <option value="">Select citizen</option>
              {citizens.map((citizen) => (
                <option key={citizen.citizen_id} value={citizen.citizen_id}>
                  {citizen.name} ({citizen.citizen_id})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Test Type</span>
            <select value={form.test_type_id} onChange={(e) => setForm({ ...form, test_type_id: e.target.value })} required>
              <option value="">Select test</option>
              {testTypes.map((testType) => (
                <option key={testType.test_id} value={testType.test_id}>
                  {testType.test_name} ({testType.test_category || 'General'})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Test Date</span>
            <input type="date" value={form.test_date} onChange={(e) => setForm({ ...form, test_date: e.target.value })} required />
          </label>

          <label className="field">
            <span>Result</span>
            <input type="text" value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })} placeholder="Normal / Positive / Review needed" required />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" placeholder="Optional clinical notes"></textarea>
          </label>

          <label className="field">
            <span>Report File URL</span>
            <input type="url" value={form.report_file_url} onChange={(e) => setForm({ ...form, report_file_url: e.target.value })} placeholder="https://..." />
          </label>

          <button type="submit" disabled={saving} className="btn-primary justify-center">
            {saving ? 'Saving...' : 'Submit Report'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default ReportUpload;
