'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, User, Calendar, Phone, MapPin, Droplet, Shield, AlertCircle, FileText, Syringe, FlaskConical, Stethoscope, Download, Eye, ChevronRight, Building2, UserRound, ClipboardList, Pill, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  citizenProfileService,
  type Citizen,
  type Appointment,
  type DiagnosticReport,
  type VaccinationRecord,
  type HealthRecord,
} from '@/services/database';
import { storageService } from '@/services/storage';
import HealthCard from '@/components/citizens/HealthCard';

export default function CitizenProfilePage() {
  const params = useParams();
  const citizenId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [citizen, setCitizen] = useState<Citizen | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [labReports, setLabReports] = useState<DiagnosticReport[]>([]);
  const [vaccinationRecords, setVaccinationRecords] = useState<VaccinationRecord[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  
  // Dialog state for health record details
  const [selectedHealthRecord, setSelectedHealthRecord] = useState<HealthRecord | null>(null);
  const [showHealthRecordDialog, setShowHealthRecordDialog] = useState(false);
  
  // Dialog state for lab report
  const [selectedLabReport, setSelectedLabReport] = useState<DiagnosticReport | null>(null);
  const [showLabReportDialog, setShowLabReportDialog] = useState(false);

  useEffect(() => {
    // Check if verified
    const isVerified = sessionStorage.getItem(`verified_${citizenId}`);
    if (!isVerified) {
      // Redirect to verification page
      window.location.href = `/citizen/${citizenId}/verify`;
      return;
    }

    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [citizenId]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await citizenProfileService.getFullProfile(citizenId);

    if (fetchError || !data) {
      setError(fetchError || 'Failed to load citizen profile');
      setLoading(false);
      return;
    }

    setCitizen(data.citizen);
    setAppointments(data.appointments);
    setLabReports(data.labReports);
    setVaccinationRecords(data.vaccinationRecords);
    setHealthRecords(data.healthRecords);
    setLoading(false);
  };

  const getWardName = (wardNumber: number | null) => {
    if (!wardNumber) return 'Not assigned';
    return `Ward ${wardNumber}`;
  };

  const handleViewReport = async (report: DiagnosticReport) => {
    if (report.report_file_url) {
      await storageService.viewOrDownloadFile(report.report_file_url, 'view');
    }
  };

  const handleDownloadReport = async (report: DiagnosticReport) => {
    if (report.report_file_url) {
      await storageService.viewOrDownloadFile(report.report_file_url, 'download');
    }
  };

  // Open health record detail dialog
  const handleViewHealthRecord = (record: HealthRecord) => {
    setSelectedHealthRecord(record);
    setShowHealthRecordDialog(true);
  };

  // Open lab report detail dialog
  const handleViewLabReportDetails = (report: DiagnosticReport) => {
    setSelectedLabReport(report);
    setShowLabReportDialog(true);
  };

  // Calculate age from date of birth
  const age = citizen?.date_of_birth
    ? Math.floor((new Date().getTime() - new Date(citizen.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : citizen?.age;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading health profile...</p>
        </div>
      </div>
    );
  }

  if (error || !citizen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Profile</h1>
            <p className="text-slate-600 mb-4">{error || 'Unable to load citizen profile'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-2 sm:p-4">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <h1 className="text-lg sm:text-xl font-bold text-slate-800">Citizen Health Profile</h1>
          </div>
          <Badge variant="outline" className="font-mono text-xs sm:text-sm">{citizen.citizen_id}</Badge>
        </div>

        {/* Citizen Info Card */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Photo and Basic Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-lg flex-shrink-0">
                  {citizen.user_photo_url ? (
                    <AvatarImage src={citizen.user_photo_url} alt={citizen.name || ''} />
                  ) : (
                    <AvatarFallback className={cn(
                      'text-2xl sm:text-3xl',
                      citizen.gender === 'Male' && 'bg-blue-100 text-blue-800',
                      citizen.gender === 'Female' && 'bg-pink-100 text-pink-800',
                      citizen.gender === 'Transgender' && 'bg-purple-100 text-purple-800'
                    )}>
                      <User className="h-10 w-10 sm:h-12 sm:w-12" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-800">{citizen.name}</h2>
                  <p className="text-slate-500 text-sm sm:text-base">{age || 'N/A'} years, {citizen.gender || 'N/A'}</p>
                  {citizen.blood_group && (
                    <Badge className="mt-1 bg-red-100 text-red-800 hover:bg-red-100">
                      <Droplet className="h-3 w-3 mr-1" /> {citizen.blood_group}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator orientation="vertical" className="hidden sm:block h-24" />
              <Separator className="sm:hidden" />

              {/* Contact Details - Mobile Friendly Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="font-medium text-sm truncate">{citizen.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Date of Birth</p>
                    <p className="font-medium text-sm">
                      {citizen.date_of_birth
                        ? format(new Date(citizen.date_of_birth), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Ward</p>
                    <p className="font-medium text-sm truncate">{getWardName(citizen.ward_number)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Registered</p>
                    <p className="font-medium text-sm">
                      {citizen.created_at
                        ? format(new Date(citizen.created_at), 'MMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-slate-500">Address</p>
              <p className="font-medium text-sm sm:text-base">{citizen.address || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Health Card Preview */}
        <Card>
          <CardHeader className="pb-2 px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" /> Health Card
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <HealthCard citizen={citizen} wardName={getWardName(citizen.ward_number)} compact={true} />
          </CardContent>
        </Card>

        {/* Medical Records Tabs */}
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Stethoscope className="h-4 w-4 sm:h-5 sm:w-5" /> Medical Records
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <Tabs defaultValue="appointments" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-auto">
                <TabsTrigger value="appointments" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Appointments</span>
                  <span className="sm:hidden">Appts</span>
                </TabsTrigger>
                <TabsTrigger value="labreports" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                  <FlaskConical className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Lab Reports</span>
                  <span className="sm:hidden">Lab</span>
                </TabsTrigger>
                <TabsTrigger value="vaccinations" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                  <Syringe className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Vaccinations</span>
                  <span className="sm:hidden">Vaccines</span>
                </TabsTrigger>
                <TabsTrigger value="healthrecords" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Health Records</span>
                  <span className="sm:hidden">Records</span>
                </TabsTrigger>
              </TabsList>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="mt-4">
                {appointments.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No appointment records found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs sm:text-sm">Date</TableHead>
                          <TableHead className="text-xs sm:text-sm">Doctor</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Hospital</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((apt) => (
                          <TableRow key={apt.appointment_id}>
                            <TableCell className="text-xs sm:text-sm">
                              {apt.appointment_date
                                ? format(new Date(apt.appointment_date), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {(apt as any).doctors?.hospital_staff?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{apt.hospital?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                apt.status === 'completed' ? 'default' :
                                apt.status === 'cancelled' ? 'destructive' :
                                apt.status === 'confirmed' ? 'default' :
                                'secondary'
                              } className="text-xs">
                                {apt.status || 'N/A'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Lab Reports Tab */}
              <TabsContent value="labreports" className="mt-4">
                {labReports.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FlaskConical className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No lab reports found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs sm:text-sm">Test Type</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Test Date</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                          <TableHead className="text-xs sm:text-sm text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {labReports.map((report) => (
                          <TableRow key={report.report_id}>
                            <TableCell className="text-xs sm:text-sm">
                              {report.test_type?.test_name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                              {report.test_date
                                ? format(new Date(report.test_date), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                report.status === 'completed' ? 'default' :
                                report.status === 'cancelled' || report.status === 'failed' ? 'destructive' :
                                report.status === 'in_progress' ? 'secondary' :
                                'outline'
                              } className="text-xs">
                                {report.status || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 sm:gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewLabReportDetails(report)}
                                  className="h-8 px-2 sm:px-3"
                                >
                                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                  <span className="hidden sm:inline">View</span>
                                </Button>
                                {report.report_file_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadReport(report)}
                                    className="h-8 px-2 sm:px-3"
                                  >
                                    <Download className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                    <span className="hidden sm:inline">Download</span>
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Vaccinations Tab */}
              <TabsContent value="vaccinations" className="mt-4">
                {vaccinationRecords.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Syringe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No vaccination records found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs sm:text-sm">Vaccine Name</TableHead>
                          <TableHead className="text-xs sm:text-sm">Dose</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Date</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Hospital</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vaccinationRecords.map((record) => (
                          <TableRow key={record.record_id}>
                            <TableCell className="font-medium text-xs sm:text-sm">{record.vaccine_type || 'N/A'}</TableCell>
                            <TableCell className="text-xs sm:text-sm">Dose {record.dose_number || 'N/A'}</TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                              {record.date_administered
                                ? format(new Date(record.date_administered), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{record.hospital?.name || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              {/* Health Records Tab */}
              <TabsContent value="healthrecords" className="mt-4">
                {healthRecords.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No health records found</p>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs sm:text-sm">Hospital</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Visit Date</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Doctor</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden md:table-cell">Diagnosis</TableHead>
                          <TableHead className="text-xs sm:text-sm text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {healthRecords.map((record) => (
                          <TableRow key={record.record_id}>
                            <TableCell className="text-xs sm:text-sm">
                              <div>
                                <p className="font-medium">{record.hospital?.name || 'N/A'}</p>
                                <p className="text-xs text-slate-500 sm:hidden">
                                  {record.visit_date
                                    ? format(new Date(record.visit_date), 'MMM dd, yyyy')
                                    : 'N/A'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                              {record.visit_date
                                ? format(new Date(record.visit_date), 'MMM dd, yyyy')
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{record.doctor?.name || 'N/A'}</TableCell>
                            <TableCell className="text-xs sm:text-sm hidden md:table-cell max-w-[200px] truncate" title={record.diagnosis || ''}>
                              {record.diagnosis || 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHealthRecord(record)}
                                className="h-8 px-2 sm:px-3"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                                <span className="hidden sm:inline">View</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Health Record Detail Dialog */}
        <Dialog open={showHealthRecordDialog} onOpenChange={setShowHealthRecordDialog}>
          <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                Health Record Details
              </DialogTitle>
              <DialogDescription>
                Complete visit information and medical details
              </DialogDescription>
            </DialogHeader>
            {selectedHealthRecord && (
              <div className="space-y-4 py-2">
                {/* Hospital Info */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-base">{selectedHealthRecord.hospital?.name || 'N/A'}</p>
                      <p className="text-sm text-slate-500">{selectedHealthRecord.hospital?.address || 'Address not available'}</p>
                    </div>
                  </div>
                </div>

                {/* Visit Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Visit Date</p>
                      <p className="font-medium text-sm">
                        {selectedHealthRecord.visit_date
                          ? format(new Date(selectedHealthRecord.visit_date), 'MMMM dd, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Doctor</p>
                      <p className="font-medium text-sm">{selectedHealthRecord.doctor?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Diagnosis */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="h-4 w-4 text-red-500" />
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-300">Diagnosis</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                    <p className="text-sm">{selectedHealthRecord.diagnosis || 'No diagnosis recorded'}</p>
                  </div>
                </div>

                {/* Prescription */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4 text-green-600" />
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-300">Prescription</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedHealthRecord.prescription || 'No prescription recorded'}</p>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-300">Notes</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedHealthRecord.notes || 'No additional notes'}</p>
                  </div>
                </div>

                {/* Record ID */}
                <div className="pt-2 border-t">
                  <p className="text-xs text-slate-400">Record ID: {selectedHealthRecord.record_id}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Lab Report Detail Dialog */}
        <Dialog open={showLabReportDialog} onOpenChange={setShowLabReportDialog}>
          <DialogContent className="max-w-lg mx-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="h-5 w-5 text-purple-600" />
                Lab Report Details
              </DialogTitle>
              <DialogDescription>
                Diagnostic test information and results
              </DialogDescription>
            </DialogHeader>
            {selectedLabReport && (
              <div className="space-y-4 py-2">
                {/* Test Info */}
                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                  <p className="font-semibold text-base">{selectedLabReport.test_type?.test_name || 'N/A'}</p>
                  <p className="text-sm text-slate-500">{selectedLabReport.test_type?.test_category || 'Category not available'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">Test Date</p>
                    <p className="font-medium text-sm">
                      {selectedLabReport.test_date
                        ? format(new Date(selectedLabReport.test_date), 'MMMM dd, yyyy')
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Status</p>
                    <Badge variant={
                      selectedLabReport.status === 'completed' ? 'default' :
                      selectedLabReport.status === 'cancelled' || selectedLabReport.status === 'failed' ? 'destructive' :
                      selectedLabReport.status === 'in_progress' ? 'secondary' :
                      'outline'
                    }>
                      {selectedLabReport.status || 'N/A'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Result */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Result</p>
                  <p className="text-sm bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                    {selectedLabReport.result || 'Result not available'}
                  </p>
                </div>

                {/* Description */}
                {selectedLabReport.description && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Description</p>
                    <p className="text-sm">{selectedLabReport.description}</p>
                  </div>
                )}

                {/* Hospital */}
                <div>
                  <p className="text-xs text-slate-500 mb-1">Hospital</p>
                  <p className="font-medium text-sm">{selectedLabReport.hospital?.name || 'N/A'}</p>
                </div>

                {/* Actions */}
                {selectedLabReport.report_file_url && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(selectedLabReport)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Report
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(selectedLabReport)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" /> Download
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-slate-500 py-4">
          <p>Solapur Municipal Corporation - Citizen Health Portal</p>
          <p className="text-xs mt-1">This is a read-only view. For any corrections, please contact your registered hospital.</p>
        </div>
      </div>
    </div>
  );
}
