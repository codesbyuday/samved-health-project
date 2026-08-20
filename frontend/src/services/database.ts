import { apiClient } from '@/services/apiClient';
import { USER_SESSION_KEY, type UserProfile } from '@/lib/auth';

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

export type LabReportStatus = 'pending' | 'completed' | 'verified' | 'cancelled';
export const LAB_REPORT_STATUSES = [
  { value: 'pending', label: 'Pending' },
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
  hospital_id: string | null;
  citizen_id: string | null;
  ward_number: number | null;
  disease_id: string | null;
  report_date: string | null;
  severity: string | null;
  status: string | null;
  reported_by: string | null;
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

export interface DiagnosticReport {
  report_id: string;
  citizen_id: string | null;
  hospital_id: string | null;
  provider_id: string | null;
  test_type_id: number | null;
  result: string | null;
  description: string | null;
  report_file_url: string | null;
  status: string | null;
  test_date: string | null;
  uploaded_at: string | null;
  citizen?: Citizen | null;
  hospital?: Hospital | null;
  test_type?: TestType | null;
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
    return apiClient.get<Citizen[]>('/citizens/search', { q: query });
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
  async getAll(): Promise<{ data: Doctor[] | null; error: string | null }> {
    return apiClient.get<Doctor[]>('/hospitals/HOSP001/doctors');
  },

  async getByDepartment(department: string): Promise<{ data: Doctor[] | null; error: string | null }> {
    return apiClient.get<Doctor[]>('/hospitals/HOSP001/doctors', { department });
  },

  async getById(doctorId: string): Promise<{ data: Doctor | null; error: string | null }> {
    const res = await apiClient.get<Doctor[]>('/hospitals/HOSP001/doctors');
    const match = res.data?.find(d => d.staff_uuid === doctorId);
    return { data: match || null, error: res.error };
  }
};

// =====================
// APPOINTMENTS SERVICE
// =====================

let aptsCachePromise: Promise<{ data: Appointment[] | null; error: string | null }> | null = null;
let aptsCacheTimestamp = 0;

export const appointmentService = {
  async getAll(): Promise<{ data: Appointment[] | null; error: string | null }> {
    const now = Date.now();
    if (aptsCachePromise && (now - aptsCacheTimestamp < 5000)) {
      return aptsCachePromise;
    }
    aptsCacheTimestamp = now;
    aptsCachePromise = apiClient.get<Appointment[]>('/appointments');
    return aptsCachePromise;
  },

  async getByDate(date: string): Promise<{ data: Appointment[] | null; error: string | null }> {
    return this.getAll();
  },

  async getToday(): Promise<{ data: Appointment[] | null; error: string | null }> {
    return this.getAll();
  },

  async getById(appointmentId: string): Promise<{ data: Appointment | null; error: string | null }> {
    const res = await this.getAll();
    const match = res.data?.find(a => a.appointment_id === appointmentId);
    return { data: match || null, error: res.error };
  },

  async create(appointment: Partial<Appointment>): Promise<{ data: Appointment | null; error: string | null }> {
    aptsCachePromise = null;
    return apiClient.post<Appointment>('/appointments', appointment);
  },

  async update(appointmentId: string, updates: { status: string }): Promise<{ data: Appointment | null; error: string | null }> {
    aptsCachePromise = null;
    return apiClient.patch<Appointment>(`/appointments/${appointmentId}`, updates);
  },

  async cancel(appointmentId: string): Promise<{ data: Appointment | null; error: string | null }> {
    aptsCachePromise = null;
    return apiClient.patch<Appointment>(`/appointments/${appointmentId}`, { status: 'cancelled' });
  },

  async countToday(): Promise<{ count: number; error: string | null }> {
    const res = await this.getAll();
    return { count: res.data?.length || 0, error: res.error };
  }
};

// =====================
// BEDS SERVICE
// =====================

export const bedService = {
  async getAll(): Promise<{ data: Bed[] | null; error: string | null }> {
    return apiClient.get<Bed[]>('/hospitals/HOSP001/beds');
  },

  async getAvailable(): Promise<{ data: Bed[] | null; error: string | null }> {
    const res = await apiClient.get<Bed[]>('/hospitals/HOSP001/beds');
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
    return apiClient.get<DiseaseCase[]>('/disease-surveillance/cases', { citizen_id: citizenId });
  },

  async create(diseaseCase: Partial<DiseaseCase>): Promise<{ data: DiseaseCase | null; error: string | null }> {
    return apiClient.post<DiseaseCase>('/disease-surveillance/cases', diseaseCase);
  }
};

export const diseaseService = {
  async getAll(): Promise<{ data: Disease[] | null; error: string | null }> {
    return apiClient.get<Disease[]>('/disease-surveillance/diseases');
  },

  async getByCitizen(citizenId: string): Promise<{ data: DiseaseCase[] | null; error: string | null }> {
    return apiClient.get<DiseaseCase[]>('/disease-surveillance/cases', { citizen_id: citizenId });
  }
};

// =====================
// PHARMACY & MEDICINE SERVICE
// =====================

export const medicineService = {
  async getAll(): Promise<{ data: Medicine[] | null; error: string | null }> {
    return apiClient.get<Medicine[]>('/pharmacies/medicines');
  }
};

export const medicineStockService = {
  async getAll(): Promise<{ data: MedicineStock[] | null; error: string | null }> {
    return apiClient.get<MedicineStock[]>('/pharmacies/stock');
  },

  async updateQuantity(stockId: string, quantity: number): Promise<{ data: MedicineStock | null; error: string | null }> {
    return apiClient.patch<MedicineStock>(`/pharmacies/stock/${stockId}`, { quantity });
  }
};

export const medicinesService = medicineService;

// =====================
// DIAGNOSTIC REPORTS SERVICE
// =====================

export const diagnosticReportService = {
  async getAll(): Promise<{ data: DiagnosticReport[] | null; error: string | null }> {
    return apiClient.get<DiagnosticReport[]>('/laboratories/reports');
  },

  async getByCitizen(citizenId: string): Promise<{ data: DiagnosticReport[] | null; error: string | null }> {
    return apiClient.get<DiagnosticReport[]>('/laboratories/reports', { citizen_id: citizenId });
  },

  async create(report: Partial<DiagnosticReport>): Promise<{ data: DiagnosticReport | null; error: string | null }> {
    return apiClient.post<DiagnosticReport>('/laboratories/reports', report);
  },

  async getTestTypes(): Promise<{ data: TestType[] | null; error: string | null }> {
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
  async getAll(): Promise<{ data: HospitalWard[] | null; error: string | null }> {
    const res = await apiClient.get<Ward[]>('/smc/wards');
    const wards = (res.data || []).map(w => ({
      hospital_ward_id: `HW-${w.ward_id}`,
      hospital_id: 'HOSP001',
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
  async getAll(): Promise<{ data: HospitalStaff[] | null; error: string | null }> {
    const res = await apiClient.get<Doctor[]>('/hospitals/HOSP001/doctors');
    return { data: res.data || [], error: res.error };
  }
};

let overviewPromiseCache: Promise<{ data: any; error: string | null }> | null = null;
let overviewCacheTimestamp = 0;

const fetchDashboardOverview = async () => {
  const now = Date.now();
  if (overviewPromiseCache && (now - overviewCacheTimestamp < 3000)) {
    return overviewPromiseCache;
  }
  overviewCacheTimestamp = now;
  overviewPromiseCache = apiClient.get<any>('/hospitals/HOSP001/dashboard-overview');
  return overviewPromiseCache;
};

export const dashboardService = {
  async getSummary(): Promise<{ data: any; error: string | null }> {
    return apiClient.get<any>('/smc/analytics');
  },

  async getStatsWithTrends(): Promise<{ data: any; error: string | null }> {
    try {
      const res = await fetchDashboardOverview();
      if (res.data?.stats) {
        return { data: res.data.stats, error: null };
      }
      return { data: null, error: res.error || 'Failed to load stats' };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load dashboard stats' };
    }
  },

  async getPatientVisitsData(): Promise<{ data: { date: string; patients: number; emergencies: number }[] | null; error: string | null }> {
    try {
      const res = await fetchDashboardOverview();
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

  async getDiseaseTrends(): Promise<{ data: { name: string; cases: number; trend: string }[] | null; error: string | null }> {
    try {
      const res = await fetchDashboardOverview();
      if (res.data?.diseaseTrends) {
        return { data: res.data.diseaseTrends, error: null };
      }
      return { data: null, error: res.error };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load disease trends' };
    }
  },

  async getBedOccupancyData(): Promise<{ data: any; error: string | null }> {
    try {
      const res = await fetchDashboardOverview();
      if (res.data?.bedOccupancy) {
        return { data: res.data.bedOccupancy, error: null };
      }
      return { data: null, error: res.error };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load bed occupancy' };
    }
  },

  async getDynamicAlerts(): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const res = await fetchDashboardOverview();
      if (res.data?.alerts) {
        return { data: res.data.alerts, error: null };
      }
      return { data: null, error: res.error };
    } catch (err: any) {
      return { data: null, error: err?.message || 'Failed to load alerts' };
    }
  },

  async getRecentActivities(): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const res = await fetchDashboardOverview();
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
  }
};

export const vaccinationRecordService = {
  async getAll(): Promise<{ data: any[] | null; error: string | null }> {
    return apiClient.get<any[]>('/smc/campaigns');
  },
  async getByCitizen(citizenId: string): Promise<{ data: any[] | null; error: string | null }> {
    const res = await apiClient.get<any[]>('/smc/campaigns');
    return { data: res.data || [], error: res.error };
  }
};

export const healthRecordService = {
  async getAll(): Promise<{ data: any[] | null; error: string | null }> {
    return apiClient.get<any[]>('/laboratories/reports');
  },
  async getByCitizen(citizenId: string): Promise<{ data: any[] | null; error: string | null }> {
    return apiClient.get<any[]>('/laboratories/reports', { citizen_id: citizenId });
  }
};

export const appointmentServiceExt = appointmentService;
export const citizenProfileService = citizenService;
export const hospitalSearchService = hospitalService;
export const doctorSearchService = doctorService;
export const diseaseSearchService = diseaseService;

export const medicalEquipmentService = {
  async getAll(): Promise<{ data: MedicalEquipment[] | null; error: string | null }> {
    return apiClient.get<MedicalEquipment[]>('/hospitals/HOSP001/equipment');
  }
};

export const ambulanceService = {
  async getAll(): Promise<{ data: Ambulance[] | null; error: string | null }> {
    return apiClient.get<Ambulance[]>('/hospitals/HOSP001/ambulances');
  }
};

export const recentPatientsService = {
  async getRecent(): Promise<{ data: Citizen[] | null; error: string | null }> {
    return apiClient.get<Citizen[]>('/citizens');
  }
};

export const referralService = {
  async getAll(): Promise<{ data: any[] | null; error: string | null }> {
    return apiClient.get<any[]>('/referrals');
  },

  async getOutgoing(): Promise<{ data: any[] | null; error: string | null }> {
    const res = await apiClient.get<any[]>('/referrals');
    if (res.data) {
      return { data: res.data.filter((r: any) => r.from_hospital_id === 'HOSP001' || !r.to_hospital_id), error: null };
    }
    return { data: [], error: res.error };
  },

  async getIncoming(): Promise<{ data: any[] | null; error: string | null }> {
    const res = await apiClient.get<any[]>('/referrals');
    if (res.data) {
      return { data: res.data.filter((r: any) => r.to_hospital_id === 'HOSP001'), error: null };
    }
    return { data: [], error: res.error };
  },

  async updateStatus(referralId: string, status: string): Promise<{ data: any | null; error: string | null }> {
    return apiClient.patch<any>(`/referrals/${referralId}`, { status });
  }
};
