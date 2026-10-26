'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  User,
  Building2,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  Calendar,
  FileText,
  UserCheck,
  ArrowRight,
  Activity,
  Stethoscope,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Send,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  referralService,
  citizenService,
  hospitalService,
  staffService,
  getCurrentHospitalId,
  type Citizen,
  type Hospital,
  type HospitalStaff,
} from '@/services/database';
import { useAuth } from '@/contexts/AuthContext';
import AccessDenied from '@/components/auth/AccessDenied';
import { useRBAC } from '@/hooks/use-rbac';

export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';
export type ReferralStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface Referral {
  referral_id: string;
  citizen_id: string;
  referring_doctor_id?: string | null;
  from_hospital_id: string;
  to_hospital_id: string;
  to_doctor_id?: string | null;
  referral_reason: string;
  urgency_level: UrgencyLevel;
  status: ReferralStatus;
  created_at: string;
  notes?: string | null;
  updated_at?: string | null;
  citizen?: Citizen | null;
  from_hospital?: Hospital | null;
  to_hospital?: Hospital | null;
  referring_doctor?: HospitalStaff | null;
  to_doctor?: HospitalStaff | null;
}

// Urgency badge styling config
export const getUrgencyConfig = (urgency: string) => {
  switch (urgency) {
    case 'emergency':
      return {
        label: 'Emergency',
        color: 'text-red-700 dark:text-red-300',
        bgColor: 'bg-red-50 dark:bg-red-950/40',
        borderColor: 'border-red-300 dark:border-red-800',
        badgeBg: 'bg-red-600 text-white hover:bg-red-700',
        dotColor: 'bg-red-600',
        borderAccent: 'border-l-4 border-l-red-600',
      };
    case 'urgent':
      return {
        label: 'Urgent',
        color: 'text-orange-700 dark:text-orange-300',
        bgColor: 'bg-orange-50 dark:bg-orange-950/40',
        borderColor: 'border-orange-300 dark:border-orange-800',
        badgeBg: 'bg-orange-500 text-white hover:bg-orange-600',
        dotColor: 'bg-orange-500',
        borderAccent: 'border-l-4 border-l-orange-500',
      };
    default:
      return {
        label: 'Normal',
        color: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-300 dark:border-emerald-800',
        badgeBg: 'bg-emerald-600 text-white hover:bg-emerald-700',
        dotColor: 'bg-emerald-500',
        borderAccent: 'border-l-4 border-l-emerald-500',
      };
  }
};

// Status badge styling config
export const getStatusConfig = (status: string) => {
  switch (status) {
    case 'accepted':
      return {
        label: 'Accepted',
        color: 'text-blue-700 dark:text-blue-300',
        bgColor: 'bg-blue-50 dark:bg-blue-950/40',
        borderColor: 'border-blue-300 dark:border-blue-800',
        dotColor: 'bg-blue-600',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        color: 'text-rose-700 dark:text-rose-300',
        bgColor: 'bg-rose-50 dark:bg-rose-950/40',
        borderColor: 'border-rose-300 dark:border-rose-800',
        dotColor: 'bg-rose-600',
      };
    case 'completed':
      return {
        label: 'Completed',
        color: 'text-emerald-700 dark:text-emerald-300',
        bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
        borderColor: 'border-emerald-300 dark:border-emerald-800',
        dotColor: 'bg-emerald-600',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'text-slate-600 dark:text-slate-400',
        bgColor: 'bg-slate-100 dark:bg-slate-800',
        borderColor: 'border-slate-300 dark:border-slate-700',
        dotColor: 'bg-slate-500',
      };
    default:
      return {
        label: 'Pending',
        color: 'text-amber-700 dark:text-amber-300',
        bgColor: 'bg-amber-50 dark:bg-amber-950/40',
        borderColor: 'border-amber-300 dark:border-amber-800',
        dotColor: 'bg-amber-500',
      };
  }
};

export default function ReferralManagement() {
  const { user } = useAuth();
  const currentHospitalId = user?.hospital_id || getCurrentHospitalId();
  const { getModuleAccess } = useRBAC();
  const moduleAccess = getModuleAccess('referrals');
  const canApproveReferrals = moduleAccess === 'full' || moduleAccess === 'partial';

  // Data state
  const [outgoingReferrals, setOutgoingReferrals] = useState<Referral[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<Referral[]>([]);
  const [hospitalsList, setHospitalsList] = useState<Hospital[]>([]);
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [staffList, setStaffList] = useState<HospitalStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tab & Filters
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  // Detail Modal State
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action Confirmation Modal (Accept, Reject, Complete, Cancel)
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionTarget, setActionTarget] = useState<{
    referral: Referral;
    newStatus: ReferralStatus;
    title: string;
    description: string;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Create Referral Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [citizenSearch, setCitizenSearch] = useState('');
  const [citizenResults, setCitizenResults] = useState<Citizen[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [isSearchingCitizens, setIsSearchingCitizens] = useState(false);

  // Form State
  const [createForm, setCreateForm] = useState({
    to_hospital_id: '',
    urgency_level: 'normal' as UrgencyLevel,
    referring_doctor_id: '',
    to_doctor_id: '',
    referral_reason: '',
    notes: '',
  });

  // Load all referrals for this hospital
  const loadReferrals = useCallback(async () => {
    setIsLoading(true);
    try {
      const [outgoingResult, incomingResult, hospitalsResult, staffResult] = await Promise.all([
        referralService.getOutgoing(currentHospitalId),
        referralService.getIncoming(currentHospitalId),
        hospitalService.getAll(),
        staffService.getAll(currentHospitalId),
      ]);

      if (outgoingResult.data) {
        setOutgoingReferrals(outgoingResult.data as Referral[]);
      }
      if (incomingResult.data) {
        setIncomingReferrals(incomingResult.data as Referral[]);
      }
      if (hospitalsResult.data) {
        setHospitalsList(hospitalsResult.data);
        const current = hospitalsResult.data.find(h => h.hospital_id === currentHospitalId);
        if (current) setCurrentHospital(current);
      }
      if (staffResult.data) {
        setStaffList(staffResult.data);
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
      toast.error('Failed to load referrals data');
    } finally {
      setIsLoading(false);
    }
  }, [currentHospitalId]);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  // Citizen search effect
  useEffect(() => {
    const searchCitizens = async () => {
      if (!citizenSearch.trim()) {
        setCitizenResults([]);
        return;
      }
      setIsSearchingCitizens(true);
      try {
        const { data } = await citizenService.search(citizenSearch);
        if (data) {
          setCitizenResults(data);
        }
      } catch (err) {
        console.error('Citizen search error:', err);
      } finally {
        setIsSearchingCitizens(false);
      }
    };
    const timer = setTimeout(searchCitizens, 300);
    return () => clearTimeout(timer);
  }, [citizenSearch]);

  // Summary Metrics
  const summary = useMemo(() => {
    const all = [...incomingReferrals, ...outgoingReferrals];
    const incomingPending = incomingReferrals.filter(r => r.status === 'pending').length;
    const outgoingPending = outgoingReferrals.filter(r => r.status === 'pending').length;
    const totalPending = incomingPending + outgoingPending;
    const emergencyCount = all.filter(r => r.urgency_level === 'emergency' || r.urgency_level === 'urgent').length;
    const acceptedCount = all.filter(r => r.status === 'accepted').length;
    const completedCount = all.filter(r => r.status === 'completed').length;
    return {
      total: all.length,
      incomingPending,
      outgoingPending,
      totalPending,
      emergencyCount,
      acceptedCount,
      completedCount,
    };
  }, [incomingReferrals, outgoingReferrals]);

  // Filtered lists
  const filterList = useCallback(
    (list: Referral[]) => {
      return list.filter((r) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          r.citizen?.name?.toLowerCase().includes(q) ||
          r.citizen_id?.toLowerCase().includes(q) ||
          r.from_hospital?.name?.toLowerCase().includes(q) ||
          r.to_hospital?.name?.toLowerCase().includes(q) ||
          r.referral_reason?.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          r.referring_doctor?.name?.toLowerCase().includes(q) ||
          r.to_doctor?.name?.toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        const matchesUrgency = urgencyFilter === 'all' || r.urgency_level === urgencyFilter;

        return matchesSearch && matchesStatus && matchesUrgency;
      });
    },
    [searchQuery, statusFilter, urgencyFilter]
  );

  const filteredIncoming = useMemo(() => filterList(incomingReferrals), [filterList, incomingReferrals]);
  const filteredOutgoing = useMemo(() => filterList(outgoingReferrals), [filterList, outgoingReferrals]);

  // Handle Action Trigger (Accept, Reject, Complete, Cancel)
  const openActionDialog = (referral: Referral, newStatus: ReferralStatus) => {
    let title = '';
    let description = '';
    if (newStatus === 'accepted') {
      title = 'Accept Patient Referral';
      description = `Accept incoming referral for ${referral.citizen?.name || referral.citizen_id}. Hospital staff will prepare appropriate department and bed allocation.`;
    } else if (newStatus === 'rejected') {
      title = 'Reject Patient Referral';
      description = `Provide a clinical or logistical reason for rejecting the referral for ${referral.citizen?.name || referral.citizen_id}.`;
    } else if (newStatus === 'completed') {
      title = 'Mark Referral as Completed';
      description = `Confirm that patient ${referral.citizen?.name || referral.citizen_id} has arrived, received consultation/admission, and the referral process is resolved.`;
    } else if (newStatus === 'cancelled') {
      title = 'Cancel Outgoing Referral';
      description = `Cancel the referral request for ${referral.citizen?.name || referral.citizen_id}.`;
    }

    setActionTarget({
      referral,
      newStatus,
      title,
      description,
    });
    setActionNotes(referral.notes || '');
    setShowActionModal(true);
  };

  const handleConfirmAction = async () => {
    if (!actionTarget) return;
    setIsUpdating(true);
    try {
      const { error } = await referralService.updateStatus(
        actionTarget.referral.referral_id,
        actionTarget.newStatus,
        actionNotes.trim() || undefined
      );

      if (error) {
        toast.error(error);
      } else {
        toast.success(`Referral successfully marked as ${actionTarget.newStatus}`);
        setShowActionModal(false);
        setActionTarget(null);
        setActionNotes('');
        setShowDetailModal(false);
        loadReferrals();
      }
    } catch (err) {
      toast.error('Failed to update referral status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Open Create Dialog
  const handleOpenCreateDialog = () => {
    setSelectedCitizen(null);
    setCitizenSearch('');
    setCitizenResults([]);
    setCreateForm({
      to_hospital_id: '',
      urgency_level: 'normal',
      referring_doctor_id: staffList[0]?.staff_uuid || '',
      to_doctor_id: '',
      referral_reason: '',
      notes: '',
    });
    setShowCreateModal(true);
  };

  // Submit New Referral
  const handleCreateReferral = async () => {
    if (!selectedCitizen) {
      toast.error('Please select a patient to refer');
      return;
    }
    if (!createForm.to_hospital_id) {
      toast.error('Please select a destination hospital');
      return;
    }
    if (!createForm.referral_reason.trim()) {
      toast.error('Please enter the primary reason for referral');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await referralService.create({
        citizen_id: selectedCitizen.citizen_id,
        from_hospital_id: currentHospitalId,
        to_hospital_id: createForm.to_hospital_id,
        referring_doctor_id: createForm.referring_doctor_id || null,
        to_doctor_id: createForm.to_doctor_id || null,
        urgency_level: createForm.urgency_level,
        referral_reason: createForm.referral_reason.trim(),
        notes: createForm.notes.trim() || null,
        status: 'pending',
      });

      if (error) {
        toast.error(error);
      } else {
        toast.success('Patient referral created successfully');
        setShowCreateModal(false);
        loadReferrals();
      }
    } catch (err) {
      toast.error('Failed to create referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (moduleAccess === 'none') {
    return <AccessDenied message="You do not have permission to access referrals." />;
  }

  // Render Referral Card
  const renderReferralCard = (referral: Referral, isIncoming: boolean) => {
    const urgencyConf = getUrgencyConfig(referral.urgency_level);
    const statusConf = getStatusConfig(referral.status);
    const isEmergency = referral.urgency_level === 'emergency';

    return (
      <Card
        key={referral.referral_id}
        className={cn(
          'cursor-pointer transition-all hover:shadow-md border',
          urgencyConf.borderAccent,
          isEmergency && 'bg-red-50/10 dark:bg-red-950/10'
        )}
        onClick={() => {
          setSelectedReferral(referral);
          setShowDetailModal(true);
        }}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2.5">
              {/* Header line: Citizen name, ID badge, Urgency, Status */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="font-bold text-slate-900 dark:text-white text-base">
                    {referral.citizen?.name || 'Unknown Patient'}
                  </span>
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {referral.citizen_id}
                </Badge>
                {referral.citizen?.phone && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {referral.citizen.phone}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <Badge variant="outline" className={cn('text-xs font-semibold', urgencyConf.bgColor, urgencyConf.color, urgencyConf.borderColor)}>
                    {isEmergency && <AlertTriangle className="h-3 w-3 mr-1 inline" />}
                    {urgencyConf.label}
                  </Badge>
                  <Badge variant="outline" className={cn('text-xs font-medium', statusConf.bgColor, statusConf.color, statusConf.borderColor)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5 inline-block', statusConf.dotColor)} />
                    {statusConf.label}
                  </Badge>
                </div>
              </div>

              {/* Route line: From Hospital -> To Hospital */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <span className="font-medium truncate max-w-[220px]">
                    {referral.from_hospital?.name || referral.from_hospital_id}
                  </span>
                  {referral.referring_doctor && (
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      ({referral.referring_doctor.name})
                    </span>
                  )}
                </div>

                <ArrowRight className="h-4 w-4 text-emerald-600 flex-shrink-0" />

                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span className="font-medium text-emerald-800 dark:text-emerald-300 truncate max-w-[220px]">
                    {referral.to_hospital?.name || referral.to_hospital_id}
                  </span>
                  {referral.to_doctor && (
                    <span className="text-xs text-slate-500 hidden sm:inline">
                      ({referral.to_doctor.name})
                    </span>
                  )}
                </div>
              </div>

              {/* Clinical Reason preview */}
              <div className="text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">Clinical Reason: </span>
                <span className="text-slate-600 dark:text-slate-400 line-clamp-1 inline">
                  {referral.referral_reason}
                </span>
              </div>

              {/* Footer info: Date & Notes preview */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {referral.created_at
                      ? format(parseISO(referral.created_at), 'MMM dd, yyyy • hh:mm a')
                      : 'N/A'}
                  </span>
                </div>
                {referral.notes && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <FileText className="h-3 w-3" />
                    <span className="truncate max-w-[300px]">Notes: {referral.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Action Buttons on Card */}
            {canApproveReferrals && (
              <div className="flex lg:flex-col items-center justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                {isIncoming && referral.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionDialog(referral, 'accepted');
                      }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-rose-600 border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        openActionDialog(referral, 'rejected');
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Reject
                    </Button>
                  </>
                )}

                {isIncoming && referral.status === 'accepted' && (
                  <Button
                    size="sm"
                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      openActionDialog(referral, 'completed');
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Complete Transfer
                  </Button>
                )}

                {!isIncoming && referral.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-slate-600 border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                    onClick={(e) => {
                      e.stopPropagation();
                      openActionDialog(referral, 'cancelled');
                    }}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel Referral
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Patient Referrals</h2>
            {currentHospital && (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 hidden sm:inline-flex">
                <Building2 className="h-3 w-3 mr-1" />
                {currentHospital.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Coordinate, triage, and manage inter-hospital patient transfers and specialist consultations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadReferrals} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button onClick={handleOpenCreateDialog} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Referral
          </Button>
        </div>
      </div>

      {/* 5 KPI Summary Cards (Interactive Filters) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Referrals */}
        <Card
          className={cn(
            'border-l-4 border-l-slate-600 cursor-pointer transition-all hover:shadow-md',
            statusFilter === 'all' && urgencyFilter === 'all' && 'ring-2 ring-slate-400 bg-slate-50/50 dark:bg-slate-900/40'
          )}
          onClick={() => {
            setStatusFilter('all');
            setUrgencyFilter('all');
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Referrals</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{summary.total}</p>
              </div>
              <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inbound Pending Actions */}
        <Card
          className={cn(
            'border-l-4 border-l-amber-500 cursor-pointer transition-all hover:shadow-md',
            activeTab === 'incoming' && statusFilter === 'pending' && 'ring-2 ring-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
          )}
          onClick={() => {
            setActiveTab('incoming');
            setStatusFilter('pending');
            setUrgencyFilter('all');
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Inbound Pending</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{summary.incomingPending}</p>
              </div>
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency & Urgent */}
        <Card
          className={cn(
            'border-l-4 border-l-red-600 cursor-pointer transition-all hover:shadow-md',
            urgencyFilter === 'emergency' && 'ring-2 ring-red-400 bg-red-50/50 dark:bg-red-950/20'
          )}
          onClick={() => {
            setUrgencyFilter(urgencyFilter === 'emergency' ? 'all' : 'emergency');
            setStatusFilter('all');
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-300">Emergency/Urgent</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{summary.emergencyCount}</p>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-2 text-red-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active / Accepted Transfers */}
        <Card
          className={cn(
            'border-l-4 border-l-blue-500 cursor-pointer transition-all hover:shadow-md',
            statusFilter === 'accepted' && 'ring-2 ring-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
          )}
          onClick={() => {
            setStatusFilter(statusFilter === 'accepted' ? 'all' : 'accepted');
            setUrgencyFilter('all');
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{summary.acceptedCount}</p>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-2 text-blue-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Transfers */}
        <Card
          className={cn(
            'border-l-4 border-l-emerald-600 cursor-pointer transition-all hover:shadow-md',
            statusFilter === 'completed' && 'ring-2 ring-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
          )}
          onClick={() => {
            setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed');
            setUrgencyFilter('all');
          }}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Completed</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.completedCount}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by patient name, ID, hospital, doctor, or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full md:w-[170px]">
                <SelectValue placeholder="All Urgencies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                <SelectItem value="emergency">Emergency Priority</SelectItem>
                <SelectItem value="urgent">Urgent Priority</SelectItem>
                <SelectItem value="normal">Normal / Routine</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setUrgencyFilter('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'incoming' | 'outgoing')}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="incoming" className="gap-2">
              <ArrowDownRight className="h-4 w-4" />
              Incoming ({filteredIncoming.length})
              {summary.incomingPending > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {summary.incomingPending}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Outgoing ({filteredOutgoing.length})
              {summary.outgoingPending > 0 && (
                <span className="ml-1 rounded-full bg-slate-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {summary.outgoingPending}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Incoming Tab */}
        <TabsContent value="incoming" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-500">Loading incoming referrals...</span>
            </div>
          ) : filteredIncoming.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-white dark:bg-slate-800/40">
              <ArrowDownRight className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">No incoming referrals found</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
                  ? 'No incoming referrals match your current search and filters.'
                  : 'Referrals dispatched to your hospital by other medical centers will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredIncoming.map((referral) => renderReferralCard(referral, true))}
            </div>
          )}
        </TabsContent>

        {/* Outgoing Tab */}
        <TabsContent value="outgoing" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="ml-3 text-slate-500">Loading outgoing referrals...</span>
            </div>
          ) : filteredOutgoing.length === 0 ? (
            <div className="text-center py-12 border rounded-xl bg-white dark:bg-slate-800/40">
              <ArrowUpRight className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 dark:text-slate-200">No outgoing referrals found</p>
              <p className="text-sm text-slate-400 mt-1">
                {searchQuery || statusFilter !== 'all' || urgencyFilter !== 'all'
                  ? 'No outgoing referrals match your current search and filters.'
                  : 'Referrals sent by your hospital to higher specialized centers will appear here.'}
              </p>
              <Button onClick={handleOpenCreateDialog} className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Refer a Patient
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredOutgoing.map((referral) => renderReferralCard(referral, false))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Confirmation Modal */}
      <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionTarget?.newStatus === 'accepted' && <CheckCircle className="h-5 w-5 text-emerald-600" />}
              {actionTarget?.newStatus === 'rejected' && <XCircle className="h-5 w-5 text-rose-600" />}
              {actionTarget?.newStatus === 'completed' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
              {actionTarget?.newStatus === 'cancelled' && <X className="h-5 w-5 text-slate-600" />}
              {actionTarget?.title}
            </DialogTitle>
            <DialogDescription>{actionTarget?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label>
                {actionTarget?.newStatus === 'rejected'
                  ? 'Reason for Rejection *'
                  : 'Clinical / Administrative Remarks'}
              </Label>
              <Textarea
                placeholder={
                  actionTarget?.newStatus === 'rejected'
                    ? 'State why this referral cannot be accommodated (e.g. Bed unavailable, ICU full)...'
                    : 'Add notes (e.g. Admitted to Ward 3B, Dr. Chavan assigned)...'
                }
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionModal(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isUpdating || (actionTarget?.newStatus === 'rejected' && !actionNotes.trim())}
              className={cn(
                actionTarget?.newStatus === 'accepted' && 'bg-emerald-600 hover:bg-emerald-700 text-white',
                actionTarget?.newStatus === 'rejected' && 'bg-rose-600 hover:bg-rose-700 text-white',
                actionTarget?.newStatus === 'completed' && 'bg-blue-600 hover:bg-blue-700 text-white',
                actionTarget?.newStatus === 'cancelled' && 'bg-slate-700 hover:bg-slate-800 text-white'
              )}
            >
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm {actionTarget?.newStatus}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comprehensive Referral Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 overflow-hidden">
          {selectedReferral && (
            <>
              {/* Modal Header */}
              <DialogHeader className="bg-gradient-to-r from-emerald-700 via-teal-700 to-indigo-800 text-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
                      <FileText className="h-6 w-6 text-emerald-200" />
                      Referral Clinical Record
                    </DialogTitle>
                    <DialogDescription className="text-emerald-100 mt-1">
                      ID: {selectedReferral.referral_id}
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge className={cn('border-0 font-semibold', getUrgencyConfig(selectedReferral.urgency_level).badgeBg)}>
                      {selectedReferral.urgency_level === 'emergency' && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {selectedReferral.urgency_level.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={cn('text-xs font-semibold bg-white/90', getStatusConfig(selectedReferral.status).color)}>
                      {getStatusConfig(selectedReferral.status).label}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <ScrollArea className="max-h-[60vh] p-6 space-y-6">
                {/* Patient Information Card */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-sm">
                    <User className="h-4 w-4 text-emerald-600" />
                    <span>Patient Demographics</span>
                  </div>
                  <div className="rounded-xl border bg-slate-50 dark:bg-slate-800/60 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-400">Full Name</p>
                        <p className="font-bold text-slate-800 dark:text-white text-base">
                          {selectedReferral.citizen?.name || 'Unknown'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Citizen ID</p>
                        <p className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                          {selectedReferral.citizen_id}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Phone</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {selectedReferral.citizen?.phone || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Gender / Age</p>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {selectedReferral.citizen?.gender || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Transfer Route Card */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-sm">
                    <ArrowRightLeft className="h-4 w-4 text-emerald-600" />
                    <span>Inter-Hospital Transfer Route</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* From */}
                    <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-2 mb-2 text-slate-500">
                        <Building2 className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Sending Facility</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {selectedReferral.from_hospital?.name || selectedReferral.from_hospital_id}
                      </p>
                      {selectedReferral.from_hospital?.address && (
                        <p className="text-xs text-slate-500 mt-0.5">{selectedReferral.from_hospital.address}</p>
                      )}
                      {selectedReferral.referring_doctor && (
                        <div className="mt-3 pt-2.5 border-t text-xs">
                          <p className="text-slate-400">Referring Physician:</p>
                          <p className="font-semibold text-slate-700 dark:text-slate-200">
                            {selectedReferral.referring_doctor.name}
                          </p>
                          <p className="text-slate-500">
                            {selectedReferral.referring_doctor.designation} • {selectedReferral.referring_doctor.department}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* To */}
                    <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-2 mb-2 text-emerald-700">
                        <Building2 className="h-4 w-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Receiving Facility</span>
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white">
                        {selectedReferral.to_hospital?.name || selectedReferral.to_hospital_id}
                      </p>
                      {selectedReferral.to_hospital?.address && (
                        <p className="text-xs text-slate-500 mt-0.5">{selectedReferral.to_hospital.address}</p>
                      )}
                      {selectedReferral.to_doctor && (
                        <div className="mt-3 pt-2.5 border-t text-xs">
                          <p className="text-slate-400">Destination Specialist:</p>
                          <p className="font-semibold text-emerald-800 dark:text-emerald-200">
                            {selectedReferral.to_doctor.name}
                          </p>
                          <p className="text-slate-500">
                            {selectedReferral.to_doctor.designation} • {selectedReferral.to_doctor.department}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Reason & Clinical Notes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-semibold text-sm">
                    <Activity className="h-4 w-4 text-emerald-600" />
                    <span>Clinical Reason & Diagnostic Notes</span>
                  </div>
                  <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/40 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Primary Reason for Referral
                      </p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed bg-white dark:bg-slate-900 p-3 rounded-lg border">
                        {selectedReferral.referral_reason}
                      </p>
                    </div>
                    {selectedReferral.notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Clinical Notes & Transfer Remarks
                        </p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-amber-50/60 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200 dark:border-amber-900">
                          {selectedReferral.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Timeline */}
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      Created:{' '}
                      {selectedReferral.created_at
                        ? format(parseISO(selectedReferral.created_at), 'MMM dd, yyyy • hh:mm a')
                        : 'N/A'}
                    </span>
                  </div>
                  {selectedReferral.updated_at && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        Updated:{' '}
                        {format(parseISO(selectedReferral.updated_at), 'MMM dd, yyyy • hh:mm a')}
                      </span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Modal Footer with Actions */}
              <DialogFooter className="p-4 border-t bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                  Close
                </Button>

                {canApproveReferrals && (
                  <div className="flex items-center gap-2">
                    {selectedReferral.to_hospital_id === currentHospitalId && selectedReferral.status === 'pending' && (
                      <>
                        <Button
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            setShowDetailModal(false);
                            openActionDialog(selectedReferral, 'accepted');
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Accept Referral
                        </Button>
                        <Button
                          variant="outline"
                          className="text-rose-600 border-rose-300 hover:bg-rose-50"
                          onClick={() => {
                            setShowDetailModal(false);
                            openActionDialog(selectedReferral, 'rejected');
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Reject
                        </Button>
                      </>
                    )}

                    {selectedReferral.to_hospital_id === currentHospitalId && selectedReferral.status === 'accepted' && (
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setShowDetailModal(false);
                          openActionDialog(selectedReferral, 'completed');
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Mark as Completed
                      </Button>
                    )}

                    {selectedReferral.from_hospital_id === currentHospitalId && selectedReferral.status === 'pending' && (
                      <Button
                        variant="outline"
                        className="text-slate-600 border-slate-300 hover:bg-slate-100"
                        onClick={() => {
                          setShowDetailModal(false);
                          openActionDialog(selectedReferral, 'cancelled');
                        }}
                      >
                        <X className="h-4 w-4 mr-1.5" />
                        Cancel Referral
                      </Button>
                    )}
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Referral Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <Send className="h-5 w-5 text-emerald-600" />
              Initiate Patient Referral
            </DialogTitle>
            <DialogDescription>
              Refer a patient from {currentHospital?.name || 'this hospital'} to an affiliated specialist medical facility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* 1. Patient Selector */}
            <div className="space-y-2">
              <Label>Select Patient *</Label>
              {!selectedCitizen ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search patient by name, mobile, or Citizen ID..."
                    value={citizenSearch}
                    onChange={(e) => setCitizenSearch(e.target.value)}
                    className="pl-9"
                  />
                  {isSearchingCitizens && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                  )}

                  {citizenResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 border rounded-lg divide-y max-h-48 overflow-y-auto bg-white dark:bg-slate-900 shadow-xl z-50">
                      {citizenResults.map((c) => (
                        <button
                          key={c.citizen_id}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                          onClick={() => {
                            setSelectedCitizen(c);
                            setCitizenSearch('');
                            setCitizenResults([]);
                          }}
                        >
                          <div>
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{c.citizen_id} • {c.phone || 'No phone'}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">Select</Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-full text-emerald-700">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedCitizen.name}</p>
                      <p className="text-xs text-slate-500 font-mono">
                        {selectedCitizen.citizen_id} • {selectedCitizen.gender || 'N/A'} • {selectedCitizen.phone || 'No phone'}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedCitizen(null)}>
                    Change
                  </Button>
                </div>
              )}
            </div>

            {/* 2. Destination Hospital */}
            <div className="space-y-2">
              <Label>Destination Hospital *</Label>
              <Select
                value={createForm.to_hospital_id}
                onValueChange={(val) => setCreateForm((prev) => ({ ...prev, to_hospital_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select target hospital for referral..." />
                </SelectTrigger>
                <SelectContent>
                  {hospitalsList
                    .filter((h) => h.hospital_id !== currentHospitalId)
                    .map((h) => (
                      <SelectItem key={h.hospital_id} value={h.hospital_id}>
                        {h.name} ({h.type || 'Hospital'})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Urgency Level */}
            <div className="space-y-2">
              <Label>Urgency Level *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'urgent', 'emergency'] as UrgencyLevel[]).map((level) => {
                  const conf = getUrgencyConfig(level);
                  const isSelected = createForm.urgency_level === level;
                  return (
                    <button
                      type="button"
                      key={level}
                      onClick={() => setCreateForm((prev) => ({ ...prev, urgency_level: level }))}
                      className={cn(
                        'flex items-center justify-center gap-1.5 p-2.5 rounded-lg border text-sm font-semibold transition-all',
                        isSelected
                          ? `${conf.bgColor} ${conf.color} ${conf.borderColor} ring-2 ring-emerald-500`
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', conf.dotColor)} />
                      {conf.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Referring Doctor & Destination Doctor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Referring Staff</Label>
                <Select
                  value={createForm.referring_doctor_id}
                  onValueChange={(val) => setCreateForm((prev) => ({ ...prev, referring_doctor_id: val }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select physician..." />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((st) => (
                      <SelectItem key={st.staff_uuid} value={st.staff_uuid}>
                        {st.name} ({st.designation || st.department || 'Staff'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Destination Department/Doctor (Optional)</Label>
                <Input
                  placeholder="e.g. Cardiology ICU, Dr. Patil"
                  value={createForm.to_doctor_id}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, to_doctor_id: e.target.value }))}
                />
              </div>
            </div>

            {/* 5. Referral Reason */}
            <div className="space-y-2">
              <Label>Primary Medical Reason for Referral *</Label>
              <Textarea
                placeholder="e.g. Suspected acute myocardial infarction requiring urgent catheterization and tertiary ICU bed..."
                value={createForm.referral_reason}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, referral_reason: e.target.value }))}
                rows={3}
              />
            </div>

            {/* 6. Clinical Notes */}
            <div className="space-y-2">
              <Label>Clinical Notes & Vitals (Optional)</Label>
              <Textarea
                placeholder="Patient stable on supplemental O2, BP: 130/85, current meds: Aspirin 75mg, ECG attached with patient..."
                value={createForm.notes}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateReferral}
              disabled={isSubmitting || !selectedCitizen || !createForm.to_hospital_id || !createForm.referral_reason.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Dispatch Referral
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
