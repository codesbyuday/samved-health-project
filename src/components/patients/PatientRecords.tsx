'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Phone,
  MapPin,
  Calendar,
  Droplets,
  AlertCircle,
  FileText,
  Clock,
  UserCircle,
  Eye,
  Download,
  Activity,
  Syringe,
  Bug,
  Stethoscope,
  Building2,
  UserCheck,
  Loader2,
  Plus,
  PlusCircle,
  Trash2,
  Edit,
  ExternalLink,
  ArrowRightLeft,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  citizenService,
  healthRecordService,
  diagnosticReportService,
  vaccinationRecordService,
  diseaseService,
  recentPatientsService,
  hospitalSearchService,
  doctorSearchService,
  diseaseSearchService,
  referralService,
  type Citizen,
  type HealthRecord,
  type DiagnosticReport,
  type VaccinationRecord,
  type DiseaseCase,
  type Hospital,
  type HospitalStaff,
  type Disease,
  type RecentPatient,
} from '@/services/database';
import { supabase } from '@/lib/supabase';

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Severity options
const SEVERITY_OPTIONS = [
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'severe', label: 'Severe' },
  { value: 'critical', label: 'Critical' },
];

// Disease status options
const DISEASE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'recovered', label: 'Recovered' },
  { value: 'deceased', label: 'Deceased' },
  { value: 'under_treatment', label: 'Under Treatment' },
];

// Disease category options
const DISEASE_CATEGORY_OPTIONS = [
  { value: 'communicable', label: 'Communicable' },
  { value: 'non_communicable', label: 'Non-Communicable' },
];

// Interface for reported disease in form
interface ReportedDiseaseForm {
  disease_id: string;
  disease_name: string;
  severity: string;
  status: string;
}

export default function PatientRecords() {
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Citizen[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // State for selected citizen
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // State for recent patients dialog
  const [showRecentPatients, setShowRecentPatients] = useState(false);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // State for records
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [totalVisits, setTotalVisits] = useState<number>(0);
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [labReports, setLabReports] = useState<DiagnosticReport[]>([]);
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([]);
  const [diseaseCases, setDiseaseCases] = useState<DiseaseCase[]>([]);

  // State for view modals
  const [selectedHealthRecord, setSelectedHealthRecord] = useState<HealthRecord | null>(null);
  const [selectedLabReport, setSelectedLabReport] = useState<DiagnosticReport | null>(null);
  const [selectedDiseaseCase, setSelectedDiseaseCase] = useState<DiseaseCase | null>(null);

  // State for related diseases in health record modal
  const [relatedDiseases, setRelatedDiseases] = useState<DiseaseCase[]>([]);

  // State for Add Treatment Record dialog
  const [showTreatmentDialog, setShowTreatmentDialog] = useState(false);
  const [treatmentTab, setTreatmentTab] = useState<'health-record' | 'report-disease'>('health-record');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for health record
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalResults, setHospitalResults] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);

  const [doctorSearch, setDoctorSearch] = useState('');
  const [doctorResults, setDoctorResults] = useState<HospitalStaff[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<HospitalStaff | null>(null);
  const [isSearchingDoctors, setIsSearchingDoctors] = useState(false);

  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [treatmentNotes, setTreatmentNotes] = useState('');

  // Form state for disease reporting
  const [reportedDiseases, setReportedDiseases] = useState<ReportedDiseaseForm[]>([]);
  const [showAddDiseaseDialog, setShowAddDiseaseDialog] = useState(false);
  const [diseaseSearch, setDiseaseSearch] = useState('');
  const [diseaseResults, setDiseaseResults] = useState<Disease[]>([]);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);
  const [isSearchingDiseases, setIsSearchingDiseases] = useState(false);
  const [newDiseaseSeverity, setNewDiseaseSeverity] = useState('moderate');
  const [newDiseaseStatus, setNewDiseaseStatus] = useState('active');

  // State for Add New Disease dialog
  const [showNewDiseaseDialog, setShowNewDiseaseDialog] = useState(false);
  const [newDiseaseName, setNewDiseaseName] = useState('');
  const [newDiseaseType, setNewDiseaseType] = useState('');
  const [newDiseaseCategory, setNewDiseaseCategory] = useState('non_communicable');
  const [newDiseaseNotifiable, setNewDiseaseNotifiable] = useState(false);
  const [isCreatingDisease, setIsCreatingDisease] = useState(false);

  // State for Edit Disease dialog
  const [showEditDiseaseDialog, setShowEditDiseaseDialog] = useState(false);
  const [editingDiseaseCase, setEditingDiseaseCase] = useState<DiseaseCase | null>(null);
  const [editSeverity, setEditSeverity] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // State for Refer Patient dialog
  const [showReferralDialog, setShowReferralDialog] = useState(false);
  // From Hospital (referring hospital)
  const [referralFromHospital, setReferralFromHospital] = useState<Hospital | null>(null);
  const [referralFromHospitalSearch, setReferralFromHospitalSearch] = useState('');
  const [referralFromHospitalResults, setReferralFromHospitalResults] = useState<Hospital[]>([]);
  const [isSearchingReferralFromHospitals, setIsSearchingReferralFromHospitals] = useState(false);
  // Referrer (staff from referring hospital)
  const [referralReferrer, setReferralReferrer] = useState<HospitalStaff | null>(null);
  const [referralReferrerSearch, setReferralReferrerSearch] = useState('');
  const [referralReferrerResults, setReferralReferrerResults] = useState<HospitalStaff[]>([]);
  const [isSearchingReferralReferrer, setIsSearchingReferralReferrer] = useState(false);
  // Destination Hospital
  const [referralDestinationHospital, setReferralDestinationHospital] = useState<Hospital | null>(null);
  const [referralDestinationHospitalSearch, setReferralDestinationHospitalSearch] = useState('');
  const [referralDestinationHospitalResults, setReferralDestinationHospitalResults] = useState<Hospital[]>([]);
  const [isSearchingReferralDestinationHospitals, setIsSearchingReferralDestinationHospitals] = useState(false);
  // Destination Doctor
  const [referralDestinationDoctor, setReferralDestinationDoctor] = useState<HospitalStaff | null>(null);
  const [referralDestinationDoctorSearch, setReferralDestinationDoctorSearch] = useState('');
  const [referralDestinationDoctorResults, setReferralDestinationDoctorResults] = useState<HospitalStaff[]>([]);
  const [isSearchingReferralDestinationDoctors, setIsSearchingReferralDestinationDoctors] = useState(false);
  // Other fields
  const [referralReason, setReferralReason] = useState('');
  const [referralNotes, setReferralNotes] = useState('');
  const [referralUrgency, setReferralUrgency] = useState<'normal' | 'urgent' | 'emergency'>('normal');
  const [isSubmittingReferral, setIsSubmittingReferral] = useState(false);

  // Search functionality
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await citizenService.search(query);
      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  // Load recent patients
  const loadRecentPatients = useCallback(async () => {
    setIsLoadingRecent(true);
    try {
      const { data, error } = await recentPatientsService.getRecent(20);
      if (error) {
        console.error('Error loading recent patients:', error);
      } else {
        setRecentPatients(data || []);
      }
    } catch (error) {
      console.error('Error loading recent patients:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  }, []);

  // Load citizen data
  const loadCitizenData = useCallback(async (citizenId: string) => {
    setIsLoading(true);
    try {
      const [
        healthResult,
        labResult,
        vaccinationResult,
        diseaseResult
      ] = await Promise.all([
        healthRecordService.getByCitizen(citizenId),
        diagnosticReportService.getByCitizen(citizenId),
        vaccinationRecordService.getByCitizen(citizenId),
        diseaseService.getByCitizen(citizenId)
      ]);

      if (healthResult.data) {
        setHealthRecords(healthResult.data);
        // Calculate total visits and last visit from health records
        setTotalVisits(healthResult.data.length);
        if (healthResult.data.length > 0 && healthResult.data[0].visit_date) {
          setLastVisit(healthResult.data[0].visit_date);
        } else {
          setLastVisit(null);
        }
      }
      if (labResult.data) setLabReports(labResult.data);
      if (vaccinationResult.data) setVaccinationRecords(vaccinationResult.data);
      if (diseaseResult.data) setDiseaseCases(diseaseResult.data);

    } catch (error) {
      console.error('Error loading citizen data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle citizen selection
  const handleSelectCitizen = useCallback((citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setSearchQuery('');
    setSearchResults([]);
    loadCitizenData(citizen.citizen_id);
  }, [loadCitizenData]);

  // Handle recent patient click
  const handleRecentPatientClick = useCallback((patient: RecentPatient) => {
    const citizen: Citizen = {
      citizen_id: patient.citizen_id,
      user_id: patient.user_id,
      guardian_id: patient.guardian_id,
      name: patient.name,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      ward_number: patient.ward_number,
      aadhar_id: patient.aadhar_id,
      blood_group: patient.blood_group,
      user_photo_url: patient.user_photo_url,
      date_of_birth: patient.date_of_birth,
      created_at: patient.created_at
    };
    setSelectedCitizen(citizen);
    setShowRecentPatients(false);
    loadCitizenData(patient.citizen_id);
  }, [loadCitizenData]);

  // Load related diseases for a health record
  const loadRelatedDiseases = useCallback(async (visitDate: string) => {
    const related = diseaseCases.filter(dc => {
      if (!dc.report_date) return false;
      const visitDateStr = visitDate?.split('T')[0];
      const reportDateStr = dc.report_date?.toString().split('T')[0];
      return visitDateStr === reportDateStr;
    });
    setRelatedDiseases(related);
  }, [diseaseCases]);

  // Hospital search
  useEffect(() => {
    const searchHospitals = async () => {
      if (!hospitalSearch.trim()) {
        setHospitalResults([]);
        return;
      }
      setIsSearchingHospitals(true);
      try {
        const { data, error } = await hospitalSearchService.search(hospitalSearch);
        if (!error) {
          setHospitalResults(data || []);
        } else {
          console.error('Hospital search error:', error);
          setHospitalResults([]);
        }
      } catch (err) {
        console.error('Hospital search error:', err);
        setHospitalResults([]);
      }
      setIsSearchingHospitals(false);
    };
    const timer = setTimeout(searchHospitals, 300);
    return () => clearTimeout(timer);
  }, [hospitalSearch]);

  // Doctor search - load all doctors when hospital is selected
  useEffect(() => {
    const searchDoctors = async () => {
      if (!selectedHospital) {
        setDoctorResults([]);
        return;
      }
      setIsSearchingDoctors(true);
      try {
        // Use getAllByHospital if no search query, otherwise use search
        const { data, error } = doctorSearch.trim()
          ? await doctorSearchService.searchByHospital(selectedHospital.hospital_id, doctorSearch)
          : await doctorSearchService.getAllByHospital(selectedHospital.hospital_id);
        if (!error) {
          setDoctorResults(data || []);
        } else {
          console.error('Doctor search error:', error);
          setDoctorResults([]);
        }
      } catch (err) {
        console.error('Doctor search error:', err);
        setDoctorResults([]);
      }
      setIsSearchingDoctors(false);
    };
    const timer = setTimeout(searchDoctors, 300);
    return () => clearTimeout(timer);
  }, [doctorSearch, selectedHospital]);

  // Referral - From Hospital search
  useEffect(() => {
    const searchFromHospitals = async () => {
      if (!referralFromHospitalSearch.trim()) {
        setReferralFromHospitalResults([]);
        return;
      }
      setIsSearchingReferralFromHospitals(true);
      try {
        const { data, error } = await hospitalSearchService.search(referralFromHospitalSearch);
        if (!error) {
          setReferralFromHospitalResults(data || []);
        } else {
          console.error('From hospital search error:', error);
          setReferralFromHospitalResults([]);
        }
      } catch (err) {
        console.error('From hospital search error:', err);
        setReferralFromHospitalResults([]);
      }
      setIsSearchingReferralFromHospitals(false);
    };
    const timer = setTimeout(searchFromHospitals, 300);
    return () => clearTimeout(timer);
  }, [referralFromHospitalSearch]);

  // Referral - Referrer (staff) search with role filtering
  useEffect(() => {
    const searchReferrer = async () => {
      if (!referralFromHospital) {
        setReferralReferrerResults([]);
        return;
      }
      setIsSearchingReferralReferrer(true);
      try {
        // Get all staff from hospital (not just doctors)
        const { data, error } = await doctorSearchService.getAllStaffByHospital(referralFromHospital.hospital_id);
        if (!error && data) {
          // Filter by allowed roles: doctor, nurse, receptionist only
          const allowedRoles = ['doctor', 'nurse', 'receptionist'];
          let filteredData = data.filter((staff: HospitalStaff) => {
            const designation = (staff.designation || '').toLowerCase();
            const department = (staff.department || '').toLowerCase();
            const role = (staff.role || '').toLowerCase();
            return allowedRoles.some(allowedRole => 
              designation.includes(allowedRole) || 
              department.includes(allowedRole) ||
              role.includes(allowedRole)
            );
          });
          
          // If there's a search query, further filter by name
          if (referralReferrerSearch.trim()) {
            const searchLower = referralReferrerSearch.toLowerCase();
            filteredData = filteredData.filter((staff: HospitalStaff) => 
              (staff.name || '').toLowerCase().includes(searchLower) ||
              (staff.staff_id || '').toLowerCase().includes(searchLower)
            );
          }
          
          setReferralReferrerResults(filteredData);
        } else {
          console.error('Referrer search error:', error);
          setReferralReferrerResults([]);
        }
      } catch (err) {
        console.error('Referrer search error:', err);
        setReferralReferrerResults([]);
      }
      setIsSearchingReferralReferrer(false);
    };
    
    searchReferrer();
  }, [referralReferrerSearch, referralFromHospital]);

  // Referral - Destination Hospital search
  useEffect(() => {
    const searchDestinationHospitals = async () => {
      if (!referralDestinationHospitalSearch.trim()) {
        setReferralDestinationHospitalResults([]);
        return;
      }
      setIsSearchingReferralDestinationHospitals(true);
      try {
        const { data, error } = await hospitalSearchService.search(referralDestinationHospitalSearch);
        if (!error) {
          // Exclude the from hospital from results
          const filteredData = (data || []).filter(h => h.hospital_id !== referralFromHospital?.hospital_id);
          setReferralDestinationHospitalResults(filteredData);
        } else {
          console.error('Destination hospital search error:', error);
          setReferralDestinationHospitalResults([]);
        }
      } catch (err) {
        console.error('Destination hospital search error:', err);
        setReferralDestinationHospitalResults([]);
      }
      setIsSearchingReferralDestinationHospitals(false);
    };
    const timer = setTimeout(searchDestinationHospitals, 300);
    return () => clearTimeout(timer);
  }, [referralDestinationHospitalSearch, referralFromHospital]);

  // Referral - Destination Doctor search
  useEffect(() => {
    const searchDestinationDoctors = async () => {
      if (!referralDestinationHospital) {
        setReferralDestinationDoctorResults([]);
        return;
      }
      setIsSearchingReferralDestinationDoctors(true);
      try {
        const { data, error } = referralDestinationDoctorSearch.trim()
          ? await doctorSearchService.searchByHospital(referralDestinationHospital.hospital_id, referralDestinationDoctorSearch)
          : await doctorSearchService.getAllByHospital(referralDestinationHospital.hospital_id);
        if (!error) {
          setReferralDestinationDoctorResults(data || []);
        } else {
          console.error('Destination doctor search error:', error);
          setReferralDestinationDoctorResults([]);
        }
      } catch (err) {
        console.error('Destination doctor search error:', err);
        setReferralDestinationDoctorResults([]);
      }
      setIsSearchingReferralDestinationDoctors(false);
    };
    const timer = setTimeout(searchDestinationDoctors, 300);
    return () => clearTimeout(timer);
  }, [referralDestinationDoctorSearch, referralDestinationHospital]);

  // Disease search with debounce - using ref to avoid state timing issues
  const diseaseSearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (diseaseSearchTimeoutRef.current) {
        clearTimeout(diseaseSearchTimeoutRef.current);
      }
    };
  }, []);

  const performDiseaseSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setDiseaseResults([]);
      setIsSearchingDiseases(false);
      return;
    }
    setIsSearchingDiseases(true);
    try {
      const { data, error } = await diseaseSearchService.search(query);
      if (!error && data) {
        setDiseaseResults(data);
      } else {
        setDiseaseResults([]);
      }
    } catch (err) {
      console.error('Disease search error:', err);
      setDiseaseResults([]);
    }
    setIsSearchingDiseases(false);
  }, []);

  const handleDiseaseSearchChange = useCallback((value: string) => {
    setDiseaseSearch(value);
    setSelectedDisease(null);

    // Clear previous timeout
    if (diseaseSearchTimeoutRef.current) {
      clearTimeout(diseaseSearchTimeoutRef.current);
    }

    // Debounce the search
    diseaseSearchTimeoutRef.current = setTimeout(() => {
      performDiseaseSearch(value);
    }, 300);
  }, [performDiseaseSearch]);

  // Open treatment dialog
  const openTreatmentDialog = () => {
    setTreatmentTab('health-record');
    setHospitalSearch('');
    setSelectedHospital(null);
    setDoctorSearch('');
    setSelectedDoctor(null);
    setDiagnosis('');
    setPrescription('');
    setTreatmentNotes('');
    setReportedDiseases([]);
    setShowTreatmentDialog(true);
  };

  // Open referral dialog
  const openReferralDialog = async () => {
    // Reset all fields first
    setReferralReferrerSearch('');
    setReferralReferrer(null);
    setReferralReferrerResults([]);
    setReferralDestinationHospitalSearch('');
    setReferralDestinationHospital(null);
    setReferralDestinationHospitalResults([]);
    setReferralDestinationDoctorSearch('');
    setReferralDestinationDoctor(null);
    setReferralDestinationDoctorResults([]);
    setReferralReason('');
    setReferralNotes('');
    setReferralUrgency('normal');
    
    // Auto-load hospital (for future auth integration)
    // For now, load the first hospital - user can change it
    try {
      const { data: hospitals } = await hospitalSearchService.search('');
      if (hospitals && hospitals.length > 0) {
        setReferralFromHospital(hospitals[0]);
        // Don't auto-select referrer - let user search and select
      }
    } catch (error) {
      console.error('Error loading initial referral data:', error);
    }
    
    setShowReferralDialog(true);
  };

  // Submit referral
  const handleSubmitReferral = async () => {
    if (!selectedCitizen) return;
    if (!referralFromHospital) {
      toast.error('Please select a referring hospital');
      return;
    }
    if (!referralReferrer) {
      toast.error('Please select a referrer');
      return;
    }
    if (!referralDestinationHospital) {
      toast.error('Please select a destination hospital');
      return;
    }
    if (!referralReason.trim()) {
      toast.error('Please enter a referral reason');
      return;
    }

    setIsSubmittingReferral(true);
    try {
      const { error } = await referralService.create({
        citizen_id: selectedCitizen.citizen_id,
        referring_doctor_id: referralReferrer.staff_uuid,
        from_hospital_id: referralFromHospital.hospital_id,
        to_hospital_id: referralDestinationHospital.hospital_id,
        to_doctor_id: referralDestinationDoctor?.staff_uuid || undefined,
        referral_reason: referralReason,
        urgency_level: referralUrgency,
        notes: referralNotes || undefined,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Patient referred successfully');
        setShowReferralDialog(false);
      }
    } catch (error) {
      toast.error('Failed to create referral');
    } finally {
      setIsSubmittingReferral(false);
    }
  };

  // Add disease to list
  const handleAddDisease = () => {
    if (!selectedDisease) return;
    
    setReportedDiseases(prev => [...prev, {
      disease_id: selectedDisease.disease_id,
      disease_name: selectedDisease.disease_name || 'Unknown',
      severity: newDiseaseSeverity,
      status: newDiseaseStatus,
    }]);
    
    setSelectedDisease(null);
    setDiseaseSearch('');
    setNewDiseaseSeverity('moderate');
    setNewDiseaseStatus('active');
    setShowAddDiseaseDialog(false);
  };

  // Remove disease from list
  const handleRemoveDisease = (index: number) => {
    setReportedDiseases(prev => prev.filter((_, i) => i !== index));
  };

  // Create new disease
  const handleCreateNewDisease = async () => {
    if (!newDiseaseName.trim()) {
      toast.error('Please enter disease name');
      return;
    }
    
    setIsCreatingDisease(true);
    const { data, error } = await diseaseSearchService.create({
      disease_name: newDiseaseName,
      disease_type: newDiseaseType || null,
      disease_category: newDiseaseCategory,
      is_notifiable: newDiseaseNotifiable,
    });
    
    if (error) {
      toast.error(error);
    } else if (data) {
      toast.success('Disease created successfully');
      setSelectedDisease(data);
      setDiseaseSearch(data.disease_name || '');
      setShowNewDiseaseDialog(false);
      setNewDiseaseName('');
      setNewDiseaseType('');
      setNewDiseaseCategory('non_communicable');
      setNewDiseaseNotifiable(false);
    }
    setIsCreatingDisease(false);
  };

  // Submit treatment record
  const handleSubmitTreatment = async () => {
    if (!selectedCitizen) return;
    if (!selectedHospital) {
      toast.error('Please select a hospital');
      return;
    }
    if (!selectedDoctor) {
      toast.error('Please select a doctor');
      return;
    }
    if (!diagnosis.trim()) {
      toast.error('Please enter diagnosis');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create health record
      const { data: healthRecord, error: healthError } = await healthRecordService.create({
        citizen_id: selectedCitizen.citizen_id,
        hospital_id: selectedHospital.hospital_id,
        staff_id: selectedDoctor.staff_uuid,
        diagnosis: diagnosis,
        prescription: prescription || null,
        notes: treatmentNotes || null,
        visit_date: new Date().toISOString().split('T')[0],
      });

      if (healthError) throw new Error(healthError);
      if (!healthRecord) throw new Error('Failed to create health record');

      // Create disease cases if any
      for (const disease of reportedDiseases) {
        const { error: diseaseError } = await diseaseService.create({
          hospital_id: selectedHospital.hospital_id,
          citizen_id: selectedCitizen.citizen_id,
          disease_id: disease.disease_id,
          severity: disease.severity,
          status: disease.status,
          report_date: new Date().toISOString().split('T')[0],
          reported_by: selectedDoctor.staff_uuid,
        });
        
        if (diseaseError) {
          console.error('Error creating disease case:', diseaseError);
          toast.error(`Failed to report disease: ${disease.disease_name}`);
        }
      }

      toast.success('Treatment record added successfully');
      setShowTreatmentDialog(false);
      loadCitizenData(selectedCitizen.citizen_id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add treatment record');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit disease case
  const handleEditDiseaseCase = (diseaseCase: DiseaseCase) => {
    if (diseaseCase.status === 'recovered') {
      toast.error('Cannot edit recovered disease cases');
      return;
    }
    setEditingDiseaseCase(diseaseCase);
    setEditSeverity(diseaseCase.severity || 'moderate');
    setEditStatus(diseaseCase.status || 'active');
    setShowEditDiseaseDialog(true);
  };

  // Save edited disease case
  const handleSaveDiseaseCase = async () => {
    if (!editingDiseaseCase) return;
    
    setIsSubmitting(true);
    const { error } = await diseaseService.update(editingDiseaseCase.case_id, {
      severity: editSeverity,
      status: editStatus,
    });
    
    if (error) {
      toast.error(error);
    } else {
      toast.success('Disease case updated');
      setShowEditDiseaseDialog(false);
      if (selectedCitizen) {
        loadCitizenData(selectedCitizen.citizen_id);
      }
    }
    setIsSubmitting(false);
  };

  // Get signed URL for lab report
  const getSignedUrl = async (path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('lab_reports')
        .createSignedUrl(path, 3600);
      
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  // Handle view lab report
  const handleViewReport = async (report: DiagnosticReport) => {
    if (!report.report_file_url) {
      toast.error('No report file available');
      return;
    }
    
    const signedUrl = await getSignedUrl(report.report_file_url);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast.error('Failed to get report URL');
    }
  };

  // Handle download lab report
  const handleDownloadReport = async (report: DiagnosticReport) => {
    if (!report.report_file_url) {
      toast.error('No report file available');
      return;
    }
    
    const signedUrl = await getSignedUrl(report.report_file_url);
    if (signedUrl) {
      const a = document.createElement('a');
      a.href = signedUrl;
      a.download = `report_${report.report_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      toast.error('Failed to download report');
    }
  };

  // Get severity badge color
  const getSeverityBadge = (severity: string | null) => {
    if (!severity) return null;
    const colors: Record<string, string> = {
      mild: 'bg-green-50 text-green-700 border-green-200',
      moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      severe: 'bg-orange-50 text-orange-700 border-orange-200',
      critical: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[severity.toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Get status badge color
  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    const colors: Record<string, string> = {
      active: 'bg-red-50 text-red-700 border-red-200',
      recovered: 'bg-green-50 text-green-700 border-green-200',
      under_treatment: 'bg-blue-50 text-blue-700 border-blue-200',
      deceased: 'bg-slate-50 text-slate-700 border-slate-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      in_progress: 'bg-blue-50 text-blue-700 border-blue-200'
    };
    return colors[status.toLowerCase()] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Get age for display
  const getAge = (citizen: Citizen): number | null => {
    if (citizen.date_of_birth) {
      return calculateAge(citizen.date_of_birth);
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Patient Records</h2>
          <p className="text-sm text-slate-500 mt-1">
            Search and manage patient health records
          </p>
        </div>
      </div>

      {/* Search Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-2xl">
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Search Patient by Health Card UID, Name, Phone, or Aadhar
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Enter Health Card UID (e.g., SMC-2024-001234), Name, or Phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setShowRecentPatients(true);
                  loadRecentPatients();
                }}
              >
                <UserCircle className="h-4 w-4" />
                Recent Patients
              </Button>
            </div>

            {/* Search Results */}
            {searchQuery && searchResults.length > 0 && (
              <div className="w-full max-w-2xl mt-4">
                <p className="text-sm text-slate-500 mb-2">
                  Found {searchResults.length} patient(s):
                </p>
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {searchResults.map((citizen) => (
                    <button
                      key={citizen.citizen_id}
                      onClick={() => handleSelectCitizen(citizen)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                        {citizen.name?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{citizen.name}</p>
                        <p className="text-sm text-slate-500">
                          {citizen.citizen_id} - {getAge(citizen) ?? 'N/A'} yrs - {citizen.gender}
                        </p>
                      </div>
                      <Badge variant="outline">Ward {citizen.ward_number}</Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="w-full max-w-2xl mt-4 text-center py-8">
                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No patients found matching your search.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Profile */}
      {selectedCitizen && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Patient Info Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white text-2xl font-bold">
                  {selectedCitizen.name?.charAt(0) || '?'}
                </div>
                <div>
                  <CardTitle className="text-xl">{selectedCitizen.name}</CardTitle>
                  <p className="text-sm text-slate-500">{selectedCitizen.citizen_id}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="capitalize">
                  {selectedCitizen.gender}
                </Badge>
                <Badge variant="outline">{getAge(selectedCitizen) ?? 'N/A'} years</Badge>
                {selectedCitizen.blood_group && (
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    <Droplets className="h-3 w-3 mr-1" />
                    {selectedCitizen.blood_group}
                  </Badge>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{selectedCitizen.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{selectedCitizen.address || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">Ward: {selectedCitizen.ward_number || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <div>
                    <span className="text-slate-500">Registered: </span>
                    <span className="text-slate-600">
                      {selectedCitizen.created_at
                        ? format(new Date(selectedCitizen.created_at), 'MMM dd, yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Visit Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-600 font-medium">Total Visits</p>
                  <p className="text-2xl font-bold text-blue-700">{totalVisits}</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-xs text-green-600 font-medium">Last Visit</p>
                  <p className="text-sm font-bold text-green-700">
                    {lastVisit ? format(parseISO(lastVisit), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                <Button 
                  className="w-full gap-2" 
                  onClick={openTreatmentDialog}
                >
                  <Plus className="h-4 w-4" />
                  Add Treatment Record
                </Button>
                <Button 
                  variant="outline"
                  className="w-full gap-2" 
                  onClick={openReferralDialog}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  Refer Patient
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Patient Details Tabs */}
          <Card className="lg:col-span-2">
            <Tabs defaultValue="health-records" className="w-full">
              <CardHeader className="pb-0">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="health-records">Health Records</TabsTrigger>
                  <TabsTrigger value="lab-reports">Lab Reports</TabsTrigger>
                  <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
                  <TabsTrigger value="diseases">Diseases</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="pt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {/* Health Records Tab */}
                    <TabsContent value="health-records" className="space-y-3">
                      {healthRecords.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Stethoscope className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                          <p>No health records found.</p>
                        </div>
                      ) : (
                        healthRecords.map((record) => (
                          <div
                            key={record.record_id}
                            className="p-4 rounded-lg border bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-slate-800">
                                    {record.visit_date
                                      ? format(parseISO(record.visit_date), 'MMM dd, yyyy')
                                      : 'N/A'}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">
                                  <span className="font-medium">Diagnosis:</span> {record.diagnosis || 'N/A'}
                                </p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" />
                                    {record.staff?.name || 'Unknown Doctor'}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {record.hospital?.name || 'Unknown Hospital'}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedHealthRecord(record);
                                  if (record.visit_date) {
                                    loadRelatedDiseases(record.visit_date);
                                  }
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    {/* Lab Reports Tab */}
                    <TabsContent value="lab-reports" className="space-y-3">
                      {labReports.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                          <p>No lab reports found.</p>
                        </div>
                      ) : (
                        labReports.map((report) => (
                          <div
                            key={report.report_id}
                            className="p-4 rounded-lg border bg-slate-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Activity className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-slate-800">
                                    {report.test_type?.test_name || 'Lab Test'}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500">
                                  Test Date: {report.test_date
                                    ? format(parseISO(report.test_date), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                                  <span>{report.hospital?.name || 'Unknown Hospital'}</span>
                                  <Badge
                                    variant="outline"
                                    className={cn('capitalize', getStatusBadge(report.status))}
                                  >
                                    {report.status || 'Unknown'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedLabReport(report)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    {/* Vaccination Records Tab */}
                    <TabsContent value="vaccinations" className="space-y-3">
                      {vaccinationRecords.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Syringe className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                          <p>No vaccination records found.</p>
                        </div>
                      ) : (
                        vaccinationRecords.map((record) => (
                          <div
                            key={record.record_id}
                            className="p-4 rounded-lg border bg-slate-50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                                <Syringe className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-slate-800">
                                  {record.vaccine_type || 'Vaccine'}
                                </p>
                                <p className="text-sm text-slate-500">
                                  Dose #{record.dose_number || 'N/A'} - {record.hospital?.name || 'Unknown Hospital'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-slate-700">
                                  {record.date_administered
                                    ? format(parseISO(record.date_administered), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    {/* Diseases Tab */}
                    <TabsContent value="diseases" className="space-y-3">
                      {diseaseCases.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Bug className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                          <p>No disease records found.</p>
                        </div>
                      ) : (
                        diseaseCases.map((diseaseCase) => (
                          <div
                            key={diseaseCase.case_id}
                            className="p-4 rounded-lg border bg-slate-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Bug className="h-4 w-4 text-red-500" />
                                  <span className="font-medium text-slate-800">
                                    {diseaseCase.disease?.disease_name || 'Unknown Disease'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 flex-wrap mt-1">
                                  <Badge variant="outline" className="capitalize">
                                    {diseaseCase.disease?.disease_category || 'N/A'}
                                  </Badge>
                                  <Badge variant="outline" className="capitalize">
                                    {diseaseCase.disease?.disease_type || 'N/A'}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn('capitalize', getSeverityBadge(diseaseCase.severity))}
                                  >
                                    {diseaseCase.severity || 'N/A'}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={cn('capitalize', getStatusBadge(diseaseCase.status))}
                                  >
                                    {diseaseCase.status || 'N/A'}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                  Reported: {diseaseCase.report_date
                                    ? format(parseISO(diseaseCase.report_date), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedDiseaseCase(diseaseCase)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {diseaseCase.status !== 'recovered' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEditDiseaseCase(diseaseCase)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </>
                )}
              </CardContent>
            </Tabs>
          </Card>
        </div>
      )}

      {/* Recent Patients Dialog */}
      <Dialog open={showRecentPatients} onOpenChange={setShowRecentPatients}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Recent Patients</DialogTitle>
            <DialogDescription>
              Patients sorted by most recent hospital visit
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            {isLoadingRecent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <UserCircle className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                <p>No recent patients found.</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentPatients.map((patient) => (
                  <button
                    key={patient.citizen_id}
                    onClick={() => handleRecentPatientClick(patient)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {patient.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-800">{patient.name}</p>
                      <p className="text-sm text-slate-500">
                        {patient.citizen_id} - {patient.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Last Visit</p>
                      <p className="text-sm font-medium">
                        {patient.latest_visit_date
                          ? format(parseISO(patient.latest_visit_date), 'MMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Health Record Detail Dialog */}
      <Dialog open={!!selectedHealthRecord} onOpenChange={() => setSelectedHealthRecord(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Health Record Details</DialogTitle>
            <DialogDescription>
              Complete information about this health record
            </DialogDescription>
          </DialogHeader>
          {selectedHealthRecord && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Hospital Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Hospital Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Hospital Name:</span>
                      <p className="font-medium">{selectedHealthRecord.hospital?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Hospital Address:</span>
                      <p className="font-medium">{selectedHealthRecord.hospital?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Doctor Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Doctor Name:</span>
                      <p className="font-medium">{selectedHealthRecord.staff?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <p className="font-medium">{selectedHealthRecord.staff?.department || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Visit Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Visit Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-500">Visit Date:</span>
                      <p className="font-medium">
                        {selectedHealthRecord.visit_date
                          ? format(parseISO(selectedHealthRecord.visit_date), 'MMMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Diagnosis:</span>
                      <p className="font-medium whitespace-pre-wrap">{selectedHealthRecord.diagnosis || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Prescription:</span>
                      <p className="font-medium whitespace-pre-wrap">{selectedHealthRecord.prescription || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Notes:</span>
                      <p className="font-medium whitespace-pre-wrap">{selectedHealthRecord.notes || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Reported Diseases Section */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-slate-800 flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Reported Diseases ({relatedDiseases.length})
                    </h4>
                  </div>
                  {relatedDiseases.length === 0 ? (
                    <p className="text-sm text-slate-500">No diseases reported on this visit date.</p>
                  ) : (
                    <div className="space-y-2">
                      {relatedDiseases.map((disease) => (
                        <div
                          key={disease.case_id}
                          className="p-3 rounded border bg-white text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{disease.disease?.disease_name}</span>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={cn('capitalize text-xs', getSeverityBadge(disease.severity))}
                                >
                                  {disease.severity}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cn('capitalize text-xs', getStatusBadge(disease.status))}
                                >
                                  {disease.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {disease.disease?.disease_category} - {disease.disease?.disease_type}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => setSelectedDiseaseCase(disease)}
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {disease.status !== 'recovered' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleEditDiseaseCase(disease)}
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Lab Report Detail Dialog */}
      <Dialog open={!!selectedLabReport} onOpenChange={() => setSelectedLabReport(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Lab Report Details</DialogTitle>
            <DialogDescription>
              Complete information about this lab report
            </DialogDescription>
          </DialogHeader>
          {selectedLabReport && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Test Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Test Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Test Name:</span>
                      <p className="font-medium">{selectedLabReport.test_type?.test_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Test Category:</span>
                      <p className="font-medium">{selectedLabReport.test_type?.test_category || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Test Date:</span>
                      <p className="font-medium">
                        {selectedLabReport.test_date
                          ? format(parseISO(selectedLabReport.test_date), 'MMMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', getStatusBadge(selectedLabReport.status))}
                      >
                        {selectedLabReport.status || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Hospital Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Hospital Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Hospital Name:</span>
                      <p className="font-medium">{selectedLabReport.hospital?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Hospital Address:</span>
                      <p className="font-medium">{selectedLabReport.hospital?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Result Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3">Results</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-slate-500">Result:</span>
                      <p className="font-medium whitespace-pre-wrap">{selectedLabReport.result || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Description:</span>
                      <p className="font-medium whitespace-pre-wrap">{selectedLabReport.description || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
          {selectedLabReport?.report_file_url && (
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleViewReport(selectedLabReport)}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Report
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleDownloadReport(selectedLabReport)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Disease Case Detail Dialog */}
      <Dialog open={!!selectedDiseaseCase} onOpenChange={() => setSelectedDiseaseCase(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Disease Case Details</DialogTitle>
            <DialogDescription>
              Complete information about this reported disease
            </DialogDescription>
          </DialogHeader>
          {selectedDiseaseCase && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Disease Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Bug className="h-4 w-4" />
                    Disease Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Disease Name:</span>
                      <p className="font-medium">{selectedDiseaseCase.disease?.disease_name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Disease Type:</span>
                      <p className="font-medium">{selectedDiseaseCase.disease?.disease_type || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span>
                      <p className="font-medium capitalize">{selectedDiseaseCase.disease?.disease_category || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Hospital Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Reporting Hospital
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Hospital Name:</span>
                      <p className="font-medium">{selectedDiseaseCase.hospital?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Hospital Address:</span>
                      <p className="font-medium">{selectedDiseaseCase.hospital?.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Reporting Doctor Info */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Reporting Doctor
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Doctor Name:</span>
                      <p className="font-medium">{selectedDiseaseCase.reported_by_staff?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <p className="font-medium">{selectedDiseaseCase.reported_by_staff?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Designation:</span>
                      <p className="font-medium">{selectedDiseaseCase.reported_by_staff?.designation || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Case Details */}
                <div className="p-4 rounded-lg border bg-slate-50">
                  <h4 className="font-medium text-slate-800 mb-3">Case Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Report Date:</span>
                      <p className="font-medium">
                        {selectedDiseaseCase.report_date
                          ? format(parseISO(selectedDiseaseCase.report_date), 'MMMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Severity:</span>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', getSeverityBadge(selectedDiseaseCase.severity))}
                      >
                        {selectedDiseaseCase.severity || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <Badge
                        variant="outline"
                        className={cn('capitalize', getStatusBadge(selectedDiseaseCase.status))}
                      >
                        {selectedDiseaseCase.status || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-slate-500">Ward Number:</span>
                      <p className="font-medium">{selectedDiseaseCase.ward_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Treatment Record Dialog */}
      <Dialog open={showTreatmentDialog} onOpenChange={setShowTreatmentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Treatment Record</DialogTitle>
            <DialogDescription>
              Add a new health record for {selectedCitizen?.name}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={treatmentTab} onValueChange={(v) => setTreatmentTab(v as 'health-record' | 'report-disease')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="health-record">Health Record Details</TabsTrigger>
              <TabsTrigger value="report-disease">Report Disease</TabsTrigger>
            </TabsList>
            
            <ScrollArea className="max-h-[50vh] mt-4">
              {/* Health Record Tab */}
              <TabsContent value="health-record" className="space-y-4 pr-4">
                {/* Hospital Search */}
                <div className="space-y-2">
                  <Label>Hospital Name *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Search hospital by name or ID..."
                      value={selectedHospital ? selectedHospital.name || '' : hospitalSearch}
                      onChange={(e) => {
                        setHospitalSearch(e.target.value);
                        setSelectedHospital(null);
                      }}
                      className="pl-10"
                      disabled={!!selectedHospital}
                    />
                    {isSearchingHospitals && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>
                  {hospitalResults.length > 0 && !selectedHospital && (
                    <div className="border rounded-lg divide-y max-h-40 overflow-auto">
                      {hospitalResults.map((hospital) => (
                        <button
                          key={hospital.hospital_id}
                          className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 text-left"
                          onClick={() => {
                            setSelectedHospital(hospital);
                            setHospitalSearch('');
                            setSelectedDoctor(null);
                            setDoctorSearch('');
                          }}
                        >
                          <Building2 className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="font-medium text-sm">{hospital.name}</p>
                            <p className="text-xs text-slate-500">{hospital.hospital_id}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedHospital && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{selectedHospital.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-6 px-2"
                        onClick={() => {
                          setSelectedHospital(null);
                          setDoctorSearch('');
                          setSelectedDoctor(null);
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </div>

                {/* Doctor Search */}
                <div className="space-y-2">
                  <Label>Doctor Name *</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder={selectedHospital ? "Search doctor by name or staff ID..." : "Select hospital first"}
                      value={selectedDoctor ? selectedDoctor.name || '' : doctorSearch}
                      onChange={(e) => {
                        setDoctorSearch(e.target.value);
                        setSelectedDoctor(null);
                      }}
                      className="pl-10"
                      disabled={!selectedHospital || !!selectedDoctor}
                    />
                    {isSearchingDoctors && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                  </div>
                  {doctorResults.length > 0 && !selectedDoctor && (
                    <div className="border rounded-lg divide-y max-h-40 overflow-auto">
                      {doctorResults.map((doctor) => (
                        <button
                          key={doctor.staff_uuid}
                          className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 text-left"
                          onClick={() => {
                            setSelectedDoctor(doctor);
                            setDoctorSearch('');
                          }}
                        >
                          <UserCheck className="h-4 w-4 text-slate-400" />
                          <div>
                            <p className="font-medium text-sm">{doctor.name}</p>
                            <p className="text-xs text-slate-500">{doctor.staff_id} - {doctor.department}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedDoctor && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <UserCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{selectedDoctor.name}</span>
                      <span className="text-xs text-slate-500">({selectedDoctor.department})</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-6 px-2"
                        onClick={() => setSelectedDoctor(null)}
                      >
                        Change
                      </Button>
                    </div>
                  )}
                </div>

                {/* Diagnosis */}
                <div className="space-y-2">
                  <Label>Diagnosis *</Label>
                  <Textarea
                    placeholder="Enter diagnosis..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Prescription */}
                <div className="space-y-2">
                  <Label>Prescription</Label>
                  <Textarea
                    placeholder="Enter prescription..."
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Treatment Notes */}
                <div className="space-y-2">
                  <Label>Treatment Notes</Label>
                  <Textarea
                    placeholder="Enter treatment notes..."
                    value={treatmentNotes}
                    onChange={(e) => setTreatmentNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </TabsContent>

              {/* Report Disease Tab */}
              <TabsContent value="report-disease" className="space-y-4 pr-4">
                <div className="flex items-center justify-between">
                  <Label>Reported Diseases</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Reset state and open dialog
                      setDiseaseSearch('');
                      setSelectedDisease(null);
                      setDiseaseResults([]);
                      setShowAddDiseaseDialog(true);
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Disease
                  </Button>
                </div>

                {reportedDiseases.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border rounded-lg">
                    <Bug className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No diseases reported yet.</p>
                    <p className="text-xs">Click &quot;Add Disease&quot; to report a disease.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reportedDiseases.map((disease, index) => (
                      <div 
                        key={index} 
                        className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 border border-red-100 shrink-0">
                              <Bug className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-base">{disease.disease_name}</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-xs font-medium px-2 py-0.5', getSeverityBadge(disease.severity))}
                                >
                                  Severity: {disease.severity}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-xs font-medium px-2 py-0.5', getStatusBadge(disease.status))}
                                >
                                  Status: {disease.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                            onClick={() => handleRemoveDisease(index)}
                            title="Remove disease"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTreatmentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitTreatment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Disease Dialog */}
      <Dialog open={showAddDiseaseDialog} onOpenChange={setShowAddDiseaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Disease</DialogTitle>
            <DialogDescription>Search and add a disease to report.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Disease Search */}
            <div className="space-y-2">
              <Label>Search Disease</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Type to search diseases..."
                  value={selectedDisease ? selectedDisease.disease_name || '' : diseaseSearch}
                  onChange={(e) => handleDiseaseSearchChange(e.target.value)}
                  className="pl-10"
                  disabled={!!selectedDisease}
                />
                {isSearchingDiseases && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                )}
              </div>
              {/* Fixed height container to prevent layout shifts */}
              <div className="min-h-[120px]">
                {diseaseResults.length > 0 && !selectedDisease && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-auto bg-white shadow-sm">
                    {diseaseResults.slice(0, 10).map((disease) => (
                      <button
                        key={disease.disease_id}
                        className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 text-left transition-colors"
                        onClick={() => {
                          setSelectedDisease(disease);
                          setDiseaseSearch('');
                          setDiseaseResults([]);
                        }}
                      >
                        <Bug className="h-4 w-4 text-red-400" />
                        <div>
                          <p className="font-medium text-sm text-slate-800">{disease.disease_name}</p>
                          <p className="text-xs text-slate-500">{disease.disease_category} - {disease.disease_type || 'N/A'}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {selectedDisease && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Bug className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{selectedDisease.disease_name}</p>
                      <p className="text-xs text-green-600">{selectedDisease.disease_category} - {selectedDisease.disease_type || 'N/A'}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-green-700 hover:text-green-800 hover:bg-green-100"
                      onClick={() => {
                        setSelectedDisease(null);
                        setDiseaseSearch('');
                        setDiseaseResults([]);
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )}
                {diseaseSearch && diseaseResults.length === 0 && !isSearchingDiseases && !selectedDisease && (
                  <div className="text-center py-4 border rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500 mb-2">No disease found matching "{diseaseSearch}"</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewDiseaseName(diseaseSearch);
                        setShowAddDiseaseDialog(false);
                        setShowNewDiseaseDialog(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Disease
                    </Button>
                  </div>
                )}
                {/* Show placeholder when nothing is displayed */}
                {!diseaseSearch && !selectedDisease && diseaseResults.length === 0 && !isSearchingDiseases && (
                  <div className="text-center py-4 text-slate-400 border rounded-lg bg-slate-50">
                    <p className="text-sm">Start typing to search diseases...</p>
                  </div>
                )}
                {/* Show searching indicator */}
                {isSearchingDiseases && !selectedDisease && (
                  <div className="text-center py-4 text-slate-500 border rounded-lg bg-slate-50">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Searching...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={newDiseaseSeverity} onValueChange={setNewDiseaseSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newDiseaseStatus} onValueChange={setNewDiseaseStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISEASE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDiseaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDisease} disabled={!selectedDisease}>
              Add Disease
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Disease Dialog */}
      <Dialog open={showNewDiseaseDialog} onOpenChange={setShowNewDiseaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Disease</DialogTitle>
            <DialogDescription>Create a new disease entry in the database.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Disease Name *</Label>
              <Input
                placeholder="Enter disease name..."
                value={newDiseaseName}
                onChange={(e) => setNewDiseaseName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Disease Type</Label>
              <Input
                placeholder="e.g., Viral, Bacterial, etc."
                value={newDiseaseType}
                onChange={(e) => setNewDiseaseType(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={newDiseaseCategory} onValueChange={setNewDiseaseCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISEASE_CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifiable"
                checked={newDiseaseNotifiable}
                onChange={(e) => setNewDiseaseNotifiable(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="notifiable" className="text-sm font-normal">
                Is Notifiable Disease
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDiseaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateNewDisease} disabled={isCreatingDisease || !newDiseaseName.trim()}>
              {isCreatingDisease && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Disease
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Disease Case Dialog */}
      <Dialog open={showEditDiseaseDialog} onOpenChange={setShowEditDiseaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Disease Case</DialogTitle>
            <DialogDescription>
              Update severity and status for {editingDiseaseCase?.disease?.disease_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={editSeverity} onValueChange={setEditSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISEASE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDiseaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDiseaseCase} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Refer Patient Dialog */}
      <Dialog open={showReferralDialog} onOpenChange={setShowReferralDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Refer Patient
            </DialogTitle>
            <DialogDescription>
              Create a referral for {selectedCitizen?.name || 'this patient'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[55vh]">
            <div className="space-y-4 pr-4">
              {/* From Hospital (Referring Hospital) */}
              <div className="space-y-2">
                <Label>Referring Hospital *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search hospital by name..."
                    value={referralFromHospital ? referralFromHospital.name || '' : referralFromHospitalSearch}
                    onChange={(e) => {
                      setReferralFromHospitalSearch(e.target.value);
                      setReferralFromHospital(null);
                      setReferralReferrer(null);
                      setReferralReferrerSearch('');
                    }}
                    className="pl-10"
                    disabled={!!referralFromHospital}
                  />
                  {isSearchingReferralFromHospitals && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>
                {referralFromHospitalResults.length > 0 && !referralFromHospital && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-auto">
                    {referralFromHospitalResults.map((hospital) => (
                      <button
                        key={hospital.hospital_id}
                        className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                        onClick={() => {
                          setReferralFromHospital(hospital);
                          setReferralFromHospitalSearch('');
                          setReferralFromHospitalResults([]);
                          setReferralReferrer(null);
                          setReferralReferrerSearch('');
                        }}
                      >
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-sm">{hospital.name}</p>
                          <p className="text-xs text-slate-500">{hospital.hospital_id}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {referralFromHospital && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{referralFromHospital.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-6 px-2"
                      onClick={() => {
                        setReferralFromHospital(null);
                        setReferralFromHospitalSearch('');
                        setReferralReferrer(null);
                        setReferralReferrerSearch('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Referrer (Staff) */}
              <div className="space-y-2">
                <Label>Referrer (Staff) *</Label>
                <p className="text-xs text-slate-500">Select doctor, nurse, or receptionist from {referralFromHospital?.name || 'hospital'}</p>
                
                {!referralReferrer ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        placeholder={referralFromHospital ? "Type to search staff name..." : "Select hospital first"}
                        value={referralReferrerSearch}
                        onChange={(e) => setReferralReferrerSearch(e.target.value)}
                        className="pl-10"
                        disabled={!referralFromHospital}
                      />
                      {isSearchingReferralReferrer && (
                        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                      )}
                    </div>
                    {referralReferrerResults.length > 0 && referralFromHospital && (
                      <div className="border rounded-lg divide-y max-h-48 overflow-auto">
                        {referralReferrerResults.map((staff) => (
                          <button
                            key={staff.staff_uuid}
                            type="button"
                            className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                            onClick={() => {
                              setReferralReferrer(staff);
                              setReferralReferrerSearch('');
                            }}
                          >
                            <UserCheck className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{staff.name}</p>
                              <p className="text-xs text-slate-500 truncate">
                                {staff.designation || staff.role || 'Staff'}
                                {staff.department && ` - ${staff.department}`}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {referralFromHospital && referralReferrerSearch && referralReferrerResults.length === 0 && !isSearchingReferralReferrer && (
                      <p className="text-xs text-slate-400">No matching staff found</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <UserCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300 truncate">{referralReferrer.name}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {referralReferrer.designation || referralReferrer.role || 'Staff'}
                        {referralReferrer.department && ` - ${referralReferrer.department}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setReferralReferrer(null);
                        setReferralReferrerSearch('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="flex items-center gap-2 py-2">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              {/* Destination Hospital */}
              <div className="space-y-2">
                <Label>Destination Hospital *</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search destination hospital..."
                    value={referralDestinationHospital ? referralDestinationHospital.name || '' : referralDestinationHospitalSearch}
                    onChange={(e) => {
                      setReferralDestinationHospitalSearch(e.target.value);
                      setReferralDestinationHospital(null);
                    }}
                    className="pl-10"
                    disabled={!!referralDestinationHospital}
                  />
                  {isSearchingReferralDestinationHospitals && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>
                {referralDestinationHospitalResults.length > 0 && !referralDestinationHospital && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-auto">
                    {referralDestinationHospitalResults.map((hospital) => (
                      <button
                        key={hospital.hospital_id}
                        className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                        onClick={() => {
                          setReferralDestinationHospital(hospital);
                          setReferralDestinationHospitalSearch('');
                          setReferralDestinationHospitalResults([]);
                        }}
                      >
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-sm">{hospital.name}</p>
                          <p className="text-xs text-slate-500">{hospital.hospital_id}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {referralDestinationHospital && (
                  <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <Building2 className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">{referralDestinationHospital.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-6 px-2"
                      onClick={() => {
                        setReferralDestinationHospital(null);
                        setReferralDestinationHospitalSearch('');
                        setReferralDestinationDoctor(null);
                        setReferralDestinationDoctorSearch('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Destination Doctor (Optional) */}
              <div className="space-y-2">
                <Label>Destination Doctor (Optional)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder={referralDestinationHospital ? "Search doctor..." : "Select destination hospital first"}
                    value={referralDestinationDoctor ? referralDestinationDoctor.name || '' : referralDestinationDoctorSearch}
                    onChange={(e) => {
                      setReferralDestinationDoctorSearch(e.target.value);
                      setReferralDestinationDoctor(null);
                    }}
                    className="pl-10"
                    disabled={!referralDestinationHospital || !!referralDestinationDoctor}
                  />
                  {isSearchingReferralDestinationDoctors && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}
                </div>
                {referralDestinationDoctorResults.length > 0 && !referralDestinationDoctor && referralDestinationHospital && (
                  <div className="border rounded-lg divide-y max-h-40 overflow-auto">
                    {referralDestinationDoctorResults.map((doctor) => (
                      <button
                        key={doctor.staff_id}
                        className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left"
                        onClick={() => {
                          setReferralDestinationDoctor(doctor);
                          setReferralDestinationDoctorSearch('');
                          setReferralDestinationDoctorResults([]);
                        }}
                      >
                        <UserCheck className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-sm">{doctor.name}</p>
                          <p className="text-xs text-slate-500">{doctor.designation} {doctor.department && `- ${doctor.department}`}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {referralDestinationDoctor && (
                  <div className="flex items-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <UserCheck className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">{referralDestinationDoctor.name}</span>
                    <span className="text-xs text-slate-500">({referralDestinationDoctor.designation})</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto h-6 px-2"
                      onClick={() => {
                        setReferralDestinationDoctor(null);
                        setReferralDestinationDoctorSearch('');
                      }}
                    >
                      Change
                    </Button>
                  </div>
                )}
              </div>

              {/* Referral Reason */}
              <div className="space-y-2">
                <Label>Referral Reason *</Label>
                <Textarea
                  placeholder="Enter reason for referral..."
                  value={referralReason}
                  onChange={(e) => setReferralReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={referralNotes}
                  onChange={(e) => setReferralNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Urgency Level */}
              <div className="space-y-2">
                <Label>Urgency Level</Label>
                <Select value={referralUrgency} onValueChange={(v) => setReferralUrgency(v as 'normal' | 'urgent' | 'emergency')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowReferralDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReferral} 
              disabled={isSubmittingReferral || !referralFromHospital || !referralReferrer || !referralDestinationHospital || !referralReason.trim()}
            >
              {isSubmittingReferral && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Create Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
