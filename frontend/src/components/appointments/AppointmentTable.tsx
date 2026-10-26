'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  appointmentService,
  citizenService,
  doctorService,
  hospitalService,
  hospitalWardService,
  getCurrentHospitalId,
  DEPARTMENTS,
  TIME_SLOTS,
  type Appointment,
  type Citizen,
  type Doctor,
  type Hospital,
  type HospitalWard,
} from '@/services/database';
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Calendar as CalendarIcon,
  User,
  Building2,
  Phone,
  MapPin,
  Stethoscope,
  Eye,
  FileText,
  Printer,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { format, isToday, isFuture, parseISO, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AccessDenied from '@/components/auth/AccessDenied';
import { useRBAC } from '@/hooks/use-rbac';

const statusColors: Record<string, string> = {
  booked: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  not_attended: 'bg-amber-100 text-amber-700 border-amber-200',
  rescheduled: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function AppointmentTable() {
  const { user } = useAuth();
  const currentHospitalId = user?.hospital_id || getCurrentHospitalId();
  const { getModuleAccess } = useRBAC();
  const moduleAccess = getModuleAccess('appointments');
  const canManageAppointments = moduleAccess === 'full';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printingAppointmentId, setPrintingAppointmentId] = useState<string | null>(null);

  // New appointment ID verification state
  const [idType, setIdType] = useState<'health_id' | 'aadhar_id' | 'phone'>('health_id');
  const [idInput, setIdInput] = useState('');
  const [isVerifyingCitizen, setIsVerifyingCitizen] = useState(false);
  const [verifiedCitizen, setVerifiedCitizen] = useState<(Citizen & { ward?: any; age?: number }) | null>(null);
  const [isCitizenConfirmed, setIsCitizenConfirmed] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // New appointment booking details
  const [selectedDepartment, setSelectedDepartment] = useState<string>('not_decided');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [appointmentType, setAppointmentType] = useState<string>('in_person');
  const [bookingErrors, setBookingErrors] = useState<Record<string, string>>({});

  // Load data on mount / hospital change
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading && appointments.length === 0) {
      setIsLoading(true);
    }
    const [aptResult, docResult, hospResult] = await Promise.all([
      appointmentService.getAll(currentHospitalId),
      doctorService.getAll(currentHospitalId),
      currentHospitalId ? hospitalService.getById(currentHospitalId) : Promise.resolve({ data: null, error: null }),
    ]);
    
    if (aptResult.data) setAppointments(aptResult.data);
    if (docResult.data) setDoctors(docResult.data);
    if (hospResult?.data) setCurrentHospital(hospResult.data);
    setIsLoading(false);
  }, [currentHospitalId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Available departments for booking: union of doctors' departments + standard hospital specialties
  const availableBookingDepartments = useMemo(() => {
    const depts = new Set<string>();
    doctors.forEach(d => {
      const dept = d.department || d.specialization;
      if (dept && dept !== 'General') depts.add(dept);
    });
    ['General Medicine', 'Gynecology', 'Neurology', 'Endocrinology', 'Cardiology', 'Pediatrics', 'Orthopedics', 'Dermatology'].forEach(d => depts.add(d));
    return Array.from(depts).sort();
  }, [doctors]);

  // Filter available doctors for the modal:
  // If 'not_decided' is selected, show ALL doctors associated with the current hospital!
  // If a specific department is selected, filter doctors by that department.
  const availableDoctors = useMemo(() => {
    if (selectedDepartment === 'not_decided') {
      return doctors;
    }
    return doctors.filter(d =>
      (d.department || '').toLowerCase() === selectedDepartment.toLowerCase() ||
      (d.specialization || '').toLowerCase() === selectedDepartment.toLowerCase()
    );
  }, [doctors, selectedDepartment]);

  // Handle department change in booking modal
  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    if (dept !== 'not_decided') {
      const docMatches = doctors.find(d => d.staff_uuid === selectedDoctorId && (
        (d.department || '').toLowerCase() === dept.toLowerCase() ||
        (d.specialization || '').toLowerCase() === dept.toLowerCase()
      ));
      if (!docMatches) {
        setSelectedDoctorId('');
      }
    }
  };

  // Handle doctor change in booking modal
  const handleDoctorChange = (docId: string) => {
    setSelectedDoctorId(docId);
    if (selectedDepartment === 'not_decided') {
      const doc = doctors.find(d => d.staff_uuid === docId);
      if (doc?.department) {
        setSelectedDepartment(doc.department);
      }
    }
    if (bookingErrors.doctor_id) {
      setBookingErrors(prev => ({ ...prev, doctor_id: '' }));
    }
  };

  // Verify Citizen by Health ID, Aadhaar ID, or Phone
  const handleVerifyCitizen = async () => {
    const clean = idInput.trim();
    if (!clean) {
      setVerificationError(
        `Please enter a valid ${
          idType === 'health_id' ? 'Health ID (SMC-ID)' : idType === 'aadhar_id' ? 'Aadhaar ID' : 'Phone Number'
        }`
      );
      return;
    }
    setVerificationError('');
    setIsVerifyingCitizen(true);
    try {
      const res = await citizenService.verifyCitizen(idType, clean);
      if (res.error || !res.data) {
        setVerificationError(res.error || 'Citizen not found in system. Please verify the ID and try again.');
        setVerifiedCitizen(null);
        setIsCitizenConfirmed(false);
      } else {
        setVerifiedCitizen(res.data);
        setIsCitizenConfirmed(false);
        setVerificationError('');
      }
    } catch (err) {
      setVerificationError('Error checking citizen identity. Please try again.');
    } finally {
      setIsVerifyingCitizen(false);
    }
  };

  // Reset booking modal state
  const resetBookingForm = () => {
    setIdType('health_id');
    setIdInput('');
    setVerifiedCitizen(null);
    setIsCitizenConfirmed(false);
    setVerificationError('');
    setSelectedDepartment('not_decided');
    setSelectedDoctorId('');
    setAppointmentDate('');
    setTimeSlot('');
    setAppointmentType('in_person');
    setBookingErrors({});
  };

  // Get unique departments for table filter
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    appointments.forEach(apt => {
      const dept = apt.doctor?.department || apt.doctor?.specialization;
      if (dept && dept !== 'General') depts.add(dept);
    });
    doctors.forEach(doc => {
      const dept = doc.department || doc.specialization;
      if (dept && dept !== 'General') depts.add(dept);
    });
    return Array.from(depts).sort();
  }, [appointments, doctors]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const citizenName = apt.citizen?.name || '';
      const citizenId = apt.citizen?.citizen_id || '';
      const doctorName = apt.doctor?.name || '';
      const deptName = apt.doctor?.department || apt.doctor?.specialization || '';
      
      const matchesSearch =
        citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        citizenId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deptName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
      const matchesDepartment =
        departmentFilter === 'all' || 
        deptName.toLowerCase() === departmentFilter.toLowerCase();
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [appointments, searchQuery, statusFilter, departmentFilter]);

  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(start, start + itemsPerPage);
  }, [filteredAppointments, currentPage]);

  const totalPages = Math.ceil(filteredAppointments.length / itemsPerPage);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'booked':
        return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const handleConfirm = async (apt: Appointment) => {
    if (!canManageAppointments) {
      toast.error('Access Denied');
      return;
    }
    const { error } = await appointmentService.update(apt.appointment_id, { status: 'confirmed' });
    if (error) toast.error(error);
    else {
      toast.success('Appointment confirmed');
      loadData();
    }
  };

  const handleReschedule = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setShowRescheduleDialog(true);
  };

  const handleCancel = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setShowCancelDialog(true);
  };

  const handleViewDetails = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setShowViewDialog(true);
  };

  const handlePrintSlip = async (apt: Appointment) => {
    try {
      setPrintingAppointmentId(apt.appointment_id);
      toast.info('Generating appointment slip...');
      
      const response = await fetch(`/api/appointments/slip?appointment_id=${apt.appointment_id}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `appointment_slip_${apt.appointment_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Appointment slip downloaded successfully!');
    } catch (error) {
      console.error('Error printing slip:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate appointment slip');
    } finally {
      setPrintingAppointmentId(null);
    }
  };

  const confirmCancel = async () => {
    if (!selectedAppointment) return;
    const { error } = await appointmentService.update(selectedAppointment.appointment_id, { status: 'cancelled' });
    if (error) toast.error(error);
    else {
      toast.success('Appointment cancelled');
      setShowCancelDialog(false);
      setSelectedAppointment(null);
      loadData();
    }
  };

  // Get minimum date (today)
  const minDate = format(startOfToday(), 'yyyy-MM-dd');

  // Handle appointment creation
  const handleCreateAppointment = async () => {
    if (!canManageAppointments) {
      toast.error('Access Denied');
      return;
    }
    if (!verifiedCitizen || !isCitizenConfirmed) {
      toast.error('Please verify and confirm citizen identity first');
      return;
    }

    const errors: Record<string, string> = {};
    if (!selectedDoctorId) errors.doctor_id = 'Please select a consulting doctor';
    if (!appointmentDate) errors.appointment_date = 'Please select an appointment date';
    if (!timeSlot) errors.time_slot = 'Please select a time slot';

    if (appointmentDate) {
      const selectedDate = parseISO(appointmentDate);
      if (!isToday(selectedDate) && !isFuture(selectedDate)) {
        errors.appointment_date = 'Please select today or a future date';
      }
    }

    if (Object.keys(errors).length > 0) {
      setBookingErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await appointmentService.create({
        citizen_id: verifiedCitizen.citizen_id,
        doctor_id: selectedDoctorId,
        hospital_id: currentHospitalId,
        appointment_date: appointmentDate,
        time_slot: timeSlot,
        appointment_type: appointmentType as 'in_person' | 'telemedicine' | 'emergency',
        status: 'booked',
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Appointment booked successfully');
        setShowNewDialog(false);
        resetBookingForm();
        loadData();
      }
    } catch (err) {
      toast.error('Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!canManageAppointments) {
      toast.error('Access Denied');
      return;
    }
    if (!selectedAppointment) return;
    toast.success('Appointment rescheduled');
    setShowRescheduleDialog(false);
    setSelectedAppointment(null);
    loadData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (moduleAccess === 'none') {
    return <AccessDenied message="You do not have permission to access appointments." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Appointment Management</h2>
            {currentHospital && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 hidden sm:inline-flex">
                <Building2 className="h-3 w-3 mr-1" />
                {currentHospital.name} ({currentHospital.hospital_id})
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">Manage patient appointments and scheduling</p>
        </div>
        {canManageAppointments ? (
          <Button 
            onClick={() => {
              resetBookingForm();
              setShowNewDialog(true);
            }} 
            className="bg-[#047857] hover:bg-[#065F46]"
          >
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Button>
        ) : (
          <Badge variant="outline">View Only</Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by patient name, Citizen ID, doctor, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="not_attended">Not Attended</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800">
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">Citizen ID</TableHead>
                <TableHead className="font-semibold">Doctor</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Date & Time</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedAppointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No appointments found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedAppointments.map((apt) => (
                  <TableRow key={apt.appointment_id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#047857] to-emerald-700 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{apt.citizen?.name || 'N/A'}</p>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="h-3 w-3" />
                            {apt.citizen?.phone || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{apt.citizen_id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">{apt.doctor?.name || 'N/A'}</p>
                        {(apt.doctor?.designation || apt.doctor?.department || apt.doctor?.specialization) && (
                          <p className="text-xs text-slate-500 capitalize">
                            {apt.doctor.designation || apt.doctor.department || apt.doctor.specialization}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {apt.doctor?.department || apt.doctor?.specialization || apt.hospital_ward?.ward_name || 'General'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{apt.time_slot || 'N/A'}</p>
                        <p className="text-xs text-slate-500">
                          {apt.appointment_date ? format(parseISO(apt.appointment_date), 'MMM dd, yyyy') : 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('capitalize font-medium', statusColors[apt.status || 'booked'])}>
                        {getStatusIcon(apt.status || 'booked')}
                        {(apt.status || 'booked').replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {canManageAppointments && (apt.status === 'booked') && (
                          <Button size="sm" variant="ghost" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleConfirm(apt)} title="Confirm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {canManageAppointments && (apt.status === 'booked' || apt.status === 'confirmed') && (
                          <>
                            <Button size="sm" variant="ghost" className="h-8 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50" onClick={() => handleReschedule(apt)} title="Reschedule">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleCancel(apt)} title="Cancel">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(apt)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {canManageAppointments ? (
                              <DropdownMenuItem>
                                <Clock className="h-4 w-4 mr-2" />
                                Send Reminder
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem 
                              onClick={() => handlePrintSlip(apt)}
                              disabled={printingAppointmentId === apt.appointment_id}
                            >
                              {printingAppointmentId === apt.appointment_id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Printer className="h-4 w-4 mr-2" />
                              )}
                              Print Slip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredAppointments.length > itemsPerPage && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(o) => { setShowViewDialog(o); if (!o) setSelectedAppointment(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
            <DialogDescription>
              Complete information about this appointment
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                {/* Patient Information */}
                <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800">
                  <h4 className="font-medium text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patient Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Name:</span>
                      <p className="font-medium">{selectedAppointment.citizen?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Citizen ID:</span>
                      <p className="font-mono">{selectedAppointment.citizen_id}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      <p>{selectedAppointment.citizen?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Gender:</span>
                      <p className="capitalize">{selectedAppointment.citizen?.gender || 'N/A'}</p>
                    </div>
                    {selectedAppointment.citizen?.address && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Address:</span>
                        <p>{selectedAppointment.citizen.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800">
                  <h4 className="font-medium text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Doctor Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Doctor Name:</span>
                      <p className="font-medium">{selectedAppointment.doctor?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Specialization:</span>
                      <p className="capitalize">{selectedAppointment.doctor?.specialization || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <p className="capitalize">{selectedAppointment.doctor?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Phone:</span>
                      <p>{selectedAppointment.doctor?.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Hospital & Department Information */}
                <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800">
                  <h4 className="font-medium text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Hospital & Department
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Hospital:</span>
                      <p className="font-medium">{selectedAppointment.hospital?.name || currentHospital?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Department:</span>
                      <p className="font-medium">
                        {selectedAppointment.doctor?.department || selectedAppointment.doctor?.specialization || selectedAppointment.hospital_ward?.ward_name || 'General'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Hospital Address:</span>
                      <p>{selectedAppointment.hospital?.address || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Contact:</span>
                      <p>{selectedAppointment.hospital?.contact_number || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800">
                  <h4 className="font-medium text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Appointment Details
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Appointment ID:</span>
                      <p className="font-mono">{selectedAppointment.appointment_id}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Token Number:</span>
                      <p className="font-medium">#{selectedAppointment.token_id || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Date:</span>
                      <p className="font-medium">
                        {selectedAppointment.appointment_date 
                          ? format(parseISO(selectedAppointment.appointment_date), 'MMMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Time Slot:</span>
                      <p className="font-medium">{selectedAppointment.time_slot || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Type:</span>
                      <p className="capitalize">{(selectedAppointment.appointment_type || 'in_person').replace('_', ' ')}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <Badge variant="outline" className={cn('capitalize font-medium', statusColors[selectedAppointment.status || 'booked'])}>
                        {getStatusIcon(selectedAppointment.status || 'booked')}
                        {(selectedAppointment.status || 'booked').replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">Booked On:</span>
                      <p>{format(new Date(selectedAppointment.created_at), 'MMM dd, yyyy h:mm a')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* New Appointment Dialog */}
      <Dialog open={canManageAppointments && showNewDialog} onOpenChange={(o) => {
        setShowNewDialog(o);
        if (!o) resetBookingForm();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 dark:text-white">Book New Appointment</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {!isCitizenConfirmed
                ? "Verify citizen identity by Health ID or Aadhaar ID before scheduling."
                : "Configure department, doctor, and time slot for this appointment."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* STEP 1: CITIZEN SEARCH / VERIFICATION */}
            {!isCitizenConfirmed ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300 font-medium">
                    Citizen Identification *
                  </Label>
                  <div className="flex gap-2">
                    {/* ID Type Dropdown */}
                    <Select value={idType} onValueChange={(val: 'health_id' | 'aadhar_id' | 'phone') => {
                      setIdType(val);
                      setVerificationError('');
                    }}>
                      <SelectTrigger className="w-[155px] shrink-0 bg-slate-50 dark:bg-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="health_id">Health ID (SMC)</SelectItem>
                        <SelectItem value="aadhar_id">Aadhaar ID</SelectItem>
                        <SelectItem value="phone">Phone Number</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* ID Text Input */}
                    <div className="relative flex-1">
                      <Input
                        placeholder={
                          idType === 'health_id'
                            ? 'e.g., SMC-2025-000001'
                            : idType === 'aadhar_id'
                            ? 'e.g., 900000000001'
                            : 'e.g., 9876543210'
                        }
                        value={idInput}
                        onChange={(e) => {
                          setIdInput(e.target.value);
                          if (verificationError) setVerificationError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleVerifyCitizen();
                          }
                        }}
                        className="bg-white dark:bg-slate-800"
                      />
                    </div>

                    {/* Search / Verify Button */}
                    <Button
                      type="button"
                      onClick={handleVerifyCitizen}
                      disabled={isVerifyingCitizen || !idInput.trim()}
                      className="bg-[#047857] hover:bg-[#065F46] shrink-0 text-white"
                    >
                      {isVerifyingCitizen ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-1.5" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    {idType === 'health_id'
                      ? "Enter citizen's unique SMC Health ID and click Search"
                      : idType === 'aadhar_id'
                      ? "Enter citizen's 12-digit Aadhaar number and click Search"
                      : "Enter citizen's 10-digit registered mobile number and click Search"}
                  </p>
                  {verificationError && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{verificationError}</span>
                    </div>
                  )}
                </div>

                {/* VERIFIED CITIZEN CARD */}
                {verifiedCitizen && (
                  <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <h4 className="font-semibold text-slate-800 dark:text-white">Citizen Verified</h4>
                      </div>
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs">
                        {verifiedCitizen.citizen_id}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Full Name</span>
                        <p className="font-semibold text-slate-800 dark:text-white">{verifiedCitizen.name}</p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Gender / Age</span>
                        <p className="font-semibold text-slate-800 dark:text-white capitalize">
                          {verifiedCitizen.gender || 'N/A'}{verifiedCitizen.age ? ` (${verifiedCitizen.age} yrs)` : ''}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Contact Number</span>
                        <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-1">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {verifiedCitizen.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">Belonging Ward</span>
                        <p className="font-semibold text-slate-800 dark:text-white flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {verifiedCitizen.ward?.ward_name || (verifiedCitizen.ward_number ? `Ward #${verifiedCitizen.ward_number}` : 'N/A')}
                        </p>
                      </div>
                      {verifiedCitizen.aadhar_id && (
                        <div className="col-span-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">Aadhaar Number</span>
                          <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                            XXXX-XXXX-{verifiedCitizen.aadhar_id.slice(-4)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="button"
                        className="w-full bg-[#047857] hover:bg-[#065F46] text-white"
                        onClick={() => setIsCitizenConfirmed(true)}
                      >
                        Confirm Identity & Proceed to Booking
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* STEP 2: APPOINTMENT DETAILS (POST-CONFIRMATION) */
              <div className="space-y-4 animate-in fade-in">
                {/* Confirmed Patient Banner */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                      {verifiedCitizen?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white leading-none">
                        {verifiedCitizen?.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {verifiedCitizen?.citizen_id} • {verifiedCitizen?.phone}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCitizenConfirmed(false)}
                    className="text-xs text-slate-600 hover:text-slate-800 dark:text-slate-400"
                  >
                    Change Patient
                  </Button>
                </div>

                {/* Hospital (Auto-assigned current hospital) */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500 dark:text-slate-400">Hospital Facility</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm">
                    <Building2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {currentHospital?.name || 'Solapur Municipal Hospital'}
                    </span>
                    <Badge variant="outline" className="ml-auto text-xs font-mono">
                      {currentHospitalId}
                    </Badge>
                  </div>
                </div>

                {/* Department Selection */}
                <div className="space-y-1.5">
                  <Label htmlFor="dept_select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Department *
                  </Label>
                  <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                    <SelectTrigger id="dept_select" className="bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_decided">
                        <span className="font-medium text-emerald-700 dark:text-emerald-400">
                          Not Decided / All Departments
                        </span>
                      </SelectItem>
                      {availableBookingDepartments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {selectedDepartment === 'not_decided'
                      ? "Showing all available hospital doctors. Selecting a doctor will auto-assign their department."
                      : `Filtering doctors specializing in ${selectedDepartment}.`}
                  </p>
                </div>

                {/* Doctor Selection */}
                <div className="space-y-1.5">
                  <Label htmlFor="doc_select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Consulting Doctor *
                  </Label>
                  <Select value={selectedDoctorId} onValueChange={handleDoctorChange}>
                    <SelectTrigger id="doc_select" className={cn(
                      "bg-white dark:bg-slate-800",
                      bookingErrors.doctor_id ? "border-red-500" : ""
                    )}>
                      <SelectValue placeholder={availableDoctors.length > 0 ? "Choose doctor..." : "No doctors available in this department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDoctors.map((doc) => (
                        <SelectItem key={doc.staff_uuid} value={doc.staff_uuid}>
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="font-medium">{doc.name}</span>
                            <span className="text-xs text-slate-500">({doc.department || doc.specialization || 'General'})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookingErrors.doctor_id && (
                    <p className="text-xs text-red-500">{bookingErrors.doctor_id}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="apt_date" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Appointment Date *
                  </Label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="apt_date"
                      type="date"
                      min={minDate}
                      value={appointmentDate}
                      onChange={(e) => {
                        setAppointmentDate(e.target.value);
                        if (bookingErrors.appointment_date) {
                          setBookingErrors(prev => ({ ...prev, appointment_date: '' }));
                        }
                      }}
                      className={cn("pl-10 bg-white dark:bg-slate-800", bookingErrors.appointment_date ? "border-red-500" : "")}
                    />
                  </div>
                  {bookingErrors.appointment_date && (
                    <p className="text-xs text-red-500">{bookingErrors.appointment_date}</p>
                  )}
                </div>

                {/* Time Slot */}
                <div className="space-y-1.5">
                  <Label htmlFor="time_slot" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Time Slot *
                  </Label>
                  <Select value={timeSlot} onValueChange={(v) => {
                    setTimeSlot(v);
                    if (bookingErrors.time_slot) setBookingErrors(prev => ({ ...prev, time_slot: '' }));
                  }}>
                    <SelectTrigger id="time_slot" className={cn("bg-white dark:bg-slate-800", bookingErrors.time_slot ? "border-red-500" : "")}>
                      <SelectValue placeholder="Select consultation time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {bookingErrors.time_slot && (
                    <p className="text-xs text-red-500">{bookingErrors.time_slot}</p>
                  )}
                </div>

                {/* Appointment Type */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Appointment Type
                  </Label>
                  <Select value={appointmentType} onValueChange={setAppointmentType}>
                    <SelectTrigger className="bg-white dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_person">In-Person Consultation</SelectItem>
                      <SelectItem value="telemedicine">Telemedicine / Online</SelectItem>
                      <SelectItem value="emergency">Emergency Walk-In</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancel
            </Button>
            {isCitizenConfirmed && (
              <Button
                onClick={handleCreateAppointment}
                disabled={isSubmitting}
                className="bg-[#047857] hover:bg-[#065F46] text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Book Appointment'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={canManageAppointments && showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Choose a new date and time for the appointment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Date</Label>
                <Input type="date" min={minDate} />
              </div>
              <div className="space-y-2">
                <Label>New Time</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select time slot" /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (<SelectItem key={slot} value={slot}>{slot}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason for Reschedule</Label>
              <Textarea placeholder="Enter reason..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>Cancel</Button>
            <Button onClick={handleRescheduleSubmit}>Reschedule</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={canManageAppointments && showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>Are you sure you want to cancel this appointment?</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">
                <strong>Warning:</strong> This action cannot be undone. The patient will be notified about the cancellation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>Keep Appointment</Button>
            <Button variant="destructive" onClick={confirmCancel}>Cancel Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
