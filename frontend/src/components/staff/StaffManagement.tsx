'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
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
import { staffMembers, departments } from '@/data/dummyData';
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
  Building2,
  Briefcase,
  GraduationCap,
  Award,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Staff type configuration
const staffTypeConfig: Record<StaffType, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  doctor: { 
    label: 'Doctors', 
    icon: <Stethoscope className="h-4 w-4" />, 
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-950/50' 
  },
  nurse: { 
    label: 'Nurses', 
    icon: <Heart className="h-4 w-4" />, 
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/50' 
  },
  technician: { 
    label: 'Technicians', 
    icon: <FlaskConical className="h-4 w-4" />, 
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/50' 
  },
  pharmacist: { 
    label: 'Pharmacists', 
    icon: <Pill className="h-4 w-4" />, 
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/50' 
  },
  admin: { 
    label: 'Admin Staff', 
    icon: <Settings className="h-4 w-4" />, 
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/50' 
  },
  support: { 
    label: 'Support Staff', 
    icon: <Users className="h-4 w-4" />, 
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-700/50' 
  },
};

// Status configuration
const statusConfig: Record<StaffStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' },
  'on-leave': { label: 'On Leave', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400' },
  inactive: { label: 'Inactive', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' },
};

// Empty staff template
const emptyStaff: Partial<StaffMember> = {
  employeeId: '',
  name: '',
  email: '',
  phone: '',
  staffType: 'doctor',
  designation: '',
  department: '',
  specialization: '',
  qualification: '',
  experience: 0,
  status: 'active',
  salary: 0,
  address: '',
  emergencyContact: '',
  shift: 'morning',
  workingDays: [],
};

export default function StaffManagement() {
  const [activeTab, setActiveTab] = useState<StaffType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Selected staff for operations
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<Partial<StaffMember>>(emptyStaff);
  
  // Local state for staff data (in a real app, this would come from an API)
  const [staffList, setStaffList] = useState<StaffMember[]>(staffMembers);

  // Filter staff based on active tab and filters
  const filteredStaff = useMemo(() => {
    return staffList.filter((staff) => {
      const matchesTab = activeTab === 'all' || staff.staffType === activeTab;
      const matchesSearch = 
        staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        staff.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = departmentFilter === 'all' || staff.department === departmentFilter;
      const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
      
      return matchesTab && matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [staffList, activeTab, searchQuery, departmentFilter, statusFilter]);

  // Calculate summary stats
  const staffStats = useMemo(() => {
    const stats = {
      total: staffList.length,
      doctors: staffList.filter(s => s.staffType === 'doctor').length,
      nurses: staffList.filter(s => s.staffType === 'nurse').length,
      technicians: staffList.filter(s => s.staffType === 'technician').length,
      pharmacists: staffList.filter(s => s.staffType === 'pharmacist').length,
      admin: staffList.filter(s => s.staffType === 'admin').length,
      support: staffList.filter(s => s.staffType === 'support').length,
      active: staffList.filter(s => s.status === 'active').length,
      onLeave: staffList.filter(s => s.status === 'on-leave').length,
    };
    return stats;
  }, [staffList]);

  // Handle add staff
  const handleAddStaff = () => {
    const newStaff: StaffMember = {
      id: `STF${String(staffList.length + 1).padStart(3, '0')}`,
      employeeId: formData.employeeId || `EMP${String(staffList.length + 1).padStart(3, '0')}`,
      name: formData.name || '',
      email: formData.email || '',
      phone: formData.phone || '',
      staffType: formData.staffType as StaffType || 'doctor',
      designation: formData.designation || '',
      department: formData.department || '',
      specialization: formData.specialization,
      qualification: formData.qualification || '',
      experience: formData.experience || 0,
      status: formData.status as StaffStatus || 'active',
      joiningDate: new Date(),
      salary: formData.salary || 0,
      address: formData.address || '',
      emergencyContact: formData.emergencyContact || '',
      shift: formData.shift as 'morning' | 'afternoon' | 'night' | 'rotational' || 'morning',
      workingDays: formData.workingDays || [],
    };
    setStaffList([...staffList, newStaff]);
    setShowAddDialog(false);
    setFormData(emptyStaff);
  };

  // Handle edit staff
  const handleEditStaff = () => {
    if (!selectedStaff) return;
    setStaffList(staffList.map(s => 
      s.id === selectedStaff.id ? { ...s, ...formData } as StaffMember : s
    ));
    setShowEditDialog(false);
    setSelectedStaff(null);
    setFormData(emptyStaff);
  };

  // Handle delete staff
  const handleDeleteStaff = () => {
    if (!selectedStaff) return;
    setStaffList(staffList.filter(s => s.id !== selectedStaff.id));
    setShowDeleteDialog(false);
    setSelectedStaff(null);
  };

  // Open edit dialog with staff data
  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData(staff);
    setShowEditDialog(true);
  };

  // Open view dialog
  const openViewDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setShowViewDialog(true);
  };

  // Open delete dialog
  const openDeleteDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setShowDeleteDialog(true);
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Render staff type icon with color
  const renderStaffTypeIcon = (type: StaffType) => {
    const config = staffTypeConfig[type];
    return React.cloneElement(config.icon as React.ReactElement, {
      className: cn("h-4 w-4", config.color)
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Staff Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage hospital staff, doctors, nurses, and other personnel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="dark:border-slate-600 dark:text-white">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => { setFormData(emptyStaff); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card 
          className={cn(
            "cursor-pointer transition-all hover:shadow-md dark:bg-slate-800 dark:border-slate-700",
            activeTab === 'all' && "ring-2 ring-emerald-600"
          )}
          onClick={() => setActiveTab('all')}
        >
          <CardContent className="p-3 text-center">
            <Users className="h-6 w-6 mx-auto text-slate-600 dark:text-slate-400" />
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{staffStats.total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Staff</p>
          </CardContent>
        </Card>
        {Object.entries(staffTypeConfig).map(([type, config]) => (
          <Card
            key={type}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md dark:bg-slate-800 dark:border-slate-700",
              activeTab === type && "ring-2 ring-emerald-600"
            )}
            onClick={() => setActiveTab(type as StaffType)}
          >
            <CardContent className="p-3 text-center">
              <div className={cn("mx-auto w-fit p-2 rounded-lg", config.bgColor)}>
                {renderStaffTypeIcon(type as StaffType)}
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                {staffStats[type as keyof typeof staffStats] as number}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{config.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Staff Progress */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active Staff</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {staffStats.active} of {staffStats.total} ({Math.round((staffStats.active / staffStats.total) * 100)}%)
            </span>
          </div>
          <Progress value={(staffStats.active / staffStats.total) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, ID, email, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-full md:w-[180px] dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-slate-600">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept} className="dark:text-white dark:focus:bg-slate-600">
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px] dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-slate-600">All Status</SelectItem>
                <SelectItem value="active" className="dark:text-white dark:focus:bg-slate-600">Active</SelectItem>
                <SelectItem value="on-leave" className="dark:text-white dark:focus:bg-slate-600">On Leave</SelectItem>
                <SelectItem value="inactive" className="dark:text-white dark:focus:bg-slate-600">Inactive</SelectItem>
                <SelectItem value="suspended" className="dark:text-white dark:focus:bg-slate-600">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg dark:text-white">Staff Directory</CardTitle>
              <CardDescription className="dark:text-slate-400">
                {filteredStaff.length} staff members found
              </CardDescription>
            </div>
            <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-300">
              {activeTab === 'all' ? 'All Staff' : staffTypeConfig[activeTab as StaffType]?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableHead className="font-semibold dark:text-slate-300">Employee</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">ID</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Type</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Department</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Designation</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Status</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Shift</TableHead>
                  <TableHead className="font-semibold text-center dark:text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-slate-500 dark:text-slate-400">No staff members found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => {
                    const typeConfig = staffTypeConfig[staff.staffType];
                    const statusConf = statusConfig[staff.status];
                    return (
                      <TableRow key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={cn("text-white", typeConfig.bgColor)}>
                                {getInitials(staff.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-slate-800 dark:text-white">{staff.name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{staff.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm dark:text-slate-300">{staff.employeeId}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("gap-1", typeConfig.bgColor, typeConfig.color)}>
                            {typeConfig.icon}
                            <span className="capitalize">{staff.staffType}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="dark:text-slate-300">{staff.department}</TableCell>
                        <TableCell className="dark:text-slate-300">{staff.designation}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusConf.color}>
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize dark:text-slate-300">{staff.shift}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 dark:text-slate-400 dark:hover:bg-slate-700"
                              onClick={() => openViewDialog(staff)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                              onClick={() => openEditDialog(staff)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                              onClick={() => openDeleteDialog(staff)}
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
            <DialogTitle className="dark:text-white">Add New Staff Member</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Enter the details for the new staff member
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="dark:text-white">Full Name *</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Employee ID *</Label>
              <Input 
                value={formData.employeeId || ''} 
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Email *</Label>
              <Input 
                type="email"
                value={formData.email || ''} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Phone *</Label>
              <Input 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Staff Type *</Label>
              <Select 
                value={formData.staffType || 'doctor'} 
                onValueChange={(v) => setFormData({...formData, staffType: v as StaffType})}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  {Object.entries(staffTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type} className="dark:text-white dark:focus:bg-slate-600">
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Department *</Label>
              <Select 
                value={formData.department || ''} 
                onValueChange={(v) => setFormData({...formData, department: v})}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept} className="dark:text-white dark:focus:bg-slate-600">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Designation *</Label>
              <Input 
                value={formData.designation || ''} 
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            {(formData.staffType === 'doctor' || !formData.staffType) && (
              <div className="space-y-2">
                <Label className="dark:text-white">Specialization</Label>
                <Input 
                  value={formData.specialization || ''} 
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="dark:text-white">Qualification *</Label>
              <Input 
                value={formData.qualification || ''} 
                onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Experience (Years)</Label>
              <Input 
                type="number"
                value={formData.experience || 0} 
                onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Status</Label>
              <Select 
                value={formData.status || 'active'} 
                onValueChange={(v) => setFormData({...formData, status: v as StaffStatus})}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  <SelectItem value="active" className="dark:text-white dark:focus:bg-slate-600">Active</SelectItem>
                  <SelectItem value="on-leave" className="dark:text-white dark:focus:bg-slate-600">On Leave</SelectItem>
                  <SelectItem value="inactive" className="dark:text-white dark:focus:bg-slate-600">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Shift</Label>
              <Select 
                value={formData.shift || 'morning'} 
                onValueChange={(v) => setFormData({...formData, shift: v as 'morning' | 'afternoon' | 'night' | 'rotational'})}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  <SelectItem value="morning" className="dark:text-white dark:focus:bg-slate-600">Morning</SelectItem>
                  <SelectItem value="afternoon" className="dark:text-white dark:focus:bg-slate-600">Afternoon</SelectItem>
                  <SelectItem value="night" className="dark:text-white dark:focus:bg-slate-600">Night</SelectItem>
                  <SelectItem value="rotational" className="dark:text-white dark:focus:bg-slate-600">Rotational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Salary (₹)</Label>
              <Input 
                type="number"
                value={formData.salary || 0} 
                onChange={(e) => setFormData({...formData, salary: parseInt(e.target.value) || 0})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="dark:text-white">Address</Label>
              <Textarea 
                value={formData.address || ''} 
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Emergency Contact</Label>
              <Input 
                value={formData.emergencyContact || ''} 
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="dark:border-slate-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={handleAddStaff}>
              Add Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Staff Member</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              Update the details for {selectedStaff?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label className="dark:text-white">Full Name *</Label>
              <Input 
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Employee ID *</Label>
              <Input 
                value={formData.employeeId || ''} 
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Email *</Label>
              <Input 
                type="email"
                value={formData.email || ''} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Phone *</Label>
              <Input 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Staff Type *</Label>
              <Select 
                value={formData.staffType || 'doctor'} 
                onValueChange={(v) => setFormData({...formData, staffType: v as StaffType})}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  {Object.entries(staffTypeConfig).map(([type, config]) => (
                    <SelectItem key={type} value={type} className="dark:text-white dark:focus:bg-slate-600">
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Department *</Label>
              <Select 
                value={formData.department || ''} 
                onValueChange={(v) => setFormData({...formData, department: v})}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept} className="dark:text-white dark:focus:bg-slate-600">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Designation *</Label>
              <Input 
                value={formData.designation || ''} 
                onChange={(e) => setFormData({...formData, designation: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            {(formData.staffType === 'doctor') && (
              <div className="space-y-2">
                <Label className="dark:text-white">Specialization</Label>
                <Input 
                  value={formData.specialization || ''} 
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="dark:text-white">Qualification *</Label>
              <Input 
                value={formData.qualification || ''} 
                onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Experience (Years)</Label>
              <Input 
                type="number"
                value={formData.experience || 0} 
                onChange={(e) => setFormData({...formData, experience: parseInt(e.target.value) || 0})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Status</Label>
              <Select 
                value={formData.status || 'active'} 
                onValueChange={(v) => setFormData({...formData, status: v as StaffStatus})}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  <SelectItem value="active" className="dark:text-white dark:focus:bg-slate-600">Active</SelectItem>
                  <SelectItem value="on-leave" className="dark:text-white dark:focus:bg-slate-600">On Leave</SelectItem>
                  <SelectItem value="inactive" className="dark:text-white dark:focus:bg-slate-600">Inactive</SelectItem>
                  <SelectItem value="suspended" className="dark:text-white dark:focus:bg-slate-600">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Shift</Label>
              <Select 
                value={formData.shift || 'morning'} 
                onValueChange={(v) => setFormData({...formData, shift: v as 'morning' | 'afternoon' | 'night' | 'rotational'})}
              >
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  <SelectItem value="morning" className="dark:text-white dark:focus:bg-slate-600">Morning</SelectItem>
                  <SelectItem value="afternoon" className="dark:text-white dark:focus:bg-slate-600">Afternoon</SelectItem>
                  <SelectItem value="night" className="dark:text-white dark:focus:bg-slate-600">Night</SelectItem>
                  <SelectItem value="rotational" className="dark:text-white dark:focus:bg-slate-600">Rotational</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Salary (₹)</Label>
              <Input 
                type="number"
                value={formData.salary || 0} 
                onChange={(e) => setFormData({...formData, salary: parseInt(e.target.value) || 0})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="dark:text-white">Address</Label>
              <Textarea 
                value={formData.address || ''} 
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="dark:text-white">Emergency Contact</Label>
              <Input 
                value={formData.emergencyContact || ''} 
                onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="dark:border-slate-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={handleEditStaff}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Staff Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Staff Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-6 py-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className={cn(
                    "text-white text-lg",
                    staffTypeConfig[selectedStaff.staffType].bgColor
                  )}>
                    {getInitials(selectedStaff.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedStaff.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400">{selectedStaff.designation}</p>
                  <Badge variant="outline" className={cn("mt-1", statusConfig[selectedStaff.status].color)}>
                    {statusConfig[selectedStaff.status].label}
                  </Badge>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Employee ID:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.employeeId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Department:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Qualification:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.qualification}</span>
                  </div>
                  {selectedStaff.specialization && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500 dark:text-slate-400">Specialization:</span>
                      <span className="font-medium dark:text-white">{selectedStaff.specialization}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Experience:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.experience} years</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Email:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Phone:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Address:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Joining Date:</span>
                    <span className="font-medium dark:text-white">{format(selectedStaff.joiningDate, 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500 dark:text-slate-400">Emergency:</span>
                    <span className="font-medium dark:text-white">{selectedStaff.emergencyContact}</span>
                  </div>
                </div>
              </div>

              {/* Working Days & Shift */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Shift:</span>
                  <Badge variant="secondary" className="capitalize dark:bg-slate-600 dark:text-white">{selectedStaff.shift}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">Working Days:</span>
                  <span className="text-sm font-medium dark:text-white">{selectedStaff.workingDays.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)} className="dark:border-slate-600 dark:text-white">
              Close
            </Button>
            <Button onClick={() => { setShowViewDialog(false); openEditDialog(selectedStaff!); }}>
              Edit Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-slate-400">
              Are you sure you want to delete <strong>{selectedStaff?.name}</strong>? This action cannot be undone.
              All associated records will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-slate-600 dark:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStaff} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
