// Hospital Management Portal - TypeScript Types
// Hospital Management Portal domain types

// ============ User & Authentication ============
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'nurse' | 'staff';
  hospitalId: string;
  hospitalName: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

// ============ Dashboard ============
export interface DashboardStats {
  totalAppointmentsToday: number;
  bedsAvailable: number;
  icuBedsAvailable: number;
  ventilatorsAvailable: number;
  emergencyBeds: number;
  totalPatients: number;
  criticalPatients: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'info' | 'warning' | 'success';
  timestamp: Date;
  read: boolean;
}

// ============ Appointments ============
export interface Appointment {
  id: string;
  patientName: string;
  healthCardUid: string;
  doctor: string;
  department: string;
  appointmentTime: Date;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  patientPhone: string;
  reason: string;
}

export type AppointmentStatus = Appointment['status'];

// ============ Patients ============
export interface Patient {
  id: string;
  healthCardUid: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  ward: string;
  bloodGroup: string;
  emergencyContact: string;
  createdAt: Date;
}

export interface Diagnosis {
  id: string;
  patientId: string;
  condition: string;
  icdCode: string;
  diagnosedBy: string;
  diagnosedAt: Date;
  notes: string;
  status: 'active' | 'resolved' | 'chronic';
}

export interface Prescription {
  id: string;
  patientId: string;
  medications: Medication[];
  prescribedBy: string;
  prescribedAt: Date;
  notes: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Visit {
  id: string;
  patientId: string;
  date: Date;
  doctor: string;
  department: string;
  reason: string;
  diagnosis: string;
  prescription?: Prescription;
}

export interface TreatmentRecord {
  id: string;
  patientId: string;
  date: Date;
  treatment: string;
  doctor: string;
  notes: string;
}

// ============ Lab Reports ============
export interface LabReport {
  id: string;
  patientUid: string;
  patientName: string;
  testType: string;
  testDate: Date;
  resultSummary: string;
  status: 'pending' | 'completed' | 'critical';
  reportFile?: string;
  technician: string;
}

export type LabReportStatus = LabReport['status'];

// ============ Bed Management ============
export interface BedStats {
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  icuTotal: number;
  icuOccupied: number;
  icuAvailable: number;
  ventilators: number;
  ventilatorsInUse: number;
  emergencyBeds: number;
  emergencyOccupied: number;
  lastUpdated: Date;
}

export interface Bed {
  id: string;
  ward: string;
  bedNumber: string;
  type: 'general' | 'icu' | 'emergency' | 'pediatric' | 'maternity';
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  patientId?: string;
  patientName?: string;
  admittedAt?: Date;
}

export type BedType = Bed['type'];
export type BedStatus = Bed['status'];

// ============ Infrastructure ============
export interface Equipment {
  id: string;
  name: string;
  category: string;
  status: 'operational' | 'maintenance' | 'out-of-service';
  lastServiced: Date;
  nextServiceDue: Date;
  location: string;
  condition: 'good' | 'fair' | 'poor' | 'critical';
}

export interface InfrastructureStatus {
  ventilators: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
  };
  ambulances: {
    total: number;
    available: number;
    onDuty: number;
    maintenance: number;
  };
  criticalEquipment: Equipment[];
  lastUpdated: Date;
}

// ============ Disease Analytics ============
export interface DiseaseReport {
  id: string;
  diseaseName: string;
  numberOfCases: number;
  ward: string;
  reportedBy: string;
  reportedAt: Date;
  status: 'reported' | 'investigating' | 'contained' | 'resolved';
  notes: string;
}

export interface DiseaseTrend {
  disease: string;
  cases: number[];
  dates: string[];
}

// ============ Medicine Stock ============
export interface MedicineStock {
  id: string;
  name: string;
  genericName: string;
  category: string;
  availableQuantity: number;
  unit: string;
  minimumThreshold: number;
  reorderLevel: number;
  lastUpdated: Date;
  expiryDate: Date;
  supplier: string;
  batchNumber: string;
  location: string;
}

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'expiring-soon';

// ============ Complaints ============
export interface Complaint {
  id: string;
  citizenName: string;
  citizenPhone: string;
  issue: string;
  category: string;
  status: 'pending' | 'in-progress' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  response?: string;
  ward?: string;
}

export type ComplaintStatus = Complaint['status'];
export type ComplaintPriority = Complaint['priority'];

// ============ Staff Management ============
export type StaffType = 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'admin' | 'support';
export type StaffStatus = 'active' | 'on-leave' | 'inactive' | 'suspended';

export interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  staffType: StaffType;
  designation: string;
  department: string;
  specialization?: string; // For doctors
  qualification: string;
  experience: number; // Years
  status: StaffStatus;
  joiningDate: Date;
  salary: number;
  address: string;
  emergencyContact: string;
  avatar?: string;
  shift: 'morning' | 'afternoon' | 'night' | 'rotational';
  workingDays: string[];
}

export interface Department {
  id: string;
  name: string;
  head?: string;
  totalStaff: number;
  location: string;
  extension: string;
}

// ============ Analytics ============
export interface AnalyticsData {
  patientLoadTrends: {
    date: string;
    patients: number;
    emergencies: number;
  }[];
  bedUtilization: {
    ward: string;
    total: number;
    occupied: number;
    percentage: number;
  }[];
  commonDiseases: {
    disease: string;
    cases: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  }[];
  emergencyCases: {
    month: string;
    cases: number;
  }[];
  departmentStats: {
    department: string;
    patients: number;
    avgWaitTime: number;
  }[];
}

// ============ Navigation ============
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

// ============ Form Data ============
export interface AppointmentFormData {
  patientName: string;
  healthCardUid: string;
  doctor: string;
  department: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  phone: string;
}

export interface DiseaseReportFormData {
  diseaseName: string;
  numberOfCases: number;
  ward: string;
  date: string;
  notes: string;
}

export interface LabReportFormData {
  patientUid: string;
  testType: string;
  resultSummary: string;
  reportFile?: File;
}

export interface ComplaintResponseFormData {
  complaintId: string;
  response: string;
  status: ComplaintStatus;
}

// ============ Referrals ============
export interface Referral {
  referral_id: string;
  citizen_id: string;
  referring_doctor_id: string;
  from_hospital_id: string;
  to_hospital_id: string;
  to_doctor_id?: string;
  referral_reason: string;
  urgency_level: 'normal' | 'urgent' | 'emergency';
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  notes?: string;
  updated_at?: string;
  // Joined data
  citizen?: {
    citizen_id: string;
    name: string;
    phone?: string;
    gender?: string;
    date_of_birth?: string;
  };
  from_hospital?: {
    hospital_id: string;
    name: string;
  };
  to_hospital?: {
    hospital_id: string;
    name: string;
  };
  referring_doctor?: {
    staff_id: string;
    name: string;
    designation?: string;
  };
  to_doctor?: {
    staff_id: string;
    name: string;
    designation?: string;
  };
}

export type ReferralStatus = Referral['status'];
export type ReferralUrgency = Referral['urgency_level'];

export interface ReferralFormData {
  citizen_id: string;
  referring_doctor_id: string;
  from_hospital_id: string;
  to_hospital_id: string;
  to_doctor_id?: string;
  referral_reason: string;
  urgency_level: ReferralUrgency;
  notes?: string;
}
