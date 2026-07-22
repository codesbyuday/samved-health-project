import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../SearchContext';
import { formatDate } from '../lib/format';

const GlobalSearch = () => {
  const { isSearching, results, query, clearSearch } = useSearch();
  const navigate = useNavigate();

  if (!isSearching || query.length < 2) return null;

  const hasResults =
    results.patients.length > 0 ||
    results.bookings.length > 0 ||
    results.reports.length > 0 ||
    results.catalog.length > 0;

  const handleClick = (path) => {
    navigate(path);
    clearSearch();
  };

  return (
    <div className="search-results">
      <div className="p-4 border-b border-[var(--border-muted)] sticky top-0 bg-[var(--surface-2)]">
        <p className="text-xs text-[var(--muted)] font-medium">
          Search results for <span className="text-[var(--accent)]">"{query}"</span>
        </p>
      </div>

      {!hasResults && (
        <div className="p-8 text-center text-[var(--muted)]">
          <i className="fa-solid fa-search text-2xl mb-2"></i>
          <p>No results found</p>
        </div>
      )}

      {results.patients.length > 0 && (
        <div className="p-2">
          <p className="search-group-title">Citizens</p>
          {results.patients.map((patient) => (
            <div key={patient.citizen_id} onClick={() => handleClick('/history')} className="search-row">
              <div className="search-avatar">{patient.name.charAt(0)}</div>
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{patient.name}</p>
                <p className="text-xs text-[var(--muted)]">{patient.citizen_id} - {patient.phone || 'No phone'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.bookings.length > 0 && (
        <div className="p-2 border-t border-[var(--border-muted)]">
          <p className="search-group-title">Appointments</p>
          {results.bookings.map((booking) => (
            <div key={booking.appointment_id} onClick={() => handleClick('/bookings')} className="search-row justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{booking.citizens?.name || booking.citizen_id}</p>
                <p className="text-xs text-[var(--muted)]">
                  {booking.appointment_id} - {formatDate(booking.appointment_date)}
                </p>
              </div>
              <span className="status-pill">{booking.status}</span>
            </div>
          ))}
        </div>
      )}

      {results.reports.length > 0 && (
        <div className="p-2 border-t border-[var(--border-muted)]">
          <p className="search-group-title">Reports</p>
          {results.reports.map((report) => (
            <div key={report.report_id} onClick={() => handleClick('/history')} className="search-row justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{report.report_id}</p>
                <p className="text-xs text-[var(--muted)]">
                  {report.citizen_id} - {report.test_types?.test_name || 'Diagnostic report'}
                </p>
              </div>
              <i className="fa-solid fa-chevron-right text-[var(--muted)]"></i>
            </div>
          ))}
        </div>
      )}

      {results.catalog.length > 0 && (
        <div className="p-2 border-t border-[var(--border-muted)]">
          <p className="search-group-title">Catalog</p>
          {results.catalog.map((test) => (
            <div key={test.lab_test_id} onClick={() => handleClick('/catalog')} className="search-row justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">{test.test_types?.test_name}</p>
                <p className="text-xs text-[var(--muted)]">{test.test_types?.test_category || 'Lab test'}</p>
              </div>
              <i className="fa-solid fa-vial text-[var(--accent)]"></i>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
