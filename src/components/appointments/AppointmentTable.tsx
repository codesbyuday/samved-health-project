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
import {
  appointmentService,
  citizenService,
  doctorService,
  hospitalService,
  hospitalWardService,
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
} from 'lucide-react';
import { format, isToday, isFuture, parseISO, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const statusColors: Record<string, string> = {
  booked: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  not_attended: 'bg-amber-100 text-amber-700 border-amber-200',
  rescheduled: 'bg-purple-100 text-purple-700 border-purple-200',
};

export default function AppointmentTable() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [wards, setWards] = useState<HospitalWard[]>([]);
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

  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    citizen_id: '',
    doctor_id: '',
    hospital_id: '',
    department: '',
    appointment_date: '',
    time_slot: '',
    appointment_type: 'in_person',
    citizenSearch: '',
  });
  const [searchedCitizens, setSearchedCitizens] = useState<Citizen[]>([]);
  const [isSearchingCitizens, setIsSearchingCitizens] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [aptResult, docResult, hospResult, wardResult] = await Promise.all([
      appointmentService.getAll(),
      doctorService.getAll(),
      hospitalService.getAll(),
      hospitalWardService.getAll(),
    ]);
    
    if (aptResult.data) setAppointments(aptResult.data);
    if (docResult.data) setDoctors(docResult.data);
    if (hospResult.data) setHospitals(hospResult.data);
    if (wardResult.data) setWards(wardResult.data);
    setIsLoading(false);
  };

  // Filter doctors by department
  useEffect(() => {
    if (newAppointment.department) {
      const filtered = doctors.filter(d => d.specialization === newAppointment.department);
      setFilteredDoctors(filtered);
      setNewAppointment(prev => ({ ...prev, doctor_id: '' }));
    } else {
      setFilteredDoctors([]);
    }
  }, [newAppointment.department, doctors]);

  // Search citizens
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (newAppointment.citizenSearch.trim()) {
        setIsSearchingCitizens(true);
        const { data } = await citizenService.search(newAppointment.citizenSearch.trim());
        setSearchedCitizens(data || []);
        setIsSearchingCitizens(false);
      } else {
        setSearchedCitizens([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newAppointment.citizenSearch]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const citizenName = apt.citizen?.name || '';
      const citizenId = apt.citizen?.citizen_id || '';
      const doctorName = apt.doctor?.name || '';
      const wardName = apt.hospital_ward?.ward_name || '';
      
      const matchesSearch =
        citizenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        citizenId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        wardName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
      const matchesDepartment =
        departmentFilter === 'all' || 
        apt.hospital_ward?.ward_name === departmentFilter ||
        apt.doctor?.specialization === departmentFilter;
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
      
      // Call the API to generate PDF
      const response = await fetch(`/api/appointments/slip?appointment_id=${apt.appointment_id}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }
      
      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
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

  // Validate new appointment form
  const validateNewAppointment = (): boolean => {
    const errors: Record<string, string> = {};
    if (!newAppointment.citizen_id) errors.citizen_id = 'Please select a citizen';
    if (!newAppointment.department) errors.department = 'Please select a department';
    if (!newAppointment.doctor_id) errors.doctor_id = 'Please select a doctor';
    if (!newAppointment.hospital_id) errors.hospital_id = 'Please select a hospital';
    if (!newAppointment.appointment_date) errors.appointment_date = 'Please select a date';
    if (!newAppointment.time_slot) errors.time_slot = 'Please select a time slot';
    
    // Validate date is not in the past
    if (newAppointment.appointment_date) {
      const selectedDate = parseISO(newAppointment.appointment_date);
      if (!isToday(selectedDate) && !isFuture(selectedDate)) {
        errors.appointment_date = 'Please select today or a future date';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateAppointment = async () => {
    if (!validateNewAppointment()) return;
    
    setIsSubmitting(true);
    const { error } = await appointmentService.create({
      citizen_id: newAppointment.citizen_id,
      doctor_id: newAppointment.doctor_id,
      hospital_id: newAppointment.hospital_id,
      appointment_date: newAppointment.appointment_date,
      time_slot: newAppointment.time_slot,
      appointment_type: newAppointment.appointment_type as 'in_person' | 'telemedicine' | 'emergency',
      status: 'booked',
    });
    setIsSubmitting(false);
    
    if (error) toast.error(error);
    else {
      toast.success('Appointment booked successfully');
      setShowNewDialog(false);
      setNewAppointment({
        citizen_id: '',
        doctor_id: '',
        hospital_id: '',
        department: '',
        appointment_date: '',
        time_slot: '',
        appointment_type: 'in_person',
        citizenSearch: '',
      });
      loadData();
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedAppointment) return;
    // This would need proper form handling for reschedule
    toast.success('Appointment rescheduled');
    setShowRescheduleDialog(false);
    setSelectedAppointment(null);
    loadData();
  };

  // Get unique ward names for department filter
  const uniqueWardNames = useMemo(() => {
    const wardNames = new Set<string>();
    appointments.forEach(apt => {
      if (apt.hospital_ward?.ward_name) {
        wardNames.add(apt.hospital_ward.ward_name);
      }
    });
    return Array.from(wardNames).sort();
  }, [appointments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Appointment Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage patient appointments and scheduling</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="bg-[#1E88E5] hover:bg-[#1565C0]">
          <Plus className="h-4 w-4 mr-2" />
          Book New Appointment
        </Button>
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
                {uniqueWardNames.map((ward) => (
                  <SelectItem key={ward} value={ward}>
                    {ward}
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
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1E88E5] to-blue-600 flex items-center justify-center">
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
                        {apt.doctor?.specialization && (
                          <p className="text-xs text-slate-500 capitalize">{apt.doctor.specialization}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800 dark:text-white">
                        {apt.hospital_ward?.ward_name || apt.doctor?.specialization || 'N/A'}
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
                        {(apt.status === 'booked') && (
                          <Button size="sm" variant="ghost" className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleConfirm(apt)} title="Confirm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {(apt.status === 'booked' || apt.status === 'confirmed') && (
                          <>
                            <Button size="sm" variant="ghost" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleReschedule(apt)} title="Reschedule">
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
                            <DropdownMenuItem>
                              <Clock className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
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
                      <p className="font-medium">{selectedAppointment.hospital?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Department/Ward:</span>
                      <p className="font-medium">{selectedAppointment.hospital_ward?.ward_name || 'N/A'}</p>
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
      <Dialog open={showNewDialog} onOpenChange={(o) => { setShowNewDialog(o); if (!o) setNewAppointment({ citizen_id: '', doctor_id: '', hospital_id: '', department: '', appointment_date: '', time_slot: '', appointment_type: 'in_person', citizenSearch: '' }); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>Schedule a new appointment for a citizen.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Citizen Search */}
            <div className="space-y-2">
              <Label>Search Citizen *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name, phone, or Citizen ID..."
                  value={newAppointment.citizenSearch}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, citizenSearch: e.target.value, citizen_id: '' }))}
                  className="pl-10"
                />
                {isSearchingCitizens && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
              </div>
              {searchedCitizens.length > 0 && !newAppointment.citizen_id && (
                <div className="border rounded-lg divide-y max-h-40 overflow-auto">
                  {searchedCitizens.slice(0, 5).map((c) => (
                    <button key={c.citizen_id} className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 text-left" onClick={() => setNewAppointment(prev => ({ ...prev, citizen_id: c.citizen_id, citizenSearch: `${c.name} (${c.citizen_id})` }))}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">{c.name?.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-slate-500">{c.citizen_id} • {c.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {formErrors.citizen_id && <p className="text-sm text-red-500">{formErrors.citizen_id}</p>}
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>Department *</Label>
              <Select value={newAppointment.department} onValueChange={(v) => setNewAppointment(prev => ({ ...prev, department: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept.charAt(0).toUpperCase() + dept.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.department && <p className="text-sm text-red-500">{formErrors.department}</p>}
            </div>

            {/* Doctor */}
            <div className="space-y-2">
              <Label>Doctor *</Label>
              <Select value={newAppointment.doctor_id} onValueChange={(v) => setNewAppointment(prev => ({ ...prev, doctor_id: v }))} disabled={!newAppointment.department}>
                <SelectTrigger>
                  <SelectValue placeholder={newAppointment.department ? "Select doctor" : "Select department first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredDoctors.map((doc) => (
                    <SelectItem key={doc.staff_uuid} value={doc.staff_uuid}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.doctor_id && <p className="text-sm text-red-500">{formErrors.doctor_id}</p>}
            </div>

            {/* Hospital */}
            <div className="space-y-2">
              <Label>Hospital *</Label>
              <Select value={newAppointment.hospital_id} onValueChange={(v) => setNewAppointment(prev => ({ ...prev, hospital_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map((h) => (
                    <SelectItem key={h.hospital_id} value={h.hospital_id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.hospital_id && <p className="text-sm text-red-500">{formErrors.hospital_id}</p>}
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Appointment Date *</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="date"
                  min={minDate}
                  value={newAppointment.appointment_date}
                  onChange={(e) => setNewAppointment(prev => ({ ...prev, appointment_date: e.target.value }))}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500">Only today or future dates are allowed</p>
              {formErrors.appointment_date && <p className="text-sm text-red-500">{formErrors.appointment_date}</p>}
            </div>

            {/* Time Slot */}
            <div className="space-y-2">
              <Label>Time Slot *</Label>
              <Select value={newAppointment.time_slot} onValueChange={(v) => setNewAppointment(prev => ({ ...prev, time_slot: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.time_slot && <p className="text-sm text-red-500">{formErrors.time_slot}</p>}
            </div>

            {/* Appointment Type */}
            <div className="space-y-2">
              <Label>Appointment Type</Label>
              <Select value={newAppointment.appointment_type} onValueChange={(v) => setNewAppointment(prev => ({ ...prev, appointment_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">In-Person</SelectItem>
                  <SelectItem value="telemedicine">Telemedicine</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateAppointment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Book Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
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
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
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
