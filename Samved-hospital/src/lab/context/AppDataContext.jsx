import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasSupabaseEnv, supabase } from '../lib/supabase';

const AppDataContext = createContext(null);
const PROVIDER_STORAGE_KEY = 'samved-provider-id';

const emptyState = {
  providers: [],
  wards: [],
  appointments: [],
  reports: [],
  labTests: [],
  testTypes: [],
  notifications: [],
  diseaseCases: [],
  citizens: [],
};

const fallbackProvider = {
  provider_id: 'LOCAL-DEMO-PROVIDER',
  name: 'SAMVED Diagnostics',
  role: 'lab',
  ward_id: 5,
  address: 'Health Ecosystem Control Centre',
  phone: '+91 00000 00000',
  license: 'CONFIGURE_PROVIDER',
  email: 'lab@samved.local',
};

function getEnv(key, fallback = "") {
  try {
    if (typeof process !== "undefined" && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}
  try {
    if (typeof import.meta !== "undefined" && import.meta?.env?.[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}
  return fallback;
}

export const AppDataProvider = ({ children }) => {
  const [datasets, setDatasets] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState(
    () =>
      localStorage.getItem(PROVIDER_STORAGE_KEY) ||
      getEnv('VITE_PROVIDER_ID') ||
      getEnv('VITE_DEFAULT_PROVIDER_ID') ||
      '',
  );

  const chooseProviderId = useCallback(
    (providers) => {
      if (selectedProviderId && providers.some((provider) => provider.provider_id === selectedProviderId)) {
        return selectedProviderId;
      }

      if (providers.length > 0) {
        return providers[0].provider_id;
      }

      return fallbackProvider.provider_id;
    },
    [selectedProviderId],
  );

  const refreshData = useCallback(async () => {
    if (!hasSupabaseEnv || !supabase) {
      setDatasets({
        ...emptyState,
        providers: [fallbackProvider],
      });
      setSelectedProviderId(fallbackProvider.provider_id);
      setError(
        'Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect the live database.',
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const [
      providersResponse,
      wardsResponse,
      appointmentsResponse,
      reportsResponse,
      labTestsResponse,
      testTypesResponse,
      notificationsResponse,
      diseaseCasesResponse,
      citizensResponse,
    ] = await Promise.all([
      supabase.from('provider').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('wards').select('ward_id, ward_name, zone, population').order('ward_id'),
      supabase
        .from('appointments')
        .select(
          'appointment_id, citizen_id, appointment_date, time_slot, status, created_at, citizens(name, phone, gender, ward_number, date_of_birth)',
        )
        .order('appointment_date', { ascending: false })
        .limit(100),
      supabase
        .from('diagnostic_reports')
        .select(
          'report_id, citizen_id, provider_id, test_type_id, result, description, report_file_url, status, test_date, uploaded_at, citizens(name, phone, date_of_birth), test_types(test_name, test_category)',
        )
        .order('uploaded_at', { ascending: false })
        .limit(100),
      supabase
        .from('lab_tests')
        .select('lab_test_id, provider_id, test_type_id, price, test_types(test_name, test_category, description)')
        .order('lab_test_id', { ascending: false })
        .limit(100),
      supabase.from('test_types').select('test_id, test_name, test_category, description').order('test_name'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
      supabase
        .from('disease_cases')
        .select(
          'case_id, disease_id, citizen_id, report_date, severity, status, diseases(disease_name, disease_type, disease_category), citizens(name, ward_number)',
        )
        .order('report_date', { ascending: false })
        .limit(100),
      supabase
        .from('citizens')
        .select('citizen_id, name, phone, gender, ward_number, date_of_birth')
        .order('name')
        .limit(200),
    ]);

    const responses = [
      providersResponse,
      wardsResponse,
      appointmentsResponse,
      reportsResponse,
      labTestsResponse,
      testTypesResponse,
      notificationsResponse,
      diseaseCasesResponse,
      citizensResponse,
    ];
    const firstError = responses.find((response) => response.error)?.error;

    if (firstError) {
      setError(firstError.message || 'Unable to load data from Supabase.');
    }

    const providers = providersResponse.data?.length ? providersResponse.data : [fallbackProvider];
    const nextProviderId = chooseProviderId(providers);

    setDatasets({
      providers,
      wards: wardsResponse.data || [],
      appointments: appointmentsResponse.data || [],
      reports: reportsResponse.data || [],
      labTests: labTestsResponse.data || [],
      testTypes: testTypesResponse.data || [],
      notifications: notificationsResponse.data || [],
      diseaseCases: diseaseCasesResponse.data || [],
      citizens: citizensResponse.data || [],
    });
    setSelectedProviderId(nextProviderId);
    localStorage.setItem(PROVIDER_STORAGE_KEY, nextProviderId);
    setLoading(false);
  }, [chooseProviderId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const currentProvider = useMemo(
    () => datasets.providers.find((provider) => provider.provider_id === selectedProviderId) || datasets.providers[0] || fallbackProvider,
    [datasets.providers, selectedProviderId],
  );

  const providerReports = useMemo(
    () => datasets.reports.filter((report) => report.provider_id === currentProvider.provider_id),
    [currentProvider.provider_id, datasets.reports],
  );

  const providerCatalog = useMemo(
    () => datasets.labTests.filter((test) => test.provider_id === currentProvider.provider_id),
    [currentProvider.provider_id, datasets.labTests],
  );

  const providerNotifications = useMemo(
    () =>
      datasets.notifications.filter((item) => {
        if (!currentProvider) return true;
        if (item.target_hospital_id) return false;
        if (item.target_ward_number && Number(item.target_ward_number) !== Number(currentProvider.ward_id)) return false;
        if (item.target_role && item.target_role !== currentProvider.role) return false;
        return true;
      }),
    [currentProvider, datasets.notifications],
  );

  const selectProvider = (providerId) => {
    setSelectedProviderId(providerId);
    localStorage.setItem(PROVIDER_STORAGE_KEY, providerId);
  };

  const withSaving = async (action) => {
    setSaving(true);
    setError('');
    try {
      await action();
    } catch (actionError) {
      setError(actionError.message || 'Unable to save changes.');
      throw actionError;
    } finally {
      setSaving(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, status) =>
    withSaving(async () => {
      if (!supabase) return;
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ status })
        .eq('appointment_id', appointmentId);

      if (updateError) throw updateError;
      await refreshData();
    });

  const createReport = async (payload) =>
    withSaving(async () => {
      if (!supabase) return;

      const insertPayload = {
        citizen_id: payload.citizen_id,
        provider_id: currentProvider.provider_id,
        test_type_id: Number(payload.test_type_id),
        result: payload.result,
        description: payload.description || null,
        report_file_url: payload.report_file_url || null,
        test_date: payload.test_date,
        uploaded_at: new Date().toISOString(),
        status: payload.status || 'completed',
      };

      const { error: insertError } = await supabase.from('diagnostic_reports').insert(insertPayload);
      if (insertError) throw insertError;
      await refreshData();
    });

  const createCatalogTest = async (payload) =>
    withSaving(async () => {
      if (!supabase) return;

      const existingType = datasets.testTypes.find(
        (item) =>
          item.test_name?.trim().toLowerCase() === payload.test_name.trim().toLowerCase() &&
          item.test_category?.trim().toLowerCase() === payload.test_category.trim().toLowerCase(),
      );

      let testTypeId = existingType?.test_id;

      if (!testTypeId) {
        const { data: insertedType, error: testTypeError } = await supabase
          .from('test_types')
          .insert({
            test_name: payload.test_name,
            test_category: payload.test_category,
            description: payload.description || null,
          })
          .select('test_id')
          .single();

        if (testTypeError) throw testTypeError;
        testTypeId = insertedType.test_id;
      }

      const { error: labTestError } = await supabase.from('lab_tests').insert({
        provider_id: currentProvider.provider_id,
        test_type_id: testTypeId,
        price: Number(payload.price),
      });

      if (labTestError) throw labTestError;
      await refreshData();
    });

  const updateProviderProfile = async (changes) =>
    withSaving(async () => {
      if (!supabase || currentProvider.provider_id === fallbackProvider.provider_id) return;

      const { error: updateError } = await supabase
        .from('provider')
        .update(changes)
        .eq('provider_id', currentProvider.provider_id);

      if (updateError) throw updateError;
      await refreshData();
    });

  const value = useMemo(
    () => ({
      ...datasets,
      currentProvider,
      providerReports,
      providerCatalog,
      providerNotifications,
      loading,
      saving,
      error,
      hasSupabaseEnv,
      selectProvider,
      refreshData,
      updateAppointmentStatus,
      createReport,
      createCatalogTest,
      updateProviderProfile,
    }),
    [
      currentProvider,
      datasets,
      error,
      loading,
      providerCatalog,
      providerNotifications,
      providerReports,
      refreshData,
      saving,
    ],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within AppDataProvider');
  return context;
};
