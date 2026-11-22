'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';
import {
  bedService,
  citizenService,
  hospitalService,
  hospitalWardService,
  getCurrentHospitalId,
  type Bed,
  type Citizen,
  type Hospital,
  type HospitalWard,
} from '@/services/database';
import {
  BedDouble,
  Activity,
  Wind,
  AlertTriangle,
  RefreshCw,
  Edit,
  Plus,
  ChevronRight,
  Users,
  Clock,
  Loader2,
  Eye,
  UserPlus,
  Search,
  AlertCircle,
  Phone,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import AccessDenied from '@/components/auth/AccessDenied';
import { useRBAC } from '@/hooks/use-rbac';

type BedFilter = 'all' | 'available' | 'occupied' | 'reserved' | 'icu' | 'emergency' | 'maintenance';

export default function BedManagement() {
  const { getModuleAccess, hospitalId } = useRBAC();
  const targetHospital = hospitalId || getCurrentHospitalId();
  const moduleAccess = getModuleAccess('bed-management');
  const canManageBeds = moduleAccess === 'full';
  const [beds, setBeds] = useState<Bed[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [wards, setWards] = useState<HospitalWard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<BedFilter>('all');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showReleaseDialog, setShowReleaseDialog] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignStatus, setAssignStatus] = useState<'occupied' | 'reserved'>('occupied');
  
  // Form state
  const [formData, setFormData] = useState({
    bed_id: '',
    hospital_id: '',
    located_at: '',
    bed_type: 'general' as string,
    bed_status: 'available' as string,
  });
  
  // Citizen search for assignment
  const [citizenSearch, setCitizenSearch] = useState('');
  const [searchedCitizens, setSearchedCitizens] = useState<Citizen[]>([]);
  const [selectedCitizenId, setSelectedCitizenId] = useState('');
  const [isSearchingCitizens, setIsSearchingCitizens] = useState(false);
  
  // One Citizen One Bed - State for tracking existing assignments
  const [existingAssignment, setExistingAssignment] = useState<Bed | null>(null);
  const [isCheckingAssignment, setIsCheckingAssignment] = useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    const effectiveHospital = hospitalId || getCurrentHospitalId();
    const [bedsResult, hospitalsResult, wardsResult] = await Promise.all([
      bedService.getAll(effectiveHospital),
      hospitalService.getAll(),
      hospitalWardService.getAll(),
    ]);
    
    if (bedsResult.data) {
      const hospitalBeds = bedsResult.data.filter(
        b => !effectiveHospital || b.hospital_id === effectiveHospital
      );
      setBeds(hospitalBeds);
    }
    if (hospitalsResult.data) setHospitals(hospitalsResult.data);
    if (wardsResult.data) {
      const hospitalWards = wardsResult.data.filter(
        w => !effectiveHospital || w.hospital_id === effectiveHospital
      );
      setWards(hospitalWards.length > 0 ? hospitalWards : wardsResult.data);
    }
    setIsLoading(false);
  }, [hospitalId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Search citizens when query changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (citizenSearch.trim()) {
        setIsSearchingCitizens(true);
        const { data } = await citizenService.search(citizenSearch.trim());
        setSearchedCitizens(data || []);
        setIsSearchingCitizens(false);
      } else {
        setSearchedCitizens([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [citizenSearch]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: beds.length,
    occupied: beds.filter(b => b.bed_status === 'occupied').length,
    reserved: beds.filter(b => b.bed_status === 'reserved').length,
    available: beds.filter(b => b.bed_status === 'available').length,
    maintenance: beds.filter(b => b.bed_status === 'maintenance').length,
    icuTotal: beds.filter(b => b.bed_type === 'icu').length,
    icuOccupied: beds.filter(b => b.bed_type === 'icu' && b.bed_status === 'occupied').length,
    icuAvailable: beds.filter(b => b.bed_type === 'icu' && b.bed_status === 'available').length,
    emergencyTotal: beds.filter(b => b.bed_type === 'emergency').length,
    emergencyOccupied: beds.filter(b => b.bed_type === 'emergency' && b.bed_status === 'occupied').length,
    emergencyAvailable: beds.filter(b => b.bed_type === 'emergency' && b.bed_status === 'available').length,
  }), [beds]);

  const overallOccupancy = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;

  // Filter beds
  const filteredBeds = useMemo(() => {
    switch (activeFilter) {
      case 'available': return beds.filter(b => b.bed_status === 'available');
      case 'occupied': return beds.filter(b => b.bed_status === 'occupied');
      case 'reserved': return beds.filter(b => b.bed_status === 'reserved');
      case 'icu': return beds.filter(b => b.bed_type === 'icu');
      case 'emergency': return beds.filter(b => b.bed_type === 'emergency');
      case 'maintenance': return beds.filter(b => b.bed_status === 'maintenance');
      default: return beds;
    }
  }, [beds, activeFilter]);

  // Get assigned citizen IDs for quick lookup
  const assignedCitizenIds = useMemo(() => {
    return new Set(
      beds
        .filter(b => (b.bed_status === 'occupied' || b.bed_status === 'reserved') && b.assigned_to)
        .map(b => b.assigned_to)
    );
  }, [beds]);

  // Check if citizen is already assigned to a bed
  const checkCitizenAssignment = (citizenId: string): Bed | null => {
    return beds.find(b => b.assigned_to === citizenId && (b.bed_status === 'occupied' || b.bed_status === 'reserved')) || null;
  };

  // Group beds by ward for summary
  const wardSummary = useMemo(() => {
    const wardMap = new Map<string, { total: number; occupied: number; available: number; maintenance: number }>();
    beds.forEach(bed => {
      const wardName = bed.ward?.ward_name || bed.located_at || 'General Ward';
      const current = wardMap.get(wardName) || { total: 0, occupied: 0, available: 0, maintenance: 0 };
      current.total++;
      if (bed.bed_status === 'occupied') current.occupied++;
      else if (bed.bed_status === 'available') current.available++;
      else if (bed.bed_status === 'maintenance') current.maintenance++;
      wardMap.set(wardName, current);
    });
    return Array.from(wardMap.entries()).map(([ward, data]) => ({
      ward,
      ...data,
      occupancyRate: data.total > 0 ? Math.round((data.occupied / data.total) * 100) : 0,
    }));
  }, [beds]);

  // Handlers
  const handleAddBed = async () => {
    if (!canManageBeds) {
      toast.error('Access Denied');
      return;
    }
    if (!formData.bed_id.trim()) {
      toast.error('Bed ID is required');
      return;
    }
    setIsSubmitting(true);
    const { error } = await bedService.create({
      bed_id: formData.bed_id.trim(),
      hospital_id: targetHospital,
      located_at: formData.located_at || null,
      bed_type: formData.bed_type as any,
      bed_status: formData.bed_status as any,
    });
    setIsSubmitting(false);
    if (error) toast.error(error);
    else {
      toast.success('Bed added successfully');
      setShowAddDialog(false);
      setFormData({ bed_id: '', hospital_id: '', located_at: '', bed_type: 'general', bed_status: 'available' });
      loadData();
    }
  };

  const handleUpdateBed = async () => {
    if (!canManageBeds) {
      toast.error('Access Denied');
      return;
    }
    if (!selectedBed) return;
    setIsSubmitting(true);
    const shouldClearAssigned = ['available', 'maintenance', 'cleaning', 'blocked'].includes(formData.bed_status);
    const { error } = await bedService.update(selectedBed.bed_id, {
      bed_type: formData.bed_type,
      bed_status: formData.bed_status,
      hospital_id: targetHospital,
      located_at: formData.located_at || null,
      assigned_to: shouldClearAssigned ? null : selectedBed.assigned_to,
    });
    setIsSubmitting(false);
    if (error) toast.error(error);
    else {
      toast.success('Bed updated successfully');
      setShowEditDialog(false);
      setSelectedBed(null);
      loadData();
    }
  };

  const handleAssignBed = async () => {
    if (!canManageBeds) {
      toast.error('Access Denied');
      return;
    }
    if (!selectedBed || !selectedCitizenId) {
      toast.error('Please select a citizen');
      return;
    }
    
    // Double-check for existing assignment before submitting
    const existingBed = checkCitizenAssignment(selectedCitizenId);
    if (existingBed && existingBed.bed_id !== selectedBed.bed_id) {
      toast.error(`This citizen is already assigned to Bed ${existingBed.bed_id}. Please discharge before assigning a new bed.`);
      return;
    }
    
    setIsSubmitting(true);
    const { error } = await bedService.assignCitizen(selectedBed.bed_id, selectedCitizenId, assignStatus);
    setIsSubmitting(false);
    if (error) toast.error(error);
    else {
      toast.success(assignStatus === 'reserved' ? 'Bed reserved successfully' : 'Bed assigned and patient admitted successfully');
      setShowAssignDialog(false);
      setSelectedBed(null);
      setSelectedCitizenId('');
      setCitizenSearch('');
      setExistingAssignment(null);
      setAssignStatus('occupied');
      loadData();
    }
  };

  const handleAdmitReserved = async (bed: Bed) => {
    if (!canManageBeds) {
      toast.error('Access Denied');
      return;
    }
    setIsSubmitting(true);
    const { error } = await bedService.updateStatus(bed.bed_id, 'occupied', bed.assigned_to);
    setIsSubmitting(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Patient admitted to Bed ${bed.bed_id}`);
      loadData();
    }
  };

  // Open release confirmation dialog
  const openReleaseDialog = async (bed: Bed) => {
    if (!canManageBeds) {
      toast.error('Access Denied');
      return;
    }
    let fullBed = { ...bed };
    if (!fullBed.assigned_citizen && fullBed.assigned_to) {
      try {
        const { data } = await citizenService.getById(fullBed.assigned_to);
        if (data) {
          fullBed.assigned_citizen = data;
        }
      } catch (e) {
        // ignore
      }
    }
    setSelectedBed(fullBed);
    setShowReleaseDialog(true);
  };

  // Confirm and execute release
  const handleConfirmRelease = async () => {
    if (!canManageBeds) {
      toast.error('Access Denied');
      return;
    }
    if (!selectedBed) return;
    setIsSubmitting(true);
    const { error } = await bedService.releaseBed(selectedBed.bed_id);
    setIsSubmitting(false);
    if (error) toast.error(error);
    else {
      toast.success('Bed released successfully');
      setShowReleaseDialog(false);
      setSelectedBed(null);
      loadData();
    }
  };

  const openEditDialog = (bed: Bed) => {
    if (!canManageBeds) {
      toast.error('Access Denied');
      return;
    }
    setSelectedBed(bed);
    setFormData({
      bed_id: bed.bed_id,
      hospital_id: bed.hospital_id || targetHospital,
      located_at: bed.ward?.hospital_ward_id || bed.located_at || '',
      bed_type: bed.bed_type || 'general',
      bed_status: bed.bed_status || 'available',
    });
    setShowEditDialog(true);
  };

  const openViewDialog = async (bed: Bed) => {
    let fullBed = { ...bed };
    if (!fullBed.assigned_citizen && fullBed.assigned_to) {
      try {
        const { data } = await citizenService.getById(fullBed.assigned_to);
        if (data) {
          fullBed.assigned_citizen = data;
        }
      } catch (e) {
        // ignore
      }
    }
    setSelectedBed(fullBed);
    setShowViewDialog(true);
  };

  const openAssignDialog = (bed: Bed) => {
    if (!canManageBeds) {
      toast.error('Access Denied');
      return;
    }
    setSelectedBed(bed);
    setCitizenSearch('');
    setSelectedCitizenId('');
    setSearchedCitizens([]);
    setExistingAssignment(null);
    setAssignStatus('occupied');
    setShowAssignDialog(true);
  };

  // Handle citizen selection with assignment check
  const handleSelectCitizen = (citizen: Citizen) => {
    setSelectedCitizenId(citizen.citizen_id);
    setCitizenSearch(`${citizen.name} (${citizen.citizen_id})`);
    
    // Check if citizen is already assigned to another bed
    const existingBed = checkCitizenAssignment(citizen.citizen_id);
    setExistingAssignment(existingBed);
    
    if (existingBed) {
      toast.warning(`This citizen is already assigned to Bed ${existingBed.bed_id}`);
    }
  };

  const getBedStatusColor = (status: string | null) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case 'occupied': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'maintenance': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
      case 'reserved': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (moduleAccess === 'none') {
    return <AccessDenied message="You do not have permission to access bed management." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Bed Management</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage hospital bed capacity</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          {canManageBeds ? (
            <Button onClick={() => { setFormData({ bed_id: '', hospital_id: '', located_at: '', bed_type: 'general', bed_status: 'available' }); setShowAddDialog(true); }}>
              <Plus className="h-4 w-4 mr-2" />Add Bed
            </Button>
          ) : (
            <Badge variant="outline">View Only</Badge>
          )}
        </div>
      </div>

      {/* Summary Cards - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-[#047857] cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/30">
                <BedDouble className="h-5 w-5 text-[#047857]" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Beds</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('occupied')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Users className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Occupied</p>
                <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('available')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <BedDouble className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Available</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('icu')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">ICU Available</p>
                <p className="text-2xl font-bold text-purple-600">{stats.icuAvailable}/{stats.icuTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveFilter('emergency')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Emergency Available</p>
                <p className="text-2xl font-bold text-orange-600">{stats.emergencyAvailable}/{stats.emergencyTotal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-500">Current Rate</span>
              <span className={cn('text-lg font-bold', overallOccupancy > 80 ? 'text-red-600' : overallOccupancy > 60 ? 'text-amber-600' : 'text-green-600')}>
                {overallOccupancy}%
              </span>
            </div>
            <Progress value={overallOccupancy} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'available', 'occupied', 'reserved', 'icu', 'emergency', 'maintenance'] as BedFilter[]).map((filter) => (
          <Button
            key={filter}
            variant={activeFilter === filter ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter)}
            className={cn('capitalize', activeFilter === filter && 'bg-[#047857] hover:bg-[#065F46]')}
          >
            {filter === 'all' ? 'All Beds' : filter}
          </Button>
        ))}
      </div>

      {/* Bed List Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bed Details - {filteredBeds.length} beds</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50">
                <TableHead>Bed ID</TableHead>
                <TableHead>Ward / Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned Patient</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No beds found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBeds.map((bed) => (
                  <TableRow key={bed.bed_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-mono font-medium">{bed.bed_id}</TableCell>
                    <TableCell className="text-slate-700 dark:text-slate-300 font-medium">
                      {bed.ward?.ward_name || bed.located_at || 'General Ward'}
                    </TableCell>
                    <TableCell className="capitalize">{bed.bed_type || 'general'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('capitalize font-medium', getBedStatusColor(bed.bed_status))}>
                        {bed.bed_status || 'available'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bed.assigned_citizen ? (
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{bed.assigned_citizen.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{bed.assigned_citizen.citizen_id}</p>
                        </div>
                      ) : bed.assigned_to ? (
                        <div>
                          <p className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200">{bed.assigned_to}</p>
                          <Badge variant="outline" className="text-xs mt-0.5">Assigned</Badge>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openViewDialog(bed)} title="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageBeds ? (
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(bed)} title="Edit Bed">
                            <Edit className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {canManageBeds && bed.bed_status === 'available' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            onClick={() => openAssignDialog(bed)}
                            title="Assign / Admit"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Assign
                          </Button>
                        )}
                        {canManageBeds && bed.bed_status === 'reserved' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => handleAdmitReserved(bed)}
                              title="Admit Reserved Patient"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Admit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => openReleaseDialog(bed)}
                              title="Cancel Reservation"
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {canManageBeds && bed.bed_status === 'occupied' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => openReleaseDialog(bed)}
                            title="Discharge Patient"
                          >
                            Release
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Bed Dialog */}
      <Dialog open={canManageBeds && showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md max-w-full">
          <DialogHeader>
            <DialogTitle>Add New Bed</DialogTitle>
            <DialogDescription>Create a new bed entry for your hospital facility.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Bed ID *</Label>
              <Input
                value={formData.bed_id}
                onChange={(e) => setFormData(prev => ({ ...prev, bed_id: e.target.value }))}
                placeholder="e.g., BED-H2-005"
              />
            </div>
            <div className="space-y-2">
              <Label>Ward / Department</Label>
              <Select
                value={formData.located_at}
                onValueChange={(v) => setFormData(prev => ({ ...prev, located_at: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ward or location" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((w) => (
                    <SelectItem key={w.hospital_ward_id} value={w.hospital_ward_id}>
                      {w.ward_name} {w.department ? `(${w.department})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bed Type</Label>
              <Select value={formData.bed_type} onValueChange={(v) => setFormData(prev => ({ ...prev, bed_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="icu">ICU</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="isolation">Isolation</SelectItem>
                  <SelectItem value="pediatric">Pediatric</SelectItem>
                  <SelectItem value="maternity">Maternity</SelectItem>
                  <SelectItem value="orthopedic">Orthopedic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial Status</Label>
              <Select value={formData.bed_status} onValueChange={(v) => setFormData(prev => ({ ...prev, bed_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddBed} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Add Bed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bed Dialog */}
      <Dialog open={canManageBeds && showEditDialog} onOpenChange={(o) => { setShowEditDialog(o); if (!o) setSelectedBed(null); }}>
        <DialogContent className="sm:max-w-md max-w-full">
          <DialogHeader>
            <DialogTitle>Edit Bed</DialogTitle>
            <DialogDescription>Modify bed specifications or change status.</DialogDescription>
          </DialogHeader>
          {selectedBed && (
            <p className="text-sm text-slate-500 mb-1">
              Bed ID: <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{selectedBed.bed_id}</span>
            </p>
          )}
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ward / Department</Label>
              <Select
                value={formData.located_at}
                onValueChange={(v) => setFormData(prev => ({ ...prev, located_at: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ward or location" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((w) => (
                    <SelectItem key={w.hospital_ward_id} value={w.hospital_ward_id}>
                      {w.ward_name} {w.department ? `(${w.department})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bed Type</Label>
              <Select value={formData.bed_type} onValueChange={(v) => setFormData(prev => ({ ...prev, bed_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="icu">ICU</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="isolation">Isolation</SelectItem>
                  <SelectItem value="pediatric">Pediatric</SelectItem>
                  <SelectItem value="maternity">Maternity</SelectItem>
                  <SelectItem value="orthopedic">Orthopedic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.bed_status} onValueChange={(v) => setFormData(prev => ({ ...prev, bed_status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="reserved">Reserved</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="cleaning">Cleaning</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateBed} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update Bed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Bed Dialog */}
      <Dialog open={showViewDialog} onOpenChange={(o) => { setShowViewDialog(o); if (!o) setSelectedBed(null); }}>
        <DialogContent className="sm:max-w-lg max-w-full">
          <DialogHeader><DialogTitle>Bed Details</DialogTitle></DialogHeader>
          {selectedBed && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Bed ID</p>
                  <p className="font-mono font-medium">{selectedBed.bed_id}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="capitalize font-medium">{selectedBed.bed_type || 'General'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <Badge className={cn('capitalize mt-1', getBedStatusColor(selectedBed.bed_status))}>
                    {selectedBed.bed_status || 'Available'}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ward / Location</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedBed.ward?.ward_name || selectedBed.located_at || 'General Ward'}
                  </p>
                </div>
              </div>

              {(selectedBed.assigned_citizen || selectedBed.assigned_to) && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/70 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <Users className="h-4 w-4" />
                    {selectedBed.bed_status === 'reserved' ? 'Reserved Patient Details' : 'Assigned Patient Details'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm min-w-[80px]">Name:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {selectedBed.assigned_citizen?.name || 'Patient ' + selectedBed.assigned_to}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm min-w-[80px]">Citizen ID:</span>
                      <span className="font-mono text-sm">{selectedBed.assigned_citizen?.citizen_id || selectedBed.assigned_to}</span>
                    </div>
                    {selectedBed.assigned_citizen?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span className="text-sm">{selectedBed.assigned_citizen.phone}</span>
                      </div>
                    )}
                    {selectedBed.assigned_citizen?.gender && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="text-slate-500 min-w-[80px]">Gender / Age:</span>
                        <span>{selectedBed.assigned_citizen.gender} {selectedBed.assigned_citizen.age ? `• ${selectedBed.assigned_citizen.age} yrs` : ''}</span>
                      </div>
                    )}
                    {selectedBed.assigned_citizen?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-slate-400 mt-0.5" />
                        <span className="text-sm">{selectedBed.assigned_citizen.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {selectedBed.last_updated_on && (
                <p className="text-xs text-slate-400">Last updated: {format(new Date(selectedBed.last_updated_on), 'MMM dd, yyyy h:mm a')}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Release Bed Confirmation Dialog */}
      <Dialog open={canManageBeds && showReleaseDialog} onOpenChange={(o) => { setShowReleaseDialog(o); if (!o) setSelectedBed(null); }}>
        <DialogContent className="sm:max-w-md max-w-full">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              {selectedBed?.bed_status === 'reserved' ? 'Cancel Bed Reservation' : 'Confirm Bed Discharge'}
            </DialogTitle>
            <DialogDescription>
              {selectedBed?.bed_status === 'reserved'
                ? 'Are you sure you want to cancel this bed reservation and return it to available status?'
                : 'Are you sure you want to release this bed? This action will discharge the assigned patient.'}
            </DialogDescription>
          </DialogHeader>
          {selectedBed && (
            <div className="space-y-4 py-4">
              {/* Bed Details */}
              <div className="p-4 rounded-lg border bg-slate-50 dark:bg-slate-800">
                <p className="text-sm font-semibold mb-3">Bed Information</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Bed ID:</span>
                    <p className="font-mono font-medium">{selectedBed.bed_id}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Type:</span>
                    <p className="capitalize font-medium">{selectedBed.bed_type || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <Badge className={cn('capitalize ml-1', getBedStatusColor(selectedBed.bed_status))}>{selectedBed.bed_status || 'Available'}</Badge>
                  </div>
                  <div>
                    <span className="text-slate-500">Ward / Location:</span>
                    <p className="font-medium">{selectedBed.ward?.ward_name || selectedBed.located_at || 'General Ward'}</p>
                  </div>
                </div>
              </div>

              {/* Assigned Citizen Details */}
              {(selectedBed.assigned_citizen || selectedBed.assigned_to) && (
                <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <p className="text-sm font-semibold mb-3 text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {selectedBed.bed_status === 'reserved' ? 'Reserved Patient' : 'Assigned Patient (To be discharged)'}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400 text-sm min-w-[80px]">Name:</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {selectedBed.assigned_citizen?.name || 'Patient ' + selectedBed.assigned_to}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400 text-sm min-w-[80px]">Citizen ID:</span>
                      <span className="font-mono text-sm">{selectedBed.assigned_citizen?.citizen_id || selectedBed.assigned_to}</span>
                    </div>
                    {selectedBed.assigned_citizen?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span className="text-sm">{selectedBed.assigned_citizen.phone}</span>
                      </div>
                    )}
                    {selectedBed.assigned_citizen?.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-slate-400 mt-0.5" />
                        <span className="text-sm">{selectedBed.assigned_citizen.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-xs text-red-800 dark:text-red-200">
                  <strong>Notice:</strong> The bed will immediately return to Available status in the system.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReleaseDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmRelease} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedBed?.bed_status === 'reserved' ? 'Cancel Reservation' : 'Release Bed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Citizen Dialog */}
      <Dialog open={canManageBeds && showAssignDialog} onOpenChange={(o) => { 
        setShowAssignDialog(o); 
        if (!o) { 
          setSelectedBed(null); 
          setCitizenSearch(''); 
          setSelectedCitizenId(''); 
          setExistingAssignment(null);
          setAssignStatus('occupied');
        }
      }}>
        <DialogContent className="sm:max-w-lg max-w-full">
          <DialogHeader>
            <DialogTitle>Assign Bed to Citizen</DialogTitle>
            <DialogDescription>Select a citizen to admit or reserve this bed for.</DialogDescription>
          </DialogHeader>
          {selectedBed && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-2">
              <div className="flex items-center gap-3">
                <BedDouble className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-slate-500">Selected Bed</p>
                  <p className="font-mono font-medium">{selectedBed.bed_id} ({selectedBed.bed_type || 'General'})</p>
                </div>
              </div>
            </div>
          )}
          <div className="space-y-4 py-2">
            {/* Assignment Mode Selection */}
            <div className="space-y-2">
              <Label>Assignment Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAssignStatus('occupied')}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                    assignStatus === 'occupied'
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <span className="font-medium text-sm">Admit Now (Occupied)</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Immediate patient admission</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignStatus('reserved')}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-lg border text-left transition-colors",
                    assignStatus === 'reserved'
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-600"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <span className="font-medium text-sm">Reserve Bed</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Hold for upcoming admission</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Search Citizen</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by name, phone, or Citizen ID..."
                  value={citizenSearch}
                  onChange={(e) => { setCitizenSearch(e.target.value); setSelectedCitizenId(''); setExistingAssignment(null); }}
                  className="pl-10"
                />
                {isSearchingCitizens && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin" />}
              </div>
              {searchedCitizens.length > 0 && !selectedCitizenId && (
                <div className="border rounded-lg divide-y max-h-40 overflow-auto bg-white dark:bg-slate-900 shadow-sm">
                  {searchedCitizens.slice(0, 5).map((c) => {
                    const isAlreadyAssigned = assignedCitizenIds.has(c.citizen_id);
                    return (
                      <button 
                        key={c.citizen_id} 
                        className={cn(
                          "w-full flex items-center gap-3 p-2 text-left",
                          isAlreadyAssigned 
                            ? "bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30" 
                            : "hover:bg-slate-50 dark:hover:bg-slate-700"
                        )} 
                        onClick={() => handleSelectCitizen(c)}
                      >
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full text-sm",
                          isAlreadyAssigned 
                            ? "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200" 
                            : "bg-primary/10 text-primary"
                        )}>
                          {c.name?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{c.name}</p>
                            {isAlreadyAssigned && (
                              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-800 dark:text-amber-200 dark:border-amber-600">
                                Already Assigned
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{c.citizen_id}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Warning Box for Already Assigned Citizen */}
            {existingAssignment && (
              <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800 dark:text-amber-200">Citizen Already Assigned</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      This citizen is already assigned to another bed. Please discharge from the current bed before assigning a new one.
                    </p>
                  </div>
                </div>
                
                {/* Existing Assignment Details */}
                <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded border border-amber-200 dark:border-amber-700">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Current Bed Assignment</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Bed ID:</span>
                      <p className="font-mono font-medium">{existingAssignment.bed_id}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Bed Type:</span>
                      <p className="capitalize font-medium">{existingAssignment.bed_type || 'General'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Status:</span>
                      <Badge className={cn('capitalize ml-1', getBedStatusColor(existingAssignment.bed_status))}>{existingAssignment.bed_status}</Badge>
                    </div>
                    <div>
                      <span className="text-slate-500">Location/Ward:</span>
                      <p className="text-xs font-medium">{existingAssignment.ward?.ward_name || existingAssignment.located_at || 'General Ward'}</p>
                    </div>
                    {existingAssignment.last_updated_on && (
                      <div className="col-span-2">
                        <span className="text-slate-500">Assigned Date:</span>
                        <p className="text-xs">{format(new Date(existingAssignment.last_updated_on), 'MMM dd, yyyy h:mm a')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleAssignBed} 
              disabled={isSubmitting || !selectedCitizenId || !!existingAssignment}
              className={cn("bg-emerald-700 hover:bg-emerald-800 text-white", existingAssignment && "opacity-50 cursor-not-allowed")}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {assignStatus === 'reserved' ? 'Reserve Bed' : 'Admit Patient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
