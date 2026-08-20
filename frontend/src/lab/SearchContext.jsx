import React, { createContext, useContext, useMemo, useState } from 'react';
import { useAppData } from './context/AppDataContext';

const SearchContext = createContext();

export const useSearch = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const { citizens, appointments, providerReports, providerCatalog } = useAppData();
  const [query, setQuery] = useState('');
  const isSearching = query.trim().length >= 2;

  const results = useMemo(() => {
    if (!isSearching) {
      return { patients: [], bookings: [], reports: [], catalog: [] };
    }

    const term = query.trim().toLowerCase();

    return {
      patients: citizens.filter(
        (patient) =>
          patient.name?.toLowerCase().includes(term) || patient.citizen_id?.toLowerCase().includes(term),
      ),
      bookings: appointments.filter(
        (booking) =>
          booking.appointment_id?.toLowerCase().includes(term) ||
          booking.citizen_id?.toLowerCase().includes(term) ||
          booking.citizens?.name?.toLowerCase().includes(term),
      ),
      reports: providerReports.filter(
        (report) =>
          report.report_id?.toLowerCase().includes(term) ||
          report.citizen_id?.toLowerCase().includes(term) ||
          report.test_types?.test_name?.toLowerCase().includes(term),
      ),
      catalog: providerCatalog.filter(
        (test) =>
          test.test_types?.test_name?.toLowerCase().includes(term) ||
          test.test_types?.test_category?.toLowerCase().includes(term),
      ),
    };
  }, [appointments, citizens, isSearching, providerCatalog, providerReports, query]);

  const performSearch = (searchTerm) => {
    setQuery(searchTerm);
  };

  const clearSearch = () => {
    setQuery('');
  };

  return (
    <SearchContext.Provider value={{ query, results, isSearching, performSearch, clearSearch }}>
      {children}
    </SearchContext.Provider>
  );
};
