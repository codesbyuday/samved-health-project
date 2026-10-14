'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
import { StaffMember, StaffType, StaffStatus } from '@/types';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Stethoscope,
  Heart,
  FlaskConical,
  Pill,
  Settings,
  Users,
  Filter,
  Download,
  Eye,
  EyeOff,
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  AlertCircle,
  Copy,
  Check,
  Key,
  ShieldCheck,
  RefreshCw,
  IndianRupee,
  Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRBAC } from '@/hooks/use-rbac';
import { toast } from 'sonner';

const getApiBaseUrl = () => {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
  return base.endsWith('/api/v1') ? base : `${base}/api/v1`;
};
const API_BASE_URL = getApiBaseUrl();

// Roles that can log into the hospital portal
const PORTAL_ACCESSIBLE_ROLES: StaffType[] = [
  'admin',
  'doctor',
  'nurse',
  'technician',
  'pharmacist',
  'receptionist',
  'lab_staff',
];

export const DOCTOR_SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Obstetrics & Gynecology',
  'Neurology',
  'Dermatology',
  'Pulmonology',
  'Psychiatry',
  'Endocrinology',
  'Gastroenterology',
  'Ophthalmology',
];

// All staff types with icons and labels
const staffTypeConfig: Record<
  StaffType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  doctor: {
    label: 'Doctors',
    icon: <Stethoscope className="h-4 w-4" />,
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/50',
  },
  nurse: {
    label: 'Nurses',
    icon: <Heart className="h-4 w-4" />,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/50',
  },
  technician: {
    label: 'Technicians',
    icon: <FlaskConical className="h-4 w-4" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50',
  },
  pharmacist: {
    label: 'Pharmacists',
    icon: <Pill className="h-4 w-4" />,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/50',
  },
  admin: {
    label: 'Admin Staff',
    icon: <Settings className="h-4 w-4" />,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/50',
  },
  receptionist: {
    label: 'Receptionists',
    icon: <Users className="h-4 w-4" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/50',
  },
  lab_staff: {
    label: 'Lab Staff',
    icon: <FlaskConical className="h-4 w-4" />,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/50',
  },
  driver: {
    label: 'Drivers',
    icon: <Truck className="h-4 w-4" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/50',
  },
  support_staff: {
    label: 'Support Staff',
    icon: <Users className="h-4 w-4" />,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700/50',
  },
  support: {
    label: 'Support Staff',
    icon: <Users className="h-4 w-4" />,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700/50',
  },
};

const statusConfig: Record<StaffStatus, { label: string; color: string }> = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  },
  'on-leave': {
    label: 'On Leave',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  },
  inactive: {
    label: 'Inactive',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400',
  },
  suspended: {
    label: 'Suspended',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  },
};

const defaultDepartments = [
  'General Medicine',
  'Emergency',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Obstetrics & Gynecology',
  'Neurology',
  'Pharmacy',
  'Laboratory',
  'Administration',
  'Transport & Ambulance',
  'Housekeeping & Support',
];

interface GeneratedCredentials {
  name: string;
  role: string;
  staffId: string;
  email: string;
  password: string;
}

export default function StaffManagement() {
  const { hospitalId, user } = useRBAC();
  const currentHospitalId = hospitalId || user?.hospital_id || 'HOSP001';

  const [activeTab, setActiveTab] = useState<StaffType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCredentialsDialog, setShowCredentialsDialog] = useState(false);
  const [showGrantCredsDialog, setShowGrantCredsDialog] = useState(false);

  // Grant credentials to existing staff state
  const [grantTargetStaff, setGrantTargetStaff] = useState<any | null>(null);
  const [grantFormData, setGrantFormData] = useState({ email: '', password: '' });
  const [grantSubmitting, setGrantSubmitting] = useState(false);
  const [showGrantPassword, setShowGrantPassword] = useState(false);

  // Selected staff and form data
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({
    name: '',
    role: 'doctor',
    designation: 'Resident Medical Officer',
    department: 'General Medicine',
    phone: '',
    email: '',
    address: '',
    shift: 'morning',
    status: 'active',
    salary: 45000,
    specialization: 'General Medicine',
    consultation_time: 15,
    max_patients_per_day: 30,
    qualification: 'MBBS',
    experience: 2,
    emergency_contact: '',
    generate_credentials: true,
    password: '',
  });

  const [generatedCreds, setGeneratedCreds] = useState<GeneratedCredentials | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch staff strictly scoped to currently logged-in hospital
  const loadStaff = useCallback(async () => {
    if (!currentHospitalId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/${currentHospitalId}/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      } else {
        toast.error('Failed to load hospital staff members');
      }
    } catch (err) {
      console.error('Failed to fetch hospital staff:', err);
      toast.error('Unable to connect to hospital staff API');
    } finally {
      setLoading(false);
    }
  }, [currentHospitalId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  // Derived unique departments
  const availableDepartments = useMemo(() => {
    const fromStaff = staffList.map((s) => s.department).filter(Boolean);
    return Array.from(new Set([...defaultDepartments, ...fromStaff]));
  }, [staffList]);

  // Filter staff
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const staffRole = (staff.role || '').toLowerCase();
      const matchesTab = activeTab === 'all' || staffRole === activeTab.toLowerCase();
      const matchesSearch =
        (staff.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.staff_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (staff.phone || '').includes(searchQuery) ||
        (staff.department || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment =
        departmentFilter === 'all' || staff.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;

      return matchesTab && matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [staffList, activeTab, searchQuery, departmentFilter, statusFilter]);

  // Calculate summary stats
  const staffStats = useMemo(() => {
    const stats: Record<string, number> = {
      total: staffList.length,
      doctors: staffList.filter((s) => (s.role || '').toLowerCase() === 'doctor').length,
      nurses: staffList.filter((s) => (s.role || '').toLowerCase() === 'nurse').length,
      technicians: staffList.filter((s) => (s.role || '').toLowerCase() === 'technician').length,
      pharmacists: staffList.filter((s) => (s.role || '').toLowerCase() === 'pharmacist').length,
      admin: staffList.filter((s) => (s.role || '').toLowerCase() === 'admin').length,
      receptionist: staffList.filter((s) => (s.role || '').toLowerCase() === 'receptionist').length,
      lab_staff: staffList.filter((s) => (s.role || '').toLowerCase() === 'lab_staff').length,
      driver: staffList.filter((s) => (s.role || '').toLowerCase() === 'driver').length,
      support_staff: staffList.filter((s) =>
        ['support_staff', 'support'].includes((s.role || '').toLowerCase())
      ).length,
      active: staffList.filter((s) => (s.status || '').toLowerCase() === 'active').length,
    };
    return stats;
  }, [staffList]);

  // Check if role allows portal credentials
  const isPortalEligibleRole = useMemo(() => {
    return PORTAL_ACCESSIBLE_ROLES.includes(formData.role as StaffType);
  }, [formData.role]);

  // Auto-generate password helper
  const handleAutoGeneratePassword = () => {
    const randomChars = Math.random().toString(36).substring(2, 7);
    const newPwd = `Staff@${randomChars}`;
    setFormData((prev: any) => ({ ...prev, password: newPwd }));
  };

  // Factory for initial form data
  const getInitialFormData = () => {
    const randomChars = Math.random().toString(36).substring(2, 7);
    return {
      name: '',
      role: 'doctor',
      designation: 'Resident Medical Officer',
      department: 'General Medicine',
      phone: '',
      email: '',
      address: '',
      shift: 'morning',
      status: 'active',
      salary: 45000,
      specialization: 'General Medicine',
      consultation_time: 15,
      max_patients_per_day: 30,
      qualification: 'MBBS',
      experience: 2,
      emergency_contact: '',
      generate_credentials: true,
      password: `Staff@${randomChars}`,
    };
  };

  // Open add dialog with fresh clean state
  const openAddDialog = () => {
    setFormData(getInitialFormData());
    setShowAddDialog(true);
  };

  // Submit Add Staff
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Please enter name and phone number.');
      return;
    }

    if (formData.generate_credentials) {
      if (!isPortalEligibleRole) {
        toast.error('Portal credentials cannot be generated for driver or field staff.');
        return;
      }
      if (!formData.email) {
        toast.error('Email is required when generating portal login credentials.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/hospitals/${currentHospitalId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          experience: formData.experience ? parseInt(formData.experience) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to create staff' }));
        throw new Error(err.detail || 'Failed to create staff');
      }

      const createdStaff = await res.json();
      
      // Close dialog, reset form, and display toast
      setShowAddDialog(false);
      setFormData(getInitialFormData());
      toast.success(`Staff member ${createdStaff.name} registered successfully!`);
      loadStaff();

      if (createdStaff.credentials) {
        setGeneratedCreds({
          name: createdStaff.name,
          role: createdStaff.role,
          staffId: createdStaff.staff_id,
          email: createdStaff.credentials.email,
          password: createdStaff.credentials.password,
        });
        setTimeout(() => {
          setShowCredentialsDialog(true);
        }, 150);
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred while adding staff.');
    } finally {
      setSubmitting(false);
    }
  };

  // Grant credentials to existing staff member
  const openGrantCredsDialog = (staff: any) => {
    setGrantTargetStaff(staff);
    const randomChars = Math.random().toString(36).substring(2, 7);
    const sanitizedName = (staff.name || 'staff')
      .toLowerCase()
      .replace(/^(dr\.|dr|mr\.|mrs\.|ms\.)\s*/, '')
      .trim()
      .replace(/[^a-z0-9]/g, '.');
    const defaultEmail = staff.email || `${sanitizedName}@hospital.com`;
    setGrantFormData({
      email: defaultEmail,
      password: `Staff@${randomChars}`,
    });
    setShowGrantCredsDialog(true);
  };

  const handleGrantCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grantTargetStaff) return;
    if (!grantFormData.email) {
      toast.error('Email address is required to generate portal login credentials.');
      return;
    }

    setGrantSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/hospitals/${currentHospitalId}/staff/${grantTargetStaff.staff_uuid}/credentials`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(grantFormData),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Failed to generate portal credentials' }));
        throw new Error(err.detail || 'Failed to generate portal credentials');
      }

      const data = await res.json();
      setShowGrantCredsDialog(false);
      toast.success(`Portal login credentials generated for ${grantTargetStaff.name}!`);
      loadStaff();

      if (data.credentials) {
        setGeneratedCreds({
          name: data.name || grantTargetStaff.name,
          role: data.role || grantTargetStaff.role,
          staffId: data.staff_id || grantTargetStaff.staff_id,
          email: data.credentials.email,
          password: data.credentials.password,
        });
        setTimeout(() => {
          setShowCredentialsDialog(true);
        }, 150);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate portal credentials');
    } finally {
      setGrantSubmitting(false);
    }
  };

  // Submit Edit Staff
  const handleEditStaff = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/hospitals/${currentHospitalId}/staff/${selectedStaff.staff_uuid}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            role: formData.role,
            designation: formData.designation,
            department: formData.department,
            phone: formData.phone,
            address: formData.address,
            shift: formData.shift,
            status: formData.status,
            salary: formData.salary ? parseFloat(formData.salary) : null,
            specialization: formData.specialization,
          }),
        }
      );

      if (!res.ok) throw new Error('Failed to update staff member');
      toast.success('Staff member details updated successfully');
      setShowEditDialog(false);
      setSelectedStaff(null);
      loadStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update staff member');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Delete Staff
  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/hospitals/${currentHospitalId}/staff/${selectedStaff.staff_uuid}`,
        {
          method: 'DELETE',
        }
      );
      if (!res.ok) throw new Error('Failed to remove staff member');
      toast.success('Staff member removed successfully');
      setShowDeleteDialog(false);
      setSelectedStaff(null);
      loadStaff();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete staff member');
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (staff: any) => {
    setSelectedStaff(staff);
    setFormData({
      ...staff,
      salary: staff.salary || 0,
      specialization: staff.specialization || '',
    });
    setShowEditDialog(true);
  };

  // Open view dialog
  const openViewDialog = (staff: any) => {
    setSelectedStaff(staff);
    setShowViewDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (staff: any) => {
    setSelectedStaff(staff);
    setShowDeleteDialog(true);
  };

  // Copy credentials helper
  const handleCopyCredentials = () => {
    if (!generatedCreds) return;
    const credText = `SAMVED Healthcare Portal - Staff Login Credentials\nHospital ID: ${currentHospitalId}\nStaff ID: ${generatedCreds.staffId}\nName: ${generatedCreds.name} (${generatedCreds.role})\nLogin Email: ${generatedCreds.email}\nDefault Password: ${generatedCreds.password}\nPortal URL: ${window.location.origin}/login`;
    navigator.clipboard.writeText(credText);
    setCopied(true);
    toast.success('Login credentials copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Render staff type icon
  const renderStaffTypeIcon = (type: string) => {
    const config =
      staffTypeConfig[type as StaffType] || staffTypeConfig.support_staff;
    return React.cloneElement(config.icon as React.ReactElement, {
      className: cn('h-4 w-4', config.color),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Staff Management</h2>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-emerald-50 text-xs">
              {currentHospitalId} Scoped
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your hospital's staff, doctors, nurses, drivers, and portal credentials.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadStaff} disabled={loading} className="dark:border-slate-600 dark:text-white">
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={openAddDialog} className="bg-emerald-700 hover:bg-emerald-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-md dark:bg-slate-800 dark:border-slate-700',
            activeTab === 'all' && 'ring-2 ring-emerald-600'
          )}
          onClick={() => setActiveTab('all')}
        >
          <CardContent className="p-3 text-center">
            <Users className="h-6 w-6 mx-auto text-slate-600 dark:text-slate-400" />
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{staffStats.total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">All Staff</p>
          </CardContent>
        </Card>

        {Object.entries(staffTypeConfig)
          .filter(([t]) => t !== 'support')
          .map(([type, config]) => (
            <Card
              key={type}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md dark:bg-slate-800 dark:border-slate-700',
                activeTab === type && 'ring-2 ring-emerald-600'
              )}
              onClick={() => setActiveTab(type as StaffType)}
            >
              <CardContent className="p-3 text-center">
                <div className={cn('mx-auto w-fit p-2 rounded-lg', config.bgColor)}>
                  {renderStaffTypeIcon(type)}
                </div>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                  {staffStats[type] ?? 0}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{config.label}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Active Staff Progress */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Staff Ratio</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {staffStats.active} of {staffStats.total} ({staffStats.total > 0 ? Math.round((staffStats.active / staffStats.total) * 100) : 0}%)
            </span>
          </div>
          <Progress
            value={staffStats.total > 0 ? (staffStats.active / staffStats.total) * 100 : 0}
            className="h-2"
          />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search staff by name, staff ID, phone, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-[200px] dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700">
                <SelectItem value="all">All Departments</SelectItem>
                {availableDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[160px] dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg dark:text-white">Hospital Staff Directory</CardTitle>
              <CardDescription className="dark:text-slate-400">
                Showing {filteredStaff.length} personnel registered under hospital {currentHospitalId}
              </CardDescription>
            </div>
            <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-300">
              {activeTab === 'all' ? 'All Roles' : staffTypeConfig[activeTab as StaffType]?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700/50">
                  <TableHead className="font-semibold">Staff Member</TableHead>
                  <TableHead className="font-semibold">Staff ID</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Department</TableHead>
                  <TableHead className="font-semibold">Designation</TableHead>
                  <TableHead className="font-semibold">Portal Login</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Shift</TableHead>
                  <TableHead className="font-semibold text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
                        <p className="text-sm text-slate-500">Loading hospital staff records...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-base font-medium text-slate-700 dark:text-slate-200">
                          No staff members found for your hospital
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Click "Add Staff Member" above to register personnel and generate their credentials.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => {
                    const roleKey = (staff.role || 'support_staff').toLowerCase() as StaffType;
                    const typeConfig = staffTypeConfig[roleKey] || staffTypeConfig.support_staff;
                    const statusConf =
                      statusConfig[(staff.status || 'active').toLowerCase() as StaffStatus] ||
                      statusConfig.active;

                    const hasPortalLogin = !!staff.user_id;

                    return (
                      <TableRow key={staff.staff_uuid} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={cn('text-white', typeConfig.bgColor)}>
                                {getInitials(staff.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{staff.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{staff.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {staff.staff_id || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('gap-1', typeConfig.bgColor, typeConfig.color)}>
                            {typeConfig.icon}
                            <span className="capitalize">{staff.role}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm dark:text-slate-300">{staff.department}</TableCell>
                        <TableCell className="text-sm dark:text-slate-300">{staff.designation}</TableCell>
                        <TableCell>
                          {hasPortalLogin ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 gap-1 text-xs">
                              <Key className="w-3 h-3 text-emerald-700" />
                              Enabled
                            </Badge>
                          ) : !PORTAL_ACCESSIBLE_ROLES.includes(roleKey) ? (
                            <span className="text-xs text-slate-400 italic">No Portal Access</span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openGrantCredsDialog(staff)}
                              className="h-7 px-2 text-xs text-blue-700 border-blue-200 bg-blue-50/60 hover:bg-blue-100 hover:text-blue-800 gap-1 font-medium transition-colors"
                              title="Generate portal credentials for this staff member"
                            >
                              <Key className="w-3 h-3 text-blue-600" />
                              Grant Access
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConf.color}>
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize text-sm dark:text-slate-300">{staff.shift}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {PORTAL_ACCESSIBLE_ROLES.includes(roleKey) && !hasPortalLogin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => openGrantCredsDialog(staff)}
                                title="Grant Portal Access & Generate Credentials"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600"
                              onClick={() => openViewDialog(staff)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                              onClick={() => openEditDialog(staff)}
                              title="Edit Staff"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openDeleteDialog(staff)}
                              title="Delete Staff"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Register New Hospital Staff</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Add a staff member to your hospital facility and optionally provision their portal login credentials.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="dark:text-white">Full Name *</Label>
                <Input
                  required
                  placeholder="e.g. Dr. Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white">Staff Role / Category *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(v) => {
                    const isEligible = PORTAL_ACCESSIBLE_ROLES.includes(v as StaffType);
                    setFormData({
                      ...formData,
                      role: v,
                      generate_credentials: isEligible,
                    });
                  }}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-700 max-h-60">
                    {Object.entries(staffTypeConfig)
                      .filter(([t]) => t !== 'support')
                      .map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            <span>{config.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white">Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(v) => setFormData({ ...formData, department: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-700 max-h-60">
                    {availableDepartments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white">Designation *</Label>
                <Input
                  required
                  placeholder="e.g. Senior Medical Officer"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white">Phone Number *</Label>
                <Input
                  required
                  type="tel"
                  placeholder="e.g. +91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white">
                  Monthly Salary (₹)
                </Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="number"
                    placeholder="e.g. 60000"
                    className="pl-9"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>

              {formData.role === 'doctor' && (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="dark:text-white">Doctor Specialization *</Label>
                    <Select
                      value={formData.specialization || 'General Medicine'}
                      onValueChange={(v) => setFormData({ ...formData, specialization: v })}
                    >
                      <SelectTrigger className="bg-white dark:bg-slate-700">
                        <SelectValue placeholder="Select Specialization" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-slate-700 max-h-60">
                        {DOCTOR_SPECIALIZATIONS.map((spec) => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="dark:text-white">Avg. Consultation Time (Mins)</Label>
                    <Input
                      type="number"
                      placeholder="15"
                      value={formData.consultation_time || 15}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          consultation_time: parseInt(e.target.value) || 15,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="dark:text-white">Max Daily Patients</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={formData.max_patients_per_day || 30}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_patients_per_day: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="dark:text-white">Qualification</Label>
                <Input
                  placeholder="e.g. MBBS, MD, B.Sc Nursing"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white">Experience (Years)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={formData.experience || ''}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white">Work Shift</Label>
                <Select
                  value={formData.shift}
                  onValueChange={(v) => setFormData({ ...formData, shift: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-700">
                    <SelectItem value="morning">Morning (08:00 - 16:00)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (14:00 - 22:00)</SelectItem>
                    <SelectItem value="night">Night (22:00 - 08:00)</SelectItem>
                    <SelectItem value="rotational">Rotational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="dark:text-white">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-700">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="dark:text-white">Address</Label>
                <Input
                  placeholder="Residential address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>

            {/* Portal Credentials Section */}
            <div className="border rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 space-y-3 mt-4">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="generateCreds"
                  checked={formData.generate_credentials}
                  disabled={!isPortalEligibleRole}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, generate_credentials: !!checked })
                  }
                  className="mt-1"
                />
                <div className="space-y-1">
                  <Label
                    htmlFor="generateCreds"
                    className={cn(
                      'font-semibold text-sm cursor-pointer',
                      !isPortalEligibleRole && 'text-slate-400'
                    )}
                  >
                    Generate Portal Login Credentials for this Staff
                  </Label>
                  <p className="text-xs text-slate-500">
                    Creates an authentication profile so this staff member can log into the hospital portal.
                  </p>
                </div>
              </div>

              {!isPortalEligibleRole ? (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Cannot generate portal credentials for <strong>{formData.role}</strong>. Drivers and operational support staff do not have a dedicated clinical portal dashboard.
                  </span>
                </div>
              ) : formData.generate_credentials ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Login Email Address *</Label>
                    <Input
                      required={formData.generate_credentials}
                      type="email"
                      placeholder="staff.member@hospital.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Initial Password</Label>
                      <button
                        type="button"
                        onClick={handleAutoGeneratePassword}
                        className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Auto-generate
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pr-10 font-mono text-sm"
                        placeholder="Create or generate password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-emerald-700 hover:bg-emerald-800">
                {submitting ? 'Registering Staff...' : 'Save & Register Staff'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grant Credentials Dialog for Existing Staff */}
      <Dialog open={showGrantCredsDialog} onOpenChange={setShowGrantCredsDialog}>
        <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-1">
              <Key className="w-5 h-5" />
            </div>
            <DialogTitle className="dark:text-white">
              Grant Portal Access
            </DialogTitle>
            <DialogDescription className="dark:text-slate-400 text-xs">
              Generate credentials so {grantTargetStaff?.name} can log into the hospital portal.
            </DialogDescription>
          </DialogHeader>

          {grantTargetStaff && (
            <form onSubmit={handleGrantCredentials} className="space-y-4 py-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff Member:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{grantTargetStaff.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Staff ID:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{grantTargetStaff.staff_id || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Role / Department:</span>
                  <span className="capitalize text-emerald-700 font-medium">{grantTargetStaff.role} • {grantTargetStaff.department}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium dark:text-white">Portal Login Email *</Label>
                <Input
                  type="email"
                  required
                  placeholder="staff.email@hospital.com"
                  value={grantFormData.email}
                  onChange={(e) => setGrantFormData({ ...grantFormData, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium dark:text-white">Initial Password *</Label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomChars = Math.random().toString(36).substring(2, 7);
                      setGrantFormData(prev => ({ ...prev, password: `Staff@${randomChars}` }));
                    }}
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Auto-generate
                  </button>
                </div>
                <div className="relative">
                  <Input
                    type={showGrantPassword ? 'text' : 'password'}
                    required
                    value={grantFormData.password}
                    onChange={(e) => setGrantFormData({ ...grantFormData, password: e.target.value })}
                    className="pr-10 font-mono text-sm"
                    placeholder="Create or generate password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGrantPassword(!showGrantPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showGrantPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGrantCredsDialog(false)}
                  disabled={grantSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={grantSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {grantSubmitting ? 'Activating...' : 'Activate & Generate Credentials'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Credentials Generated Success Dialog */}
      <Dialog open={showCredentialsDialog} onOpenChange={setShowCredentialsDialog}>
        <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <DialogTitle className="text-center text-xl font-bold dark:text-white">
              Staff Added & Credentials Ready!
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              Please copy these login credentials and securely share them with the staff member.
            </DialogDescription>
          </DialogHeader>

          {generatedCreds && (
            <div className="space-y-4 py-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2 border text-sm">
                <div className="flex justify-between pb-1 border-b">
                  <span className="text-slate-500">Staff Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {generatedCreds.name}
                  </span>
                </div>
                <div className="flex justify-between pb-1 border-b">
                  <span className="text-slate-500">Staff ID:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {generatedCreds.staffId}
                  </span>
                </div>
                <div className="flex justify-between pb-1 border-b">
                  <span className="text-slate-500">Assigned Role:</span>
                  <span className="font-medium text-emerald-700 capitalize">
                    {generatedCreds.role}
                  </span>
                </div>
                <div className="flex justify-between pb-1 border-b">
                  <span className="text-slate-500">Login Email:</span>
                  <span className="font-mono font-medium text-blue-600">
                    {generatedCreds.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Default Password:</span>
                  <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {generatedCreds.password}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleCopyCredentials}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Credentials Copied!' : 'Copy Login Credentials'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCredentialsDialog(false)}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Staff Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Staff Member Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-6 py-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-white text-lg bg-emerald-700">
                    {getInitials(selectedStaff.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    {selectedStaff.name}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">{selectedStaff.designation}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">
                      {selectedStaff.role}
                    </Badge>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      {selectedStaff.status || 'Active'}
                    </Badge>
                    {selectedStaff.user_id && (
                      <Badge className="bg-emerald-600 text-white text-xs">
                        Portal Login Enabled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Staff ID:</span>
                    <span className="font-mono font-medium dark:text-white">
                      {selectedStaff.staff_id || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Department:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <IndianRupee className="h-4 w-4 text-emerald-600" />
                    <span className="text-slate-500">Monthly Salary:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      {selectedStaff.salary
                        ? `₹${Number(selectedStaff.salary).toLocaleString()}`
                        : 'Not Disclosed'}
                    </span>
                  </div>
                  {selectedStaff.specialization && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Specialization:</span>
                      <span className="font-medium dark:text-white">
                        {selectedStaff.specialization}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Shift Schedule:</span>
                    <span className="font-medium capitalize dark:text-white">
                      {selectedStaff.shift || 'Morning'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Email:</span>
                    <span className="font-medium dark:text-white">
                      {selectedStaff.email || 'No email attached'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Address:</span>
                    <span className="font-medium dark:text-white">
                      {selectedStaff.address || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Joined Date:</span>
                    <span className="font-medium dark:text-white">
                      {selectedStaff.joined_at
                        ? format(new Date(selectedStaff.joined_at), 'MMM dd, yyyy')
                        : 'Recent'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Portal Access Quick Action */}
              {PORTAL_ACCESSIBLE_ROLES.includes((selectedStaff.role || '').toLowerCase() as StaffType) && !selectedStaff.user_id && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-600" />
                      Portal Login Not Activated
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      This staff member is eligible for portal access. You can generate login credentials now.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 text-xs h-8"
                    onClick={() => {
                      setShowViewDialog(false);
                      openGrantCredsDialog(selectedStaff);
                    }}
                  >
                    <Key className="w-3.5 h-3.5 mr-1" /> Grant Portal Access
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Staff Details</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="dark:text-white">Full Name</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="dark:text-white">Designation</Label>
              <Input
                value={formData.designation || ''}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="dark:text-white">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(v) => setFormData({ ...formData, department: v })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="dark:text-white">Phone</Label>
              <Input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="dark:text-white">Monthly Salary (₹)</Label>
              <Input
                type="number"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </div>

            {formData.role === 'doctor' && (
              <div className="space-y-1.5 md:col-span-2">
                <Label className="dark:text-white">Doctor Specialization</Label>
                <Select
                  value={formData.specialization || 'General Medicine'}
                  onValueChange={(v) => setFormData({ ...formData, specialization: v })}
                >
                  <SelectTrigger className="bg-white dark:bg-slate-700">
                    <SelectValue placeholder="Select Specialization" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-700 max-h-60">
                    {DOCTOR_SPECIALIZATIONS.map((spec) => (
                      <SelectItem key={spec} value={spec}>
                        {spec}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="dark:text-white">Shift</Label>
              <Select
                value={formData.shift}
                onValueChange={(v) => setFormData({ ...formData, shift: v })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="rotational">Rotational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="dark:text-white">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="bg-white dark:bg-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="dark:text-white">Address</Label>
              <Input
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStaff} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Remove Staff Member?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to remove <strong>{selectedStaff?.name}</strong> from your hospital directory? This will also revoke any portal credentials they have.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStaff}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? 'Removing...' : 'Confirm Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
