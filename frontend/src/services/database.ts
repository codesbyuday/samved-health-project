import { apiClient } from '@/services/apiClient';
import { supabase } from '@/lib/supabase';
import { USER_SESSION_KEY, type UserProfile } from '@/lib/auth';
import { canAccessModule, type ModuleKey } from '@/lib/rbac';

export function getCurrentHospitalId(): string {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      if (stored) {
        const user = JSON.parse(stored) as UserProfile;
        if (user.hospital_id) return user.hospital_id;
      }
    }
  } catch (e) {
    // ignore
  }
  return 'HOSP001';
}

// =====================
// Error Handling Utility
// =====================

export function parseErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const errObj = error as { message?: string; detail?: string };
    return errObj.message || errObj.detail || 'An error occurred while communicating with the backend server.';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred. Please try again.';
}

// =====================
// Types & Constants
// =====================

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export type LabReportStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled' | 'failed';
export const LAB_REPORT_STATUSES: { value: LabReportStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'verified', label: 'Verified' },
  { value: 'cancelled', label: 'Cancelled' },
];

export interface Citizen {
  citizen_id: string;
  user_id: string | null;
  guardian_id: string | null;
  name: string | null;
  age?: number | null;
  gender: 'Male' | 'Female' | 'Transgender' | null;
  phone: string | null;
  address: string | null;
  ward_number: number | null;
  aadhar_id: string | null;
  blood_group: BloodGroup | null;
  user_photo_url: string | null;
  date_of_birth: string | null;
  latest_visit_date?: string | null;
  last_visit?: string | null;
  created_at: string;
}

export interface Hospital {
  hospital_id: string;
  name: string | null;
  type: string | null;
  address: string | null;
  ward_id: number | null;
  contact_number: string | null;
  email: string | null;
  verified_by_smc: boolean | null;
  created_at: string;
}

export interface HospitalStaff {
  staff_uuid: string;
  staff_id: string | null;
  hospital_id: string | null;
  user_id: string | null;
  name: string | null;
  role: string | null;
  designation: string | null;
  department: string | null;
  phone: string | null;
  address: string | null;
  shift: string | null;
  status: string | null;
  joined_at: string;
}

export interface Doctor extends HospitalStaff {
  specialization: string | null;
  consultation_time: number | null;
  work_start_time: string | null;
  work_end_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  max_patients_per_day: number | null;
}

export interface Appointment {
  appointment_id: string;
  citizen_id: string | null;
  hospital_id: string | null;
  hospital_ward_id: string | null;
  doctor_id: string | null;
  appointment_type: string | null;
  appointment_date: string | null;
  time_slot: string | null;
  token_id: number | null;
  status: string | null;
  created_at: string;
  citizen?: Citizen | null;
  hospital?: Hospital | null;
  doctor?: Doctor | null;
  hospital_ward?: HospitalWard | null;
}

export interface Bed {
  bed_id: string;
  hospital_id: string | null;
  assigned_to: string | null;
  located_at: string | null;
  bed_type: string | null;
  bed_status: string | null;
  last_updated_on: string | null;
  assigned_citizen?: Citizen | null;
  hospital?: Hospital | null;
  ward?: HospitalWard | null;
}

export interface HospitalWard {
  hospital_ward_id: string;
  hospital_id: string | null;
  ward_name: string | null;
  ward_description: string | null;
  status: string | null;
  created_at: string;
}

export interface MedicalEquipment {
  equipment_uuid: string;
  equipment_id: string | null;
  hospital_id: string | null;
  equipment_name: string | null;
  equipment_category: string | null;
  condition_status: string | null;
  last_serviced_date: string | null;
  added_date: string | null;
  manufacturer: string | null;
  model_number: string | null;
  equipment_location: string | null;
  added_by: string | null;
  updated_by: string | null;
  hospital?: Hospital | null;
  added_by_staff?: HospitalStaff | null;
  updated_by_staff?: HospitalStaff | null;
}

export interface Ambulance {
  ambulance_vehicle_number: string;
  hospital_id: string | null;
  status: string | null;
  current_location: string | null;
  updated_at: string | null;
  hospital?: Hospital | null;
}

export interface DiseaseCase {
  case_id: string;
  id?: string;
  hospital_id: string | null;
  hospital_name?: string | null;
  hospital_address?: string | null;
  citizen_id: string | null;
  ward_number: number | null;
  disease_id: string | null;
  disease_name?: string | null;
  disease_type?: string | null;
  disease_category?: string | null;
  report_date: string | null;
  severity: string | null;
  status: string | null;
  reported_by: string | null;
  health_record_id?: string | null;
  updated_at?: string | null;
  doctor_name?: string | null;
  department?: string | null;
  designation?: string | null;
  citizen?: Citizen | null;
  hospital?: Hospital | null;
  disease?: Disease | null;
  ward?: Ward | null;
  reported_by_staff?: HospitalStaff | null;
}

export interface Disease {
  disease_id: string;
  disease_name: string | null;
  disease_type: string | null;
  disease_category: string | null;
  is_notifiable: boolean | null;
}

export interface MedicineStock {
  stock_id: string;
  hospital_id: string | null;
  medicine_id: string | null;
  quantity: number | null;
  threshold: number | null;
  expiry_date: string | null;
  last_updated: string | null;
  added_by: string | null;
  updated_by: string | null;
  medicine?: Medicine | null;
  hospital?: Hospital | null;
  added_by_staff?: HospitalStaff | null;
  updated_by_staff?: HospitalStaff | null;
}

export interface Medicine {
  medicine_id: string;
  medicine_name: string | null;
  medicine_category: string | null;
  manufacturer_name: string | null;
  description: string | null;
}

export interface Provider {
  provider_id: string;
  user_id?: string | null;
  ward_id?: number | null;
  name?: string | null;
  role?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  license?: string | null;
  status?: string | null;
}

export interface DiagnosticReport {
  report_id: string;
  id?: string;
  citizen_id: string | null;
  hospital_id: string | null;
  provider_id: string | null;
  test_type_id: number | null;
  test_name?: string | null;
  test_category?: string | null;
  result: string | null;
  description: string | null;
  report_file_url: string | null;
  status: string | null;
  test_date: string | null;
  uploaded_at: string | null;
  booking_id?: string | null;
  citizen?: Citizen | null;
  hospital?: Hospital | null;
  provider?: Provider | null;
  test_type?: TestType | null;
  issuer_type?: string | null;
  issuer_name?: string | null;
  issuer_address?: string | null;
}

export interface TestType {
  test_id: number;
  test_name: string | null;
  test_category: string | null;
  description: string | null;
}

export interface Complaint {
  complaint_id: string;
  citizen_id: string | null;
  hospital_id: string | null;
  description: string | null;
  priority: string | null;
  status: string | null;
  remarks_by_officers: string | null;
  created_at: string;
  resolved_at: string | null;
  category: string | null;
  citizen?: Citizen | null;
  hospital?: Hospital | null;
}

export interface Ward {
  ward_id: number;
  ward_name: string | null;
  zone: string | null;
  population: number | null;
  population_density: number | null;
}

export interface VaccinationRecord {
  record_id: string;
  id?: string;
  citizen_id: string | null;
  hospital_id: string | null;
  campaign_id: string | null;
  vaccine_type: string | null;
  dose_number: number | null;
  date_administered: string | null;
  hospital?: Hospital | null;
}

export interface HealthRecord {
  record_id: string;
  id?: string;
  report_id?: string;
  citizen_id: string | null;
  hospital_id: string | null;
  staff_id: string | null;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  visit_date: string | null;
  hospital?: Hospital | null;
  staff?: HospitalStaff | null;
  doctor?: HospitalStaff | null;
}

export type RecentPatient = Citizen;

export const DEPARTMENTS = [
  'general',
  'cardiology',
  'dermatology',
  'pediatrics',
  'gynecology',
  'orthopedics',
  'neurology',
  'oncology',
  'psychiatry',
  'ophthalmology',
  'ent',
  'urology',
  'endocrinology',
  'gastroenterology',
  'pulmonology',
  'nephrology'
] as const;

export type Department = typeof DEPARTMENTS[number];

export const TIME_SLOTS = [
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
  '18:00-19:00',
  '19:00-20:00'
] as const;

export type TimeSlot = typeof TIME_SLOTS[number];

// =====================
// CITIZENS SERVICE
// =====================

export const citizenService = {
  async getAll(): Promise<{ data: Citizen[] | null; error: string | null }> {
    return apiClient.get<Citizen[]>('/citizens');
  },

  async getById(citizenId: string): Promise<{ data: Citizen | null; error: string | null }> {
    return apiClient.get<Citizen>(`/citizens/${citizenId}`);
  },

  async search(query: string): Promise<{ data: Citizen[] | null; error: string | null }> {
    if (!query || !query.trim()) return { data: [], error: null };
    const q = query.trim();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('citizens')
          .select('*')
          .or(`name.ilike.%${q}%,citizen_id.ilike.%${q}%,phone.ilike.%${q}%`)
          .limit(20);
        if (!error && data) {
          return { data: data as Citizen[], error: null };
        }
      } catch {}
    }
    return apiClient.get<Citizen[]>('/citizens/search', { q });
  },

  async searchByIdType(
    idType: 'health_id' | 'aadhar_id' | 'phone',
    idValue: string
  ): Promise<{ data: Citizen[] | null; error: string | null }> {
    const cleanId = idValue.trim();
    if (!cleanId) return { data: [], error: 'Please enter a search value' };

    if (supabase) {
      try {
        let query = supabase.from('citizens').select('*');
        if (idType === 'aadhar_id') {
          const cleanAadhar = cleanId.replace(/\s+/g, '');
          query = query.or(`aadhar_id.eq.${cleanAadhar},aadhar_id.ilike.%${cleanAadhar}%`);
        } else if (idType === 'phone') {
          const cleanPhone = cleanId.replace(/\D/g, '');
          query = query.or(`phone.eq.${cleanId},phone.ilike.%${cleanPhone || cleanId}%`);
        } else {
          // Default: health_id (citizen_id)
          query = query.ilike('citizen_id', cleanId);
        }

        const { data, error } = await query;
        if (error) {
          console.error('Error searching citizen in Supabase:', error);
          return { data: null, error: error.message };
        }
        return { data: (data as Citizen[]) || [], error: null };
      } catch (err: any) {
        console.warn('searchByIdType Supabase error, falling back:', err);
      }
    }

    const res = await this.search(cleanId);
    return res;
  },

  async verifyCitizen(
    idType: 'health_id' | 'aadhar_id' | 'phone',
    idValue: string
  ): Promise<{ data: (Citizen & { ward?: any; age?: number }) | null; error: string | null }> {
    const cleanId = idValue.trim();
    if (!cleanId) return { data: null, error: 'Please enter an ID to verify' };

    if (supabase) {
      try {
        let query = supabase.from('citizens').select('*, wards(*)');
        if (idType === 'aadhar_id') {
          const cleanAadhar = cleanId.replace(/\s+/g, '');
          query = query.or(`aadhar_id.eq.${cleanAadhar},aadhar_id.ilike.%${cleanAadhar}%`);
        } else if (idType === 'phone') {
          const cleanPhone = cleanId.replace(/\D/g, '');
          query = query.or(`phone.eq.${cleanId},phone.ilike.%${cleanPhone || cleanId}%`);
        } else {
          query = query.ilike('citizen_id', cleanId);
        }

        const { data, error } = await query.limit(1).maybeSingle();
        if (error) {
          console.error('Error verifying citizen in Supabase:', error);
        } else if (data) {
          let age: number | undefined;
          if (data.date_of_birth) {
            const birthDate = new Date(data.date_of_birth);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
          }
          return {
            data: {
              ...data,
              ward: data.wards || null,
              age,
            },
            error: null,
          };
        }
      } catch (err: any) {
        console.warn('verifyCitizen Supabase error, falling back to API:', err);
      }
    }

    // Fallback: search by query
    const res = await this.search(cleanId);
    if (res.data && res.data.length > 0) {
      const match = res.data[0];
      let age: number | undefined;
      if (match.date_of_birth) {
        const birthDate = new Date(match.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      return {
        data: {
          ...match,
          age,
        },
        error: null,
      };
    }

    return { data: null, error: 'Citizen not found in system' };
  },

  async create(citizen: Partial<Citizen>): Promise<{ data: Citizen | null; error: string | null }> {
    return apiClient.post<Citizen>('/citizens', citizen);
  },

  async update(citizenId: string, updates: Partial<Citizen>): Promise<{ data: Citizen | null; error: string | null }> {
    return apiClient.patch<Citizen>(`/citizens/${citizenId}`, updates);
  },

  async count(): Promise<{ count: number; error: string | null }> {
    const res = await apiClient.get<{ count: number }>('/citizens/count');
    return { count: res.data?.count || 0, error: res.error };
  }
};

// =====================
// HOSPITALS SERVICE
// =====================

export const hospitalService = {
  async getAll(): Promise<{ data: Hospital[] | null; error: string | null }> {
    return apiClient.get<Hospital[]>('/hospitals');
  },

  async getById(hospitalId: string): Promise<{ data: Hospital | null; error: string | null }> {
    return apiClient.get<Hospital>(`/hospitals/${hospitalId}`);
  },

  async getFirst(): Promise<{ data: Hospital | null; error: string | null }> {
    const res = await apiClient.get<Hospital[]>('/hospitals');
    return { data: res.data?.[0] || null, error: res.error };
  },

  async search(query: string): Promise<{ data: Hospital[] | null; error: string | null }> {
    const res = await apiClient.get<Hospital[]>('/hospitals');
    if (!query || !query.trim()) return res;
    const q = query.toLowerCase().trim();
    const filtered = (res.data || []).filter(h =>
      (h.name || '').toLowerCase().includes(q) ||
      (h.type || '').toLowerCase().includes(q) ||
      (h.address || '').toLowerCase().includes(q)
    );
    return { data: filtered, error: res.error };
  }
};

// =====================
// DOCTORS SERVICE
// =====================

export const doctorService = {
  async getAll(hospitalId?: string): Promise<{ data: Doctor[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    if (supabase) {
      try {
        const { data: staffData, error: staffError } = await supabase
          .from('hospital_staff')
          .select('*, doctors(*)')
          .eq('hospital_id', target)
          .eq('role', 'doctor');

        if (!staffError && staffData && staffData.length > 0) {
          const docs: Doctor[] = staffData.map((s: any) => {
            const d = s.doctors || {};
            return {
              ...d,
              ...s,
              staff_uuid: s.staff_uuid,
              name: s.name,
              department: s.department || d.specialization || 'General',
              specialization: d.specialization || s.department || 'General',
              consultation_time: d.consultation_time || 15,
            };
          });
          return { data: docs, error: null };
        }
      } catch (e) {
        console.warn('Supabase doctorService error:', e);
      }
    }
    return apiClient.get<Doctor[]>(`/hospitals/${target}/doctors`);
  },

  async getAllByHospital(hospitalId?: string): Promise<{ data: Doctor[] | null; error: string | null }> {
    return this.getAll(hospitalId);
  },

  async searchByHospital(query: string, hospitalId?: string): Promise<{ data: Doctor[] | null; error: string | null }> {
    const res = await this.getAll(hospitalId);
    if (!query || !query.trim()) return res;
    const q = query.toLowerCase().trim();
    const filtered = (res.data || []).filter(d => 
      (d.name || '').toLowerCase().includes(q) || 
      (d.specialization || '').toLowerCase().includes(q) ||
      (d.department || '').toLowerCase().includes(q)
    );
    return { data: filtered, error: res.error };
  },

  async getByDepartment(department: string, hospitalId?: string): Promise<{ data: Doctor[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    if (!department || department === 'not_decided' || department === 'all') {
      return this.getAll(target);
    }
    const res = await this.getAll(target);
    if (res.data) {
      const filtered = res.data.filter(d =>
        (d.department || '').toLowerCase() === department.toLowerCase() ||
        (d.specialization || '').toLowerCase() === department.toLowerCase()
      );
      return { data: filtered, error: null };
    }
    return apiClient.get<Doctor[]>(`/hospitals/${target}/doctors`, { department });
  },

  async getById(doctorId: string, hospitalId?: string): Promise<{ data: Doctor | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    const res = await this.getAll(target);
    const match = res.data?.find(d => d.staff_uuid === doctorId);
    return { data: match || null, error: res.error };
  }
};

// =====================
// APPOINTMENTS SERVICE
// =====================

let aptsCachePromise: { [key: string]: { promise: Promise<{ data: Appointment[] | null; error: string | null }>; timestamp: number } } = {};

export const appointmentService = {
  async getAll(hospitalId?: string): Promise<{ data: Appointment[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, citizen:citizens(*, wards(*)), doctor:doctors(*, hospital_staff(*)), hospital:hospitals(*)')
          .eq('hospital_id', target)
          .order('appointment_date', { ascending: false });

        if (!error && data) {
          const normalized = data.map((apt: any) => {
            const staff = apt.doctor?.hospital_staff;
            return {
              ...apt,
              doctor: {
                ...apt.doctor,
                name: staff?.name || apt.doctor?.name || 'Dr. Specialist',
                department: staff?.department || apt.doctor?.department || apt.doctor?.specialization || 'General',
                phone: staff?.phone || apt.doctor?.phone || null,
                specialization: apt.doctor?.specialization || staff?.department || 'General',
                designation: staff?.designation || null,
              }
            };
          });
          return { data: normalized as Appointment[], error: null };
        }
      } catch (err) {
        console.warn('Supabase appointment fetch error, using API fallback:', err);
      }
    }
    const now = Date.now();
    const cached = aptsCachePromise[target];
    if (cached && (now - cached.timestamp < 5000)) {
      return cached.promise;
    }
    const promise = apiClient.get<Appointment[]>('/appointments', { hospital_id: target }).then((res) => {
      if (res.data) {
        const normalized = res.data.map((apt: any) => ({
          ...apt,
          doctor: {
            ...apt.doctor,
            department: apt.doctor?.department || apt.doctor?.specialization || 'General',
          }
        }));
        return { data: normalized as Appointment[], error: null };
      }
      return res;
    });
    aptsCachePromise[target] = { promise, timestamp: now };
    return promise;
  },

  async getByDate(date: string, hospitalId?: string): Promise<{ data: Appointment[] | null; error: string | null }> {
    return this.getAll(hospitalId);
  },

  async getToday(hospitalId?: string): Promise<{ data: Appointment[] | null; error: string | null }> {
    return this.getAll(hospitalId);
  },

  async getById(appointmentId: string, hospitalId?: string): Promise<{ data: Appointment | null; error: string | null }> {
    const res = await this.getAll(hospitalId);
    const match = res.data?.find(a => a.appointment_id === appointmentId);
    return { data: match || null, error: res.error };
  },

  async create(appointment: Partial<Appointment>): Promise<{ data: Appointment | null; error: string | null }> {
    aptsCachePromise = {};
    if (supabase) {
      try {
        const target = appointment.hospital_id || getCurrentHospitalId();
        const aptId = `APT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const newApt = {
          appointment_id: aptId,
          citizen_id: appointment.citizen_id,
          hospital_id: target,
          doctor_id: appointment.doctor_id,
          appointment_date: appointment.appointment_date,
          time_slot: appointment.time_slot,
          appointment_type: appointment.appointment_type || 'in_person',
          status: appointment.status || 'booked',
          token_id: Math.floor(Math.random() * 20) + 1,
        };

        const { data, error } = await supabase.from('appointments').insert(newApt).select().single();
        if (!error && data) {
          return { data: data as Appointment, error: null };
        }
      } catch (err) {
        console.warn('Supabase direct appointment insert error, falling back to API:', err);
      }
    }
    return apiClient.post<Appointment>('/appointments', appointment);
  },

  async update(appointmentId: string, updates: { status: string }): Promise<{ data: Appointment | null; error: string | null }> {
    aptsCachePromise = {};
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('appointments')
          .update(updates)
          .eq('appointment_id', appointmentId)
          .select()
          .single();
        if (!error && data) {
          return { data: data as Appointment, error: null };
        }
      } catch (err) {
        console.warn('Supabase appointment update error, using API fallback:', err);
      }
    }
    return apiClient.patch<Appointment>(`/appointments/${appointmentId}`, updates);
  },

  async cancel(appointmentId: string): Promise<{ data: Appointment | null; error: string | null }> {
    return this.update(appointmentId, { status: 'cancelled' });
  },

  async countToday(hospitalId?: string): Promise<{ count: number; error: string | null }> {
    const res = await this.getAll(hospitalId);
    const today = new Date().toISOString().split('T')[0];
    const todayApts = res.data?.filter(a => a.appointment_date === today) || [];
    return { count: todayApts.length, error: res.error };
  }
};

// =====================
// BEDS SERVICE
// =====================

export const bedService = {
  async getAll(hospitalId?: string): Promise<{ data: Bed[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    return apiClient.get<Bed[]>(`/hospitals/${target}/beds`);
  },

  async getAvailable(hospitalId?: string): Promise<{ data: Bed[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    const res = await apiClient.get<Bed[]>(`/hospitals/${target}/beds`);
    const available = res.data?.filter(b => b.bed_status === 'available') || [];
    return { data: available, error: res.error };
  },

  async updateStatus(bedId: string, status: string, citizenId?: string | null): Promise<{ data: Bed | null; error: string | null }> {
    return apiClient.patch<Bed>(`/hospitals/beds/${bedId}`, { bed_status: status, assigned_to: citizenId });
  }
};

// =====================
// DISEASE SURVEILLANCE & CASES SERVICE
// =====================

export const diseaseCaseService = {
  async getAll(): Promise<{ data: DiseaseCase[] | null; error: string | null }> {
    return apiClient.get<DiseaseCase[]>('/disease-surveillance/cases');
  },

  async getByCitizen(citizenId: string): Promise<{ data: DiseaseCase[] | null; error: string | null }> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('disease_cases')
          .select('*, diseases(*), hospitals(*), hospital_staff!fk_reported_by_staff(*)')
          .eq('citizen_id', citizenId)
          .order('report_date', { ascending: false });
        if (!error && data && data.length > 0) {
          const mapped = data.map((d: any) => ({
            ...d,
            disease: d.diseases,
            disease_name: d.diseases?.disease_name || d.disease_name,
            disease_type: d.diseases?.disease_type || d.disease_type,
            disease_category: d.diseases?.disease_category || d.disease_category,
            hospital: d.hospitals,
            hospital_name: d.hospitals?.name || d.hospital_name,
            hospital_address: d.hospitals?.address || d.hospital_address,
            reported_by_staff: d.hospital_staff,
            doctor_name: d.hospital_staff?.name || d.doctor_name,
            department: d.hospital_staff?.department || d.department,
            designation: d.hospital_staff?.designation || d.designation,
          })) as DiseaseCase[];
          return { data: mapped, error: null };
        }
      }
      const res = await apiClient.get<DiseaseCase[]>('/disease-surveillance/cases', { citizen_id: citizenId });
      return res;
    } catch (err: any) {
      return { data: null, error: parseErrorMessage(err) };
    }
  },

  async create(diseaseCase: Partial<DiseaseCase>): Promise<{ data: DiseaseCase | null; error: string | null }> {
    return apiClient.post<DiseaseCase>('/disease-surveillance/cases', diseaseCase);
  }
};

export const diseaseService = {
  async getAll(): Promise<{ data: Disease[] | null; error: string | null }> {
    return apiClient.get<Disease[]>('/disease-surveillance/diseases');
  },

  async search(query: string): Promise<{ data: Disease[] | null; error: string | null }> {
    const res = await this.getAll();
    if (!query || !query.trim()) return res;
    const q = query.toLowerCase().trim();
    const filtered = (res.data || []).filter(d => 
      (d.disease_name || '').toLowerCase().includes(q) ||
      (d.disease_category || '').toLowerCase().includes(q) ||
      (d.disease_type || '').toLowerCase().includes(q)
    );
    return { data: filtered, error: res.error };
  },

  async getByCitizen(citizenId: string): Promise<{ data: DiseaseCase[] | null; error: string | null }> {
    return diseaseCaseService.getByCitizen(citizenId);
  },

  async create(diseaseCase: Partial<DiseaseCase>): Promise<{ data: DiseaseCase | null; error: string | null }> {
    return diseaseCaseService.create(diseaseCase);
  },

  async createDisease(disease: Partial<Disease>): Promise<{ data: Disease | null; error: string | null }> {
    if (supabase) {
      try {
        const id = disease.disease_id || `DIS-${Date.now().toString(36).toUpperCase()}`;
        const newRecord = { ...disease, disease_id: id };
        const { data, error } = await supabase.from('diseases').insert(newRecord).select().single();
        if (!error && data) {
          return { data: data as Disease, error: null };
        }
      } catch (err: any) {
        return { data: null, error: parseErrorMessage(err) };
      }
    }
    return apiClient.post<Disease>('/disease-surveillance/diseases', disease);
  }
};

// =====================
// PHARMACY & MEDICINE SERVICE
// =====================

export const medicineService = {
  async getAll(): Promise<{ data: Medicine[] | null; error: string | null }> {
    return apiClient.get<Medicine[]>('/pharmacies/medicines');
  },

  async search(query: string): Promise<{ data: Medicine[] | null; error: string | null }> {
    const res = await this.getAll();
    if (!query || !query.trim()) return res;
    const q = query.toLowerCase().trim();
    const filtered = (res.data || []).filter(
      (m) =>
        (m.medicine_name || '').toLowerCase().includes(q) ||
        (m.medicine_id || '').toLowerCase().includes(q) ||
        (m.medicine_category || '').toLowerCase().includes(q) ||
        (m.manufacturer_name || '').toLowerCase().includes(q)
    );
    return { data: filtered, error: res.error };
  },
};

export const medicinesService = medicineService;

export const medicineStockService = {
  async getAll(hospitalId?: string): Promise<{ data: MedicineStock[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('hospital_medicine_stock')
          .select('*, medicines(*), hospitals(*)')
          .eq('hospital_id', target)
          .order('last_updated', { ascending: false });

        if (!error && data) {
          const mapped = data.map((s: any) => ({
            ...s,
            medicine: s.medicines,
            hospital: s.hospitals,
          })) as MedicineStock[];
          return { data: mapped, error: null };
        }
      } catch {
        // Fallback to API endpoint
      }
    }
    return apiClient.get<MedicineStock[]>('/pharmacies/stock', { hospital_id: target });
  },

  async getById(stockId: string): Promise<{ data: MedicineStock | null; error: string | null }> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('hospital_medicine_stock')
          .select('*, medicines(*), hospitals(*)')
          .eq('stock_id', stockId)
          .maybeSingle();

        if (!error && data) {
          return {
            data: {
              ...data,
              medicine: data.medicines,
              hospital: data.hospitals,
            } as MedicineStock,
            error: null,
          };
        }
      } catch {
        // Fallback to API endpoint
      }
    }
    return apiClient.get<MedicineStock>(`/pharmacies/stock/${stockId}`);
  },

  async create(payload: Partial<MedicineStock>): Promise<{ data: MedicineStock | null; error: string | null }> {
    const target = payload.hospital_id || getCurrentHospitalId();
    const payloadWithHospital = { ...payload, hospital_id: target };
    return apiClient.post<MedicineStock>('/pharmacies/stock', payloadWithHospital);
  },

  async update(stockId: string, payload: Partial<MedicineStock>): Promise<{ data: MedicineStock | null; error: string | null }> {
    return apiClient.patch<MedicineStock>(`/pharmacies/stock/${stockId}`, payload);
  },

  async updateQuantity(stockId: string, quantity: number): Promise<{ data: MedicineStock | null; error: string | null }> {
    return apiClient.patch<MedicineStock>(`/pharmacies/stock/${stockId}`, { quantity });
  },

  async delete(stockId: string): Promise<{ data: any; error: string | null }> {
    return apiClient.delete(`/pharmacies/stock/${stockId}`);
  },
};

// =====================
// DIAGNOSTIC REPORTS SERVICE
// =====================

export const diagnosticReportService = {
  async getAll(hospitalId?: string): Promise<{ data: DiagnosticReport[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('diagnostic_reports')
          .select('*, citizen:citizens(*), test_type:test_types(*), hospital:hospitals(*)')
          .eq('hospital_id', target)
          .order('uploaded_at', { ascending: false });

        if (!error && data) {
          const mapped = data.map((r: any) => ({
            ...r,
            issuer_type: 'Hospital',
            issuer_name: r.hospital?.name || r.hospital_id,
            issuer_address: r.hospital?.address || null,
            test_name: r.test_type?.test_name || r.test_name,
            test_category: r.test_type?.test_category || r.test_category,
          })) as DiagnosticReport[];
          return { data: mapped, error: null };
        }
      } catch {
        // Fallback to apiClient
      }
    }
    return apiClient.get<DiagnosticReport[]>('/laboratories/reports', { hospital_id: target });
  },

  async getByCitizen(citizenId: string): Promise<{ data: DiagnosticReport[] | null; error: string | null }> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('diagnostic_reports')
          .select('*, citizen:citizens(*), test_type:test_types(*), hospital:hospitals(*)')
          .eq('citizen_id', citizenId)
          .order('uploaded_at', { ascending: false });

        if (!error && data) {
          const providerIds = Array.from(new Set(data.map((d: any) => d.provider_id).filter(Boolean)));
          let providerMap: Record<string, any> = {};
          if (providerIds.length > 0) {
            const { data: provs } = await supabase
              .from('provider')
              .select('*')
              .in('provider_id', providerIds);
            if (provs) {
              provs.forEach((p: any) => {
                providerMap[p.provider_id] = p;
              });
            }
          }

          const mapped = data.map((r: any) => {
            const prov = r.provider_id ? providerMap[r.provider_id] : null;
            return {
              ...r,
              provider: prov,
              issuer_type: r.hospital_id ? 'Hospital' : r.provider_id ? 'Diagnostic Laboratory' : 'Diagnostic Facility',
              issuer_name: r.hospital?.name || prov?.name || r.hospital_id || r.provider_id || 'Diagnostic Facility',
              issuer_address: r.hospital?.address || prov?.address || null,
              test_name: r.test_type?.test_name || r.test_name,
              test_category: r.test_type?.test_category || r.test_category,
            };
          }) as DiagnosticReport[];
          return { data: mapped, error: null };
        }
      } catch {
        // Fallback to apiClient
      }
    }
    return apiClient.get<DiagnosticReport[]>('/laboratories/reports', { citizen_id: citizenId });
  },

  async create(report: Partial<DiagnosticReport>): Promise<{ data: DiagnosticReport | null; error: string | null }> {
    const target = report.hospital_id || getCurrentHospitalId();
    const payload = {
      ...report,
      hospital_id: target,
      status: report.status || 'pending',
      uploaded_at: report.uploaded_at || new Date().toISOString(),
    };
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('diagnostic_reports')
          .insert(payload)
          .select('*, citizen:citizens(*), test_type:test_types(*), hospital:hospitals(*)')
          .single();
        if (!error && data) {
          return { data: data as DiagnosticReport, error: null };
        }
      } catch {
        // Fallback to apiClient
      }
    }
    return apiClient.post<DiagnosticReport>('/laboratories/reports', payload);
  },

  async update(reportId: string, updates: Partial<DiagnosticReport>): Promise<{ data: DiagnosticReport | null; error: string | null }> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('diagnostic_reports')
          .update(updates)
          .eq('report_id', reportId)
          .select('*, citizen:citizens(*), test_type:test_types(*), hospital:hospitals(*)')
          .maybeSingle();
        if (!error && data) {
          return { data: data as DiagnosticReport, error: null };
        }
      } catch {
        // Fallback to apiClient
      }
    }
    return apiClient.patch<DiagnosticReport>(`/laboratories/reports/${reportId}`, updates);
  },

  async getTestTypes(): Promise<{ data: TestType[] | null; error: string | null }> {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('test_types')
          .select('*')
          .order('test_name', { ascending: true });
        if (!error && data) {
          return { data: data as TestType[], error: null };
        }
      } catch {
        // Fallback
      }
    }
    return apiClient.get<TestType[]>('/laboratories/test-types');
  }
};

// =====================
// COMPLAINTS SERVICE
// =====================

export const complaintService = {
  async getAll(): Promise<{ data: Complaint[] | null; error: string | null }> {
    return apiClient.get<Complaint[]>('/smc/complaints');
  },

  async resolve(complaintId: string, remarks?: string): Promise<{ data: Complaint | null; error: string | null }> {
    return apiClient.patch<Complaint>(`/smc/complaints/${complaintId}/resolve${remarks ? `?remarks=${encodeURIComponent(remarks)}` : ''}`);
  }
};

// =====================
// INFRASTRUCTURE & EXT SERVICES
// =====================

export const hospitalWardService = {
  async getAll(hospitalId?: string): Promise<{ data: HospitalWard[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    const res = await apiClient.get<Ward[]>('/smc/wards');
    const wards = (res.data || []).map(w => ({
      hospital_ward_id: `HW-${w.ward_id}`,
      hospital_id: target,
      ward_name: w.ward_name,
      ward_description: `Zone: ${w.zone}`,
      status: 'Active',
      created_at: new Date().toISOString()
    }));
    return { data: wards, error: res.error };
  }
};

export const wardService = {
  async getAll(): Promise<{ data: Ward[] | null; error: string | null }> {
    return apiClient.get<Ward[]>('/smc/wards');
  }
};

export const staffService = {
  async getAll(hospitalId?: string): Promise<{ data: HospitalStaff[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    const res = await apiClient.get<Doctor[]>(`/hospitals/${target}/doctors`);
    return { data: res.data || [], error: res.error };
  }
};

let overviewPromiseCache: { [key: string]: { promise: Promise<{ data: any; error: string | null }>; timestamp: number } } = {};

const fetchDashboardOverview = async (hospitalId?: string) => {
  const target = hospitalId || getCurrentHospitalId();
  const now = Date.now();
  const cached = overviewPromiseCache[target];
  if (cached && (now - cached.timestamp < 3000)) {
    return cached.promise;
  }
  const promise = apiClient.get<any>(`/hospitals/${target}/dashboard-overview`);
  overviewPromiseCache[target] = { promise, timestamp: now };
  return promise;
};

export const dashboardService = {
  async getSummary(): Promise<{ data: any; error: string | null }> {
    return apiClient.get<any>('/smc/analytics');
  },

  async getStatsWithTrends(hospitalId?: string): Promise<{ data: any; error: string | null }> {
    try {
      const res = await fetchDashboardOverview(hospitalId);
      if (res.data?.stats) {
        return { data: res.data.stats, error: null };
      }
      return { data: null, error: res.error || 'Failed to load stats' };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load dashboard stats' };
    }
  },

  async getPatientVisitsData(hospitalId?: string): Promise<{ data: { date: string; patients: number; emergencies: number }[] | null; error: string | null }> {
    try {
      const res = await fetchDashboardOverview(hospitalId);
      if (res.data?.patientVisits) {
        return { data: res.data.patientVisits, error: null };
      }
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const data = days.map((day, idx) => ({
        date: day,
        patients: 25 + (idx * 5) % 18,
        emergencies: 4 + (idx * 2) % 7,
      }));
      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load visit data' };
    }
  },

  async getDiseaseTrends(hospitalId?: string): Promise<{ data: { name: string; cases: number; trend: string }[] | null; error: string | null }> {
    try {
      const res = await fetchDashboardOverview(hospitalId);
      if (res.data?.diseaseTrends) {
        return { data: res.data.diseaseTrends, error: null };
      }
      return { data: null, error: res.error };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load disease trends' };
    }
  },

  async getBedOccupancyData(hospitalId?: string): Promise<{ data: any; error: string | null }> {
    try {
      const res = await fetchDashboardOverview(hospitalId);
      if (res.data?.bedOccupancy) {
        return { data: res.data.bedOccupancy, error: null };
      }
      return { data: null, error: res.error };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load bed occupancy' };
    }
  },

  async getDynamicAlerts(hospitalId?: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const res = await fetchDashboardOverview(hospitalId);
      if (res.data?.alerts) {
        return { data: res.data.alerts, error: null };
      }
      return { data: null, error: res.error };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load alerts' };
    }
  },

  async getRecentActivities(hospitalId?: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const res = await fetchDashboardOverview(hospitalId);
      if (res.data?.activities) {
        return { data: res.data.activities, error: null };
      }
      return { data: null, error: res.error };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load recent activities' };
    }
  }
};

export const healthCardService = {
  async getByCitizenId(citizenId: string): Promise<{ data: any; error: string | null }> {
    return apiClient.get<any>(`/health-cards/${citizenId}`);
  },
  async create(citizenId: string): Promise<{ data: any; error: string | null }> {
    return apiClient.post<any>('/health-cards', { citizen_id: citizenId });
  }
};

export const vaccinationRecordService = {
  async getAll(): Promise<{ data: any[] | null; error: string | null }> {
    return apiClient.get<any[]>('/smc/campaigns');
  },
  async getByCitizen(citizenId: string): Promise<{ data: VaccinationRecord[] | null; error: string | null }> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('vaccination_records')
          .select('*, hospitals(*)')
          .eq('citizen_id', citizenId)
          .order('date_administered', { ascending: false });
        if (!error && data) {
          const records = data.map((r: any) => ({
            ...r,
            hospital: r.hospitals as Hospital,
          })) as VaccinationRecord[];
          return { data: records, error: null };
        }
      }
      const res = await apiClient.get<any[]>(`/citizens/${citizenId}/vaccinations`);
      return { data: res.data || [], error: res.error };
    } catch (err: any) {
      return { data: null, error: parseErrorMessage(err) };
    }
  }
};

export const healthRecordService = {
  async getAll(): Promise<{ data: any[] | null; error: string | null }> {
    return apiClient.get<any[]>('/laboratories/reports');
  },
  async getByCitizen(citizenId: string): Promise<{ data: HealthRecord[] | null; error: string | null }> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('health_records')
          .select('*, hospitals(*), hospital_staff(*)')
          .eq('citizen_id', citizenId)
          .order('visit_date', { ascending: false });
        if (!error && data) {
          const records = data.map((h: any) => ({
            ...h,
            hospital: h.hospitals as Hospital,
            staff: h.hospital_staff as HospitalStaff,
            doctor: h.hospital_staff as HospitalStaff,
          })) as HealthRecord[];
          return { data: records, error: null };
        }
      }
      const res = await apiClient.get<any[]>(`/citizens/${citizenId}/health-records`);
      return { data: res.data || [], error: res.error };
    } catch (err: any) {
      return { data: null, error: parseErrorMessage(err) };
    }
  }
};

export const appointmentServiceExt = {
  ...appointmentService,
  async getByCitizen(citizenId: string): Promise<{ data: Appointment[] | null; error: string | null }> {
    try {
      if (supabase) {
        const { data, error } = await supabase
          .from('appointments')
          .select('*, hospitals(*), doctors(*, hospital_staff(*))')
          .eq('citizen_id', citizenId)
          .order('appointment_date', { ascending: false });
        if (!error && data) {
          const appointments = data.map((a: any) => ({
            ...a,
            citizen: a.citizens as Citizen,
            hospital: a.hospitals as Hospital,
            doctor: a.doctors
              ? ({
                  ...(a.doctors.hospital_staff || {}),
                  specialization: a.doctors.specialization,
                  consultation_time: a.doctors.consultation_time,
                  work_start_time: a.doctors.work_start_time,
                  work_end_time: a.doctors.work_end_time,
                  break_start_time: a.doctors.break_start_time,
                  break_end_time: a.doctors.break_end_time,
                  max_patients_per_day: a.doctors.max_patients_per_day,
                } as Doctor)
              : null,
          })) as Appointment[];
          return { data: appointments, error: null };
        }
      }
      return apiClient.get<Appointment[]>('/appointments', { citizen_id: citizenId });
    } catch (err: any) {
      return { data: null, error: parseErrorMessage(err) };
    }
  }
};

export const citizenProfileService = {
  ...citizenService,

  async getFullProfile(citizenId: string): Promise<{
    data: {
      citizen: Citizen | null;
      appointments: Appointment[];
      labReports: DiagnosticReport[];
      vaccinationRecords: VaccinationRecord[];
      healthRecords: HealthRecord[];
    } | null;
    error: string | null;
  }> {
    try {
      if (!citizenId) {
        return { data: null, error: 'Citizen ID is required' };
      }

      // 1. Fetch citizen details (try Supabase first, fallback to FastAPI)
      let citizen: Citizen | null = null;
      if (supabase) {
        const { data } = await supabase
          .from('citizens')
          .select('*')
          .eq('citizen_id', citizenId)
          .maybeSingle();
        if (data) citizen = data as Citizen;
      }

      if (!citizen) {
        const res = await apiClient.get<Citizen>(`/citizens/${citizenId}`);
        if (res.data) citizen = res.data;
      }

      if (!citizen) {
        return { data: null, error: `Citizen ID "${citizenId}" does not exist in our records.` };
      }

      // 2. Fetch all collections in parallel from Supabase
      let appointments: Appointment[] = [];
      let labReports: DiagnosticReport[] = [];
      let vaccinationRecords: VaccinationRecord[] = [];
      let healthRecords: HealthRecord[] = [];

      if (supabase) {
        const [apptRes, labRes, vacRes, healthRes] = await Promise.allSettled([
          supabase
            .from('appointments')
            .select('*, hospitals(*), doctors(*, hospital_staff(*))')
            .eq('citizen_id', citizenId)
            .order('appointment_date', { ascending: false }),
          supabase
            .from('diagnostic_reports')
            .select('*, hospitals(*), test_types(*)')
            .eq('citizen_id', citizenId)
            .order('test_date', { ascending: false }),
          supabase
            .from('vaccination_records')
            .select('*, hospitals(*)')
            .eq('citizen_id', citizenId)
            .order('date_administered', { ascending: false }),
          supabase
            .from('health_records')
            .select('*, hospitals(*), hospital_staff(*)')
            .eq('citizen_id', citizenId)
            .order('visit_date', { ascending: false }),
        ]);

        if (apptRes.status === 'fulfilled' && apptRes.value.data) {
          appointments = (apptRes.value.data as any[]).map((a) => ({
            ...a,
            citizen: citizen as Citizen,
            hospital: a.hospitals as Hospital,
            doctor: a.doctors
              ? ({
                  ...(a.doctors.hospital_staff || {}),
                  specialization: a.doctors.specialization,
                  consultation_time: a.doctors.consultation_time,
                  work_start_time: a.doctors.work_start_time,
                  work_end_time: a.doctors.work_end_time,
                  break_start_time: a.doctors.break_start_time,
                  break_end_time: a.doctors.break_end_time,
                  max_patients_per_day: a.doctors.max_patients_per_day,
                } as Doctor)
              : null,
          }));
        }

        if (labRes.status === 'fulfilled' && labRes.value.data) {
          labReports = (labRes.value.data as any[]).map((r) => ({
            ...r,
            citizen: citizen as Citizen,
            hospital: r.hospitals as Hospital,
            test_type: r.test_types as TestType,
          }));
        }

        if (vacRes.status === 'fulfilled' && vacRes.value.data) {
          vaccinationRecords = (vacRes.value.data as any[]).map((v) => ({
            ...v,
            hospital: v.hospitals as Hospital,
          }));
        }

        if (healthRes.status === 'fulfilled' && healthRes.value.data) {
          healthRecords = (healthRes.value.data as any[]).map((h) => ({
            ...h,
            hospital: h.hospitals as Hospital,
            staff: h.hospital_staff as HospitalStaff,
            doctor: h.hospital_staff as HospitalStaff,
          }));
        }
      }

      // 3. Fallback to FastAPI endpoints if needed
      if (healthRecords.length === 0) {
        try {
          const hrRes = await apiClient.get<any[]>(`/citizens/${citizenId}/health-records`);
          if (hrRes.data && hrRes.data.length > 0) {
            healthRecords = hrRes.data;
          }
        } catch {}
      }

      if (vaccinationRecords.length === 0) {
        try {
          const vrRes = await apiClient.get<any[]>(`/citizens/${citizenId}/vaccinations`);
          if (vrRes.data && vrRes.data.length > 0) {
            vaccinationRecords = vrRes.data;
          }
        } catch {}
      }

      return {
        data: {
          citizen,
          appointments,
          labReports,
          vaccinationRecords,
          healthRecords,
        },
        error: null,
      };
    } catch (error) {
      console.error('Error in citizenProfileService.getFullProfile:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async verifyCitizen(
    citizenId: string,
    credential: { type: 'phone' | 'aadhar'; value: string }
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      if (!citizenId) {
        return { success: false, error: 'Citizen ID is required' };
      }

      let citizen: Citizen | null = null;
      if (supabase) {
        const { data } = await supabase
          .from('citizens')
          .select('*')
          .eq('citizen_id', citizenId)
          .maybeSingle();
        if (data) citizen = data as Citizen;
      }

      if (!citizen) {
        const res = await apiClient.get<Citizen>(`/citizens/${citizenId}`);
        if (res.data) citizen = res.data;
      }

      if (!citizen) {
        return { success: false, error: 'Citizen not found in our records.' };
      }

      const cleanInput = (credential.value || '').replace(/\D/g, '').trim();

      if (credential.type === 'phone') {
        const citizenPhone = (citizen.phone || '').replace(/\D/g, '').trim();
        if (!citizenPhone) {
          return {
            success: false,
            error: 'No mobile number registered with this Citizen ID. Please contact your registered hospital.',
          };
        }

        // Compare exact, or 10-digit suffix (handles +91 or leading 0)
        if (
          citizenPhone === cleanInput ||
          citizenPhone.endsWith(cleanInput) ||
          cleanInput.endsWith(citizenPhone)
        ) {
          return { success: true, error: null };
        }

        return {
          success: false,
          error: 'The mobile number entered does not match our records for this citizen. Please check and try again.',
        };
      } else if (credential.type === 'aadhar') {
        const citizenAadhar = (citizen.aadhar_id || '').replace(/\D/g, '').trim();
        if (!citizenAadhar) {
          return {
            success: false,
            error: 'No Aadhar ID is registered for this citizen. Please verify using your registered mobile number instead.',
          };
        }

        if (citizenAadhar === cleanInput) {
          return { success: true, error: null };
        }

        return {
          success: false,
          error: 'The Aadhar ID entered does not match our records for this citizen. Please check and try again.',
        };
      }

      return { success: false, error: 'Invalid verification method.' };
    } catch (error) {
      console.error('Error verifying citizen:', error);
      return { success: false, error: parseErrorMessage(error) };
    }
  },
};

export const hospitalSearchService = hospitalService;
export const doctorSearchService = doctorService;
export const diseaseSearchService = diseaseService;

export const medicalEquipmentService = {
  async getAll(hospitalId?: string): Promise<{ data: MedicalEquipment[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    return apiClient.get<MedicalEquipment[]>(`/hospitals/${target}/equipment`);
  }
};

export const ambulanceService = {
  async getAll(hospitalId?: string): Promise<{ data: Ambulance[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    return apiClient.get<Ambulance[]>(`/hospitals/${target}/ambulances`);
  }
};

export const recentPatientsService = {
  async getRecent(limit: number = 10, hospitalId?: string): Promise<{ data: Citizen[] | null; error: string | null }> {
    const targetHospital = hospitalId || getCurrentHospitalId();
    if (supabase) {
      try {
        // Fetch recent visits from health_records for the current hospital
        const { data: hrList, error: hrError } = await supabase
          .from('health_records')
          .select('citizen_id, visit_date')
          .eq('hospital_id', targetHospital)
          .order('visit_date', { ascending: false });

        if (hrError) {
          console.warn('Error fetching recent health records:', hrError);
        }

        // Fetch recent appointments for the current hospital
        const { data: aptList, error: aptError } = await supabase
          .from('appointments')
          .select('citizen_id, appointment_date')
          .eq('hospital_id', targetHospital)
          .order('appointment_date', { ascending: false });

        if (aptError) {
          console.warn('Error fetching recent appointments:', aptError);
        }

        const citizenVisits = new Map<string, string>();

        (hrList || []).forEach(hr => {
          if (!hr.citizen_id || !hr.visit_date) return;
          const date = hr.visit_date;
          const existing = citizenVisits.get(hr.citizen_id);
          if (!existing || new Date(date).getTime() > new Date(existing).getTime()) {
            citizenVisits.set(hr.citizen_id, date);
          }
        });

        (aptList || []).forEach(apt => {
          if (!apt.citizen_id || !apt.appointment_date) return;
          const date = apt.appointment_date;
          const existing = citizenVisits.get(apt.citizen_id);
          if (!existing || new Date(date).getTime() > new Date(existing).getTime()) {
            citizenVisits.set(apt.citizen_id, date);
          }
        });

        // Top sorted citizen IDs up to requested limit (max 10)
        const sorted = Array.from(citizenVisits.entries())
          .sort((a, b) => new Date(b[1]).getTime() - new Date(a[1]).getTime())
          .slice(0, limit);

        if (sorted.length > 0) {
          const ids = sorted.map(x => x[0]);
          const { data: citizens, error: citError } = await supabase
            .from('citizens')
            .select('*')
            .in('citizen_id', ids);

          if (!citError && citizens) {
            const citizenMap = new Map(citizens.map(c => [c.citizen_id, c]));
            const result: Citizen[] = sorted.map(([cid, visitDate]) => {
              const c = citizenMap.get(cid) || ({ citizen_id: cid } as Citizen);
              return {
                ...c,
                latest_visit_date: visitDate,
                last_visit: visitDate,
              };
            });
            return { data: result, error: null };
          }
        } else {
          return { data: [], error: null };
        }
      } catch (err: any) {
        console.warn('recentPatientsService Supabase error, falling back:', err);
      }
    }

    const params = limit ? { limit: String(limit) } : undefined;
    return apiClient.get<Citizen[]>('/citizens', params);
  }
};

export const referralService = {
  async getAll(hospitalId?: string): Promise<{ data: any[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('referrals')
          .select('*, citizen:citizens(*), from_hospital:hospitals!from_hospital_id(*), to_hospital:hospitals!to_hospital_id(*), referring_doctor:hospital_staff!referring_doctor_id(*)')
          .or(`from_hospital_id.eq.${target},to_hospital_id.eq.${target}`)
          .order('created_at', { ascending: false });

        if (!error && data) {
          const toDoctorIds = Array.from(new Set(data.map((d: any) => d.to_doctor_id).filter(Boolean)));
          let toDoctorMap: Record<string, any> = {};
          if (toDoctorIds.length > 0) {
            const { data: toDocs } = await supabase
              .from('hospital_staff')
              .select('*')
              .in('staff_uuid', toDoctorIds);
            if (toDocs) {
              toDocs.forEach((doc: any) => {
                toDoctorMap[doc.staff_uuid] = doc;
              });
            }
          }

          const mapped = data.map((r: any) => ({
            ...r,
            to_doctor: r.to_doctor_id ? toDoctorMap[r.to_doctor_id] || null : null,
          }));

          return { data: mapped, error: null };
        }
      } catch (err) {
        // Fallback to apiClient
      }
    }
    return apiClient.get<any[]>('/referrals', { hospital_id: target });
  },

  async getOutgoing(hospitalId?: string): Promise<{ data: any[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    const res = await this.getAll(target);
    if (res.data) {
      return { data: res.data.filter((r: any) => r.from_hospital_id === target), error: null };
    }
    return { data: [], error: res.error };
  },

  async getIncoming(hospitalId?: string): Promise<{ data: any[] | null; error: string | null }> {
    const target = hospitalId || getCurrentHospitalId();
    const res = await this.getAll(target);
    if (res.data) {
      return { data: res.data.filter((r: any) => r.to_hospital_id === target), error: null };
    }
    return { data: [], error: res.error };
  },

  async create(referral: Partial<any>): Promise<{ data: any | null; error: string | null }> {
    if (supabase) {
      try {
        const payload = {
          ...referral,
          status: referral.status || 'pending',
          urgency_level: referral.urgency_level || 'normal',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('referrals')
          .insert(payload)
          .select('*, citizen:citizens(*), from_hospital:hospitals!from_hospital_id(*), to_hospital:hospitals!to_hospital_id(*), referring_doctor:hospital_staff!referring_doctor_id(*)')
          .single();

        if (!error && data) {
          return { data, error: null };
        }
      } catch (err) {
        // Fallback to apiClient
      }
    }
    return apiClient.post<any>('/referrals', referral);
  },

  async updateStatus(referralId: string, status: string, notes?: string): Promise<{ data: any | null; error: string | null }> {
    if (supabase) {
      try {
        const updateData: any = { status, updated_at: new Date().toISOString() };
        if (notes) updateData.notes = notes;
        const { data, error } = await supabase
          .from('referrals')
          .update(updateData)
          .eq('referral_id', referralId)
          .select()
          .maybeSingle();

        if (!error && data) {
          return { data, error: null };
        }
      } catch (err) {
        // Fallback to apiClient
      }
    }
    return apiClient.patch<any>(`/referrals/${referralId}`, { status, notes });
  }
};

// =====================
// SIDEBAR BADGES SERVICE
// =====================

export interface SidebarBadgeCounts {
  appointments: number;
  referrals: number;
  'medicine-stock': number;
  'lab-reports': number;
}

export const badgeService = {
  async getHospitalBadges(hospitalId?: string): Promise<SidebarBadgeCounts> {
    const target = hospitalId || getCurrentHospitalId();
    const counts: SidebarBadgeCounts = {
      appointments: 0,
      referrals: 0,
      'medicine-stock': 0,
      'lab-reports': 0,
    };

    if (supabase) {
      try {
        const [aptRes, refRes, stockRes, labRes] = await Promise.all([
          // 1. Appointments requiring action (booked at current hospital)
          supabase
            .from('appointments')
            .select('appointment_id')
            .eq('hospital_id', target)
            .eq('status', 'booked'),

          // 2. Referrals: incoming requests to this hospital pending review/acceptance
          supabase
            .from('referrals')
            .select('referral_id')
            .eq('to_hospital_id', target)
            .eq('status', 'pending'),

          // 3. Medicine Stock: medicines low on stock or expired
          supabase
            .from('hospital_medicine_stock')
            .select('quantity, threshold, expiry_date')
            .eq('hospital_id', target),

          // 4. Lab Reports: pending diagnostic reports at this hospital
          supabase
            .from('diagnostic_reports')
            .select('report_id')
            .eq('hospital_id', target)
            .eq('status', 'pending')
        ]);

        if (aptRes.data) {
          counts.appointments = aptRes.data.length;
        }

        if (refRes.data) {
          counts.referrals = refRes.data.length;
        }

        if (stockRes.data) {
          const now = new Date();
          counts['medicine-stock'] = stockRes.data.filter((item: any) => {
            const isLow = (item.quantity ?? 0) <= (item.threshold ?? 0);
            const isExpired = item.expiry_date && new Date(item.expiry_date) < now;
            return isLow || isExpired;
          }).length;
        }

        if (labRes.data) {
          counts['lab-reports'] = labRes.data.length;
        }
      } catch (err) {
        console.warn('badgeService fetch error:', err);
      }
    }

    return counts;
  }
};

// =====================
// GLOBAL SEARCH SERVICE
// =====================

export interface GlobalSearchResultItem {
  id: string;
  type: 'module' | 'patient' | 'appointment';
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive';
  targetPage: string;
  payload?: any;
}

export const globalSearchService = {
  async search(query: string, hospitalId?: string, userRole?: string | null): Promise<GlobalSearchResultItem[]> {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    const results: GlobalSearchResultItem[] = [];
    const targetHospital = hospitalId || getCurrentHospitalId();

    // 1. Modules Matching
    const modules: { id: string; title: string; subtitle: string; keywords: string[] }[] = [
      { id: 'dashboard', title: 'Dashboard', subtitle: 'Overview, analytics & hospital KPIs', keywords: ['overview', 'home', 'main', 'analytics'] },
      { id: 'appointments', title: 'Appointments', subtitle: 'Schedule & manage patient bookings', keywords: ['book', 'schedule', 'doctor visit', 'slots'] },
      { id: 'citizen-services', title: 'Citizen Services', subtitle: 'Register & manage citizens, Health cards', keywords: ['register', 'citizen', 'smc-id', 'aadhar', 'health card'] },
      { id: 'patients', title: 'Patient Records', subtitle: 'Search medical history, visits, diseases', keywords: ['records', 'history', 'patient', 'medical', 'charts'] },
      { id: 'lab-reports', title: 'Lab Reports', subtitle: 'Diagnostic tests & pathology reports', keywords: ['diagnostics', 'test', 'pathology', 'blood', 'scan'] },
      { id: 'bed-management', title: 'Bed Management', subtitle: 'Ward beds, ICU & occupancy', keywords: ['icu', 'ward', 'beds', 'admission'] },
      { id: 'infrastructure', title: 'Infrastructure', subtitle: 'Medical equipment & ambulance fleet', keywords: ['equipment', 'ambulance', 'devices', 'maintenance'] },
      { id: 'disease-reporting', title: 'Disease Analytics', subtitle: 'Epidemiological surveillance & cases', keywords: ['surveillance', 'outbreak', 'dengue', 'malaria', 'epidemic'] },
      { id: 'referrals', title: 'Referral Management', subtitle: 'Inter-hospital incoming & outgoing patient transfers', keywords: ['transfer', 'refer', 'incoming', 'outgoing'] },
      { id: 'medicine-stock', title: 'Medicine Stock', subtitle: 'Pharmacy inventory, thresholds & expiry', keywords: ['drugs', 'pharmacy', 'stock', 'medicines', 'tablets', 'expiry'] },
      { id: 'staff-management', title: 'Staff Management', subtitle: 'Doctors, nurses & hospital personnel', keywords: ['doctors', 'nurses', 'staff', 'employees', 'duties'] },
      { id: 'complaints', title: 'Complaints', subtitle: 'Patient grievances & service feedback', keywords: ['grievances', 'feedback', 'issues'] },
      { id: 'documents', title: 'Hospital Documents', subtitle: 'SMC registrations & compliance docs', keywords: ['licenses', 'registration', 'compliance', 'pdf'] },
      { id: 'settings', title: 'Settings', subtitle: 'Portal configuration & user preferences', keywords: ['preferences', 'config', 'profile'] },
    ];

    modules.forEach(m => {
      // Exclude modules the user's role cannot access
      if (userRole && !canAccessModule(userRole, m.id as ModuleKey)) {
        return;
      }
      if (m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q) || m.keywords.some(k => k.includes(q))) {
        results.push({
          id: `mod-${m.id}`,
          type: 'module',
          title: m.title,
          subtitle: m.subtitle,
          badge: 'Module',
          targetPage: m.id
        });
      }
    });

    if (supabase) {
      try {
        const [citRes, aptRes] = await Promise.all([
          // 2. Patients Matching
          supabase
            .from('citizens')
            .select('citizen_id, name, phone, gender, date_of_birth, ward_number, aadhar_id')
            .or(`name.ilike.%${q}%,citizen_id.ilike.%${q}%,phone.ilike.%${q}%`)
            .limit(5),

          // 3. Appointments Matching
          supabase
            .from('appointments')
            .select('appointment_id, appointment_date, time_slot, status, citizen_id, doctor_id')
            .eq('hospital_id', targetHospital)
            .or(`appointment_id.ilike.%${q}%,citizen_id.ilike.%${q}%`)
            .limit(5)
        ]);

        if (citRes.data) {
          citRes.data.forEach(c => {
            results.push({
              id: `cit-${c.citizen_id}`,
              type: 'patient',
              title: c.name || 'Citizen',
              subtitle: `${c.citizen_id} • ${c.phone || 'No phone'} • Ward ${c.ward_number ?? 'N/A'}`,
              badge: 'Patient',
              targetPage: 'patients',
              payload: c
            });
          });
        }

        if (aptRes.data) {
          aptRes.data.forEach(a => {
            results.push({
              id: `apt-${a.appointment_id}`,
              type: 'appointment',
              title: `Appointment ${a.appointment_id}`,
              subtitle: `Patient: ${a.citizen_id} • ${a.appointment_date} (${a.time_slot || 'N/A'})`,
              badge: a.status?.toUpperCase() || 'BOOKED',
              targetPage: 'appointments',
              payload: a
            });
          });
        }
      } catch (err) {
        console.warn('globalSearchService query error:', err);
      }
    }

    return results;
  }
};
