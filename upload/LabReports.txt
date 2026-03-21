'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import {
  diagnosticReportService,
  citizenService,
  LAB_REPORT_STATUSES,
  type DiagnosticReport,
  type TestType,
  type Citizen,
  type LabReportStatus,
} from '@/services/database';
import { storageService } from '@/services/storage';
import {
  Upload,
  FileText,
  Download,
  Eye,
  Search,
  Plus,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  FileImage,
  File,
  Edit,
  RefreshCw,
  User,
  Phone,
  XCircle as XCircleIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Status configuration with colors and icons
const statusConfig: Record<LabReportStatus, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  pending: {
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-700',
    icon: <Clock className="h-3 w-3" />,
    label: 'Pending'
  },
  in_progress: {
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700',
    icon: <RefreshCw className="h-3 w-3" />,
    label: 'In Progress'
  },
  completed: {
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700',
    icon: <CheckCircle className="h-3 w-3" />,
    label: 'Completed'
  },
  cancelled: {
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600',
    icon: <XCircle className="h-3 w-3" />,
    label: 'Cancelled'
  },
  failed: {
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-700',
    icon: <AlertCircle className="h-3 w-3" />,
    label: 'Failed'
  },
};

interface LabReportFormData {
  citizen_id: string;
  test_type_id: string;
  status: LabReportStatus;
  result: string;
  description: string;
  report_file: File | null;
  test_date: string;
  citizenSearch: string;
}

const initialFormData: LabReportFormData = {
  citizen_id: '',
  test_type_id: '',
  status: 'pending',
  result: '',
  description: '',
  report_file: null,
  test_date: new Date().toISOString().split('T')[0],
  citizenSearch: '',
};

export default function LabReports() {
  const { toast } = useToast();
  
  // State
  const [reports, setReports] = useState<DiagnosticReport[]>([]);
  const [testTypes, setTestTypes] = useState<TestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<LabReportStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Citizen search state 
  const [searchedCitizens, setSearchedCitizens] = useState<Citizen[]>([]);
  const [isSearchingCitizens, setIsSearchingCitizens] = useState(false);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  
  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<LabReportFormData>(initialFormData);
  const [editingReport, setEditingReport] = useState<DiagnosticReport | null>(null);
  const [viewingReport, setViewingReport] = useState<DiagnosticReport | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // File upload state
  const [fileUploaded, setFileUploaded] = useState(false);

  // Get today's date for max date validation
  const today = new Date().toISOString().split('T')[0];

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reportsResult, testTypesResult] = await Promise.all([
        diagnosticReportService.getAll(),
        diagnosticReportService.getTestTypes(),
      ]);

      if (reportsResult.error) {
        toast({
          title: 'Error loading reports',
          description: reportsResult.error,
          variant: 'destructive',
        });
      } else {
        setReports(reportsResult.data || []);
      }

      if (testTypesResult.data) {
        setTestTypes(testTypesResult.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load lab reports data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search citizens with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.citizenSearch.trim()) {
        setIsSearchingCitizens(true);
        const { data } = await citizenService.search(formData.citizenSearch.trim());
        setSearchedCitizens(data || []);
        setIsSearchingCitizens(false);
      } else {
        setSearchedCitizens([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.citizenSearch]);

  // Filter reports by status and search
  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const citizenName = r.citizen?.name?.toLowerCase() || '';
    const citizenId = r.citizen_id?.toLowerCase() || '';
    const testName = r.test_type?.test_name?.toLowerCase() || '';
    const phone = r.citizen?.phone?.toLowerCase() || '';
    const matchesSearch = !searchQuery || 
      citizenName.includes(query) || 
      citizenId.includes(query) || 
      testName.includes(query) ||
      phone.includes(query);
    return matchesStatus && matchesSearch;
  });

  // Handle citizen selection
  const handleSelectCitizen = (citizen: Citizen) => {
    setFormData({
      ...formData,
      citizen_id: citizen.citizen_id,
      citizenSearch: '',
    });
    setSelectedCitizen(citizen);
    setSearchedCitizens([]);
    setValidationErrors({ ...validationErrors, citizen_id: '' });
  };

  // Clear citizen selection
  const handleClearCitizen = () => {
    setFormData({
      ...formData,
      citizen_id: '',
      citizenSearch: '',
    });
    setSelectedCitizen(null);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Only PDF, JPG, and PNG files are allowed.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'File size must be under 5 MB.',
          variant: 'destructive',
        });
        return;
      }

      setFormData({ ...formData, report_file: file, status: 'completed' });
      setSelectedFileName(file.name);
      setFileUploaded(true);
      setValidationErrors({ ...validationErrors, report_file: '' });
    }
  };

  // Remove file
  const handleRemoveFile = () => {
    setFormData({ ...formData, report_file: null, status: 'pending' });
    setSelectedFileName('');
    setFileUploaded(false);
  };

  // Validate form
  const validateForm = (isEdit = false): boolean => {
    const errors: Record<string, string> = {};

    if (!isEdit) {
      if (!formData.citizen_id) {
        errors.citizen_id = 'Please select a citizen';
      }
      if (!formData.test_type_id) {
        errors.test_type_id = 'Please select a test type';
      }
    }

    // If status is completed, file must be present
    if (formData.status === 'completed') {
      if (!formData.report_file && !editingReport?.report_file_url) {
        errors.report_file = 'Report file is required when status is completed';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle add report
  const handleAddReport = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      let reportFilePath = '';

      // Upload file if provided
      if (formData.report_file) {
        const uploadResult = await storageService.uploadLabReport(formData.report_file);
        if (uploadResult.error) {
          toast({
            title: 'Upload failed',
            description: uploadResult.error,
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        reportFilePath = uploadResult.path;
      }

      // Create report
      const result = await diagnosticReportService.create({
        citizen_id: formData.citizen_id,
        test_type_id: parseInt(formData.test_type_id),
        status: formData.status,
        result: formData.result || undefined,
        description: formData.description || undefined,
        report_file_url: reportFilePath || undefined,
        test_date: formData.test_date,
      });

      if (result.error) {
        toast({
          title: 'Error creating report',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Lab report created successfully',
        });
        setShowAddDialog(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create lab report',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit report
  const handleEditReport = async () => {
    if (!editingReport) return;
    if (!validateForm(true)) return;

    setIsSubmitting(true);
    try {
      let reportFilePath = editingReport.report_file_url || '';

      // Upload new file if provided
      if (formData.report_file) {
        const uploadResult = await storageService.uploadLabReport(formData.report_file);
        if (uploadResult.error) {
          toast({
            title: 'Upload failed',
            description: uploadResult.error,
            variant: 'destructive',
          });
          setIsSubmitting(false);
          return;
        }
        reportFilePath = uploadResult.path;
      }

      // Update report
      const result = await diagnosticReportService.update(editingReport.report_id, {
        status: formData.status,
        result: formData.result || undefined,
        description: formData.description || undefined,
        report_file_url: reportFilePath || undefined,
      });

      if (result.error) {
        toast({
          title: 'Error updating report',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Lab report updated successfully',
        });
        setShowEditDialog(false);
        resetForm();
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lab report',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view file
  const handleViewFile = async (report: DiagnosticReport) => {
    if (!report.report_file_url) {
      toast({
        title: 'No file',
        description: 'This report does not have an attached file.',
        variant: 'destructive',
      });
      return;
    }

    const result = await storageService.viewOrDownloadFile(report.report_file_url, 'view');
    if (result.error) {
      toast({
        title: 'Error viewing file',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Handle download file
  const handleDownloadFile = async (report: DiagnosticReport) => {
    if (!report.report_file_url) {
      toast({
        title: 'No file',
        description: 'This report does not have an attached file.',
        variant: 'destructive',
      });
      return;
    }

    const result = await storageService.viewOrDownloadFile(report.report_file_url, 'download');
    if (result.error) {
      toast({
        title: 'Error downloading file',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  // Open edit dialog
  const openEditDialog = (report: DiagnosticReport) => {
    if (report.status === 'completed') {
      toast({
        title: 'Cannot edit',
        description: 'Completed reports cannot be edited.',
        variant: 'destructive',
      });
      return;
    }
    setEditingReport(report);
    setFormData({
      citizen_id: report.citizen_id || '',
      test_type_id: report.test_type_id?.toString() || '',
      status: (report.status as LabReportStatus) || 'pending',
      result: report.result || '',
      description: report.description || '',
      report_file: null,
      test_date: report.test_date || new Date().toISOString().split('T')[0],
      citizenSearch: '',
    });
    setSelectedCitizen(report.citizen || null);
    setSelectedFileName(report.report_file_url ? 'Current file exists' : '');
    setFileUploaded(!!report.report_file_url);
    setShowEditDialog(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedFileName('');
    setValidationErrors({});
    setEditingReport(null);
    setSelectedCitizen(null);
    setFileUploaded(false);
    setSearchedCitizens([]);
  };

  // Get status counts
  const getStatusCount = (status: LabReportStatus) => {
    return reports.filter(r => r.status === status).length;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Lab Reports</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage patient lab test reports and diagnostics
          </p>
        </div>
        <Button 
          className="bg-[#1E88E5] hover:bg-[#1565C0]" 
          onClick={() => {
            resetForm();
            setShowAddDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Lab Record
        </Button>
      </div>

      {/* Stats Cards - Interactive */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* All Records Card */}
        <Card 
          className={cn(
            'p-3 cursor-pointer transition-all hover:shadow-md',
            statusFilter === 'all' ? 'ring-2 ring-[#1E88E5] bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
          )}
          onClick={() => setStatusFilter('all')}
        >
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700">
              <FileText className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">All Records</p>
              <p className="text-lg font-semibold text-slate-800 dark:text-white">{reports.length}</p>
            </div>
          </div>
        </Card>

        {LAB_REPORT_STATUSES.map((status) => {
          const count = getStatusCount(status.value);
          const config = statusConfig[status.value];
          return (
            <Card 
              key={status.value} 
              className={cn(
                'p-3 cursor-pointer transition-all hover:shadow-md',
                statusFilter === status.value ? 'ring-2 ring-[#1E88E5]' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
              )}
              onClick={() => setStatusFilter(status.value)}
            >
              <div className="flex items-center gap-2">
                <div className={cn('p-2 rounded-lg', config.bgColor)}>
                  {config.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{status.label}</p>
                  <p className="text-lg font-semibold text-slate-800 dark:text-white">{count}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by patient name, ID, phone, or test type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-lg text-slate-800 dark:text-white">Lab Reports</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No lab reports found</p>
              <p className="text-sm">Add a new lab record to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800">
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Patient</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">SMC ID</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Test Type</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Test Date</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300">Uploaded</TableHead>
                    <TableHead className="font-semibold text-slate-700 dark:text-slate-300 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.report_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1E88E5] to-blue-600 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">
                              {report.citizen?.name || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                              <Phone className="h-3 w-3" />
                              {report.citizen?.phone || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-700 dark:text-slate-300">
                          {report.citizen_id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {report.test_type?.test_name || 'Unknown Test'}
                          </p>
                          {report.test_type?.test_category && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {report.test_type.test_category}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">
                        {report.test_date 
                          ? format(new Date(report.test_date), 'MMM dd, yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'flex items-center gap-1 w-fit',
                            statusConfig[report.status as LabReportStatus]?.bgColor || '',
                            statusConfig[report.status as LabReportStatus]?.color || ''
                          )}
                        >
                          {statusConfig[report.status as LabReportStatus]?.icon}
                          <span className="capitalize">
                            {statusConfig[report.status as LabReportStatus]?.label || report.status}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                        {report.uploaded_at
                          ? format(new Date(report.uploaded_at), 'MMM dd, yyyy HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {report.report_file_url ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewFile(report)}
                                title="View Report"
                                className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                              >
                                <Eye className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDownloadFile(report)}
                                title="Download Report"
                                className="hover:bg-green-50 dark:hover:bg-green-900/30"
                              >
                                <Download className="h-4 w-4 text-green-500" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 dark:text-slate-500 px-2">No file</span>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(report)}
                            disabled={report.status === 'completed'}
                            title={report.status === 'completed' ? 'Completed reports cannot be edited' : 'Edit Report'}
                            className={cn(
                              report.status === 'completed' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-50 dark:hover:bg-amber-900/30'
                            )}
                          >
                            <Edit className="h-4 w-4 text-amber-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Lab Record Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Add Lab Record</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Create a new lab report record for a citizen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Citizen UID - Searchable Input */}
            <div className="space-y-2">
              <Label htmlFor="citizenSearch" className="text-slate-700 dark:text-slate-300">Citizen UID (SMC-ID) *</Label>
              <div className="relative">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    id="citizenSearch"
                    placeholder="Enter SMC-ID (e.g., SMC-2026-000132)"
                    value={selectedCitizen ? `${selectedCitizen.name} (${selectedCitizen.citizen_id})` : formData.citizenSearch}
                    onChange={(e) => {
                      if (!selectedCitizen) {
                        setFormData({ ...formData, citizenSearch: e.target.value, citizen_id: '' });
                      }
                    }}
                    onFocus={() => {
                      if (selectedCitizen) {
                        setFormData({ ...formData, citizenSearch: '', citizen_id: '' });
                        setSelectedCitizen(null);
                      }
                    }}
                    className={cn(
                      'pl-10 bg-white dark:bg-slate-800',
                      validationErrors.citizen_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                    )}
                  />
                  {selectedCitizen && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={handleClearCitizen}
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </Button>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {formData.citizenSearch && !selectedCitizen && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg max-h-48 overflow-y-auto">
                    {isSearchingCitizens ? (
                      <div className="p-3 text-center text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        <p className="text-sm mt-1">Searching...</p>
                      </div>
                    ) : searchedCitizens.length > 0 ? (
                      searchedCitizens.map((citizen) => (
                        <button
                          key={citizen.citizen_id}
                          type="button"
                          className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0"
                          onClick={() => handleSelectCitizen(citizen)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1E88E5] to-blue-600 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">{citizen.name}</p>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{citizen.citizen_id}</span>
                                {citizen.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {citizen.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                        <AlertCircle className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                        <p className="text-sm font-medium">Citizen record not found</p>
                        <p className="text-xs mt-1">Please check the SMC-ID and try again</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {validationErrors.citizen_id && (
                <p className="text-sm text-red-500">{validationErrors.citizen_id}</p>
              )}
            </div>

            {/* Test Type */}
            <div className="space-y-2">
              <Label htmlFor="test_type_id" className="text-slate-700 dark:text-slate-300">Test Type *</Label>
              <Select
                value={formData.test_type_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, test_type_id: value });
                  setValidationErrors({ ...validationErrors, test_type_id: '' });
                }}
              >
                <SelectTrigger className={cn(
                  'bg-white dark:bg-slate-800',
                  validationErrors.test_type_id ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'
                )}>
                  <SelectValue placeholder="Select test type" className="text-slate-700 dark:text-slate-300" />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map((test) => (
                    <SelectItem key={test.test_id} value={test.test_id.toString()}>
                      {test.test_name}
                      {test.test_category && ` - ${test.test_category}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {validationErrors.test_type_id && (
                <p className="text-sm text-red-500">{validationErrors.test_type_id}</p>
              )}
            </div>

            {/* Test Date */}
            <div className="space-y-2">
              <Label htmlFor="test_date" className="text-slate-700 dark:text-slate-300">Test Date</Label>
              <Input
                id="test_date"
                type="date"
                value={formData.test_date}
                max={today}
                onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">Only past or current dates allowed</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-slate-700 dark:text-slate-300">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: LabReportStatus) => {
                  if (fileUploaded) {
                    toast({
                      title: 'Cannot change status',
                      description: 'To change the report status, please remove the uploaded file first.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  setFormData({ ...formData, status: value });
                  if (value === 'completed' && !formData.report_file) {
                    setValidationErrors({ ...validationErrors, report_file: 'Report file is required when status is completed' });
                  } else {
                    setValidationErrors({ ...validationErrors, report_file: '' });
                  }
                }}
                disabled={fileUploaded}
              >
                <SelectTrigger className={cn(
                  'bg-white dark:bg-slate-800',
                  fileUploaded ? 'opacity-60 cursor-not-allowed' : '',
                  'border-slate-200 dark:border-slate-700'
                )}>
                  <SelectValue placeholder="Select status" className="text-slate-700 dark:text-slate-300" />
                </SelectTrigger>
                <SelectContent>
                  {LAB_REPORT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        {statusConfig[status.value].icon}
                        <span className="text-slate-700 dark:text-slate-300">{status.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fileUploaded && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Status is locked to &quot;Completed&quot; when a file is uploaded
                </p>
              )}
            </div>

            {/* Result Summary */}
            <div className="space-y-2">
              <Label htmlFor="result" className="text-slate-700 dark:text-slate-300">Result Summary</Label>
              <Textarea
                id="result"
                placeholder="Enter test results summary..."
                rows={3}
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Upload Lab Report File */}
            <div className="space-y-2">
              <Label htmlFor="report_file" className="text-slate-700 dark:text-slate-300">
                Upload Lab Report File
                {formData.status === 'completed' && <span className="text-red-500"> *</span>}
              </Label>
              <div className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center',
                validationErrors.report_file 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              )}>
                <input
                  type="file"
                  id="report_file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                
                {selectedFileName ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300">{selectedFileName}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="report_file" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Click to upload lab report file
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      PDF, JPG, PNG up to 5 MB
                    </p>
                  </label>
                )}
              </div>
              {validationErrors.report_file && (
                <p className="text-sm text-red-500">{validationErrors.report_file}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleAddReport}
              disabled={isSubmitting}
              className="bg-[#1E88E5] hover:bg-[#1565C0]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Record'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lab Report Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Edit Lab Report</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Update the lab report record. Completed reports cannot be edited.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Read-only info */}
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#1E88E5] to-blue-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-white">{editingReport?.citizen?.name}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{editingReport?.citizen_id}</span>
                    {editingReport?.citizen?.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {editingReport.citizen.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm"><strong className="text-slate-600 dark:text-slate-400">Test Type:</strong> <span className="text-slate-800 dark:text-white">{editingReport?.test_type?.test_name}</span></p>
              </div>
            </div>

            {/* Test Date */}
            <div className="space-y-2">
              <Label htmlFor="edit_test_date" className="text-slate-700 dark:text-slate-300">Test Date</Label>
              <Input
                id="edit_test_date"
                type="date"
                value={formData.test_date}
                max={today}
                onChange={(e) => setFormData({ ...formData, test_date: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500">Only past or current dates allowed</p>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="edit_status" className="text-slate-700 dark:text-slate-300">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: LabReportStatus) => {
                  if (fileUploaded) {
                    toast({
                      title: 'Cannot change status',
                      description: 'To change the report status, please remove the uploaded file first.',
                      variant: 'destructive',
                    });
                    return;
                  }
                  setFormData({ ...formData, status: value });
                  if (value === 'completed' && !formData.report_file && !editingReport?.report_file_url) {
                    setValidationErrors({ ...validationErrors, report_file: 'Report file is required when status is completed' });
                  } else {
                    setValidationErrors({ ...validationErrors, report_file: '' });
                  }
                }}
                disabled={fileUploaded}
              >
                <SelectTrigger className={cn(
                  'bg-white dark:bg-slate-800',
                  fileUploaded ? 'opacity-60 cursor-not-allowed' : '',
                  'border-slate-200 dark:border-slate-700'
                )}>
                  <SelectValue placeholder="Select status" className="text-slate-700 dark:text-slate-300" />
                </SelectTrigger>
                <SelectContent>
                  {LAB_REPORT_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        {statusConfig[status.value].icon}
                        <span className="text-slate-700 dark:text-slate-300">{status.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fileUploaded && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Status is locked to "Completed" when a file is uploaded
                </p>
              )}
            </div>

            {/* Result Summary */}
            <div className="space-y-2">
              <Label htmlFor="edit_result" className="text-slate-700 dark:text-slate-300">Result Summary</Label>
              <Textarea
                id="edit_result"
                placeholder="Enter test results summary..."
                rows={3}
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Upload Lab Report File */}
            <div className="space-y-2">
              <Label htmlFor="edit_report_file" className="text-slate-700 dark:text-slate-300">
                Upload Lab Report File
                {formData.status === 'completed' && !editingReport?.report_file_url && (
                  <span className="text-red-500"> *</span>
                )}
              </Label>
              {editingReport?.report_file_url && !formData.report_file && (
                <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/30 rounded-lg mb-2">
                  <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-green-700 dark:text-green-300">
                    Current file exists
                  </span>
                </div>
              )}
              <div className={cn(
                'border-2 border-dashed rounded-lg p-6 text-center',
                validationErrors.report_file 
                  ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' 
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
              )}>
                <input
                  type="file"
                  id="edit_report_file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.jpg,.jpeg,.png"
                />
                
                {selectedFileName && formData.report_file ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                      <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300">{selectedFileName}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label htmlFor="edit_report_file" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Click to upload new file (replaces existing)
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      PDF, JPG, PNG up to 5 MB
                    </p>
                  </label>
                )}
              </div>
              {validationErrors.report_file && (
                <p className="text-sm text-red-500">{validationErrors.report_file}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="border-slate-200 dark:border-slate-700">
              Cancel
            </Button>
            <Button 
              onClick={handleEditReport}
              disabled={isSubmitting}
              className="bg-[#1E88E5] hover:bg-[#1565C0]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Record'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Report Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-slate-800 dark:text-white">Lab Report Details</DialogTitle>
          </DialogHeader>
          {viewingReport && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">Citizen</Label>
                  <p className="font-medium text-slate-800 dark:text-white">{viewingReport.citizen?.name}</p>
                </div>
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">Test Type</Label>
                  <p className="font-medium text-slate-800 dark:text-white">{viewingReport.test_type?.test_name}</p>
                </div>
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">Status</Label>
                  <Badge
                    variant="outline"
                    className={cn(
                      'flex items-center gap-1 w-fit mt-1',
                      statusConfig[viewingReport.status as LabReportStatus]?.bgColor
                    )}
                  >
                    {statusConfig[viewingReport.status as LabReportStatus]?.icon}
                    <span className="text-slate-700 dark:text-slate-300">{statusConfig[viewingReport.status as LabReportStatus]?.label}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">Test Date</Label>
                  <p className="font-medium text-slate-800 dark:text-white">
                    {viewingReport.test_date 
                      ? format(new Date(viewingReport.test_date), 'MMM dd, yyyy')
                      : '-'}
                  </p>
                </div>
              </div>
              {viewingReport.result && (
                <div>
                  <Label className="text-slate-500 dark:text-slate-400">Result Summary</Label>
                  <p className="text-sm bg-slate-50 dark:bg-slate-800 p-2 rounded mt-1 text-slate-700 dark:text-slate-300">
                    {viewingReport.result}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)} className="border-slate-200 dark:border-slate-700">
              Close
            </Button>
            {viewingReport?.report_file_url && (
              <Button onClick={() => handleViewFile(viewingReport)} className="bg-[#1E88E5] hover:bg-[#1565C0]">
                <Eye className="h-4 w-4 mr-2" />
                View File
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
