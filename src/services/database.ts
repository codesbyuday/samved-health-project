import { supabase } from '@/lib/supabase';

// =====================
// Error Handling Utility
// =====================

export function parseErrorMessage(error: unknown): string {
  // Handle Supabase error objects
  if (error && typeof error === 'object') {
    const supabaseError = error as { message?: string; code?: string; details?: string; hint?: string };
    
    if (supabaseError.message) {
      const message = supabaseError.message.toLowerCase();
      const code = supabaseError.code || '';
      
      // RLS policy violation
      if (code === '42501' || message.includes('permission') || message.includes('policy')) {
        return 'Permission denied. You may not have access to modify this record.';
      }
      
      // Foreign key constraint violations
      if (message.includes('foreign key') || message.includes('violates foreign key constraint')) {
        if (message.includes('citizen_id')) {
          return 'The selected citizen does not exist. Please select a valid citizen.';
        }
        if (message.includes('hospital_id')) {
          return 'The selected hospital does not exist. Please select a valid hospital.';
        }
        if (message.includes('doctor_id')) {
          return 'The selected doctor does not exist. Please select a valid doctor.';
        }
        if (message.includes('disease_id')) {
          return 'The selected disease does not exist. Please select a valid disease.';
        }
        if (message.includes('ward_number') || message.includes('ward_id')) {
          return 'The selected ward does not exist. Please select a valid ward.';
        }
        if (message.includes('medicine_id')) {
          return 'The selected medicine does not exist.';
        }
        if (message.includes('assigned_to')) {
          return 'The selected patient does not exist.';
        }
        return 'Invalid reference data provided. Please check your selections.';
      }
      
      // Unique constraint violations
      if (message.includes('unique') || message.includes('duplicate')) {
        if (message.includes('aadhar')) {
          return 'This Aadhar ID is already registered. Please use a different Aadhar ID.';
        }
        if (message.includes('phone')) {
          return 'This phone number is already registered.';
        }
        if (message.includes('email')) {
          return 'This email is already registered.';
        }
        if (message.includes('bed_id')) {
          return 'This bed ID already exists. Please use a different ID.';
        }
        return 'This record already exists. Please check for duplicates.';
      }
      
      // Return the actual error message if available
      if (supabaseError.message && supabaseError.message !== '{}') {
        return supabaseError.message;
      }
      
      // Return details if available
      if (supabaseError.details) {
        return supabaseError.details;
      }
    }
  }
  
  // Handle Error instances
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Foreign key constraint violations
    if (message.includes('foreign key') || message.includes('violates foreign key constraint')) {
      if (message.includes('citizen_id')) {
        return 'The selected citizen does not exist. Please select a valid citizen.';
      }
      if (message.includes('hospital_id')) {
        return 'The selected hospital does not exist. Please select a valid hospital.';
      }
      if (message.includes('doctor_id')) {
        return 'The selected doctor does not exist. Please select a valid doctor.';
      }
      if (message.includes('disease_id')) {
        return 'The selected disease does not exist. Please select a valid disease.';
      }
      if (message.includes('ward_number') || message.includes('ward_id')) {
        return 'The selected ward does not exist. Please select a valid ward.';
      }
      if (message.includes('medicine_id')) {
        return 'The selected medicine does not exist.';
      }
      if (message.includes('assigned_to')) {
        return 'The selected patient does not exist.';
      }
      return 'Invalid reference data provided. Please check your selections.';
    }
    
    // Unique constraint violations
    if (message.includes('unique') || message.includes('duplicate')) {
      if (message.includes('aadhar')) {
        return 'This Aadhar ID is already registered. Please use a different Aadhar ID.';
      }
      if (message.includes('phone')) {
        return 'This phone number is already registered.';
      }
      if (message.includes('email')) {
        return 'This email is already registered.';
      }
      if (message.includes('bed_id')) {
        return 'This bed ID already exists. Please use a different ID.';
      }
      return 'This record already exists. Please check for duplicates.';
    }
    
    // Check constraint violations
    if (message.includes('check constraint')) {
      return 'Invalid data provided. Please check your input values.';
    }
    
    // Not null violations
    if (message.includes('null') || message.includes('required')) {
      return 'Please fill in all required fields.';
    }
    
    // Network errors
    if (message.includes('network') || message.includes('connection')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    // Default message
    return 'An error occurred while processing your request. Please try again.';
  }
  
  return 'An unexpected error occurred. Please try again.';
}

// =====================
// Types
// =====================

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export interface Citizen {
  citizen_id: string;
  user_id: string | null;
  guardian_id: string | null;
  name: string | null;
  age?: number | null; // Calculated field, not stored in DB - computed from date_of_birth
  gender: 'Male' | 'Female' | 'Transgender' | null;
  phone: string | null;
  address: string | null;
  ward_number: number | null;
  aadhar_id: string | null;
  blood_group: BloodGroup | null;
  user_photo_url: string | null; // Photo URL stored in Supabase storage
  date_of_birth: string | null; // Date of birth for age calculation
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

// =====================
// DEPARTMENTS (Static)
// =====================

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

// =====================
// TIME SLOTS (Static)
// =====================

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
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getById(citizenId: string): Promise<{ data: Citizen | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .eq('citizen_id', citizenId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async search(query: string): Promise<{ data: Citizen[] | null; error: string | null }> {
    try {
      // Try search with aadhar_id column first
      const { data, error } = await supabase
        .from('citizens')
        .select('*')
        .or(`name.ilike.%${query}%,phone.ilike.%${query}%,citizen_id.ilike.%${query}%,aadhar_id.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        // Fallback to basic search without aadhar_id
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('citizens')
          .select('*')
          .or(`name.ilike.%${query}%,phone.ilike.%${query}%,citizen_id.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (fallbackError) throw fallbackError;
        return { data: fallbackData, error: null };
      }
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(citizen: Partial<Citizen>): Promise<{ data: Citizen | null; error: string | null }> {
    try {
      // Remove 'age' field - it's calculated from date_of_birth, not stored
      const { age, ...restCitizen } = citizen as Citizen & { age?: number };
      
      // Filter out undefined and null values to avoid issues
      const cleanData = Object.fromEntries(
        Object.entries(restCitizen).filter(([_, v]) => v !== undefined && v !== null)
      );
      
      console.log('Creating citizen with data:', cleanData);
      
      const { data, error } = await supabase
        .from('citizens')
        .insert(cleanData)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      console.log('Citizen created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Create citizen exception:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(citizenId: string, updates: Partial<Citizen>): Promise<{ data: Citizen | null; error: string | null }> {
    try {
      // Remove 'age' field - it's calculated from date_of_birth, not stored
      const { age, ...restUpdates } = updates as Citizen & { age?: number };
      
      // Filter out undefined and null values (but keep empty strings if needed)
      const cleanUpdates = Object.fromEntries(
        Object.entries(restUpdates).filter(([_, v]) => v !== undefined)
      );
      
      console.log('Updating citizen:', citizenId, 'with data:', cleanUpdates);
      
      const { data, error } = await supabase
        .from('citizens')
        .update(cleanUpdates)
        .eq('citizen_id', citizenId)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      console.log('Citizen updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Update citizen exception:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async count(): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await supabase
        .from('citizens')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// HOSPITALS SERVICE
// =====================

export const hospitalService = {
  async getAll(): Promise<{ data: Hospital[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getById(hospitalId: string): Promise<{ data: Hospital | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .eq('hospital_id', hospitalId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getFirst(): Promise<{ data: Hospital | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .limit(1)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// DOCTORS SERVICE
// =====================

export const doctorService = {
  async getAll(): Promise<{ data: Doctor[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          hospital_staff (*)
        `);
      
      if (error) throw error;
      
      const doctors = data?.map(d => ({
        ...(d.hospital_staff as HospitalStaff),
        specialization: d.specialization,
        consultation_time: d.consultation_time,
        work_start_time: d.work_start_time,
        work_end_time: d.work_end_time,
        break_start_time: d.break_start_time,
        break_end_time: d.break_end_time,
        max_patients_per_day: d.max_patients_per_day
      })) as Doctor[];
      
      return { data: doctors, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByDepartment(department: string): Promise<{ data: Doctor[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          hospital_staff (*)
        `)
        .eq('specialization', department);
      
      if (error) throw error;
      
      const doctors = data?.map(d => ({
        ...(d.hospital_staff as HospitalStaff),
        specialization: d.specialization,
        consultation_time: d.consultation_time,
        work_start_time: d.work_start_time,
        work_end_time: d.work_end_time,
        break_start_time: d.break_start_time,
        break_end_time: d.break_end_time,
        max_patients_per_day: d.max_patients_per_day
      })) as Doctor[];
      
      return { data: doctors, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getById(doctorId: string): Promise<{ data: Doctor | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select(`
          *,
          hospital_staff (*)
        `)
        .eq('staff_uuid', doctorId)
        .single();
      
      if (error) throw error;
      
      const doctor = {
        ...(data.hospital_staff as HospitalStaff),
        specialization: data.specialization,
        consultation_time: data.consultation_time,
        work_start_time: data.work_start_time,
        work_end_time: data.work_end_time,
        break_start_time: data.break_start_time,
        break_end_time: data.break_end_time,
        max_patients_per_day: data.max_patients_per_day
      } as Doctor;
      
      return { data: doctor, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// APPOINTMENTS SERVICE
// =====================

export const appointmentService = {
  async getAll(): Promise<{ data: Appointment[] | null; error: string | null }> {
    try {
      // First, fetch all appointments with basic relations
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          hospital_wards (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get unique doctor_ids to fetch doctor info
      const doctorIds = [...new Set(data?.map(a => a.doctor_id).filter(Boolean))];
      
      // Fetch doctor info for all unique doctor_ids
      let doctorMap: Record<string, Doctor> = {};
      if (doctorIds.length > 0) {
        // Try to get from doctors table first
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('doctors')
          .select(`
            *,
            hospital_staff (*)
          `)
          .in('staff_uuid', doctorIds);
        
        if (!doctorsError && doctorsData) {
          doctorsData.forEach(d => {
            if (d.hospital_staff) {
              doctorMap[d.staff_uuid] = {
                ...(d.hospital_staff as HospitalStaff),
                specialization: d.specialization,
                consultation_time: d.consultation_time,
                work_start_time: d.work_start_time,
                work_end_time: d.work_end_time,
                break_start_time: d.break_start_time,
                break_end_time: d.break_end_time,
                max_patients_per_day: d.max_patients_per_day
              } as Doctor;
            }
          });
        }
        
        // For any doctor_ids not found in doctors table, try hospital_staff directly
        const missingDoctorIds = doctorIds.filter(id => !doctorMap[id]);
        if (missingDoctorIds.length > 0) {
          const { data: staffData, error: staffError } = await supabase
            .from('hospital_staff')
            .select('*')
            .in('staff_uuid', missingDoctorIds);
          
          if (!staffError && staffData) {
            staffData.forEach(s => {
              doctorMap[s.staff_uuid] = {
                ...s,
                specialization: s.department, // Use department as specialization fallback
              } as Doctor;
            });
          }
        }
      }
      
      const appointments = data?.map(a => ({
        ...a,
        citizen: a.citizens as Citizen,
        hospital: a.hospitals as Hospital,
        hospital_ward: a.hospital_wards as HospitalWard,
        doctor: a.doctor_id ? (doctorMap[a.doctor_id] || null) : null
      })) as Appointment[];
      
      return { data: appointments, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByDate(date: string): Promise<{ data: Appointment[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          hospital_wards (*)
        `)
        .eq('appointment_date', date)
        .order('time_slot');
      
      if (error) throw error;
      
      // Get unique doctor_ids to fetch doctor info
      const doctorIds = [...new Set(data?.map(a => a.doctor_id).filter(Boolean))];
      
      // Fetch doctor info for all unique doctor_ids
      let doctorMap: Record<string, Doctor> = {};
      if (doctorIds.length > 0) {
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('doctors')
          .select(`
            *,
            hospital_staff (*)
          `)
          .in('staff_uuid', doctorIds);
        
        if (!doctorsError && doctorsData) {
          doctorsData.forEach(d => {
            if (d.hospital_staff) {
              doctorMap[d.staff_uuid] = {
                ...(d.hospital_staff as HospitalStaff),
                specialization: d.specialization,
                consultation_time: d.consultation_time,
                work_start_time: d.work_start_time,
                work_end_time: d.work_end_time,
                break_start_time: d.break_start_time,
                break_end_time: d.break_end_time,
                max_patients_per_day: d.max_patients_per_day
              } as Doctor;
            }
          });
        }
        
        // For any doctor_ids not found, try hospital_staff directly
        const missingDoctorIds = doctorIds.filter(id => !doctorMap[id]);
        if (missingDoctorIds.length > 0) {
          const { data: staffData, error: staffError } = await supabase
            .from('hospital_staff')
            .select('*')
            .in('staff_uuid', missingDoctorIds);
          
          if (!staffError && staffData) {
            staffData.forEach(s => {
              doctorMap[s.staff_uuid] = {
                ...s,
                specialization: s.department,
              } as Doctor;
            });
          }
        }
      }
      
      const appointments = data?.map(a => ({
        ...a,
        citizen: a.citizens as Citizen,
        hospital: a.hospitals as Hospital,
        hospital_ward: a.hospital_wards as HospitalWard,
        doctor: a.doctor_id ? (doctorMap[a.doctor_id] || null) : null
      })) as Appointment[];
      
      return { data: appointments, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getToday(): Promise<{ data: Appointment[] | null; error: string | null }> {
    const today = new Date().toISOString().split('T')[0];
    return this.getByDate(today);
  },

  async create(appointment: Partial<Appointment>): Promise<{ data: Appointment | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(appointmentId: string, updates: Partial<Appointment>): Promise<{ data: Appointment | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('appointment_id', appointmentId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async countToday(): Promise<{ count: number; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today);
      
      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// BEDS SERVICE
// =====================

export const bedService = {
  async getAll(): Promise<{ data: Bed[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          hospital_wards (*)
        `)
        .order('bed_id');
      
      if (error) throw error;
      
      const beds = data?.map(b => ({
        ...b,
        assigned_citizen: b.citizens as Citizen,
        hospital: b.hospitals as Hospital,
        ward: b.hospital_wards as HospitalWard
      })) as Bed[];
      
      return { data: beds, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByStatus(status: string): Promise<{ data: Bed[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          hospital_wards (*)
        `)
        .eq('bed_status', status)
        .order('bed_id');
      
      if (error) throw error;
      
      const beds = data?.map(b => ({
        ...b,
        assigned_citizen: b.citizens as Citizen,
        hospital: b.hospitals as Hospital,
        ward: b.hospital_wards as HospitalWard
      })) as Bed[];
      
      return { data: beds, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getById(bedId: string): Promise<{ data: Bed | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          hospital_wards (*)
        `)
        .eq('bed_id', bedId)
        .single();
      
      if (error) throw error;
      
      const bed = {
        ...data,
        assigned_citizen: data.citizens as Citizen,
        hospital: data.hospitals as Hospital,
        ward: data.hospital_wards as HospitalWard
      } as Bed;
      
      return { data: bed, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(bed: Partial<Bed>): Promise<{ data: Bed | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .insert({
          ...bed,
          last_updated_on: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(bedId: string, updates: Partial<Bed>): Promise<{ data: Bed | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .update({
          ...updates,
          last_updated_on: new Date().toISOString()
        })
        .eq('bed_id', bedId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async assignCitizen(bedId: string, citizenId: string): Promise<{ data: Bed | null; error: string | null }> {
    return this.update(bedId, { 
      assigned_to: citizenId, 
      bed_status: 'occupied' 
    });
  },

  async releaseBed(bedId: string): Promise<{ data: Bed | null; error: string | null }> {
    return this.update(bedId, { 
      assigned_to: null, 
      bed_status: 'available' 
    });
  },

  async getStats(): Promise<{ 
    data: { 
      total: number; 
      occupied: number; 
      available: number; 
      maintenance: number;
      icuTotal: number;
      icuOccupied: number;
      icuAvailable: number;
      emergencyTotal: number;
      emergencyOccupied: number;
      emergencyAvailable: number;
    } | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select('bed_status, bed_type');
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        occupied: data?.filter(b => b.bed_status === 'occupied').length || 0,
        available: data?.filter(b => b.bed_status === 'available').length || 0,
        maintenance: data?.filter(b => b.bed_status === 'maintenance').length || 0,
        icuTotal: data?.filter(b => b.bed_type === 'icu').length || 0,
        icuOccupied: data?.filter(b => b.bed_type === 'icu' && b.bed_status === 'occupied').length || 0,
        icuAvailable: data?.filter(b => b.bed_type === 'icu' && b.bed_status === 'available').length || 0,
        emergencyTotal: data?.filter(b => b.bed_type === 'emergency').length || 0,
        emergencyOccupied: data?.filter(b => b.bed_type === 'emergency' && b.bed_status === 'occupied').length || 0,
        emergencyAvailable: data?.filter(b => b.bed_type === 'emergency' && b.bed_status === 'available').length || 0
      };
      
      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// DISEASE CASES SERVICE
// =====================

export const diseaseService = {
  async getAll(): Promise<{ data: DiseaseCase[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('disease_cases')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          diseases (*),
          wards (*)
        `)
        .order('report_date', { ascending: false });
      
      if (error) throw error;
      
      const cases = data?.map(c => ({
        ...c,
        citizen: c.citizens as Citizen,
        hospital: c.hospitals as Hospital,
        disease: c.diseases as Disease,
        ward: c.wards as Ward
      })) as DiseaseCase[];
      
      return { data: cases, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(diseaseCase: Partial<DiseaseCase>): Promise<{ data: DiseaseCase | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('disease_cases')
        .insert(diseaseCase)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(caseId: string, updates: Partial<DiseaseCase>): Promise<{ data: DiseaseCase | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('disease_cases')
        .update(updates)
        .eq('case_id', caseId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async delete(caseId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('disease_cases')
        .delete()
        .eq('case_id', caseId);
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: parseErrorMessage(error) };
    }
  },

  async getDiseases(): Promise<{ data: Disease[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('diseases')
        .select('*')
        .order('disease_name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByCitizen(citizenId: string): Promise<{ data: DiseaseCase[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('disease_cases')
        .select(`
          *,
          hospitals (*),
          diseases (*),
          hospital_staff!reported_by (*)
        `)
        .eq('citizen_id', citizenId)
        .order('report_date', { ascending: false });
      
      if (error) throw error;
      
      const cases = data?.map(c => ({
        ...c,
        hospital: c.hospitals as Hospital,
        disease: c.diseases as Disease,
        reported_by_staff: c.hospital_staff as HospitalStaff
      })) as DiseaseCase[];
      
      return { data: cases, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// RECENT PATIENTS SERVICE
// =====================

export interface RecentPatient extends Citizen {
  latest_visit_date: string | null;
  visit_count: number;
}

export const recentPatientsService = {
  async getRecent(limit: number = 20): Promise<{ data: RecentPatient[] | null; error: string | null }> {
    try {
      // Get citizens with their latest health record visit date
      const { data, error } = await supabase
        .from('health_records')
        .select(`
          visit_date,
          citizen_id,
          citizens (*)
        `)
        .order('visit_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Group by citizen and get latest visit
      const citizenMap = new Map<string, RecentPatient>();
      
      data?.forEach(record => {
        const citizenId = record.citizen_id;
        if (!citizenId) return;
        
        if (!citizenMap.has(citizenId)) {
          const citizen = record.citizens as Citizen;
          citizenMap.set(citizenId, {
            ...citizen,
            latest_visit_date: record.visit_date,
            visit_count: 1
          });
        } else {
          const existing = citizenMap.get(citizenId)!;
          existing.visit_count++;
        }
      });
      
      // Convert to array and sort by latest visit date
      const recentPatients = Array.from(citizenMap.values())
        .sort((a, b) => {
          if (!a.latest_visit_date) return 1;
          if (!b.latest_visit_date) return -1;
          return new Date(b.latest_visit_date).getTime() - new Date(a.latest_visit_date).getTime();
        })
        .slice(0, limit);
      
      return { data: recentPatients, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// MEDICINE STOCK SERVICE
// =====================

export const medicineService = {
  async getAll(): Promise<{ data: MedicineStock[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .select(`
          *,
          medicines (*),
          hospitals (*)
        `)
        .order('expiry_date');
      
      if (error) throw error;
      
      const stock = data?.map(s => ({
        ...s,
        medicine: s.medicines as Medicine,
        hospital: s.hospitals as Hospital
      })) as MedicineStock[];
      
      return { data: stock, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByHospital(hospitalId: string): Promise<{ data: MedicineStock[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .select(`
          *,
          medicines (*),
          hospitals (*)
        `)
        .eq('hospital_id', hospitalId)
        .order('expiry_date');
      
      if (error) throw error;
      
      const stock = data?.map(s => ({
        ...s,
        medicine: s.medicines as Medicine,
        hospital: s.hospitals as Hospital
      })) as MedicineStock[];
      
      return { data: stock, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(stock: Partial<MedicineStock>): Promise<{ data: MedicineStock | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .insert({
          ...stock,
          last_updated: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(stockId: string, updates: Partial<MedicineStock>): Promise<{ data: MedicineStock | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('stock_id', stockId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async delete(stockId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('hospital_medicine_stock')
        .delete()
        .eq('stock_id', stockId);
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: parseErrorMessage(error) };
    }
  },

  async getMedicines(): Promise<{ data: Medicine[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('medicine_name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getLowStock(hospitalId?: string): Promise<{ data: MedicineStock[] | null; error: string | null }> {
    try {
      let query = supabase
        .rpc('get_low_stock_medicines');
      
      if (hospitalId) {
        query = supabase
          .from('hospital_medicine_stock')
          .select(`
            *,
            medicines (*),
            hospitals (*)
          `)
          .eq('hospital_id', hospitalId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        // Fallback to manual query if RPC doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('hospital_medicine_stock')
          .select(`
            *,
            medicines (*),
            hospitals (*)
          `);
        
        if (fallbackError) throw fallbackError;
        
        const lowStock = fallbackData?.filter(s => (s.quantity || 0) <= (s.threshold || 0)).map(s => ({
          ...s,
          medicine: s.medicines as Medicine,
          hospital: s.hospitals as Hospital
        })) as MedicineStock[];
        
        return { data: lowStock, error: null };
      }
      
      const stock = data?.map((s: Record<string, unknown>) => ({
        ...s,
        medicine: s.medicines as Medicine,
        hospital: s.hospitals as Hospital
      })) as MedicineStock[];
      
      return { data: stock, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// DIAGNOSTIC REPORTS SERVICE (LAB REPORTS)
// =====================

export const diagnosticReportService = {
  async getAll(): Promise<{ data: DiagnosticReport[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          test_types (*)
        `)
        .order('test_date', { ascending: false });
      
      if (error) throw error;
      
      const reports = data?.map(r => ({
        ...r,
        citizen: r.citizens as Citizen,
        hospital: r.hospitals as Hospital,
        test_type: r.test_types as TestType
      })) as DiagnosticReport[];
      
      return { data: reports, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByCitizen(citizenId: string): Promise<{ data: DiagnosticReport[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          test_types (*)
        `)
        .eq('citizen_id', citizenId)
        .order('test_date', { ascending: false });
      
      if (error) throw error;
      
      const reports = data?.map(r => ({
        ...r,
        citizen: r.citizens as Citizen,
        hospital: r.hospitals as Hospital,
        test_type: r.test_types as TestType
      })) as DiagnosticReport[];
      
      return { data: reports, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(report: Partial<DiagnosticReport>): Promise<{ data: DiagnosticReport | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .insert({
          ...report,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(reportId: string, updates: Partial<DiagnosticReport>): Promise<{ data: DiagnosticReport | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .update(updates)
        .eq('report_id', reportId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async delete(reportId: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('diagnostic_reports')
        .delete()
        .eq('report_id', reportId);
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: parseErrorMessage(error) };
    }
  },

  async getTestTypes(): Promise<{ data: TestType[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('test_types')
        .select('*')
        .order('test_name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async countPending(): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await supabase
        .from('diagnostic_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error: parseErrorMessage(error) };
    }
  },

  async getByStatus(status: string): Promise<{ data: DiagnosticReport[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          test_types (*)
        `)
        .eq('status', status)
        .order('test_date', { ascending: false });
      
      if (error) throw error;
      
      const reports = data?.map(r => ({
        ...r,
        citizen: r.citizens as Citizen,
        hospital: r.hospitals as Hospital,
        test_type: r.test_types as TestType
      })) as DiagnosticReport[];
      
      return { data: reports, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getStats(): Promise<{ 
    data: { 
      total: number;
      pending: number;
      in_progress: number;
      completed: number;
      cancelled: number;
      failed: number;
    } | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(r => r.status === 'pending').length || 0,
        in_progress: data?.filter(r => r.status === 'in_progress').length || 0,
        completed: data?.filter(r => r.status === 'completed').length || 0,
        cancelled: data?.filter(r => r.status === 'cancelled').length || 0,
        failed: data?.filter(r => r.status === 'failed').length || 0,
      };
      
      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getById(reportId: string): Promise<{ data: DiagnosticReport | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('diagnostic_reports')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          test_types (*)
        `)
        .eq('report_id', reportId)
        .single();
      
      if (error) throw error;
      
      const report = {
        ...data,
        citizen: data.citizens as Citizen,
        hospital: data.hospitals as Hospital,
        test_type: data.test_types as TestType
      } as DiagnosticReport;
      
      return { data: report, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// Lab Report Status Enum
export const LAB_REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

export type LabReportStatusType = typeof LAB_REPORT_STATUS[keyof typeof LAB_REPORT_STATUS];

// Lab Report Statuses array for UI components
export const LAB_REPORT_STATUSES: { value: LabReportStatusType; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'failed', label: 'Failed' },
];

export type LabReportStatus = LabReportStatusType;

// =====================
// COMPLAINTS SERVICE
// =====================

export const complaintService = {
  async getAll(): Promise<{ data: Complaint[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          *,
          citizens (*),
          hospitals (*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const complaints = data?.map(c => ({
        ...c,
        citizen: c.citizens as Citizen,
        hospital: c.hospitals as Hospital
      })) as Complaint[];
      
      return { data: complaints, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(complaintId: string, updates: Partial<Complaint>): Promise<{ data: Complaint | null; error: string | null }> {
    try {
      if (updates.status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('complaint_id', complaintId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async countPending(): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review', 'in_progress']);
      
      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// STAFF SERVICE
// =====================

export const staffService = {
  async getAll(): Promise<{ data: HospitalStaff[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_staff')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByRole(role: string): Promise<{ data: HospitalStaff[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_staff')
        .select('*')
        .eq('role', role)
        .order('name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(staff: Partial<HospitalStaff>): Promise<{ data: HospitalStaff | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_staff')
        .insert(staff)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(staffUuid: string, updates: Partial<HospitalStaff>): Promise<{ data: HospitalStaff | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_staff')
        .update(updates)
        .eq('staff_uuid', staffUuid)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async delete(staffUuid: string): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('hospital_staff')
        .delete()
        .eq('staff_uuid', staffUuid);
      
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error: parseErrorMessage(error) };
    }
  },

  async count(): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await supabase
        .from('hospital_staff')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error) {
      return { count: 0, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// WARDS SERVICE
// =====================

export const wardService = {
  async getAll(): Promise<{ data: Ward[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('wards')
        .select('*')
        .order('ward_id');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// DASHBOARD SERVICE
// =====================

export const dashboardService = {
  async getStats(): Promise<{ 
    data: {
      totalAppointmentsToday: number;
      bedsAvailable: number;
      icuBedsAvailable: number;
      totalPatients: number;
      totalBeds: number;
      occupiedBeds: number;
      pendingLabReports: number;
      pendingComplaints: number;
      totalStaff: number;
    } | null; 
    error: string | null 
  }> {
    try {
      const [
        appointmentsResult,
        bedStatsResult,
        citizensResult,
        labReportsResult,
        complaintsResult,
        staffResult
      ] = await Promise.all([
        appointmentService.countToday(),
        bedService.getStats(),
        citizenService.count(),
        diagnosticReportService.countPending(),
        complaintService.countPending(),
        staffService.count()
      ]);

      return {
        data: {
          totalAppointmentsToday: appointmentsResult.count,
          bedsAvailable: bedStatsResult.data?.available || 0,
          icuBedsAvailable: bedStatsResult.data?.icuAvailable || 0,
          totalPatients: citizensResult.count,
          totalBeds: bedStatsResult.data?.total || 0,
          occupiedBeds: bedStatsResult.data?.occupied || 0,
          pendingLabReports: labReportsResult.count,
          pendingComplaints: complaintsResult.count,
          totalStaff: staffResult.count
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get patient visits data for last 7 days chart
  async getPatientVisitsData(): Promise<{ 
    data: { date: string; patients: number; emergencies: number }[] | null; 
    error: string | null 
  }> {
    try {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      
      const startDate = sevenDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      // Get all health records for last 7 days
      const { data: healthRecords, error } = await supabase
        .from('health_records')
        .select('visit_date')
        .gte('visit_date', startDate)
        .lte('visit_date', endDate);

      if (error) throw error;

      // Group by date
      const visitsByDate: Record<string, { patients: number; emergencies: number }> = {};
      
      // Initialize all 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - i));
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        visitsByDate[dayName] = { patients: 0, emergencies: 0 };
      }

      // Count visits (assuming OPD visits are regular, emergencies would have specific flag)
      healthRecords?.forEach(record => {
        if (record.visit_date) {
          const date = new Date(record.visit_date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          if (visitsByDate[dayName]) {
            visitsByDate[dayName].patients++;
          }
        }
      });

      // For emergencies, estimate as ~10% of visits (in real system, would filter by type)
      Object.keys(visitsByDate).forEach(day => {
        visitsByDate[day].emergencies = Math.round(visitsByDate[day].patients * 0.12);
      });

      const result = Object.entries(visitsByDate).map(([date, counts]) => ({
        date,
        patients: counts.patients,
        emergencies: counts.emergencies
      }));

      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get disease trends for dashboard (top diseases)
  async getDiseaseTrends(): Promise<{ 
    data: { name: string; cases: number; trend: 'increasing' | 'stable' | 'decreasing' }[] | null; 
    error: string | null 
  }> {
    try {
      // Get disease cases with disease names
      const { data, error } = await supabase
        .from('disease_cases')
        .select(`
          disease_id,
          diseases (disease_name)
        `);

      if (error) throw error;

      // Count by disease
      const diseaseCounts: Record<string, number> = {};
      data?.forEach(record => {
        const diseaseName = (record.diseases as { disease_name: string })?.disease_name || 'Unknown';
        diseaseCounts[diseaseName] = (diseaseCounts[diseaseName] || 0) + 1;
      });

      // Sort and take top 7
      const sorted = Object.entries(diseaseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, cases]) => ({
          name,
          cases,
          trend: cases > 50 ? 'increasing' : cases > 20 ? 'stable' : 'decreasing'
        }));

      return { data: sorted, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get bed occupancy data with emergency beds
  async getBedOccupancyData(): Promise<{ 
    data: {
      general: { total: number; occupied: number; available: number; percentage: number };
      icu: { total: number; occupied: number; available: number; percentage: number };
      emergency: { total: number; occupied: number; available: number; percentage: number };
    } | null; 
    error: string | null 
  }> {
    try {
      const { data: beds, error } = await supabase
        .from('beds')
        .select('bed_type, bed_status');

      if (error) throw error;

      // Calculate stats by bed type
      const stats = {
        general: { total: 0, occupied: 0, available: 0, percentage: 0 },
        icu: { total: 0, occupied: 0, available: 0, percentage: 0 },
        emergency: { total: 0, occupied: 0, available: 0, percentage: 0 }
      };

      beds?.forEach(bed => {
        const type = bed.bed_type?.toLowerCase() || 'general';
        const category = type === 'icu' ? 'icu' : type === 'emergency' ? 'emergency' : 'general';
        
        stats[category].total++;
        if (bed.bed_status === 'occupied') {
          stats[category].occupied++;
        } else if (bed.bed_status === 'available') {
          stats[category].available++;
        }
      });

      // Calculate percentages
      Object.keys(stats).forEach(key => {
        const cat = key as keyof typeof stats;
        stats[cat].percentage = stats[cat].total > 0 
          ? Math.round((stats[cat].occupied / stats[cat].total) * 100) 
          : 0;
        // Ensure available shows total - occupied - maintenance
        stats[cat].available = stats[cat].total - stats[cat].occupied;
      });

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get dynamic alerts based on real conditions
  async getDynamicAlerts(): Promise<{ 
    data: {
      id: string;
      title: string;
      message: string;
      type: 'alert' | 'warning' | 'info' | 'success';
      timeAgo: string;
      read: boolean;
    }[] | null; 
    error: string | null 
  }> {
    try {
      const alerts: {
        id: string;
        title: string;
        message: string;
        type: 'alert' | 'warning' | 'info' | 'success';
        timeAgo: string;
        read: boolean;
      }[] = [];

      // Check medicine stock alerts
      const { data: lowStockMedicines } = await supabase
        .from('hospital_medicine_stock')
        .select(`
          quantity,
          threshold,
          medicines (medicine_name)
        `)
        .lt('quantity', supabase.rpc('coalesce', { a: 'threshold', b: 10 }));

      if (lowStockMedicines && lowStockMedicines.length > 0) {
        const lowStockNames = lowStockMedicines
          .slice(0, 3)
          .map((m: { medicines: { medicine_name: string } | null }) => m.medicines?.medicine_name)
          .filter(Boolean)
          .join(', ');
        
        alerts.push({
          id: 'alert-stock',
          title: 'Stock Alert',
          message: `${lowStockMedicines.length} medicines are running low: ${lowStockNames}. Please reorder.`,
          type: 'warning',
          timeAgo: '15 min ago',
          read: false
        });
      }

      // Check bed occupancy
      const { data: bedStats } = await supabase
        .from('beds')
        .select('bed_status');

      const totalBeds = bedStats?.length || 0;
      const occupiedBeds = bedStats?.filter(b => b.bed_status === 'occupied').length || 0;
      const occupancyPercentage = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

      if (occupancyPercentage > 80) {
        alerts.push({
          id: 'alert-beds',
          title: 'High Bed Usage',
          message: `Bed occupancy is at ${Math.round(occupancyPercentage)}%. Consider discharge planning for stable patients.`,
          type: 'alert',
          timeAgo: '30 min ago',
          read: false
        });
      }

      // Check pending lab reports
      const { count: pendingLabCount } = await supabase
        .from('diagnostic_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (pendingLabCount && pendingLabCount > 5) {
        alerts.push({
          id: 'alert-lab',
          title: 'Lab Delay Alert',
          message: `${pendingLabCount} lab reports are pending. Review and process urgent tests.`,
          type: 'warning',
          timeAgo: '45 min ago',
          read: false
        });
      }

      // Check pending complaints
      const { count: pendingComplaintsCount } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'resolved');

      if (pendingComplaintsCount && pendingComplaintsCount > 3) {
        alerts.push({
          id: 'alert-complaints',
          title: 'Pending Complaints',
          message: `${pendingComplaintsCount} complaints await resolution. Priority cases need attention.`,
          type: 'info',
          timeAgo: '1 hour ago',
          read: true
        });
      }

      // Check for disease spikes
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      const previousWeek = new Date(lastWeek);
      previousWeek.setDate(previousWeek.getDate() - 7);

      const { count: thisWeekCases } = await supabase
        .from('disease_cases')
        .select('*', { count: 'exact', head: true })
        .gte('report_date', lastWeek.toISOString().split('T')[0]);

      const { count: lastWeekCases } = await supabase
        .from('disease_cases')
        .select('*', { count: 'exact', head: true })
        .gte('report_date', previousWeek.toISOString().split('T')[0])
        .lt('report_date', lastWeek.toISOString().split('T')[0]);

      const thisWeek = thisWeekCases || 0;
      const prevWeek = lastWeekCases || 0;
      if (thisWeek > prevWeek * 1.3 && thisWeek > 5) {
        const increase = Math.round(((thisWeek - prevWeek) / Math.max(prevWeek, 1)) * 100);
        alerts.push({
          id: 'alert-disease',
          title: 'Disease Alert',
          message: `Disease cases increased by ${increase}% this week. Monitor for potential outbreaks.`,
          type: 'alert',
          timeAgo: '2 hours ago',
          read: false
        });
      }

      // Add a positive alert if system is running well
      if (alerts.length < 2) {
        alerts.push({
          id: 'info-system',
          title: 'System Status',
          message: 'All systems operating normally. No critical alerts at this time.',
          type: 'success',
          timeAgo: '3 hours ago',
          read: true
        });
      }

      return { data: alerts, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get recent activities for activity feed
  async getRecentActivities(): Promise<{ 
    data: {
      id: string;
      type: 'patient' | 'record' | 'disease' | 'appointment' | 'lab';
      message: string;
      timestamp: string;
      timeAgo: string;
    }[] | null; 
    error: string | null 
  }> {
    try {
      const activities: {
        id: string;
        type: 'patient' | 'record' | 'disease' | 'appointment' | 'lab';
        message: string;
        timestamp: string;
        timeAgo: string;
        sortTime: number; // For proper sorting
      }[] = [];

      const now = new Date();
      const formatTimeAgo = (timestamp: string | null): string => {
        if (!timestamp) return 'Just now';
        const date = new Date(timestamp);
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
      };

      // Helper to get sort time - handles both date and datetime strings
      const getSortTime = (timestamp: string | null, fallbackId: string): number => {
        if (!timestamp) return Date.now();
        const date = new Date(timestamp);
        // If it's a valid date, use it; otherwise use current time
        if (!isNaN(date.getTime())) {
          // For date-only strings, add time component based on ID to differentiate same-day entries
          if (timestamp.length === 10) { // YYYY-MM-DD format
            // Extract number from ID for sub-day ordering
            const idNum = parseInt(fallbackId.replace(/\D/g, '').slice(-6) || '0', 10);
            return date.getTime() + (idNum % 86400000); // Add up to 1 day in ms
          }
          return date.getTime();
        }
        return Date.now();
      };

      // Get recent citizens (new patient registrations)
      try {
        const { data: recentCitizens } = await supabase
          .from('citizens')
          .select('citizen_id, name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        recentCitizens?.forEach(citizen => {
          const timestamp = citizen.created_at || new Date().toISOString();
          activities.push({
            id: `citizen-${citizen.citizen_id}`,
            type: 'patient',
            message: `New patient registered: ${citizen.name || 'Unknown'}`,
            timestamp: timestamp,
            timeAgo: formatTimeAgo(citizen.created_at),
            sortTime: getSortTime(citizen.created_at, citizen.citizen_id)
          });
        });
      } catch (e) {
        console.error('Error fetching recent citizens:', e);
      }

      // Get recent health records
      try {
        // First get health records
        const { data: recentRecords } = await supabase
          .from('health_records')
          .select('record_id, visit_date, citizen_id, diagnosis')
          .order('visit_date', { ascending: false })
          .limit(5);

        if (recentRecords && recentRecords.length > 0) {
          // Get citizen names for these records
          const citizenIds = [...new Set(recentRecords.map(r => r.citizen_id).filter(Boolean))];
          const { data: citizensData } = await supabase
            .from('citizens')
            .select('citizen_id, name')
            .in('citizen_id', citizenIds);
          
          const citizenMap = new Map(citizensData?.map(c => [c.citizen_id, c.name]) || []);

          recentRecords.forEach(record => {
            const citizenName = citizenMap.get(record.citizen_id) || 'patient';
            const timestamp = record.visit_date || new Date().toISOString();
            activities.push({
              id: `record-${record.record_id}`,
              type: 'record',
              message: `Health record added for ${citizenName}${record.diagnosis ? ` - ${record.diagnosis.substring(0, 30)}${record.diagnosis.length > 30 ? '...' : ''}` : ''}`,
              timestamp: timestamp,
              timeAgo: formatTimeAgo(record.visit_date),
              sortTime: getSortTime(record.visit_date, record.record_id)
            });
          });
        }
      } catch (e) {
        console.error('Error fetching recent health records:', e);
      }

      // Get recent disease cases
      try {
        const { data: recentDiseases } = await supabase
          .from('disease_cases')
          .select('case_id, report_date, disease_id')
          .order('report_date', { ascending: false })
          .limit(5);

        if (recentDiseases && recentDiseases.length > 0) {
          // Get disease names
          const diseaseIds = [...new Set(recentDiseases.map(d => d.disease_id).filter(Boolean))];
          const { data: diseasesData } = await supabase
            .from('diseases')
            .select('disease_id, disease_name')
            .in('disease_id', diseaseIds);
          
          const diseaseMap = new Map(diseasesData?.map(d => [d.disease_id, d.disease_name]) || []);

          recentDiseases.forEach(disease => {
            const diseaseName = diseaseMap.get(disease.disease_id) || 'Disease';
            const timestamp = disease.report_date || new Date().toISOString();
            activities.push({
              id: `disease-${disease.case_id}`,
              type: 'disease',
              message: `New ${diseaseName} case reported`,
              timestamp: timestamp,
              timeAgo: formatTimeAgo(disease.report_date),
              sortTime: getSortTime(disease.report_date, disease.case_id)
            });
          });
        }
      } catch (e) {
        console.error('Error fetching recent disease cases:', e);
      }

      // Get recent lab reports
      try {
        const { data: recentLabs } = await supabase
          .from('diagnostic_reports')
          .select('report_id, test_date, citizen_id, status')
          .order('test_date', { ascending: false })
          .limit(3);

        if (recentLabs && recentLabs.length > 0) {
          // Get citizen names
          const citizenIds = [...new Set(recentLabs.map(l => l.citizen_id).filter(Boolean))];
          const { data: citizensData } = await supabase
            .from('citizens')
            .select('citizen_id, name')
            .in('citizen_id', citizenIds);
          
          const citizenMap = new Map(citizensData?.map(c => [c.citizen_id, c.name]) || []);

          recentLabs.forEach(lab => {
            const citizenName = citizenMap.get(lab.citizen_id) || 'patient';
            const timestamp = lab.test_date || new Date().toISOString();
            activities.push({
              id: `lab-${lab.report_id}`,
              type: 'lab',
              message: `Lab report ${lab.status || 'added'} for ${citizenName}`,
              timestamp: timestamp,
              timeAgo: formatTimeAgo(lab.test_date),
              sortTime: getSortTime(lab.test_date, lab.report_id)
            });
          });
        }
      } catch (e) {
        console.error('Error fetching recent lab reports:', e);
      }

      // Sort by sortTime (most recent first - descending order)
      activities.sort((a, b) => b.sortTime - a.sortTime);

      // Return without the sortTime field
      return { 
        data: activities.slice(0, 10).map(({ sortTime, ...rest }) => rest), 
        error: null 
      };
    } catch (error) {
      console.error('Error in getRecentActivities:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get comprehensive dashboard stats with trends
  async getStatsWithTrends(): Promise<{ 
    data: {
      totalAppointmentsToday: number;
      appointmentsTrend: { value: number; isPositive: boolean };
      bedsAvailable: number;
      icuBedsAvailable: number;
      emergencyBedsAvailable: number;
      totalPatients: number;
      patientsTrend: { value: number; isPositive: boolean };
      totalBeds: number;
      occupiedBeds: number;
      bedOccupancyTrend: { value: number; isPositive: boolean };
      pendingLabReports: number;
      labTrend: { value: number; isPositive: boolean };
      pendingComplaints: number;
      complaintsTrend: { value: number; isPositive: boolean };
      totalStaff: number;
    } | null; 
    error: string | null 
  }> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Fetch today's data
      const [
        todayAppointments,
        yesterdayAppointments,
        bedStatsResult,
        citizensResult,
        labReportsResult,
        yesterdayLabResult,
        complaintsResult,
        yesterdayComplaintsResult,
        staffResult
      ] = await Promise.all([
        supabase.from('health_records').select('*', { count: 'exact', head: true }).gte('visit_date', todayStr),
        supabase.from('health_records').select('*', { count: 'exact', head: true }).gte('visit_date', yesterdayStr).lt('visit_date', todayStr),
        bedService.getStats(),
        citizenService.count(),
        diagnosticReportService.countPending(),
        supabase.from('diagnostic_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        complaintService.countPending(),
        supabase.from('complaints').select('*', { count: 'exact', head: true }).neq('status', 'resolved'),
        staffService.count()
      ]);

      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return { value: 0, isPositive: current >= 0 };
        const change = Math.round(((current - previous) / previous) * 100);
        return { value: Math.abs(change), isPositive: change >= 0 };
      };

      return {
        data: {
          totalAppointmentsToday: todayAppointments.count || 0,
          appointmentsTrend: calculateTrend(todayAppointments.count || 0, yesterdayAppointments.count || 1),
          bedsAvailable: bedStatsResult.data?.available || 0,
          icuBedsAvailable: bedStatsResult.data?.icuAvailable || 0,
          emergencyBedsAvailable: bedStatsResult.data?.emergencyAvailable || 0,
          totalPatients: citizensResult.count,
          patientsTrend: { value: 8, isPositive: true }, // Estimate for citizens growth
          totalBeds: bedStatsResult.data?.total || 0,
          occupiedBeds: bedStatsResult.data?.occupied || 0,
          bedOccupancyTrend: calculateTrend(bedStatsResult.data?.occupied || 0, (bedStatsResult.data?.occupied || 1) - 5),
          pendingLabReports: labReportsResult.count,
          labTrend: calculateTrend(labReportsResult.count, Math.max(1, labReportsResult.count - 2)),
          pendingComplaints: complaintsResult.count,
          complaintsTrend: calculateTrend(complaintsResult.count, Math.max(1, complaintsResult.count - 1)),
          totalStaff: staffResult.count
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get disease trends for bar chart
  async getDiseaseTrends(): Promise<{ 
    data: { name: string; cases: number; trend: string }[] | null; 
    error: string | null 
  }> {
    try {
      const { data, error } = await supabase
        .from('disease_cases')
        .select(`
          disease_id,
          diseases (disease_name)
        `);

      if (error) throw error;

      // Count by disease
      const diseaseCounts: Record<string, number> = {};
      data?.forEach(record => {
        const diseaseName = (record.diseases as { disease_name: string })?.disease_name || 'Unknown';
        diseaseCounts[diseaseName] = (diseaseCounts[diseaseName] || 0) + 1;
      });

      // Sort and take top 7
      const sorted = Object.entries(diseaseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, cases]) => ({
          name,
          cases,
          trend: cases > 50 ? 'increasing' : cases > 20 ? 'stable' : 'decreasing'
        }));

      return { data: sorted, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get bed occupancy data with emergency beds
  async getBedOccupancyData(): Promise<{ 
    data: {
      general: { total: number; occupied: number; available: number; percentage: number };
      icu: { total: number; occupied: number; available: number; percentage: number };
      emergency: { total: number; occupied: number; available: number; percentage: number };
    } | null; 
    error: string | null 
  }> {
    try {
      const { data: beds, error } = await supabase
        .from('beds')
        .select('bed_type, bed_status');

      if (error) throw error;

      // Calculate stats by bed type
      const stats = {
        general: { total: 0, occupied: 0, available: 0, percentage: 0 },
        icu: { total: 0, occupied: 0, available: 0, percentage: 0 },
        emergency: { total: 0, occupied: 0, available: 0, percentage: 0 }
      };

      beds?.forEach(bed => {
        const type = bed.bed_type?.toLowerCase() || 'general';
        const category = type === 'icu' ? 'icu' : type === 'emergency' ? 'emergency' : 'general';
        
        stats[category].total++;
        if (bed.bed_status === 'occupied') {
          stats[category].occupied++;
        } else if (bed.bed_status === 'available') {
          stats[category].available++;
        }
      });

      // Calculate percentages
      Object.keys(stats).forEach(key => {
        const cat = key as keyof typeof stats;
        stats[cat].percentage = stats[cat].total > 0 
          ? Math.round((stats[cat].occupied / stats[cat].total) * 100) 
          : 0;
        // Ensure available shows total - occupied - maintenance
        stats[cat].available = stats[cat].total - stats[cat].occupied;
      });

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// HOSPITAL WARDS SERVICE
// =====================

export const hospitalWardService = {
  async getAll(): Promise<{ data: HospitalWard[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_wards')
        .select('*')
        .order('ward_name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByHospital(hospitalId: string): Promise<{ data: HospitalWard[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_wards')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('ward_name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// HEALTH CARD TYPE
// =====================

export interface HealthCard {
  citizen_id: string;
  qr_code_url: string | null;
  issued_date: string | null;
  status: 'active' | 'inactive' | 'expired' | null;
  citizen?: Citizen | null;
}

// =====================
// HEALTH CARD SERVICE
// =====================

export const healthCardService = {
  async getByCitizen(citizenId: string): Promise<{ data: HealthCard | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('health_cards')
        .select(`
          *,
          citizens (*)
        `)
        .eq('citizen_id', citizenId)
        .single();
      
      if (error) throw error;
      
      const healthCard = {
        ...data,
        citizen: data.citizens as Citizen
      } as HealthCard;
      
      return { data: healthCard, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(citizenId: string): Promise<{ data: HealthCard | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('health_cards')
        .insert({
          citizen_id: citizenId,
          issued_date: new Date().toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(citizenId: string, updates: Partial<HealthCard>): Promise<{ data: HealthCard | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('health_cards')
        .update(updates)
        .eq('citizen_id', citizenId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// VACCINATION RECORD TYPE
// =====================

export interface VaccinationRecord {
  record_id: string;
  citizen_id: string | null;
  hospital_id: string | null;
  campaign_id: string | null;
  vaccine_type: string | null;
  dose_number: number | null;
  date_administered: string | null;
  hospital?: Hospital | null;
}

// =====================
// VACCINATION RECORD SERVICE
// =====================

export const vaccinationRecordService = {
  async getByCitizen(citizenId: string): Promise<{ data: VaccinationRecord[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('vaccination_records')
        .select(`
          *,
          hospitals (*)
        `)
        .eq('citizen_id', citizenId)
        .order('date_administered', { ascending: false });
      
      if (error) throw error;
      
      const records = data?.map(r => ({
        ...r,
        hospital: r.hospitals as Hospital
      })) as VaccinationRecord[];
      
      return { data: records, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// HEALTH RECORD TYPE
// =====================

export interface HealthRecord {
  record_id: string;
  citizen_id: string | null;
  hospital_id: string | null;
  staff_id: string | null;
  diagnosis: string | null;
  prescription: string | null;
  notes: string | null;
  visit_date: string | null;
  hospital?: Hospital | null;
  staff?: HospitalStaff | null;
  doctor?: HospitalStaff | null; // Alias for staff
}

// =====================
// HEALTH RECORD SERVICE
// =====================

export const healthRecordService = {
  async getByCitizen(citizenId: string): Promise<{ data: HealthRecord[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .select(`
          *,
          hospitals (*),
          hospital_staff (*)
        `)
        .eq('citizen_id', citizenId)
        .order('visit_date', { ascending: false });
      
      if (error) throw error;
      
      const records = data?.map(r => ({
        ...r,
        hospital: r.hospitals as Hospital,
        staff: r.hospital_staff as HospitalStaff
      })) as HealthRecord[];
      
      return { data: records, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(record: Partial<HealthRecord>): Promise<{ data: HealthRecord | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .insert(record)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// APPOINTMENT SERVICE EXTENSION
// =====================

export const appointmentServiceExt = {
  async getByCitizen(citizenId: string): Promise<{ data: Appointment[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          citizens (*),
          hospitals (*),
          doctors (
            *,
            hospital_staff (*)
          )
        `)
        .eq('citizen_id', citizenId)
        .order('appointment_date', { ascending: false });
      
      if (error) throw error;
      
      const appointments = data?.map(a => ({
        ...a,
        citizen: a.citizens as Citizen,
        hospital: a.hospitals as Hospital,
        doctor: a.doctors ? {
          ...(a.doctors.hospital_staff as HospitalStaff),
          specialization: a.doctors.specialization,
          consultation_time: a.doctors.consultation_time,
          work_start_time: a.doctors.work_start_time,
          work_end_time: a.doctors.work_end_time,
          break_start_time: a.doctors.break_start_time,
          break_end_time: a.doctors.break_end_time,
          max_patients_per_day: a.doctors.max_patients_per_day
        } as Doctor : null
      })) as Appointment[];
      
      return { data: appointments, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// CITIZEN PROFILE SERVICE (Combined for health profile page)
// =====================

export const citizenProfileService = {
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
      // Fetch citizen first
      const { data: citizen, error: citizenError } = await supabase
        .from('citizens')
        .select('*')
        .eq('citizen_id', citizenId)
        .single();
      
      if (citizenError) throw citizenError;
      
      if (!citizen) {
        return { data: null, error: 'Citizen not found' };
      }

      // Fetch all related data in parallel
      const [
        appointmentsResult,
        labReportsResult,
        vaccinationsResult,
        healthRecordsResult
      ] = await Promise.all([
        supabase
          .from('appointments')
          .select(`
            *,
            hospitals (*),
            doctors (
              staff_uuid,
              specialization,
              hospital_staff (name)
            )
          `)
          .eq('citizen_id', citizenId)
          .order('appointment_date', { ascending: false }),
        supabase
          .from('diagnostic_reports')
          .select(`
            *,
            hospitals (*),
            test_types (*)
          `)
          .eq('citizen_id', citizenId)
          .order('test_date', { ascending: false }),
        supabase
          .from('vaccination_records')
          .select(`
            *,
            hospitals (*)
          `)
          .eq('citizen_id', citizenId)
          .order('date_administered', { ascending: false }),
        supabase
          .from('health_records')
          .select(`
            *,
            hospitals (*),
            hospital_staff (*)
          `)
          .eq('citizen_id', citizenId)
          .order('visit_date', { ascending: false })
      ]);

      return {
        data: {
          citizen: citizen as Citizen,
          appointments: (appointmentsResult.data || []) as Appointment[],
          labReports: (labReportsResult.data || []).map(r => ({
            ...r,
            citizen: citizen as Citizen,
            hospital: r.hospitals as Hospital,
            test_type: r.test_types as TestType
          })) as DiagnosticReport[],
          vaccinationRecords: (vaccinationsResult.data || []).map(v => ({
            ...v,
            hospital: v.hospitals as Hospital
          })) as VaccinationRecord[],
          healthRecords: (healthRecordsResult.data || []).map(h => ({
            ...h,
            hospital: h.hospitals as Hospital,
            doctor: h.hospital_staff as HospitalStaff
          })) as HealthRecord[]
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async verifyCitizen(citizenId: string, credential: { type: 'phone' | 'aadhar'; value: string }): Promise<{
    success: boolean;
    error: string | null;
  }> {
    try {
      const { data: citizen, error } = await supabase
        .from('citizens')
        .select('phone, aadhar_id')
        .eq('citizen_id', citizenId)
        .single();
      
      if (error || !citizen) {
        return { success: false, error: 'Citizen not found' };
      }

      if (credential.type === 'phone') {
        if (citizen.phone === credential.value) {
          return { success: true, error: null };
        }
      } else if (credential.type === 'aadhar') {
        if (citizen.aadhar_id === credential.value) {
          return { success: true, error: null };
        }
      }

      return { success: false, error: 'Wrong credentials. Please try again.' };
    } catch (error) {
      return { success: false, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// EXTENDED SERVICES FOR PATIENT RECORDS
// =====================

// Hospital Search Service
export const hospitalSearchService = {
  async search(query: string): Promise<{ data: Hospital[] | null; error: string | null }> {
    try {
      if (!query.trim()) {
        return { data: [], error: null };
      }
      
      const { data, error } = await supabase
        .from('hospitals')
        .select('*')
        .or(`name.ilike.%${query}%,hospital_id.ilike.%${query}%`)
        .order('name')
        .limit(20);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// Doctor Search Service
export const doctorSearchService = {
  async searchByHospital(hospitalId: string, query: string): Promise<{ data: HospitalStaff[] | null; error: string | null }> {
    try {
      if (!hospitalId) {
        return { data: [], error: null };
      }
      
      let queryBuilder = supabase
        .from('hospital_staff')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('role', 'doctor')
        .eq('status', 'active');
      
      if (query.trim()) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,staff_id.ilike.%${query}%`);
      }
      
      const { data, error } = await queryBuilder.order('name').limit(20);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getAllByHospital(hospitalId: string): Promise<{ data: HospitalStaff[] | null; error: string | null }> {
    try {
      if (!hospitalId) {
        return { data: [], error: null };
      }
      
      const { data, error } = await supabase
        .from('hospital_staff')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('role', 'doctor')
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  // Get all staff (doctors, nurses, admins, receptionists) from a hospital
  async getAllStaffByHospital(hospitalId: string): Promise<{ data: HospitalStaff[] | null; error: string | null }> {
    try {
      if (!hospitalId) {
        return { data: [], error: null };
      }
      
      const { data, error } = await supabase
        .from('hospital_staff')
        .select('*')
        .eq('hospital_id', hospitalId)
        .eq('status', 'active')
        .order('name');
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// Disease Search Service
export const diseaseSearchService = {
  async search(query: string): Promise<{ data: Disease[] | null; error: string | null }> {
    try {
      console.log('Disease search called with query:', query);
      
      if (!query.trim()) {
        const { data: allData, error: allError } = await supabase
          .from('diseases')
          .select('*')
          .order('disease_name')
          .limit(50);
        
        if (allError) {
          console.error('Disease search error (all):', allError);
          throw allError;
        }
        console.log('Disease search result (all):', allData);
        return { data: allData, error: null };
      }
      
      // Search only on text columns - disease_name and disease_type
      // disease_category is an enum type, so we can't use ilike on it directly
      const { data, error } = await supabase
        .from('diseases')
        .select('*')
        .or(`disease_name.ilike.%${query}%,disease_type.ilike.%${query}%`)
        .order('disease_name')
        .limit(20);
      
      if (error) {
        console.error('Disease search error:', error);
        throw error;
      }
      
      console.log('Disease search result:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Disease search exception:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(disease: Partial<Disease>): Promise<{ data: Disease | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('diseases')
        .insert(disease)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// Vaccination Record Type
export interface VaccinationRecord {
  record_id: string;
  citizen_id: string | null;
  hospital_id: string | null;
  vaccine_type: string | null;
  dose_number: number | null;
  date_administered: string | null;
  hospital?: Hospital | null;
}

// Medical Equipment Service
export const medicalEquipmentService = {
  async getAll(): Promise<{ data: MedicalEquipment[] | null; error: string | null }> {
    try {
      // First get all equipment
      const { data, error } = await supabase
        .from('medical_equipment')
        .select('*')
        .order('equipment_category')
        .order('equipment_name');
      
      if (error) {
        console.error('Error fetching equipment:', error);
        throw error;
      }

      // Then get hospitals and staff for each equipment
      const equipmentWithDetails = await Promise.all(
        (data || []).map(async (eq) => {
          let hospital = null;
          let added_by_staff = null;
          let updated_by_staff = null;

          // Fetch hospital
          if (eq.hospital_id) {
            const { data: hospitalData } = await supabase
              .from('hospitals')
              .select('*')
              .eq('hospital_id', eq.hospital_id)
              .single();
            hospital = hospitalData as Hospital;
          }

          // Fetch added_by staff
          if (eq.added_by) {
            const { data: addedByStaffData } = await supabase
              .from('hospital_staff')
              .select('staff_uuid, staff_id, name, role, designation, department')
              .eq('staff_uuid', eq.added_by)
              .single();
            added_by_staff = addedByStaffData as HospitalStaff;
          }

          // Fetch updated_by staff
          if (eq.updated_by) {
            const { data: updatedByStaffData } = await supabase
              .from('hospital_staff')
              .select('staff_uuid, staff_id, name, role, designation, department')
              .eq('staff_uuid', eq.updated_by)
              .single();
            updated_by_staff = updatedByStaffData as HospitalStaff;
          }

          return {
            ...eq,
            hospital,
            added_by_staff,
            updated_by_staff,
          } as MedicalEquipment;
        })
      );
      
      return { data: equipmentWithDetails, error: null };
    } catch (error) {
      console.error('Equipment fetch exception:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByHospital(hospitalId: string): Promise<{ data: MedicalEquipment[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('medical_equipment')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('equipment_category')
        .order('equipment_name');
      
      if (error) throw error;
      
      const equipment = data?.map(e => ({
        ...e,
        hospital: null,
      })) as MedicalEquipment[];
      
      return { data: equipment, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(equipment: Partial<MedicalEquipment>): Promise<{ data: MedicalEquipment | null; error: string | null }> {
    try {
      // Generate UUID for equipment_uuid
      const equipmentUuid = crypto.randomUUID();
      
      const insertData = {
        equipment_uuid: equipmentUuid,
        equipment_id: equipment.equipment_id || null,
        equipment_name: equipment.equipment_name,
        equipment_category: equipment.equipment_category || null,
        condition_status: equipment.condition_status || 'operational',
        hospital_id: equipment.hospital_id || null,
        equipment_location: equipment.equipment_location || null,
        manufacturer: equipment.manufacturer || null,
        model_number: equipment.model_number || null,
        last_serviced_date: equipment.last_serviced_date || null,
        added_date: equipment.added_date || new Date().toISOString().split('T')[0],
      };
      
      console.log('Creating equipment with data:', insertData);
      const { data, error } = await supabase
        .from('medical_equipment')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating equipment:', error);
        throw error;
      }
      console.log('Equipment created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Create equipment exception:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(equipmentUuid: string, equipment: Partial<MedicalEquipment>): Promise<{ data: MedicalEquipment | null; error: string | null }> {
    try {
      const updateData: Record<string, unknown> = {
        equipment_id: equipment.equipment_id || null,
        equipment_category: equipment.equipment_category || null,
        condition_status: equipment.condition_status || null,
        hospital_id: equipment.hospital_id || null,
        equipment_location: equipment.equipment_location || null,
        manufacturer: equipment.manufacturer || null,
        model_number: equipment.model_number || null,
        last_serviced_date: equipment.last_serviced_date || null,
      };
      
      // Only include equipment_name if it's provided
      if (equipment.equipment_name) {
        updateData.equipment_name = equipment.equipment_name;
      }
      
      console.log('Updating equipment:', equipmentUuid, updateData);
      
      const { data, error } = await supabase
        .from('medical_equipment')
        .update(updateData)
        .eq('equipment_uuid', equipmentUuid)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating equipment:', JSON.stringify(error, null, 2));
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Equipment not found or no changes were made.' };
        }
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from update');
        return { data: null, error: 'Equipment not found. It may have been deleted.' };
      }
      
      console.log('Equipment updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Update equipment exception:', error);
      const errorMsg = parseErrorMessage(error);
      // If we still get an empty or generic message, provide more context
      if (!errorMsg || errorMsg === 'An unexpected error occurred. Please try again.') {
        return { data: null, error: 'Failed to update equipment. Please check if the record exists and you have permission to edit it.' };
      }
      return { data: null, error: errorMsg };
    }
  },

  async delete(equipmentUuid: string): Promise<{ error: string | null }> {
    try {
      console.log('Deleting equipment:', equipmentUuid);
      const { error } = await supabase
        .from('medical_equipment')
        .delete()
        .eq('equipment_uuid', equipmentUuid);
      
      if (error) {
        console.error('Error deleting equipment:', error);
        throw error;
      }
      console.log('Equipment deleted successfully');
      return { error: null };
    } catch (error) {
      return { error: parseErrorMessage(error) };
    }
  },

  async getStats(): Promise<{ data: { total: number; operational: number; maintenance: number; outOfService: number } | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('medical_equipment')
        .select('condition_status');
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        operational: data?.filter(e => e.condition_status === 'operational').length || 0,
        maintenance: data?.filter(e => e.condition_status === 'under_maintenance' || e.condition_status === 'needs_service').length || 0,
        outOfService: data?.filter(e => e.condition_status === 'out_of_order' || e.condition_status === 'retired').length || 0,
      };
      
      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// Ambulance Service
export const ambulanceService = {
  async getAll(): Promise<{ data: Ambulance[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ambulances')
        .select('*')
        .order('ambulance_vehicle_number');
      
      if (error) {
        console.error('Error fetching ambulances:', error);
        throw error;
      }

      // Fetch hospitals separately
      const ambulancesWithHospitals = await Promise.all(
        (data || []).map(async (amb) => {
          let hospital = null;
          if (amb.hospital_id) {
            const { data: hospitalData } = await supabase
              .from('hospitals')
              .select('*')
              .eq('hospital_id', amb.hospital_id)
              .single();
            hospital = hospitalData as Hospital;
          }
          return {
            ...amb,
            hospital,
          } as Ambulance;
        })
      );
      
      return { data: ambulancesWithHospitals, error: null };
    } catch (error) {
      console.error('Ambulance fetch exception:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByHospital(hospitalId: string): Promise<{ data: Ambulance[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ambulances')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('ambulance_vehicle_number');
      
      if (error) throw error;
      
      return { data: data as Ambulance[], error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(ambulance: Partial<Ambulance>): Promise<{ data: Ambulance | null; error: string | null }> {
    try {
      console.log('Creating ambulance with data:', ambulance);
      const { data, error } = await supabase
        .from('ambulances')
        .insert(ambulance)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating ambulance:', error);
        throw error;
      }
      console.log('Ambulance created successfully:', data);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(vehicleNumber: string, ambulance: Partial<Ambulance>): Promise<{ data: Ambulance | null; error: string | null }> {
    try {
      console.log('Updating ambulance:', vehicleNumber, ambulance);
      
      const updateData: Record<string, unknown> = {
        hospital_id: ambulance.hospital_id || null,
        status: ambulance.status || null,
        current_location: ambulance.current_location || null,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('ambulances')
        .update(updateData)
        .eq('ambulance_vehicle_number', vehicleNumber)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating ambulance:', JSON.stringify(error, null, 2));
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Ambulance not found or no changes were made.' };
        }
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from ambulance update');
        return { data: null, error: 'Ambulance not found. It may have been deleted.' };
      }
      
      console.log('Ambulance updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Update ambulance exception:', error);
      const errorMsg = parseErrorMessage(error);
      if (!errorMsg || errorMsg === 'An unexpected error occurred. Please try again.') {
        return { data: null, error: 'Failed to update ambulance. Please check if the record exists and you have permission to edit it.' };
      }
      return { data: null, error: errorMsg };
    }
  },

  async delete(vehicleNumber: string): Promise<{ error: string | null }> {
    try {
      console.log('Deleting ambulance:', vehicleNumber);
      const { error } = await supabase
        .from('ambulances')
        .delete()
        .eq('ambulance_vehicle_number', vehicleNumber);
      
      if (error) {
        console.error('Error deleting ambulance:', error);
        throw error;
      }
      console.log('Ambulance deleted successfully');
      return { error: null };
    } catch (error) {
      return { error: parseErrorMessage(error) };
    }
  },

  async getStats(): Promise<{ data: { total: number; available: number; outOfService: number; maintenance: number } | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ambulances')
        .select('status');
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        available: data?.filter(a => a.status === 'available').length || 0,
        outOfService: data?.filter(a => a.status === 'out_of_service').length || 0,
        maintenance: data?.filter(a => a.status === 'under_maintenance').length || 0,
      };
      
      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// Medicine Stock Service
export const medicineStockService = {
  async getAll(): Promise<{ data: MedicineStock[] | null; error: string | null }> {
    try {
      // First get all medicine stock
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .select('*')
        .order('last_updated', { ascending: false });
      
      if (error) {
        console.error('Error fetching medicine stock:', error);
        throw error;
      }

      // Then get related data for each stock item
      const stockWithDetails = await Promise.all(
        (data || []).map(async (stock) => {
          let medicine = null;
          let hospital = null;
          let added_by_staff = null;
          let updated_by_staff = null;

          // Fetch medicine details
          if (stock.medicine_id) {
            const { data: medicineData } = await supabase
              .from('medicines')
              .select('*')
              .eq('medicine_id', stock.medicine_id)
              .single();
            medicine = medicineData as Medicine;
          }

          // Fetch hospital details
          if (stock.hospital_id) {
            const { data: hospitalData } = await supabase
              .from('hospitals')
              .select('*')
              .eq('hospital_id', stock.hospital_id)
              .single();
            hospital = hospitalData as Hospital;
          }

          // Fetch added_by staff
          if (stock.added_by) {
            const { data: addedByStaffData } = await supabase
              .from('hospital_staff')
              .select('staff_uuid, staff_id, name, role, designation, department')
              .eq('staff_uuid', stock.added_by)
              .single();
            added_by_staff = addedByStaffData as HospitalStaff;
          }

          // Fetch updated_by staff
          if (stock.updated_by) {
            const { data: updatedByStaffData } = await supabase
              .from('hospital_staff')
              .select('staff_uuid, staff_id, name, role, designation, department')
              .eq('staff_uuid', stock.updated_by)
              .single();
            updated_by_staff = updatedByStaffData as HospitalStaff;
          }

          return {
            ...stock,
            medicine,
            hospital,
            added_by_staff,
            updated_by_staff,
          } as MedicineStock;
        })
      );
      
      return { data: stockWithDetails, error: null };
    } catch (error) {
      console.error('Medicine stock fetch exception:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getByHospital(hospitalId: string): Promise<{ data: MedicineStock[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .select('*')
        .eq('hospital_id', hospitalId)
        .order('last_updated', { ascending: false });
      
      if (error) throw error;

      // Fetch related data
      const stockWithDetails = await Promise.all(
        (data || []).map(async (stock) => {
          let medicine = null;
          let added_by_staff = null;
          let updated_by_staff = null;

          if (stock.medicine_id) {
            const { data: medicineData } = await supabase
              .from('medicines')
              .select('*')
              .eq('medicine_id', stock.medicine_id)
              .single();
            medicine = medicineData as Medicine;
          }

          if (stock.added_by) {
            const { data: addedByStaffData } = await supabase
              .from('hospital_staff')
              .select('staff_uuid, staff_id, name, role, designation, department')
              .eq('staff_uuid', stock.added_by)
              .single();
            added_by_staff = addedByStaffData as HospitalStaff;
          }

          if (stock.updated_by) {
            const { data: updatedByStaffData } = await supabase
              .from('hospital_staff')
              .select('staff_uuid, staff_id, name, role, designation, department')
              .eq('staff_uuid', stock.updated_by)
              .single();
            updated_by_staff = updatedByStaffData as HospitalStaff;
          }

          return {
            ...stock,
            medicine,
            added_by_staff,
            updated_by_staff,
          } as MedicineStock;
        })
      );
      
      return { data: stockWithDetails, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getById(stockId: string): Promise<{ data: MedicineStock | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .select('*')
        .eq('stock_id', stockId)
        .single();
      
      if (error) throw error;

      // Fetch related data
      let medicine = null;
      let hospital = null;
      let added_by_staff = null;
      let updated_by_staff = null;

      if (data.medicine_id) {
        const { data: medicineData } = await supabase
          .from('medicines')
          .select('*')
          .eq('medicine_id', data.medicine_id)
          .single();
        medicine = medicineData as Medicine;
      }

      if (data.hospital_id) {
        const { data: hospitalData } = await supabase
          .from('hospitals')
          .select('*')
          .eq('hospital_id', data.hospital_id)
          .single();
        hospital = hospitalData as Hospital;
      }

      if (data.added_by) {
        const { data: addedByStaffData } = await supabase
          .from('hospital_staff')
          .select('staff_uuid, staff_id, name, role, designation, department')
          .eq('staff_uuid', data.added_by)
          .single();
        added_by_staff = addedByStaffData as HospitalStaff;
      }

      if (data.updated_by) {
        const { data: updatedByStaffData } = await supabase
          .from('hospital_staff')
          .select('staff_uuid, staff_id, name, role, designation, department')
          .eq('staff_uuid', data.updated_by)
          .single();
        updated_by_staff = updatedByStaffData as HospitalStaff;
      }

      return { 
        data: {
          ...data,
          medicine,
          hospital,
          added_by_staff,
          updated_by_staff,
        } as MedicineStock, 
        error: null 
      };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async create(stock: Partial<MedicineStock>): Promise<{ data: MedicineStock | null; error: string | null }> {
    try {
      const insertData = {
        hospital_id: stock.hospital_id || null,
        medicine_id: stock.medicine_id || null,
        quantity: stock.quantity || 0,
        threshold: stock.threshold || 10,
        expiry_date: stock.expiry_date || null,
        added_by: stock.added_by || null,
        last_updated: new Date().toISOString(),
      };
      
      console.log('Creating medicine stock with data:', insertData);
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Error creating medicine stock:', error);
        throw error;
      }
      console.log('Medicine stock created successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Create medicine stock exception:', error);
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async update(stockId: string, stock: Partial<MedicineStock>): Promise<{ data: MedicineStock | null; error: string | null }> {
    try {
      const updateData: Record<string, unknown> = {
        hospital_id: stock.hospital_id || null,
        medicine_id: stock.medicine_id || null,
        quantity: stock.quantity ?? null,
        threshold: stock.threshold ?? null,
        expiry_date: stock.expiry_date || null,
        updated_by: stock.updated_by || null,
        last_updated: new Date().toISOString(),
      };
      
      console.log('Updating medicine stock:', stockId, updateData);
      
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .update(updateData)
        .eq('stock_id', stockId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating medicine stock:', JSON.stringify(error, null, 2));
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Medicine stock not found or no changes were made.' };
        }
        throw error;
      }
      
      if (!data) {
        console.error('No data returned from medicine stock update');
        return { data: null, error: 'Medicine stock not found. It may have been deleted.' };
      }
      
      console.log('Medicine stock updated successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Update medicine stock exception:', error);
      const errorMsg = parseErrorMessage(error);
      if (!errorMsg || errorMsg === 'An unexpected error occurred. Please try again.') {
        return { data: null, error: 'Failed to update medicine stock. Please check if the record exists and you have permission to edit it.' };
      }
      return { data: null, error: errorMsg };
    }
  },

  async delete(stockId: string): Promise<{ error: string | null }> {
    try {
      console.log('Deleting medicine stock:', stockId);
      const { error } = await supabase
        .from('hospital_medicine_stock')
        .delete()
        .eq('stock_id', stockId);
      
      if (error) {
        console.error('Error deleting medicine stock:', error);
        throw error;
      }
      console.log('Medicine stock deleted successfully');
      return { error: null };
    } catch (error) {
      return { error: parseErrorMessage(error) };
    }
  },

  async getStats(): Promise<{ data: { total: number; inStock: number; lowStock: number; outOfStock: number; expiringSoon: number } | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('hospital_medicine_stock')
        .select('quantity, threshold, expiry_date');
      
      if (error) throw error;
      
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const stats = {
        total: data?.length || 0,
        inStock: data?.filter(s => (s.quantity || 0) > (s.threshold || 0)).length || 0,
        lowStock: data?.filter(s => {
          const qty = s.quantity || 0;
          const thresh = s.threshold || 0;
          return qty > 0 && qty <= thresh;
        }).length || 0,
        outOfStock: data?.filter(s => (s.quantity || 0) === 0).length || 0,
        expiringSoon: data?.filter(s => {
          if (!s.expiry_date) return false;
          const expiry = new Date(s.expiry_date);
          return expiry <= thirtyDaysFromNow;
        }).length || 0,
      };
      
      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// Medicines Service (for reference data)
export const medicinesService = {
  async getAll(): Promise<{ data: Medicine[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .order('medicine_name');
      
      if (error) {
        console.error('Error fetching medicines:', error);
        throw error;
      }
      
      return { data: data as Medicine[], error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async search(query: string): Promise<{ data: Medicine[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('medicines')
        .select('*')
        .or(`medicine_name.ilike.%${query}%,medicine_id.ilike.%${query}%,medicine_category.ilike.%${query}%`)
        .order('medicine_name')
        .limit(20);
      
      if (error) throw error;
      
      return { data: data as Medicine[], error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};

// =====================
// Referral Service
// =====================
export const referralService = {
  async create(data: {
    citizen_id: string;
    referring_doctor_id: string;
    from_hospital_id: string;
    to_hospital_id: string;
    to_doctor_id?: string;
    referral_reason: string;
    urgency_level: string;
    notes?: string;
  }): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data: result, error } = await supabase
        .from('referrals')
        .insert({
          citizen_id: data.citizen_id,
          referring_doctor_id: data.referring_doctor_id,
          from_hospital_id: data.from_hospital_id,
          to_hospital_id: data.to_hospital_id,
          to_doctor_id: data.to_doctor_id || null,
          referral_reason: data.referral_reason,
          urgency_level: data.urgency_level,
          notes: data.notes || null,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating referral:', error);
        throw error;
      }
      
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getOutgoing(hospitalId?: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('referrals')
        .select(`
          referral_id,
          citizen_id,
          referring_doctor_id,
          from_hospital_id,
          to_hospital_id,
          to_doctor_id,
          referral_reason,
          urgency_level,
          status,
          created_at,
          notes,
          updated_at
        `)
        .order('created_at', { ascending: false });
      
      // Filter by hospital if provided (for future use)
      if (hospitalId) {
        query = query.eq('from_hospital_id', hospitalId);
      }
      
      const { data: referrals, error } = await query;
      
      if (error) throw error;
      
      // Fetch related data separately
      const enrichedReferrals = await this.enrichReferrals(referrals || []);
      
      return { data: enrichedReferrals, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getIncoming(hospitalId?: string): Promise<{ data: any[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('referrals')
        .select(`
          referral_id,
          citizen_id,
          referring_doctor_id,
          from_hospital_id,
          to_hospital_id,
          to_doctor_id,
          referral_reason,
          urgency_level,
          status,
          created_at,
          notes,
          updated_at
        `)
        .order('created_at', { ascending: false });
      
      // Filter by hospital if provided (for future use)
      if (hospitalId) {
        query = query.eq('to_hospital_id', hospitalId);
      }
      
      const { data: referrals, error } = await query;
      
      if (error) throw error;
      
      // Fetch related data separately
      const enrichedReferrals = await this.enrichReferrals(referrals || []);
      
      return { data: enrichedReferrals, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async enrichReferrals(referrals: any[]): Promise<any[]> {
    if (!referrals || referrals.length === 0) return [];
    
    // Get unique IDs
    const citizenIds = [...new Set(referrals.map(r => r.citizen_id).filter(Boolean))];
    const hospitalIds = [...new Set([
      ...referrals.map(r => r.from_hospital_id).filter(Boolean),
      ...referrals.map(r => r.to_hospital_id).filter(Boolean)
    ])];
    const doctorIds = [...new Set([
      ...referrals.map(r => r.referring_doctor_id).filter(Boolean),
      ...referrals.map(r => r.to_doctor_id).filter(Boolean)
    ])];
    
    // Fetch related data
    const [citizensResult, hospitalsResult, doctorsResult] = await Promise.all([
      supabase.from('citizens').select('citizen_id, name, phone, gender, date_of_birth').in('citizen_id', citizenIds),
      supabase.from('hospitals').select('hospital_id, name').in('hospital_id', hospitalIds),
      supabase.from('hospital_staff').select('staff_id, staff_uuid, name, designation').in('staff_uuid', doctorIds)
    ]);
    
    const citizenMap = new Map(citizensResult.data?.map(c => [c.citizen_id, c]) || []);
    const hospitalMap = new Map(hospitalsResult.data?.map(h => [h.hospital_id, h]) || []);
    const doctorMap = new Map(doctorsResult.data?.map(d => [d.staff_uuid, d]) || []);
    
    // Enrich referrals
    return referrals.map(referral => ({
      ...referral,
      citizen: citizenMap.get(referral.citizen_id) || null,
      from_hospital: hospitalMap.get(referral.from_hospital_id) || null,
      to_hospital: hospitalMap.get(referral.to_hospital_id) || null,
      referring_doctor: doctorMap.get(referral.referring_doctor_id) || null,
      to_doctor: doctorMap.get(referral.to_doctor_id) || null,
    }));
  },

  async getById(referralId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data: referral, error } = await supabase
        .from('referrals')
        .select(`
          referral_id,
          citizen_id,
          referring_doctor_id,
          from_hospital_id,
          to_hospital_id,
          to_doctor_id,
          referral_reason,
          urgency_level,
          status,
          created_at,
          notes,
          updated_at
        `)
        .eq('referral_id', referralId)
        .single();
      
      if (error) throw error;
      
      // Enrich the single referral
      const enriched = await this.enrichReferrals([referral]);
      
      return { data: enriched[0] || null, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async updateStatus(referralId: string, status: string): Promise<{ data: any | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('referral_id', referralId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating referral status:', error);
        throw error;
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  },

  async getStats(hospitalId?: string): Promise<{ data: { outgoing: number; incoming: number; pending: number; accepted: number } | null; error: string | null }> {
    try {
      // Get all referrals
      const { data: allReferrals, error } = await supabase
        .from('referrals')
        .select('from_hospital_id, to_hospital_id, status');
      
      if (error) throw error;
      
      const stats = {
        outgoing: hospitalId ? allReferrals?.filter(r => r.from_hospital_id === hospitalId).length || 0 : allReferrals?.length || 0,
        incoming: hospitalId ? allReferrals?.filter(r => r.to_hospital_id === hospitalId).length || 0 : allReferrals?.length || 0,
        pending: allReferrals?.filter(r => r.status === 'pending').length || 0,
        accepted: allReferrals?.filter(r => r.status === 'accepted').length || 0,
      };
      
      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error: parseErrorMessage(error) };
    }
  }
};
