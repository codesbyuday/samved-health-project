import React, { useMemo, useState } from 'react';
import Modal from '../components/Modal';
import { useAppData } from '../context/AppDataContext';
import { formatDate } from '../lib/format';

const TestHistory = () => {
  const { providerReports, openReportDocument } = useAppData();
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return providerReports;

    return providerReports.filter((report) => {
      const citizenName = report.citizens?.name || '';
      const testName = report.test_types?.test_name || '';
      return (
        report.citizen_id?.toLowerCase().includes(term) ||
        report.report_id?.toLowerCase().includes(term) ||
        citizenName.toLowerCase().includes(term) ||
        testName.toLowerCase().includes(term) ||
        report.result?.toLowerCase().includes(term)
      );
    });
  }, [providerReports, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
            Diagnostic Archive
          </p>
          <h1 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">
            Diagnostic History & Archives
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Complete searchable repository of all diagnostic reports released by your laboratory, partitioned under municipal health guidelines.
          </p>
        </div>
      </div>

      <div className="surface-card rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative">
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
            placeholder="Search archive by citizen name, patient SMC ID, report number, or test type..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium"
          />
        </div>
      </div>

      <div className="surface-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-slate-400">
            <i className="fa-solid fa-box-archive text-3xl mb-2 text-cyan-500"></i>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No archived records found</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {search ? 'No reports matched your search term.' : 'Historical laboratory reports will appear here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 text-left">
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Report Reference</th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Citizen / Patient</th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Investigation</th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Key Finding</th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Completion Date</th>
                  <th className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReports.map((report) => (
                  <tr
                    key={report.report_id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {report.report_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {report.citizens?.name || report.citizen_id}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {report.citizen_id} • {report.citizens?.phone || 'No phone'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-xs">
                          {report.test_types?.test_name || `Investigation #${report.test_type_id}`}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {report.test_types?.test_category || 'General'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {report.result}
                      </p>
                      {report.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {report.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {formatDate(report.test_date || report.uploaded_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {report.status || 'Archived'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={selectedReport?.test_types?.test_name || 'Investigation Details'}
        subtitle={`Report Reference: ${selectedReport?.report_id || ''}`}
        icon="fa-file-waveform"
        maxWidth="max-w-lg"
      >
        {selectedReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-bold">Report Reference</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-0.5 block">{selectedReport.report_id}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-bold">Investigation Date</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs mt-0.5 block">{formatDate(selectedReport.test_date || selectedReport.uploaded_at)}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-2">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-bold">Citizen / Patient</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 block">{selectedReport.citizens?.name || selectedReport.citizen_id}</span>
                <span className="text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">{selectedReport.citizen_id} • {selectedReport.citizens?.phone || 'No phone'}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Key Finding / Diagnostic Result</span>
              <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/80 text-sm font-bold text-cyan-950 dark:text-cyan-200">
                {selectedReport.result}
              </div>
            </div>

            {selectedReport.description && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Clinical Remarks</span>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {selectedReport.description}
                </p>
              </div>
            )}

            {selectedReport.report_file_url && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => openReportDocument(selectedReport.report_file_url)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-md shadow-cyan-600/20 transition-all cursor-pointer"
                >
                  <i className="fa-solid fa-file-pdf"></i>
                  <span>Open Official Diagnostic Document / PDF</span>
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TestHistory;
