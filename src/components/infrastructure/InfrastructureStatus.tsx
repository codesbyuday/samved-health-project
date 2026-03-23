'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Ambulance,
  Activity,
  Wrench,
  CheckCircle,
  XCircle,
  Edit,
  Calendar,
  MapPin,
  RefreshCw,
  Plus,
  Trash2,
  Loader2,
  Building2,
  Cog,
  Truck,
  FolderOpen,
  AlertTriangle,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Info,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  medicalEquipmentService,
  ambulanceService,
  hospitalSearchService,
  type MedicalEquipment,
  type Ambulance,
  type Hospital,
} from '@/services/database';

// Equipment condition status options (matching database enum)
const EQUIPMENT_CONDITION_OPTIONS = [
  { value: 'operational', label: 'Operational', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'needs_service', label: 'Needs Service', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { value: 'under_maintenance', label: 'Under Maintenance', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'out_of_order', label: 'Out of Order', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'retired', label: 'Retired', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

// Ambulance status options (matching database enum)
const AMBULANCE_STATUS_OPTIONS = [
  { value: 'available', label: 'Available', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'out_of_service', label: 'Out of Service', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'under_maintenance', label: 'Under Maintenance', color: 'bg-amber-100 text-amber-700 border-amber-200' },
];

// Equipment categories
const EQUIPMENT_CATEGORIES = [
  'Diagnostic',
  'Therapeutic',
  'Life Support',
  'Monitoring',
  'Surgical',
  'Laboratory',
  'Imaging',
  'Sterilization',
  'Other',
];

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  'Diagnostic': 'bg-blue-50 border-blue-200',
  'Therapeutic': 'bg-purple-50 border-purple-200',
  'Life Support': 'bg-red-50 border-red-200',
  'Monitoring': 'bg-cyan-50 border-cyan-200',
  'Surgical': 'bg-indigo-50 border-indigo-200',
  'Laboratory': 'bg-teal-50 border-teal-200',
  'Imaging': 'bg-violet-50 border-violet-200',
  'Sterilization': 'bg-orange-50 border-orange-200',
  'Other': 'bg-slate-50 border-slate-200',
};

const CATEGORY_TEXT_COLORS: Record<string, string> = {
  'Diagnostic': 'text-blue-800',
  'Therapeutic': 'text-purple-800',
  'Life Support': 'text-red-800',
  'Monitoring': 'text-cyan-800',
  'Surgical': 'text-indigo-800',
  'Laboratory': 'text-teal-800',
  'Imaging': 'text-violet-800',
  'Sterilization': 'text-orange-800',
  'Other': 'text-slate-800',
};

export default function InfrastructureStatus() {
  // State for equipment
  const [equipment, setEquipment] = useState<MedicalEquipment[]>([]);
  const [equipmentStats, setEquipmentStats] = useState({ total: 0, operational: 0, maintenance: 0, outOfService: 0 });
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);

  // State for ambulances
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [ambulanceStats, setAmbulanceStats] = useState({ total: 0, available: 0, outOfService: 0, maintenance: 0 });
  const [isLoadingAmbulances, setIsLoadingAmbulances] = useState(false);

  // Filter states
  const [equipmentFilter, setEquipmentFilter] = useState<'all' | 'operational' | 'maintenance' | 'outOfService'>('all');
  const [ambulanceFilter, setAmbulanceFilter] = useState<'all' | 'available' | 'maintenance'>('all');

  // Search states
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [ambulanceSearch, setAmbulanceSearch] = useState('');
  const [equipmentCategoryFilter, setEquipmentCategoryFilter] = useState<string>('all');

  // State for dialogs
  const [showAddEquipmentDialog, setShowAddEquipmentDialog] = useState(false);
  const [showEditEquipmentDialog, setShowEditEquipmentDialog] = useState(false);
  const [showAddAmbulanceDialog, setShowAddAmbulanceDialog] = useState(false);
  const [showEditAmbulanceDialog, setShowEditAmbulanceDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation dialog
  const [showDeleteEquipmentDialog, setShowDeleteEquipmentDialog] = useState(false);
  const [showDeleteAmbulanceDialog, setShowDeleteAmbulanceDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'equipment' | 'ambulance'; id: string; name: string } | null>(null);

  // View dialog states
  const [showViewEquipmentDialog, setShowViewEquipmentDialog] = useState(false);
  const [showViewAmbulanceDialog, setShowViewAmbulanceDialog] = useState(false);
  const [viewEquipment, setViewEquipment] = useState<MedicalEquipment | null>(null);
  const [viewAmbulance, setViewAmbulance] = useState<Ambulance | null>(null);

  // State for forms
  const [selectedEquipment, setSelectedEquipment] = useState<MedicalEquipment | null>(null);
  const [selectedAmbulance, setSelectedAmbulance] = useState<Ambulance | null>(null);

  // Equipment form state
  const [equipmentForm, setEquipmentForm] = useState({
    equipment_id: '',
    equipment_name: '',
    equipment_category: '',
    condition_status: 'operational',
    hospital_id: '',
    equipment_location: '',
    manufacturer: '',
    model_number: '',
    last_serviced_date: '',
  });

  // Ambulance form state
  const [ambulanceForm, setAmbulanceForm] = useState({
    ambulance_vehicle_number: '',
    hospital_id: '',
    status: 'available',
    current_location: '',
  });

  // Hospital search
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [hospitalResults, setHospitalResults] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [isSearchingHospitals, setIsSearchingHospitals] = useState(false);

  // Load equipment data
  const loadEquipment = useCallback(async () => {
    setIsLoadingEquipment(true);
    setEquipmentError(null);
    
    try {
      const result = await medicalEquipmentService.getAll();

      if (result.error) {
        setEquipmentError(result.error);
        toast.error(result.error);
      } else if (result.data) {
        setEquipment(result.data);
        
        // Calculate stats based on actual enum values
        const stats = {
          total: result.data.length,
          operational: result.data.filter(e => e.condition_status === 'operational').length,
          maintenance: result.data.filter(e => 
            e.condition_status === 'under_maintenance' || 
            e.condition_status === 'needs_service'
          ).length,
          outOfService: result.data.filter(e => 
            e.condition_status === 'out_of_order' || 
            e.condition_status === 'retired'
          ).length,
        };
        setEquipmentStats(stats);
      }
    } catch (error) {
      console.error('Error loading equipment:', error);
      setEquipmentError('Failed to load equipment data');
      toast.error('Failed to load equipment data');
    } finally {
      setIsLoadingEquipment(false);
    }
  }, []);

  // Load ambulance data
  const loadAmbulances = useCallback(async () => {
    setIsLoadingAmbulances(true);
    try {
      const result = await ambulanceService.getAll();

      if (result.data) {
        setAmbulances(result.data);
        // Calculate stats based on actual enum values
        const stats = {
          total: result.data.length,
          available: result.data.filter(a => a.status === 'available').length,
          outOfService: result.data.filter(a => a.status === 'out_of_service').length,
          maintenance: result.data.filter(a => a.status === 'under_maintenance').length,
        };
        setAmbulanceStats(stats);
      }
    } catch (error) {
      console.error('Error loading ambulances:', error);
      toast.error('Failed to load ambulance data');
    } finally {
      setIsLoadingAmbulances(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadEquipment();
    loadAmbulances();
  }, [loadEquipment, loadAmbulances]);

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
        if (!error && data) {
          setHospitalResults(data);
        }
      } catch (err) {
        console.error('Hospital search error:', err);
      }
      setIsSearchingHospitals(false);
    };
    const timer = setTimeout(searchHospitals, 300);
    return () => clearTimeout(timer);
  }, [hospitalSearch]);

  // Filter equipment based on search, status filter, and category filter
  const filteredEquipment = React.useMemo(() => {
    let filtered = equipment;
    
    // Filter by status (from card clicks) - matching actual enum values
    if (equipmentFilter !== 'all') {
      filtered = filtered.filter(eq => {
        if (equipmentFilter === 'operational') {
          return eq.condition_status === 'operational';
        }
        if (equipmentFilter === 'maintenance') {
          return eq.condition_status === 'under_maintenance' || 
                 eq.condition_status === 'needs_service';
        }
        if (equipmentFilter === 'outOfService') {
          return eq.condition_status === 'out_of_order' || 
                 eq.condition_status === 'retired';
        }
        return true;
      });
    }
    
    // Filter by category
    if (equipmentCategoryFilter !== 'all') {
      filtered = filtered.filter(eq => eq.equipment_category === equipmentCategoryFilter);
    }
    
    // Filter by search
    if (equipmentSearch.trim()) {
      const searchLower = equipmentSearch.toLowerCase();
      filtered = filtered.filter(eq => 
        (eq.equipment_name?.toLowerCase().includes(searchLower)) ||
        (eq.equipment_id?.toLowerCase().includes(searchLower)) ||
        (eq.equipment_category?.toLowerCase().includes(searchLower)) ||
        (eq.manufacturer?.toLowerCase().includes(searchLower)) ||
        (eq.model_number?.toLowerCase().includes(searchLower)) ||
        (eq.equipment_location?.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [equipment, equipmentFilter, equipmentSearch, equipmentCategoryFilter]);

  // Filter ambulances based on search and status filter
  const filteredAmbulances = React.useMemo(() => {
    let filtered = ambulances;
    
    // Filter by status (from card clicks) - matching actual enum values
    if (ambulanceFilter !== 'all') {
      filtered = filtered.filter(amb => {
        if (ambulanceFilter === 'available') return amb.status === 'available';
        if (ambulanceFilter === 'maintenance') return amb.status === 'under_maintenance';
        return true;
      });
    }
    
    // Filter by search (vehicle number)
    if (ambulanceSearch.trim()) {
      const searchLower = ambulanceSearch.toLowerCase();
      filtered = filtered.filter(amb => 
        amb.ambulance_vehicle_number?.toLowerCase().includes(searchLower) ||
        amb.current_location?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [ambulances, ambulanceFilter, ambulanceSearch]);

  // Group equipment by category
  const groupedEquipment = React.useMemo(() => {
    const groups: Record<string, MedicalEquipment[]> = {};
    
    filteredEquipment.forEach(eq => {
      const category = eq.equipment_category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(eq);
    });

    // Sort categories alphabetically
    const sortedGroups: Record<string, MedicalEquipment[]> = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key].sort((a, b) => 
        (a.equipment_name || '').localeCompare(b.equipment_name || '')
      );
    });

    return sortedGroups;
  }, [filteredEquipment]);

  // Reset forms
  const resetEquipmentForm = () => {
    setEquipmentForm({
      equipment_id: '',
      equipment_name: '',
      equipment_category: '',
      condition_status: 'operational',
      hospital_id: '',
      equipment_location: '',
      manufacturer: '',
      model_number: '',
      last_serviced_date: '',
    });
    setSelectedHospital(null);
    setHospitalSearch('');
  };

  const resetAmbulanceForm = () => {
    setAmbulanceForm({
      ambulance_vehicle_number: '',
      hospital_id: '',
      status: 'available',
      current_location: '',
    });
    setSelectedHospital(null);
    setHospitalSearch('');
  };

  // Handle add equipment
  const handleAddEquipment = async () => {
    if (!equipmentForm.equipment_name.trim()) {
      toast.error('Please enter equipment name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await medicalEquipmentService.create({
        equipment_id: equipmentForm.equipment_id || null,
        equipment_name: equipmentForm.equipment_name,
        equipment_category: equipmentForm.equipment_category || null,
        condition_status: equipmentForm.condition_status,
        hospital_id: selectedHospital?.hospital_id || null,
        equipment_location: equipmentForm.equipment_location || null,
        manufacturer: equipmentForm.manufacturer || null,
        model_number: equipmentForm.model_number || null,
        last_serviced_date: equipmentForm.last_serviced_date || null,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Equipment added successfully');
        setShowAddEquipmentDialog(false);
        resetEquipmentForm();
        loadEquipment();
      }
    } catch (error) {
      toast.error('Failed to add equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit equipment
  const handleEditEquipment = async () => {
    if (!selectedEquipment) return;
    if (!equipmentForm.equipment_name.trim()) {
      toast.error('Please enter equipment name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await medicalEquipmentService.update(selectedEquipment.equipment_uuid, {
        equipment_id: equipmentForm.equipment_id || null,
        equipment_name: equipmentForm.equipment_name,
        equipment_category: equipmentForm.equipment_category || null,
        condition_status: equipmentForm.condition_status,
        hospital_id: selectedHospital?.hospital_id || null,
        equipment_location: equipmentForm.equipment_location || null,
        manufacturer: equipmentForm.manufacturer || null,
        model_number: equipmentForm.model_number || null,
        last_serviced_date: equipmentForm.last_serviced_date || null,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Equipment updated successfully');
        setShowEditEquipmentDialog(false);
        setSelectedEquipment(null);
        resetEquipmentForm();
        loadEquipment();
      }
    } catch (error) {
      toast.error('Failed to update equipment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete equipment
  const handleDeleteEquipment = async () => {
    if (!itemToDelete || itemToDelete.type !== 'equipment') return;

    setIsSubmitting(true);
    try {
      const { error } = await medicalEquipmentService.delete(itemToDelete.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Equipment deleted successfully');
        loadEquipment();
      }
    } catch (error) {
      toast.error('Failed to delete equipment');
    } finally {
      setIsSubmitting(false);
      setShowDeleteEquipmentDialog(false);
      setItemToDelete(null);
    }
  };

  // Handle add ambulance
  const handleAddAmbulance = async () => {
    if (!ambulanceForm.ambulance_vehicle_number.trim()) {
      toast.error('Please enter vehicle number');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await ambulanceService.create({
        ambulance_vehicle_number: ambulanceForm.ambulance_vehicle_number,
        hospital_id: selectedHospital?.hospital_id || null,
        status: ambulanceForm.status,
        current_location: ambulanceForm.current_location || null,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Ambulance added successfully');
        setShowAddAmbulanceDialog(false);
        resetAmbulanceForm();
        loadAmbulances();
      }
    } catch (error) {
      toast.error('Failed to add ambulance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit ambulance
  const handleEditAmbulance = async () => {
    if (!selectedAmbulance) return;
    if (!ambulanceForm.ambulance_vehicle_number.trim()) {
      toast.error('Please enter vehicle number');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await ambulanceService.update(selectedAmbulance.ambulance_vehicle_number, {
        hospital_id: selectedHospital?.hospital_id || null,
        status: ambulanceForm.status,
        current_location: ambulanceForm.current_location || null,
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Ambulance updated successfully');
        setShowEditAmbulanceDialog(false);
        setSelectedAmbulance(null);
        resetAmbulanceForm();
        loadAmbulances();
      }
    } catch (error) {
      toast.error('Failed to update ambulance');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete ambulance
  const handleDeleteAmbulance = async () => {
    if (!itemToDelete || itemToDelete.type !== 'ambulance') return;

    setIsSubmitting(true);
    try {
      const { error } = await ambulanceService.delete(itemToDelete.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Ambulance deleted successfully');
        loadAmbulances();
      }
    } catch (error) {
      toast.error('Failed to delete ambulance');
    } finally {
      setIsSubmitting(false);
      setShowDeleteAmbulanceDialog(false);
      setItemToDelete(null);
    }
  };

  // Open edit equipment dialog
  const openEditEquipmentDialog = (eq: MedicalEquipment) => {
    setSelectedEquipment(eq);
    setEquipmentForm({
      equipment_id: eq.equipment_id || '',
      equipment_name: eq.equipment_name || '',
      equipment_category: eq.equipment_category || '',
      condition_status: eq.condition_status || 'operational',
      hospital_id: eq.hospital_id || '',
      equipment_location: eq.equipment_location || '',
      manufacturer: eq.manufacturer || '',
      model_number: eq.model_number || '',
      last_serviced_date: eq.last_serviced_date || '',
    });
    if (eq.hospital) {
      setSelectedHospital(eq.hospital);
    }
    setShowEditEquipmentDialog(true);
  };

  // Open edit ambulance dialog
  const openEditAmbulanceDialog = (amb: Ambulance) => {
    setSelectedAmbulance(amb);
    setAmbulanceForm({
      ambulance_vehicle_number: amb.ambulance_vehicle_number,
      hospital_id: amb.hospital_id || '',
      status: amb.status || 'available',
      current_location: amb.current_location || '',
    });
    if (amb.hospital) {
      setSelectedHospital(amb.hospital);
    }
    setShowEditAmbulanceDialog(true);
  };

  // Open delete equipment confirmation
  const openDeleteEquipmentDialog = (eq: MedicalEquipment) => {
    setItemToDelete({
      type: 'equipment',
      id: eq.equipment_uuid,
      name: eq.equipment_name || 'Unknown Equipment',
    });
    setShowDeleteEquipmentDialog(true);
  };

  // Open delete ambulance confirmation
  const openDeleteAmbulanceDialog = (amb: Ambulance) => {
    setItemToDelete({
      type: 'ambulance',
      id: amb.ambulance_vehicle_number,
      name: amb.ambulance_vehicle_number,
    });
    setShowDeleteAmbulanceDialog(true);
  };

  // Open view equipment dialog
  const openViewEquipmentDialog = (eq: MedicalEquipment) => {
    setViewEquipment(eq);
    setShowViewEquipmentDialog(true);
  };

  // Open view ambulance dialog
  const openViewAmbulanceDialog = (amb: Ambulance) => {
    setViewAmbulance(amb);
    setShowViewAmbulanceDialog(true);
  };

  // Get condition badge color
  const getConditionColor = (status: string | null) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const found = EQUIPMENT_CONDITION_OPTIONS.find(opt => opt.value === status.toLowerCase());
    return found?.color || 'bg-slate-100 text-slate-700';
  };

  // Get ambulance status badge color
  const getAmbulanceStatusColor = (status: string | null) => {
    if (!status) return 'bg-slate-100 text-slate-700';
    const found = AMBULANCE_STATUS_OPTIONS.find(opt => opt.value === status.toLowerCase());
    return found?.color || 'bg-slate-100 text-slate-700';
  };

  // Hospital selector component
  const HospitalSelector = () => (
    <div className="space-y-2">
      <Label>Hospital</Label>
      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search hospital..."
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
        <div className="border rounded-lg divide-y max-h-40 overflow-auto bg-white shadow-lg z-50 relative">
          {hospitalResults.map((hospital) => (
            <button
              key={hospital.hospital_id}
              className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 text-left"
              onClick={() => {
                setSelectedHospital(hospital);
                setHospitalSearch('');
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
        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border">
          <Building2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{selectedHospital.name}</span>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-6 px-2"
            onClick={() => {
              setSelectedHospital(null);
              setHospitalSearch('');
            }}
          >
            Change
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Infrastructure Management</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor and manage hospital equipment and ambulances
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { loadEquipment(); loadAmbulances(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="equipment" className="gap-2">
            <Cog className="h-4 w-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="ambulances" className="gap-2">
            <Truck className="h-4 w-4" />
            Ambulances
          </TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4 mt-4">
          {/* Summary Cards - Clickable for filtering */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className={cn(
                'border-l-4 border-l-blue-500 cursor-pointer transition-all hover:shadow-md',
                equipmentFilter === 'all' && 'ring-2 ring-blue-300 bg-blue-50/50 dark:bg-blue-950/20'
              )}
              onClick={() => setEquipmentFilter('all')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Equipment</p>
                    <p className="mt-1 text-3xl font-bold text-slate-800 dark:text-white">{equipmentStats.total}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3 dark:bg-blue-950/30">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                'border-l-4 border-l-green-500 cursor-pointer transition-all hover:shadow-md',
                equipmentFilter === 'operational' && 'ring-2 ring-green-300 bg-green-50/50 dark:bg-green-950/20'
              )}
              onClick={() => setEquipmentFilter('operational')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Operational</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{equipmentStats.operational}</p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-3 dark:bg-green-950/30">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                'border-l-4 border-l-amber-500 cursor-pointer transition-all hover:shadow-md',
                equipmentFilter === 'maintenance' && 'ring-2 ring-amber-300 bg-amber-50/50 dark:bg-amber-950/20'
              )}
              onClick={() => setEquipmentFilter('maintenance')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Under Maintenance</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{equipmentStats.maintenance}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
                    <Wrench className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                'border-l-4 border-l-red-500 cursor-pointer transition-all hover:shadow-md',
                equipmentFilter === 'outOfService' && 'ring-2 ring-red-300 bg-red-50/50 dark:bg-red-950/20'
              )}
              onClick={() => setEquipmentFilter('outOfService')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Out of Service</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">{equipmentStats.outOfService}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/30">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, ID, category, manufacturer, model..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={equipmentCategoryFilter}
              onValueChange={setEquipmentCategoryFilter}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter indicator */}
          {(equipmentFilter !== 'all' || equipmentCategoryFilter !== 'all' || equipmentSearch) && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-100 p-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <span>Filtered:</span>
              {equipmentFilter !== 'all' && (
                <Badge variant="secondary" className="capitalize">
                  {equipmentFilter === 'operational' ? 'Operational' : 
                   equipmentFilter === 'maintenance' ? 'Under Maintenance' : 'Out of Service'}
                </Badge>
              )}
              {equipmentCategoryFilter !== 'all' && (
                <Badge variant="secondary">{equipmentCategoryFilter}</Badge>
              )}
              {equipmentSearch && (
                <Badge variant="secondary">Search: "{equipmentSearch}"</Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 ml-auto"
                onClick={() => {
                  setEquipmentFilter('all');
                  setEquipmentCategoryFilter('all');
                  setEquipmentSearch('');
                }}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          )}

          {/* Equipment List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">
                Medical Equipment 
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({filteredEquipment.length} {filteredEquipment.length === 1 ? 'record' : 'records'})
                </span>
              </CardTitle>
              <Button size="sm" onClick={() => { resetEquipmentForm(); setShowAddEquipmentDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingEquipment ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-3 text-slate-500">Loading equipment...</span>
                </div>
              ) : equipmentError ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-red-400" />
                  <p className="font-medium text-red-600">Error Loading Equipment</p>
                  <p className="text-sm text-slate-500 mt-1">{equipmentError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-4"
                    onClick={loadEquipment}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredEquipment.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Cog className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No equipment found</p>
                  <p className="text-sm">
                    {equipmentFilter !== 'all' || equipmentCategoryFilter !== 'all' || equipmentSearch
                      ? 'Try adjusting your filters or search'
                      : 'Click "Add Equipment" to add new equipment'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedEquipment).map(([category, items]) => (
                    <div key={category} className="border rounded-lg overflow-hidden">
                      {/* Category Header */}
                      <div className={cn(
                        'px-4 py-2 flex items-center justify-between border-b',
                        CATEGORY_COLORS[category] || 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                      )}>
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4" />
                          <span className={cn('font-semibold', CATEGORY_TEXT_COLORS[category] || 'text-slate-800 dark:text-slate-100')}>
                            {category}
                          </span>
                        </div>
                        <Badge variant="secondary" className="bg-white/70 dark:bg-slate-700 dark:text-slate-100">
                          {items.length}
                        </Badge>
                      </div>
                      
                      {/* Equipment Items */}
                      <div className="divide-y bg-white dark:bg-slate-950">
                        {items.map((eq) => (
                          <div 
                            key={eq.equipment_uuid} 
                            className="flex items-center justify-between p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                          >
                            <div className="flex-1 min-w-0 mr-4">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium text-slate-800 dark:text-slate-100">{eq.equipment_name}</p>
                                {eq.equipment_id && (
                                  <span className="text-xs font-mono text-slate-400 shrink-0">[{eq.equipment_id}]</span>
                                )}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                {eq.hospital && (
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {eq.hospital.name}
                                  </span>
                                )}
                                {eq.equipment_location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {eq.equipment_location}
                                  </span>
                                )}
                                {eq.last_serviced_date && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {format(new Date(eq.last_serviced_date), 'MMM dd, yyyy')}
                                  </span>
                                )}
                                {eq.manufacturer && (
                                  <span className="hidden md:inline">
                                    {eq.manufacturer}{eq.model_number && ` - ${eq.model_number}`}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge 
                                variant="outline" 
                                className={cn('text-xs capitalize', getConditionColor(eq.condition_status))}
                              >
                                {eq.condition_status?.replace(/_/g, ' ') || 'N/A'}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800"
                                onClick={() => openViewEquipmentDialog(eq)}
                                title="View Details"
                              >
                                <Eye className="h-3.5 w-3.5 text-slate-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-blue-50"
                                onClick={() => openEditEquipmentDialog(eq)}
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-red-50"
                                onClick={() => openDeleteEquipmentDialog(eq)}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ambulances Tab */}
        <TabsContent value="ambulances" className="space-y-4 mt-4">
          {/* Summary Cards - Clickable for filtering */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className={cn(
                'border-l-4 border-l-blue-500 cursor-pointer transition-all hover:shadow-md',
                ambulanceFilter === 'all' && 'ring-2 ring-blue-300 bg-blue-50/50'
              )}
              onClick={() => setAmbulanceFilter('all')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Total Ambulances</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{ambulanceStats.total}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <Ambulance className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                'border-l-4 border-l-green-500 cursor-pointer transition-all hover:shadow-md',
                ambulanceFilter === 'available' && 'ring-2 ring-green-300 bg-green-50/50'
              )}
              onClick={() => setAmbulanceFilter('available')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Available</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{ambulanceStats.available}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={cn(
                'border-l-4 border-l-red-500 cursor-pointer transition-all hover:shadow-md',
                ambulanceFilter === 'maintenance' && 'ring-2 ring-red-300 bg-red-50/50'
              )}
              onClick={() => setAmbulanceFilter('maintenance')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Under Maintenance</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{ambulanceStats.maintenance}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50">
                    <Wrench className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by vehicle number or location..."
                value={ambulanceSearch}
                onChange={(e) => setAmbulanceSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter indicator */}
          {(ambulanceFilter !== 'all' || ambulanceSearch) && (
            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 p-2 rounded-lg flex-wrap">
              <span>Filtered:</span>
              {ambulanceFilter !== 'all' && (
                <Badge variant="secondary" className="capitalize">
                  {ambulanceFilter === 'available' ? 'Available' : 'Under Maintenance'}
                </Badge>
              )}
              {ambulanceSearch && (
                <Badge variant="secondary">Search: "{ambulanceSearch}"</Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 ml-auto"
                onClick={() => {
                  setAmbulanceFilter('all');
                  setAmbulanceSearch('');
                }}
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          )}

          {/* Ambulances List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">
                Ambulances
                <span className="text-sm font-normal text-slate-500 ml-2">
                  ({filteredAmbulances.length} {filteredAmbulances.length === 1 ? 'record' : 'records'})
                </span>
              </CardTitle>
              <Button size="sm" onClick={() => { resetAmbulanceForm(); setShowAddAmbulanceDialog(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Ambulance
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoadingAmbulances ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredAmbulances.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Ambulance className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium">No ambulances found</p>
                  <p className="text-sm">
                    {ambulanceFilter !== 'all' || ambulanceSearch
                      ? 'Try adjusting your filters or search'
                      : 'Click "Add Ambulance" to add new ambulance'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredAmbulances.map((amb) => (
                    <div 
                      key={amb.ambulance_vehicle_number} 
                      className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 shrink-0">
                          <Ambulance className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-mono font-medium text-slate-800">{amb.ambulance_vehicle_number}</p>
                          <div className="flex items-center gap-4 mt-0.5 text-xs text-slate-500">
                            {amb.hospital && (
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {amb.hospital.name}
                              </span>
                            )}
                            {amb.current_location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {amb.current_location}
                              </span>
                            )}
                            {amb.updated_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(amb.updated_at), 'MMM dd, yyyy HH:mm')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs capitalize', getAmbulanceStatusColor(amb.status))}
                        >
                          {amb.status?.replace(/_/g, ' ') || 'N/A'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-slate-100"
                          onClick={() => openViewAmbulanceDialog(amb)}
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5 text-slate-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-blue-50"
                          onClick={() => openEditAmbulanceDialog(amb)}
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5 text-blue-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-red-50"
                          onClick={() => openDeleteAmbulanceDialog(amb)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Equipment Dialog */}
      <Dialog open={showAddEquipmentDialog} onOpenChange={setShowAddEquipmentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Equipment</DialogTitle>
            <DialogDescription>Add new medical equipment to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Equipment ID</Label>
                <Input
                  placeholder="e.g., EQ-001"
                  value={equipmentForm.equipment_id}
                  onChange={(e) => setEquipmentForm(prev => ({ ...prev, equipment_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Equipment Name *</Label>
                <Input
                  placeholder="e.g., MRI Scanner"
                  value={equipmentForm.equipment_name}
                  onChange={(e) => setEquipmentForm(prev => ({ ...prev, equipment_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={equipmentForm.equipment_category}
                  onValueChange={(value) => setEquipmentForm(prev => ({ ...prev, equipment_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={equipmentForm.condition_status}
                  onValueChange={(value) => setEquipmentForm(prev => ({ ...prev, condition_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CONDITION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <HospitalSelector />
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Room 101, Block A"
                value={equipmentForm.equipment_location}
                onChange={(e) => setEquipmentForm(prev => ({ ...prev, equipment_location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input
                  placeholder="e.g., Siemens"
                  value={equipmentForm.manufacturer}
                  onChange={(e) => setEquipmentForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Model Number</Label>
                <Input
                  placeholder="e.g., MAGNETOM"
                  value={equipmentForm.model_number}
                  onChange={(e) => setEquipmentForm(prev => ({ ...prev, model_number: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Serviced Date</Label>
              <Input
                type="date"
                value={equipmentForm.last_serviced_date}
                onChange={(e) => setEquipmentForm(prev => ({ ...prev, last_serviced_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddEquipmentDialog(false)}>Cancel</Button>
            <Button onClick={handleAddEquipment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={showEditEquipmentDialog} onOpenChange={setShowEditEquipmentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>Update equipment details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Equipment ID</Label>
                <Input
                  placeholder="e.g., EQ-001"
                  value={equipmentForm.equipment_id}
                  onChange={(e) => setEquipmentForm(prev => ({ ...prev, equipment_id: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Equipment Name *</Label>
                <Input
                  placeholder="e.g., MRI Scanner"
                  value={equipmentForm.equipment_name}
                  onChange={(e) => setEquipmentForm(prev => ({ ...prev, equipment_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={equipmentForm.equipment_category}
                  onValueChange={(value) => setEquipmentForm(prev => ({ ...prev, equipment_category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select
                  value={equipmentForm.condition_status}
                  onValueChange={(value) => setEquipmentForm(prev => ({ ...prev, condition_status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {EQUIPMENT_CONDITION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <HospitalSelector />
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                placeholder="e.g., Room 101, Block A"
                value={equipmentForm.equipment_location}
                onChange={(e) => setEquipmentForm(prev => ({ ...prev, equipment_location: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Manufacturer</Label>
                <Input
                  placeholder="e.g., Siemens"
                  value={equipmentForm.manufacturer}
                  onChange={(e) => setEquipmentForm(prev => ({ ...prev, manufacturer: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Model Number</Label>
                <Input
                  placeholder="e.g., MAGNETOM"
                  value={equipmentForm.model_number}
                  onChange={(e) => setEquipmentForm(prev => ({ ...prev, model_number: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Last Serviced Date</Label>
              <Input
                type="date"
                value={equipmentForm.last_serviced_date}
                onChange={(e) => setEquipmentForm(prev => ({ ...prev, last_serviced_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditEquipmentDialog(false)}>Cancel</Button>
            <Button onClick={handleEditEquipment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Ambulance Dialog */}
      <Dialog open={showAddAmbulanceDialog} onOpenChange={setShowAddAmbulanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Ambulance</DialogTitle>
            <DialogDescription>Add new ambulance to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Number *</Label>
              <Input
                placeholder="e.g., MH-12-AB-1234"
                value={ambulanceForm.ambulance_vehicle_number}
                onChange={(e) => setAmbulanceForm(prev => ({ ...prev, ambulance_vehicle_number: e.target.value }))}
              />
            </div>
            <HospitalSelector />
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={ambulanceForm.status}
                onValueChange={(value) => setAmbulanceForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {AMBULANCE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Location</Label>
              <Input
                placeholder="e.g., Main Hospital, Solapur"
                value={ambulanceForm.current_location}
                onChange={(e) => setAmbulanceForm(prev => ({ ...prev, current_location: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAmbulanceDialog(false)}>Cancel</Button>
            <Button onClick={handleAddAmbulance} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Ambulance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Ambulance Dialog */}
      <Dialog open={showEditAmbulanceDialog} onOpenChange={setShowEditAmbulanceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Ambulance</DialogTitle>
            <DialogDescription>Update ambulance details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input
                value={ambulanceForm.ambulance_vehicle_number}
                disabled
                className="bg-slate-50"
              />
            </div>
            <HospitalSelector />
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={ambulanceForm.status}
                onValueChange={(value) => setAmbulanceForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {AMBULANCE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Location</Label>
              <Input
                placeholder="e.g., Main Hospital, Solapur"
                value={ambulanceForm.current_location}
                onChange={(e) => setAmbulanceForm(prev => ({ ...prev, current_location: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditAmbulanceDialog(false)}>Cancel</Button>
            <Button onClick={handleEditAmbulance} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Ambulance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Equipment Confirmation Dialog */}
      <AlertDialog open={showDeleteEquipmentDialog} onOpenChange={setShowDeleteEquipmentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Equipment
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>&quot;{itemToDelete?.name}&quot;</strong>? This action cannot be undone.
              <br /><br />
              <span className="text-amber-600 font-medium">Warning:</span> This will permanently remove the equipment record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteEquipment}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Ambulance Confirmation Dialog */}
      <AlertDialog open={showDeleteAmbulanceDialog} onOpenChange={setShowDeleteAmbulanceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Delete Ambulance
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ambulance <strong>&quot;{itemToDelete?.name}&quot;</strong>? This action cannot be undone.
              <br /><br />
              <span className="text-amber-600 font-medium">Warning:</span> This will permanently remove the ambulance record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteAmbulance}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Equipment Dialog */}
      <Dialog open={showViewEquipmentDialog} onOpenChange={setShowViewEquipmentDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Cog className="h-5 w-5 text-primary" />
              Equipment Details
            </DialogTitle>
          </DialogHeader>
          {viewEquipment && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-500">Equipment UUID</span>
                <span className="font-mono text-sm">{viewEquipment.equipment_uuid}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Equipment ID</span>
                  <p className="font-medium">{viewEquipment.equipment_id || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Equipment Name</span>
                  <p className="font-medium">{viewEquipment.equipment_name || 'N/A'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Category</span>
                  <Badge variant="outline" className="mt-1">
                    {viewEquipment.equipment_category || 'Not specified'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-slate-500">Condition Status</span>
                  <Badge 
                    variant="outline" 
                    className={cn('mt-1 capitalize', getConditionColor(viewEquipment.condition_status))}
                  >
                    {viewEquipment.condition_status?.replace(/_/g, ' ') || 'N/A'}
                  </Badge>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Location & Hospital
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">Hospital</span>
                    <p className="text-sm">{viewEquipment.hospital?.name || viewEquipment.hospital_id || 'Not assigned'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">Equipment Location</span>
                    <p className="text-sm">{viewEquipment.equipment_location || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Manufacturer Details
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">Manufacturer</span>
                    <p className="text-sm">{viewEquipment.manufacturer || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">Model Number</span>
                    <p className="text-sm">{viewEquipment.model_number || 'Not specified'}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Dates
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">Last Serviced</span>
                    <p className="text-sm">
                      {viewEquipment.last_serviced_date 
                        ? format(new Date(viewEquipment.last_serviced_date), 'MMM dd, yyyy')
                        : 'Never'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-500">Added Date</span>
                    <p className="text-sm">
                      {viewEquipment.added_date 
                        ? format(new Date(viewEquipment.added_date), 'MMM dd, yyyy')
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Staff Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 p-3 bg-green-50 rounded-lg">
                    <span className="text-xs font-medium text-green-700">Added By</span>
                    {viewEquipment.added_by_staff ? (
                      <>
                        <p className="text-sm font-medium">{viewEquipment.added_by_staff.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">
                          ID: {viewEquipment.added_by_staff.staff_id || 'N/A'}
                        </p>
                        {viewEquipment.added_by_staff.designation && (
                          <p className="text-xs text-slate-500">{viewEquipment.added_by_staff.designation}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Not recorded</p>
                    )}
                  </div>
                  <div className="space-y-1 p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs font-medium text-blue-700">Updated By</span>
                    {viewEquipment.updated_by_staff ? (
                      <>
                        <p className="text-sm font-medium">{viewEquipment.updated_by_staff.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">
                          ID: {viewEquipment.updated_by_staff.staff_id || 'N/A'}
                        </p>
                        {viewEquipment.updated_by_staff.designation && (
                          <p className="text-xs text-slate-500">{viewEquipment.updated_by_staff.designation}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">Not recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setShowViewEquipmentDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowViewEquipmentDialog(false);
              if (viewEquipment) openEditEquipmentDialog(viewEquipment);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Equipment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Ambulance Dialog */}
      <Dialog open={showViewAmbulanceDialog} onOpenChange={setShowViewAmbulanceDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Ambulance Details
            </DialogTitle>
          </DialogHeader>
          {viewAmbulance && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1 min-h-0">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Ambulance className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-lg">{viewAmbulance.ambulance_vehicle_number}</p>
                    <p className="text-xs text-slate-500">Vehicle Number</p>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn('text-sm capitalize', getAmbulanceStatusColor(viewAmbulance.status))}
                >
                  {viewAmbulance.status?.replace(/_/g, ' ') || 'N/A'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Hospital
                  </span>
                  <p className="font-medium">{viewAmbulance.hospital?.name || viewAmbulance.hospital_id || 'Not assigned'}</p>
                </div>
                <div className="space-y-1 p-3 bg-slate-50 rounded-lg">
                  <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Current Location
                  </span>
                  <p className="font-medium">{viewAmbulance.current_location || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Last Updated
                </h4>
                <p className="text-sm">
                  {viewAmbulance.updated_at 
                    ? format(new Date(viewAmbulance.updated_at), 'MMM dd, yyyy HH:mm')
                    : 'Never updated'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="shrink-0 border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setShowViewAmbulanceDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setShowViewAmbulanceDialog(false);
              if (viewAmbulance) openEditAmbulanceDialog(viewAmbulance);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Ambulance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
