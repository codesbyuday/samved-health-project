'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  citizenService,
  wardService,
  healthCardService,
  BLOOD_GROUPS,
  type Citizen,
  type Ward,
  type BloodGroup,
} from '@/services/database';
import { uploadCitizenPhoto } from '@/services/citizenStorage';
import HealthCard from './HealthCard';
import {
  Search,
  Edit,
  UserPlus,
  Loader2,
  AlertCircle,
  CreditCard,
  Eye,
  Upload,
  X,
  Camera,
  Calendar,
} from 'lucide-react';
import { format, differenceInYears, subYears, startOfDay, setYear, setMonth, setDate } from 'date-fns';
import { cn } from '@/lib/utils';

// Generate years for dropdown (110 years back from current year)
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 111 }, (_, i) => currentYear - i);
const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getDaysArray(year: number, month: number): number[] {
  const daysInMonth = getDaysInMonth(year, month);
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

export default function CitizenServices() {
  const [searchQuery, setSearchQuery] = useState('');
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showHealthCardDialog, setShowHealthCardDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Photo upload states
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Date of birth states
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(0);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    blood_group: '',
    phone: '',
    address: '',
    ward_number: '',
    aadhar_id: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Update days when year/month changes
  const days = getDaysArray(selectedYear, selectedMonth);
  
  // Reset day if it exceeds the days in the new month
  useEffect(() => {
    const maxDays = getDaysInMonth(selectedYear, selectedMonth);
    if (selectedDay > maxDays) {
      setSelectedDay(maxDays);
    }
  }, [selectedYear, selectedMonth, selectedDay]);

  useEffect(() => {
    loadWards();
  }, []);

  const loadWards = async () => {
    const { data } = await wardService.getAll();
    if (data) setWards(data);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setCitizens([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const { data, error } = await citizenService.search(searchQuery.trim());
    setIsSearching(false);
    if (error) toast.error(error);
    else setCitizens(data || []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery.trim()]);

  // Handle photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setPhotoError('Invalid file type. Only JPG, PNG, and WEBP are allowed.');
      return;
    }

    // Validate file size (50KB max)
    if (file.size > 50 * 1024) {
      setPhotoError('File size must be less than 50 KB.');
      return;
    }

    setPhotoError(null);
    setSelectedPhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setSelectedPhoto(null);
    setPhotoPreview(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get date of birth from selected values
  const getDateOfBirth = (): string => {
    const date = new Date(selectedYear, selectedMonth, selectedDay);
    return format(date, 'yyyy-MM-dd');
  };

  // Calculate age from DOB
  const calculateAge = (dob: string): number => {
    return differenceInYears(new Date(), new Date(dob));
  };

  const validateForm = (isEdit = false): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    
    // Validate DOB is not in future and not more than 110 years ago
    const dob = new Date(getDateOfBirth());
    const today = new Date();
    const minDate = subYears(today, 110);
    
    if (dob > today) {
      errors.date_of_birth = 'Date of birth cannot be in the future';
    } else if (dob < minDate) {
      errors.date_of_birth = 'Date of birth cannot be more than 110 years ago';
    }
    
    if (!formData.gender) errors.gender = 'Gender is required';
    
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(formData.phone.trim())) errors.phone = 'Phone must be exactly 10 digits';
    
    if (!formData.address.trim()) errors.address = 'Address is required';
    
    if (!isEdit && formData.aadhar_id && !/^\d{12}$/.test(formData.aadhar_id.trim())) {
      errors.aadhar_id = 'Aadhar ID must be exactly 12 digits';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    
    try {
      const dateOfBirth = getDateOfBirth();
      // Note: age is calculated dynamically from date_of_birth, not stored in DB
      
      // Create citizen data - only include non-null values (no age field - it's calculated)
      const citizenData: Record<string, unknown> = {
        name: formData.name.trim(),
        gender: formData.gender as 'Male' | 'Female' | 'Transgender',
        phone: formData.phone.trim(),
        address: formData.address.trim(),
      };
      
      // Add optional fields only if they have values
      if (formData.blood_group) {
        citizenData.blood_group = formData.blood_group;
      }
      if (formData.ward_number) {
        citizenData.ward_number = parseInt(formData.ward_number);
      }
      if (formData.aadhar_id.trim()) {
        citizenData.aadhar_id = formData.aadhar_id.trim();
      }
      
      // Add date_of_birth (age is calculated from this)
      citizenData.date_of_birth = dateOfBirth;
      
      // Create citizen first
      const { data: newCitizen, error: citizenError } = await citizenService.create(citizenData);
      
      if (citizenError) {
        toast.error(citizenError);
        setIsSubmitting(false);
        return;
      }
      
      if (!newCitizen) {
        toast.error('Failed to create citizen record');
        setIsSubmitting(false);
        return;
      }
      
      // Upload photo if selected
      if (selectedPhoto) {
        try {
          const { publicUrl, error: photoError } = await uploadCitizenPhoto(
            newCitizen.citizen_id,
            selectedPhoto
          );
          
          if (photoError) {
            toast.warning('Citizen registered but photo upload failed: ' + photoError);
          } else if (publicUrl) {
            // Update citizen with photo URL (only user_photo_url column)
            await citizenService.update(newCitizen.citizen_id, { 
              user_photo_url: publicUrl 
            });
          }
        } catch (photoUploadError) {
          console.error('Photo upload error:', photoUploadError);
          toast.warning('Citizen registered but photo upload failed');
        }
      }
      
      // Create health card entry
      try {
        await healthCardService.create(newCitizen.citizen_id);
      } catch (e) {
        console.log('Health card creation skipped:', e);
      }
      
      toast.success('Citizen registered successfully');
      setShowAddDialog(false);
      resetForm();
      handleSearch();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An unexpected error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedCitizen || !validateForm(true)) return;
    setIsSubmitting(true);
    
    try {
      const dateOfBirth = getDateOfBirth();
      // Note: age is calculated dynamically from date_of_birth, not stored in DB
      
      // Upload new photo if provided
      let photoUrl = selectedCitizen.user_photo_url;
      if (selectedPhoto) {
        const { publicUrl, error: photoError } = await uploadCitizenPhoto(
          selectedCitizen.citizen_id,
          selectedPhoto
        );
        
        if (photoError) {
          toast.warning('Update saved but photo upload failed: ' + photoError);
        } else if (publicUrl) {
          photoUrl = publicUrl;
        }
      }
      
      const updateData: Partial<Citizen> = {
        name: formData.name.trim(),
        date_of_birth: dateOfBirth,
        gender: formData.gender as 'Male' | 'Female' | 'Transgender',
        blood_group: (formData.blood_group || null) as BloodGroup | null,
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        ward_number: formData.ward_number ? parseInt(formData.ward_number) : null,
        user_photo_url: photoUrl,
      };
      
      // Only add aadhar_id if it was previously null and now has a value
      if (!selectedCitizen.aadhar_id && formData.aadhar_id.trim()) {
        updateData.aadhar_id = formData.aadhar_id.trim();
      }
      
      const { error } = await citizenService.update(selectedCitizen.citizen_id, updateData);
      
      if (error) {
        toast.error(error);
      } else {
        toast.success('Citizen updated successfully');
        setShowEditDialog(false);
        setSelectedCitizen(null);
        resetForm();
        handleSearch();
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('An unexpected error occurred during update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    
    // Parse DOB if available
    if (citizen.date_of_birth) {
      const dob = new Date(citizen.date_of_birth);
      setSelectedYear(dob.getFullYear());
      setSelectedMonth(dob.getMonth());
      setSelectedDay(dob.getDate());
    } else {
      // Default to 30 years ago
      const defaultDob = subYears(new Date(), 30);
      setSelectedYear(defaultDob.getFullYear());
      setSelectedMonth(defaultDob.getMonth());
      setSelectedDay(defaultDob.getDate());
    }
    
    setFormData({
      name: citizen.name || '',
      gender: citizen.gender || '',
      blood_group: citizen.blood_group || '',
      phone: citizen.phone || '',
      address: citizen.address || '',
      ward_number: citizen.ward_number?.toString() || '',
      aadhar_id: citizen.aadhar_id || '',
    });
    setPhotoPreview(citizen.user_photo_url || null);
    setSelectedPhoto(null);
    setPhotoError(null);
    setFormErrors({});
    setShowEditDialog(true);
  };

  const openViewDialog = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setShowViewDialog(true);
  };

  const openHealthCardDialog = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setShowViewDialog(false);
    setShowHealthCardDialog(true);
  };

  const resetForm = () => {
    // Reset to default DOB (30 years ago)
    const defaultDob = subYears(new Date(), 30);
    setSelectedYear(defaultDob.getFullYear());
    setSelectedMonth(defaultDob.getMonth());
    setSelectedDay(defaultDob.getDate());
    
    setFormData({
      name: '',
      gender: '',
      blood_group: '',
      phone: '',
      address: '',
      ward_number: '',
      aadhar_id: '',
    });
    setFormErrors({});
    clearPhoto();
  };

  const getWardName = (wardNumber: number | null) => {
    if (!wardNumber) return 'Not assigned';
    const ward = wards.find(w => w.ward_id === wardNumber);
    return ward?.ward_name || `Ward ${wardNumber}`;
  };

  const renderFormFields = (isEdit = false) => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {isEdit && selectedCitizen && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <p className="text-sm"><span className="font-medium">Citizen ID:</span> {selectedCitizen.citizen_id}</p>
        </div>
      )}
      
      {/* Photo Upload */}
      <div className="space-y-2">
        <Label>Citizen Photo (Optional, max 50KB)</Label>
        <div className="flex items-start gap-4">
          <div className="relative">
            <div className="h-24 w-20 rounded-lg overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
              {photoPreview ? (
                <>
                  <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={clearPhoto}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <Camera className="h-8 w-8 text-slate-400" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
            <Button
              variant="outline"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {photoPreview ? 'Change Photo' : 'Upload Photo'}
            </Button>
            {photoError && <p className="text-sm text-red-500 mt-1">{photoError}</p>}
            <p className="text-xs text-slate-500 mt-1">JPG, PNG or WEBP. Max 50KB.</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Full Name *</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter full name"
        />
        {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
      </div>

      {/* Date of Birth with Year Selector */}
      <div className="space-y-2">
        <Label>Date of Birth *</Label>
        <div className="grid grid-cols-3 gap-2">
          {/* Day */}
          <Select 
            value={selectedDay.toString()} 
            onValueChange={(v) => setSelectedDay(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Day" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {days.map((day) => (
                <SelectItem key={day} value={day.toString()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Month */}
          <Select 
            value={selectedMonth.toString()} 
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Year */}
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {YEARS.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {formErrors.date_of_birth && <p className="text-sm text-red-500">{formErrors.date_of_birth}</p>}
        <p className="text-xs text-slate-500">Age will be calculated automatically: {calculateAge(getDateOfBirth())} years</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Gender *</Label>
          <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Transgender">Transgender</SelectItem>
            </SelectContent>
          </Select>
          {formErrors.gender && <p className="text-sm text-red-500">{formErrors.gender}</p>}
        </div>
        <div className="space-y-2">
          <Label>Blood Group</Label>
          <Select value={formData.blood_group} onValueChange={(v) => setFormData({ ...formData, blood_group: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((bg) => (
                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone Number *</Label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
            placeholder="10-digit phone"
            maxLength={10}
          />
          {formErrors.phone && <p className="text-sm text-red-500">{formErrors.phone}</p>}
        </div>
        <div className="space-y-2">
          <Label>Ward</Label>
          <Select value={formData.ward_number} onValueChange={(v) => setFormData({ ...formData, ward_number: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Select ward" />
            </SelectTrigger>
            <SelectContent>
              {wards.map((w) => (
                <SelectItem key={w.ward_id} value={w.ward_id.toString()}>
                  {w.ward_name || `Ward ${w.ward_id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Aadhar ID {isEdit && selectedCitizen?.aadhar_id ? '(Locked)' : '(Optional)'}</Label>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <Input
            value={formData.aadhar_id}
            onChange={(e) => setFormData({ ...formData, aadhar_id: e.target.value.replace(/\D/g, '').slice(0, 12) })}
            placeholder="12-digit Aadhar ID"
            maxLength={12}
            disabled={isEdit && !!selectedCitizen?.aadhar_id}
            className={cn(isEdit && selectedCitizen?.aadhar_id && 'bg-slate-100')}
          />
        </div>
        {formErrors.aadhar_id && <p className="text-sm text-red-500">{formErrors.aadhar_id}</p>}
        {!isEdit && <p className="text-xs text-slate-500">Once saved, Aadhar ID cannot be changed.</p>}
      </div>

      <div className="space-y-2">
        <Label>Address *</Label>
        <Textarea
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Full address"
          rows={2}
        />
        {formErrors.address && <p className="text-sm text-red-500">{formErrors.address}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Citizen Services</h2>
          <p className="text-sm text-slate-500 mt-1">Register, search, and manage citizen records</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2">
          <UserPlus className="h-4 w-4" /> Register New Citizen
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-2xl">
              <Label className="mb-2 block">Search by Name, Citizen ID, Phone, or Aadhar ID</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Enter name, Citizen ID (SMC-YYYY-XXXXXX), phone, or Aadhar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-slate-400" />}
              </div>
            </div>

            {searchQuery && citizens.length > 0 && (
              <div className="w-full max-w-5xl mt-4">
                <p className="text-sm text-slate-500 mb-2">Found {citizens.length} citizen(s)</p>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800">
                        <TableHead>Citizen ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Age/Gender</TableHead>
                        <TableHead>Blood</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Ward</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {citizens.map((c) => (
                        <TableRow key={c.citizen_id}>
                          <TableCell className="font-mono text-sm">{c.citizen_id}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center">
                                {c.user_photo_url ? (
                                  <img src={c.user_photo_url || ''} alt={c.name || ''} className="h-full w-full object-cover" />
                                ) : (
                                  <span className={cn(
                                    'text-sm font-medium',
                                    c.gender === 'Male' && 'text-blue-700',
                                    c.gender === 'Female' && 'text-pink-700',
                                    c.gender === 'Transgender' && 'text-purple-700'
                                  )}>
                                    {c.name?.charAt(0) || '?'}
                                  </span>
                                )}
                              </div>
                              <span className="font-medium">{c.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{(() => {
                            // Calculate age dynamically from date_of_birth
                            if (c.date_of_birth) {
                              const calculatedAge = Math.floor((new Date().getTime() - new Date(c.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                              return `${calculatedAge} / ${c.gender?.charAt(0) || '?'}`;
                            }
                            return `${c.age || 'N/A'} / ${c.gender?.charAt(0) || '?'}`;
                          })()}</TableCell>
                          <TableCell>
                            {c.blood_group ? (
                              <Badge variant="outline" className="font-mono text-red-600 border-red-200">{c.blood_group}</Badge>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>{c.phone || 'N/A'}</TableCell>
                          <TableCell>{getWardName(c.ward_number)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openViewDialog(c)} title="View Details">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(c)} title="Edit">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {searchQuery && !isSearching && citizens.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No citizens found matching your search.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Register New Citizen</DialogTitle>
            <DialogDescription>Fill in the citizen details. Fields marked with * are required.</DialogDescription>
          </DialogHeader>
          {renderFormFields(false)}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(o) => { setShowEditDialog(o); if (!o) { setSelectedCitizen(null); resetForm(); }}}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Citizen</DialogTitle>
            <DialogDescription>
              Aadhar ID cannot be changed once set. Only Date of Birth, Phone, Address, Ward, Blood Group and Photo can be updated.
            </DialogDescription>
          </DialogHeader>
          {renderFormFields(true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedCitizen(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Citizen Details</DialogTitle>
          </DialogHeader>
          {selectedCitizen && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-16 rounded-lg overflow-hidden bg-slate-200 flex items-center justify-center">
                  {selectedCitizen.user_photo_url ? (
                    <img src={selectedCitizen.user_photo_url} alt={selectedCitizen.name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedCitizen.name}</h3>
                  <p className="text-sm text-slate-500">{selectedCitizen.citizen_id}</p>
                  {selectedCitizen.blood_group && (
                    <Badge variant="outline" className="font-mono mt-1 text-red-600 border-red-200">{selectedCitizen.blood_group}</Badge>
                  )}
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Date of Birth</p>
                  <p className="font-medium">
                    {selectedCitizen.date_of_birth
                      ? format(new Date(selectedCitizen.date_of_birth), 'MMMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Age</p>
                  <p className="font-medium">{selectedCitizen.age || 'N/A'} years</p>
                </div>
                <div>
                  <p className="text-slate-500">Gender</p>
                  <p className="font-medium">{selectedCitizen.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Phone</p>
                  <p className="font-medium">{selectedCitizen.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-500">Ward</p>
                  <p className="font-medium">{getWardName(selectedCitizen.ward_number)}</p>
                </div>
                <div>
                  <p className="text-slate-500">Registered</p>
                  <p className="font-medium">
                    {selectedCitizen.created_at
                      ? format(new Date(selectedCitizen.created_at), 'MMM dd, yyyy')
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500">Aadhar ID</p>
                <p className="font-mono">{selectedCitizen.aadhar_id || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Address</p>
                <p className="font-medium">{selectedCitizen.address || 'N/A'}</p>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => openHealthCardDialog(selectedCitizen)}>
                  <Calendar className="h-4 w-4 mr-2" /> See Health Card
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => { setShowViewDialog(false); openEditDialog(selectedCitizen); }}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Health Card Dialog */}
      <Dialog open={showHealthCardDialog} onOpenChange={setShowHealthCardDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Health Card</DialogTitle>
          </DialogHeader>
          {selectedCitizen && (
            <HealthCard
              citizen={selectedCitizen}
              wardName={getWardName(selectedCitizen.ward_number)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
