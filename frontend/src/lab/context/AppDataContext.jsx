import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasSupabaseEnv, supabase } from '../lib/supabase';
import { uploadReportFile, getReportViewUrl, openReportDocument } from '../lib/storage';

const AppDataContext = createContext(null);
const PROVIDER_STORAGE_KEY = 'samved-provider-id';
const SESSION_STORAGE_KEY = 'lab-dashboard-session';

const emptyState = {
  providers: [],
  wards: [],
  bookings: [],
  appointments: [],
  reports: [],
  labTests: [],
  testTypes: [],
  notifications: [],
  diseaseCases: [],
  citizens: [],
};

const getStoredSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const getInitialProviderId = () => {
  if (typeof window === 'undefined') return '';
  const session = getStoredSession();
  if (session?.profile?.provider_id) {
    return session.profile.provider_id;
  }
  return localStorage.getItem(PROVIDER_STORAGE_KEY) || '';
};

export const AppDataProvider = ({ children }) => {
  const [datasets, setDatasets] = useState(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedProviderId, setSelectedProviderId] = useState(getInitialProviderId);

  const chooseProviderId = useCallback(
    (providers) => {
      const session = getStoredSession();
      if (session?.profile?.provider_id) {
        return session.profile.provider_id;
      }

      if (selectedProviderId && providers.some((p) => p.provider_id === selectedProviderId)) {
        return selectedProviderId;
      }

      const labProvider = providers.find((p) => p.role === 'lab');
      if (labProvider) {
        return labProvider.provider_id;
      }

      return providers[0]?.provider_id || '';
    },
    [selectedProviderId],
  );

  const refreshData = useCallback(async () => {
    if (!hasSupabaseEnv || !supabase) {
      setDatasets(emptyState);
      setError('Supabase connection configuration is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Dedicated query for lab_bookings (completely decoupled from hospital appointments)
      const bookingsQuery = supabase
        .from('lab_bookings')
        .select(
          'booking_id, citizen_id, provider_id, test_type_id, booking_date, time_slot, status, sample_type, specimen_tube, sample_collected_at, collected_by, analysis_started_at, completed_at, rejection_reason, notes, price, payment_status, created_at, updated_at, test_types(test_id, test_name, test_category, description), citizens(name, phone, gender, ward_number, date_of_birth, blood_group)',
        )
        .order('booking_date', { ascending: false })
        .limit(200);

      const [
        providersResponse,
        wardsResponse,
        bookingsResponse,
        reportsResponseInitial,
        labTestsResponse,
        testTypesResponse,
        notificationsResponse,
        diseaseCasesResponse,
        citizensResponse,
      ] = await Promise.all([
        supabase.from('provider').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('wards').select('ward_id, ward_name, zone, population').order('ward_id'),
        bookingsQuery,
        supabase
          .from('diagnostic_reports')
          .select(
            'report_id, citizen_id, provider_id, test_type_id, booking_id, result, description, report_file_url, status, test_date, uploaded_at, citizens(name, phone, date_of_birth, gender), test_types(test_name, test_category, description)',
          )
          .order('uploaded_at', { ascending: false })
          .limit(200),
        supabase
          .from('lab_tests')
          .select('lab_test_id, provider_id, test_type_id, price, test_types(test_id, test_name, test_category, description)')
          .order('lab_test_id', { ascending: false })
          .limit(200),
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
          .select('citizen_id, name, phone, gender, ward_number, date_of_birth, blood_group, address')
          .order('name')
          .limit(300),
      ]);

      let bookingsData = bookingsResponse.data || [];
      if (bookingsResponse.error) {
        // Table may not exist yet if user hasn't run the migration SQL
        console.warn('Notice querying lab_bookings table (create table if needed):', bookingsResponse.error.message);
      }

      let reportsData = reportsResponseInitial.data || [];
      if (reportsResponseInitial.error) {
        // Fallback without booking_id if column not added yet
        const baseReportsRes = await supabase
          .from('diagnostic_reports')
          .select(
            'report_id, citizen_id, provider_id, test_type_id, result, description, report_file_url, status, test_date, uploaded_at, citizens(name, phone, date_of_birth, gender), test_types(test_name, test_category, description)',
          )
          .order('uploaded_at', { ascending: false })
          .limit(200);
        reportsData = baseReportsRes.data || [];
      }

      const responses = [
        providersResponse,
        wardsResponse,
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

      const providers = providersResponse.data || [];
      const nextProviderId = chooseProviderId(providers);

      setDatasets({
        providers,
        wards: wardsResponse.data || [],
        bookings: bookingsData,
        appointments: bookingsData, // Backward-compatibility alias
        reports: reportsData,
        labTests: labTestsResponse.data || [],
        testTypes: testTypesResponse.data || [],
        notifications: notificationsResponse.data || [],
        diseaseCases: diseaseCasesResponse.data || [],
        citizens: citizensResponse.data || [],
      });

      if (nextProviderId) {
        setSelectedProviderId(nextProviderId);
        localStorage.setItem(PROVIDER_STORAGE_KEY, nextProviderId);
      }
    } catch (err) {
      setError(err?.message || 'Error communicating with Supabase database.');
    } finally {
      setLoading(false);
    }
  }, [chooseProviderId]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived currentProvider bound to authenticated session
  const currentProvider = useMemo(() => {
    const session = getStoredSession();
    const sessionProfile = session?.profile;
    const matchId = sessionProfile?.provider_id || selectedProviderId;

    const fromDb = datasets.providers.find((p) => p.provider_id === matchId);
    if (fromDb) return fromDb;

    if (sessionProfile) return sessionProfile;

    const defaultLab = datasets.providers.find((p) => p.role === 'lab');
    if (defaultLab) return defaultLab;

    return datasets.providers[0] || {
      provider_id: matchId || 'PROV-LAB-001',
      name: 'Diagnostic Laboratory',
      role: 'lab',
      ward_id: 1,
      address: 'Solapur',
      phone: '',
      license: '',
      email: '',
    };
  }, [datasets.providers, selectedProviderId]);

  // Multi-tenant isolated datasets
  const providerReports = useMemo(
    () => datasets.reports.filter((report) => report.provider_id === currentProvider.provider_id),
    [currentProvider.provider_id, datasets.reports],
  );

  const providerCatalog = useMemo(
    () => datasets.labTests.filter((test) => test.provider_id === currentProvider.provider_id),
    [currentProvider.provider_id, datasets.labTests],
  );

  const providerBookings = useMemo(() => {
    return datasets.bookings
      .filter((b) => {
        if (!currentProvider?.provider_id) return true;
        if (b.provider_id && b.provider_id === currentProvider.provider_id) return true;
        return false;
      })
      .map((b) => {
        if (b.test_types?.test_name) return b;

        if (b.test_type_id) {
          const typeObj = datasets.testTypes.find((t) => t.test_id === Number(b.test_type_id));
          if (typeObj) {
            return {
              ...b,
              test_types: typeObj,
            };
          }
        }

        const fallbackType = providerCatalog[0]?.test_types || datasets.testTypes[0];
        return {
          ...b,
          test_type_id: fallbackType?.test_id,
          test_types: fallbackType || { test_name: 'Diagnostic Blood Profile', test_category: 'General Pathology' },
        };
      });
  }, [currentProvider?.provider_id, datasets.bookings, datasets.testTypes, providerCatalog]);

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

  const findCitizenById = async (citizenId) => {
    if (!citizenId) return null;
    const cleanId = citizenId.trim();

    // 1. Check local loaded cache
    const cached = datasets.citizens.find(
      (c) => c.citizen_id?.toLowerCase() === cleanId.toLowerCase(),
    );
    if (cached) return cached;

    // 2. Direct Supabase query
    if (supabase) {
      try {
        const { data, error: qError } = await supabase
          .from('citizens')
          .select('citizen_id, name, phone, gender, ward_number, date_of_birth, blood_group, address')
          .eq('citizen_id', cleanId)
          .maybeSingle();

        if (!qError && data) return data;
      } catch (err) {
        console.warn('Direct citizen query warning:', err);
      }
    }

    return null;
  };

  const createBooking = async (payload) =>
    withSaving(async () => {
      if (!supabase) return;

      const bookingId =
        payload.booking_id ||
        payload.appointment_id ||
        `LBK-${Math.random().toString(16).substring(2, 10).toUpperCase()}`;

      const bookingDate =
        payload.booking_date ||
        payload.appointment_date ||
        new Date().toISOString().slice(0, 10);

      const testTypeId = Number(payload.test_type_id);

      const insertPayload = {
        booking_id: bookingId,
        citizen_id: payload.citizen_id,
        provider_id: currentProvider.provider_id,
        test_type_id: testTypeId,
        booking_date: bookingDate,
        time_slot: payload.time_slot || '09:30 AM - 10:00 AM',
        status: payload.status || 'booked',
        sample_type: payload.sample_type || null,
        specimen_tube: payload.specimen_tube || null,
        price: Number(payload.price) || 0,
        notes: payload.notes || payload.description || null,
        rejection_reason: null,
        payment_status: payload.payment_status || 'pending',
      };

      const { error: insertError } = await supabase.from('lab_bookings').insert(insertPayload);

      if (insertError) {
        throw new Error(
          `Unable to save booking to lab_bookings table: ${insertError.message}. Please verify the lab_bookings SQL table has been created in Supabase.`
        );
      }

      // Automatically create or link provisional tracking in diagnostic_reports
      if (testTypeId) {
        try {
          await supabase.from('diagnostic_reports').insert({
            citizen_id: payload.citizen_id,
            provider_id: currentProvider.provider_id,
            test_type_id: testTypeId,
            booking_id: bookingId,
            status: 'pending',
            result: 'Sample Collection Scheduled',
            description: payload.notes || payload.description || 'Test booking registered.',
            test_date: bookingDate,
            uploaded_at: new Date().toISOString(),
          });
        } catch (e) {
          // Graceful fallback if booking_id column does not exist yet in diagnostic_reports
          try {
            await supabase.from('diagnostic_reports').insert({
              citizen_id: payload.citizen_id,
              provider_id: currentProvider.provider_id,
              test_type_id: testTypeId,
              status: 'pending',
              result: 'Sample Collection Scheduled',
              description: payload.notes || payload.description || 'Test booking registered.',
              test_date: bookingDate,
              uploaded_at: new Date().toISOString(),
            });
          } catch (ign) {}
        }
      }

      // Optional status audit event in lab_sample_tracking
      try {
        await supabase.from('lab_sample_tracking').insert({
          booking_id: bookingId,
          stage: 'booking_created',
          status: payload.status || 'booked',
          notes: 'Test booking created by laboratory admin / walk-in.',
          performed_by: currentProvider.name,
        });
      } catch (trackErr) {}

      await refreshData();
      return bookingId;
    });

  const updateBookingStatus = async (bookingId, status, reason = null, extraFields = {}) =>
    withSaving(async () => {
      if (!supabase) return;

      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...extraFields,
      };

      if (reason) {
        updateData.rejection_reason = reason;
      }

      if (status === 'sample_collected' && !updateData.sample_collected_at) {
        updateData.sample_collected_at = new Date().toISOString();
      }
      if (status === 'in_progress' && !updateData.analysis_started_at) {
        updateData.analysis_started_at = new Date().toISOString();
      }
      if (status === 'completed' && !updateData.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from('lab_bookings')
        .update(updateData)
        .eq('booking_id', bookingId);

      if (updateError) throw updateError;

      // Real-world synchronization with diagnostic_reports:
      // When sample is collected or in bench analysis, mark diagnostic_reports as in_progress
      const targetBooking = datasets.bookings.find((b) => b.booking_id === bookingId);
      if (targetBooking) {
        if (['sample_collected', 'in_progress', 'confirmed'].includes(status)) {
          const existingReport = datasets.reports.find(
            (r) =>
              (r.booking_id && r.booking_id === bookingId) ||
              (r.citizen_id === targetBooking.citizen_id &&
                r.provider_id === currentProvider.provider_id &&
                r.test_type_id === targetBooking.test_type_id)
          );

          if (existingReport) {
            await supabase
              .from('diagnostic_reports')
              .update({
                status: 'in_progress',
                result:
                  status === 'sample_collected'
                    ? 'Specimen Drawn - Pending Analysis'
                    : 'Specimen Under Bench Analysis',
              })
              .eq('report_id', existingReport.report_id);
          } else {
            const testTypeId = targetBooking.test_type_id;
            if (testTypeId) {
              try {
                await supabase.from('diagnostic_reports').insert({
                  citizen_id: targetBooking.citizen_id,
                  provider_id: currentProvider.provider_id,
                  test_type_id: Number(testTypeId),
                  booking_id: bookingId,
                  status: 'in_progress',
                  result: 'Specimen Drawn - In Bench Analysis',
                  description: 'Specimen collected and accessioned into lab analyzer.',
                  test_date: targetBooking.booking_date || new Date().toISOString().slice(0, 10),
                  uploaded_at: new Date().toISOString(),
                });
              } catch (e) {
                // fallback if booking_id column does not exist
                try {
                  await supabase.from('diagnostic_reports').insert({
                    citizen_id: targetBooking.citizen_id,
                    provider_id: currentProvider.provider_id,
                    test_type_id: Number(testTypeId),
                    status: 'in_progress',
                    result: 'Specimen Drawn - In Bench Analysis',
                    description: 'Specimen collected and accessioned into lab analyzer.',
                    test_date: targetBooking.booking_date || new Date().toISOString().slice(0, 10),
                    uploaded_at: new Date().toISOString(),
                  });
                } catch (ign) {}
              }
            }
          }
        }
      }

      // Log status transition in lab_sample_tracking
      try {
        await supabase.from('lab_sample_tracking').insert({
          booking_id: bookingId,
          stage: status,
          status,
          notes: reason || `Status changed to ${status}`,
          performed_by: currentProvider.name,
        });
      } catch (trackErr) {}

      await refreshData();
    });

  const createReport = async (payload, file = null) =>
    withSaving(async () => {
      if (!supabase) return;

      let fileUrl = payload.report_file_url || null;
      let uploadedAt = new Date().toISOString();

      // If a real document file was selected, upload it directly to Supabase storage 'lab_reports' bucket
      if (file) {
        const uploadRes = await uploadReportFile(file, payload.citizen_id);
        if (uploadRes.error) {
          throw new Error(`File upload failed: ${uploadRes.error}`);
        }
        fileUrl = uploadRes.path;
      }

      const insertPayload = {
        citizen_id: payload.citizen_id,
        provider_id: currentProvider.provider_id,
        test_type_id: Number(payload.test_type_id),
        result: payload.result,
        description: payload.description || null,
        report_file_url: fileUrl,
        test_date: payload.test_date,
        uploaded_at: uploadedAt,
        status: payload.status || 'completed',
        ...(payload.booking_id ? { booking_id: payload.booking_id } : {}),
      };

      let { error: insertError } = await supabase.from('diagnostic_reports').insert(insertPayload);
      if (insertError && payload.booking_id) {
        // Fallback without booking_id if column not created yet
        const { booking_id, ...fallbackPayload } = insertPayload;
        const retry = await supabase.from('diagnostic_reports').insert(fallbackPayload);
        insertError = retry.error;
      }
      if (insertError) throw insertError;

      // Auto-update linked lab booking to completed
      const bookingId = payload.booking_id;
      if (bookingId) {
        await supabase
          .from('lab_bookings')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('booking_id', bookingId);
      } else if (payload.citizen_id) {
        const openBooking = datasets.bookings.find(
          (b) =>
            b.citizen_id === payload.citizen_id &&
            b.provider_id === currentProvider.provider_id &&
            ['booked', 'sample_collected', 'in_progress', 'pending'].includes(b.status),
        );
        if (openBooking) {
          await supabase
            .from('lab_bookings')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('booking_id', openBooking.booking_id);
        }
      }

      await refreshData();
    });

  const uploadAndAttachReportDocument = async (reportId, file, citizenId = 'patient') =>
    withSaving(async () => {
      if (!supabase) return;
      if (!file) throw new Error('Please select a PDF document or image file.');

      const uploadRes = await uploadReportFile(file, citizenId);
      if (uploadRes.error) {
        throw new Error(uploadRes.error);
      }

      const updateData = {
        report_file_url: uploadRes.path,
        uploaded_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('diagnostic_reports')
        .update(updateData)
        .eq('report_id', reportId);

      if (updateError) throw updateError;
      await refreshData();
      return uploadRes;
    });

  const createCatalogTest = async (payload) =>
    withSaving(async () => {
      if (!supabase) return;

      let testTypeId = payload.test_type_id ? Number(payload.test_type_id) : null;

      // If no existing test_type selected, find or create one
      if (!testTypeId) {
        const cleanName = (payload.test_name || '').trim();
        const cleanCat = (payload.test_category || '').trim();

        if (!cleanName) throw new Error('Test name is required.');

        const existingType = datasets.testTypes.find(
          (item) =>
            item.test_name?.trim().toLowerCase() === cleanName.toLowerCase() &&
            item.test_category?.trim().toLowerCase() === cleanCat.toLowerCase(),
        );

        if (existingType) {
          testTypeId = existingType.test_id;
        } else {
          const { data: insertedType, error: testTypeError } = await supabase
            .from('test_types')
            .insert({
              test_name: cleanName,
              test_category: cleanCat || 'General Pathology',
              description: payload.description?.trim() || null,
            })
            .select('test_id')
            .single();

          if (testTypeError) throw testTypeError;
          testTypeId = insertedType.test_id;
        }
      }

      // Check if test is already in this laboratory's catalog
      const alreadyExists = datasets.labTests.some(
        (t) => t.provider_id === currentProvider.provider_id && t.test_type_id === testTypeId,
      );
      if (alreadyExists) {
        throw new Error('This test is already present in your laboratory catalog. You can edit its price directly.');
      }

      const { error: labTestError } = await supabase.from('lab_tests').insert({
        provider_id: currentProvider.provider_id,
        test_type_id: testTypeId,
        price: Number(payload.price) || 0,
      });

      if (labTestError) throw labTestError;
      await refreshData();
    });

  const updateCatalogTest = async (labTestId, payload) =>
    withSaving(async () => {
      if (!supabase) return;

      // Update price in lab_tests
      if (payload.price !== undefined) {
        const { error: priceError } = await supabase
          .from('lab_tests')
          .update({ price: Number(payload.price) })
          .eq('lab_test_id', labTestId)
          .eq('provider_id', currentProvider.provider_id);

        if (priceError) throw priceError;
      }

      // Update test type metadata if provided (excluding description which is master-locked)
      if (payload.test_type_id && (payload.test_name || payload.test_category)) {
        const typeUpdates = {};
        if (payload.test_name) typeUpdates.test_name = payload.test_name.trim();
        if (payload.test_category) typeUpdates.test_category = payload.test_category.trim();

        await supabase
          .from('test_types')
          .update(typeUpdates)
          .eq('test_id', payload.test_type_id);
      }

      await refreshData();
    });

  const deleteCatalogTest = async (labTestId) =>
    withSaving(async () => {
      if (!supabase) return;

      const { error: deleteError } = await supabase
        .from('lab_tests')
        .delete()
        .eq('lab_test_id', labTestId)
        .eq('provider_id', currentProvider.provider_id);

      if (deleteError) throw deleteError;
      await refreshData();
    });

  const updateProviderProfile = async (changes) =>
    withSaving(async () => {
      if (!supabase || !currentProvider.provider_id) return;

      const { error: updateError } = await supabase
        .from('provider')
        .update(changes)
        .eq('provider_id', currentProvider.provider_id);

      if (updateError) throw updateError;

      // Update stored session profile if updated
      const session = getStoredSession();
      if (session?.profile) {
        const updatedSession = {
          ...session,
          profile: {
            ...session.profile,
            ...changes,
          },
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
      }

      await refreshData();
    });

  const value = useMemo(
    () => ({
      ...datasets,
      bookings: providerBookings,
      allBookings: datasets.bookings,
      // Backward-compatibility aliases
      appointments: providerBookings,
      allAppointments: datasets.bookings,
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
      createBooking,
      createAppointment: createBooking,
      updateBookingStatus,
      updateAppointmentStatus: updateBookingStatus,
      findCitizenById,
      createReport,
      uploadAndAttachReportDocument,
      openReportDocument,
      getReportViewUrl,
      createCatalogTest,
      updateCatalogTest,
      deleteCatalogTest,
      updateProviderProfile,
    }),
    [
      currentProvider,
      datasets,
      error,
      loading,
      providerBookings,
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
