'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
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
  XCircle,
  Loader2,
  Phone,
  Calendar,
  FileText,
  UserCheck,
  ArrowRight,
  Activity,
  Stethoscope,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { referralService } from '@/services/database';

// Referral type
interface Referral {
  referral_id: string;
  citizen_id: string;
  referring_doctor_id: string;
  from_hospital_id: string;
  to_hospital_id: string;
  to_doctor_id?: string;
  referral_reason: string;
  urgency_level: 'normal' | 'urgent' | 'emergency';
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  created_at: string;
  notes?: string;
  updated_at?: string;
  citizen?: {
    citizen_id: string;
    name: string;
    phone?: string;
    gender?: string;
    date_of_birth?: string;
  };
  from_hospital?: {
    hospital_id: string;
    name: string;
  };
  to_hospital?: {
    hospital_id: string;
    name: string;
  };
  referring_doctor?: {
    staff_id: string;
    name: string;
    designation?: string;
  };
  to_doctor?: {
    staff_id: string;
    name: string;
    designation?: string;
  };
}

// Urgency colors
const getUrgencyColor = (urgency: string): string => {
  switch (urgency) {
    case 'emergency':
      return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700';
    case 'urgent':
      return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700';
    default:
      return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700';
  }
};

// Status colors
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'accepted':
      return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400';
    case 'rejected':
      return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400';
    case 'completed':
      return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400';
    case 'cancelled':
      return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-400';
    default:
      return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400';
  }
};

export default function ReferralManagement() {
  // State
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [outgoingReferrals, setOutgoingReferrals] = useState<Referral[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<Referral[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load referrals
  const loadReferrals = useCallback(async () => {
    setIsLoading(true);
    try {
      const [outgoingResult, incomingResult] = await Promise.all([
        referralService.getOutgoing(),
        referralService.getIncoming(),
      ]);

      if (outgoingResult.data) {
        setOutgoingReferrals(outgoingResult.data);
      }
      if (incomingResult.data) {
        setIncomingReferrals(incomingResult.data);
      }
    } catch (error) {
      console.error('Error loading referrals:', error);
      toast.error('Failed to load referrals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReferrals();
  }, [loadReferrals]);

  // Handle view detail
  const handleViewDetail = (referral: Referral) => {
    setSelectedReferral(referral);
    setShowDetailModal(true);
  };

  // Handle accept referral
  const handleAccept = async (referralId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await referralService.updateStatus(referralId, 'accepted');
      if (error) {
        toast.error(error);
      } else {
        toast.success('Referral accepted successfully');
        loadReferrals();
        setShowDetailModal(false);
      }
    } catch (error) {
      toast.error('Failed to accept referral');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle reject referral
  const handleReject = async (referralId: string) => {
    setIsUpdating(true);
    try {
      const { error } = await referralService.updateStatus(referralId, 'rejected');
      if (error) {
        toast.error(error);
      } else {
        toast.success('Referral rejected');
        loadReferrals();
        setShowDetailModal(false);
      }
    } catch (error) {
      toast.error('Failed to reject referral');
    } finally {
      setIsUpdating(false);
    }
  };

  // Render referral card
  const renderReferralCard = (referral: Referral, isIncoming: boolean) => {
    const isUrgent = referral.urgency_level === 'urgent' || referral.urgency_level === 'emergency';
    
    return (
      <Card
        key={referral.referral_id}
        className={cn(
          'cursor-pointer transition-all hover:shadow-md',
          isUrgent && 'border-l-4 border-l-red-500'
        )}
        onClick={() => handleViewDetail(referral)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Patient Name */}
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-semibold text-slate-800 dark:text-white">
                  {referral.citizen?.name || 'Unknown Patient'}
                </span>
                <Badge variant="outline" className={cn('ml-auto', getUrgencyColor(referral.urgency_level))}>
                  {referral.urgency_level.charAt(0).toUpperCase() + referral.urgency_level.slice(1)}
                </Badge>
              </div>

              {/* Hospitals */}
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mb-2">
                <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">
                  {referral.from_hospital?.name || 'Unknown Hospital'}
                </span>
                <ArrowRightLeft className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate font-medium">
                  {referral.to_hospital?.name || 'Unknown Hospital'}
                </span>
              </div>

              {/* Reason preview */}
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                {referral.referral_reason}
              </p>

              {/* Date */}
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                <span>
                  {referral.created_at
                    ? format(parseISO(referral.created_at), 'MMM dd, yyyy HH:mm')
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={getStatusColor(referral.status)}>
                {referral.status.charAt(0).toUpperCase() + referral.status.slice(1)}
              </Badge>

              {/* Action buttons for incoming pending referrals */}
              {isIncoming && referral.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-green-600 hover:bg-green-50 border-green-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccept(referral.referral_id);
                    }}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-red-600 hover:bg-red-50 border-red-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReject(referral.referral_id);
                    }}
                    disabled={isUpdating}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render empty state
  const renderEmptyState = (type: 'outgoing' | 'incoming') => (
    <div className="text-center py-12">
      <ArrowRightLeft className="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-600 mb-2">
        No {type} referrals
      </h3>
      <p className="text-sm text-slate-400">
        {type === 'outgoing'
          ? 'Referrals sent from your hospital will appear here'
          : 'Referrals sent to your hospital will appear here'}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Referrals</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage patient referrals between hospitals
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              {outgoingReferrals.filter(r => r.status === 'pending').length + incomingReferrals.filter(r => r.status === 'pending').length} Pending
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'outgoing' | 'incoming')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="outgoing" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Outgoing ({outgoingReferrals.length})
          </TabsTrigger>
          <TabsTrigger value="incoming" className="gap-2">
            <ArrowDownRight className="h-4 w-4" />
            Incoming ({incomingReferrals.length})
          </TabsTrigger>
        </TabsList>

        {/* Outgoing Tab */}
        <TabsContent value="outgoing" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : outgoingReferrals.length === 0 ? (
            renderEmptyState('outgoing')
          ) : (
            <div className="grid gap-4">
              {outgoingReferrals.map((referral) => renderReferralCard(referral, false))}
            </div>
          )}
        </TabsContent>

        {/* Incoming Tab */}
        <TabsContent value="incoming" className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : incomingReferrals.length === 0 ? (
            renderEmptyState('incoming')
          ) : (
            <div className="grid gap-4">
              {incomingReferrals.map((referral) => renderReferralCard(referral, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0">
          {/* Header with gradient background */}
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 text-white p-6 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                  Referral Details
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-1">
                  Complete referral information and actions
                </DialogDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={cn('text-white border-0', getStatusColor(selectedReferral?.status || ''))}>
                  {selectedReferral?.status?.charAt(0).toUpperCase() + selectedReferral?.status?.slice(1)}
                </Badge>
                <Badge className={cn('text-white border-0', getUrgencyColor(selectedReferral?.urgency_level || ''))}>
                  {selectedReferral?.urgency_level === 'emergency' && <AlertTriangle className="h-3 w-3 mr-1" />}
                  {selectedReferral?.urgency_level?.charAt(0).toUpperCase() + selectedReferral?.urgency_level?.slice(1)} Priority
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Content */}
          <ScrollArea className="max-h-[60vh]">
            {selectedReferral && (
              <div className="p-6 space-y-6">
                {/* Patient Information Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <User className="h-4 w-4 text-blue-500" />
                    <span>Patient Information</span>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Full Name</p>
                        <p className="font-semibold text-slate-800 dark:text-white text-lg">
                          {selectedReferral.citizen?.name || 'Unknown'}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Phone Number</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-slate-400" />
                          <p className="font-medium text-slate-700 dark:text-slate-200">
                            {selectedReferral.citizen?.phone || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Patient ID</p>
                        <p className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">
                          {selectedReferral.citizen_id}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">Gender</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {selectedReferral.citizen?.gender || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Transfer Flow Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                    <span>Transfer Flow</span>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      {/* From Hospital */}
                      <div className="flex-1">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-slate-400" />
                            <span className="text-xs text-slate-400 uppercase tracking-wide">From</span>
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {selectedReferral.from_hospital?.name || 'Unknown Hospital'}
                          </p>
                          {selectedReferral.referring_doctor && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-blue-500" />
                                <div>
                                  <p className="text-xs text-slate-400">Referring Staff</p>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {selectedReferral.referring_doctor.name}
                                  </p>
                                  {selectedReferral.referring_doctor.designation && (
                                    <p className="text-xs text-slate-400">
                                      {selectedReferral.referring_doctor.designation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="px-4 flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900">
                          <ArrowRight className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      {/* To Hospital */}
                      <div className="flex-1">
                        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-blue-300 dark:border-blue-700 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-5 w-5 text-blue-500" />
                            <span className="text-xs text-blue-500 uppercase tracking-wide">To</span>
                          </div>
                          <p className="font-semibold text-slate-800 dark:text-white">
                            {selectedReferral.to_hospital?.name || 'Unknown Hospital'}
                          </p>
                          {selectedReferral.to_doctor && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-green-500" />
                                <div>
                                  <p className="text-xs text-slate-400">Destination Doctor</p>
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {selectedReferral.to_doctor.name}
                                  </p>
                                  {selectedReferral.to_doctor.designation && (
                                    <p className="text-xs text-slate-400">
                                      {selectedReferral.to_doctor.designation}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Reason & Notes Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>Reason & Clinical Notes</span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-red-500" />
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Referral Reason</p>
                        </div>
                        <p className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 rounded-lg p-3 text-sm leading-relaxed">
                          {selectedReferral.referral_reason}
                        </p>
                      </div>
                      {selectedReferral.notes && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-amber-500" />
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Additional Notes</p>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-sm leading-relaxed border border-amber-100 dark:border-amber-800">
                            {selectedReferral.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Timeline Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>Timeline</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Created</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {selectedReferral.created_at
                            ? format(parseISO(selectedReferral.created_at), 'MMM dd, yyyy • hh:mm a')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    {selectedReferral.updated_at && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Last Updated</p>
                          <p className="font-medium text-slate-700 dark:text-slate-200">
                            {format(parseISO(selectedReferral.updated_at), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Footer Actions */}
          {activeTab === 'incoming' && selectedReferral?.status === 'pending' && (
            <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg">
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-200 dark:shadow-green-900"
                  onClick={() => handleAccept(selectedReferral.referral_id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Accept Referral
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                  onClick={() => handleReject(selectedReferral.referral_id)}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
