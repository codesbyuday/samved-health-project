'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  complaintService,
  type Complaint,
  type Citizen,
  type Hospital,
} from '@/services/database';
import {
  Search,
  Filter,
  MessageSquareWarning,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  ArrowUpRight,
  Send,
  SearchX,
  Loader2,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

// Extended status config to handle all possible statuses with dark mode support
const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  submitted: {
    color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    icon: <Clock className="h-3 w-3" />,
  },
  pending: {
    color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    icon: <Clock className="h-3 w-3" />,
  },
  under_review: {
    color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-700',
    icon: <Search className="h-3 w-3" />,
  },
  in_progress: {
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    icon: <ArrowUpRight className="h-3 w-3" />,
  },
  resolved: {
    color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  escalated: {
    color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const priorityConfig: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  medium: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  high: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

export default function ComplaintResolution() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch complaints from database
  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await complaintService.getAll();
      if (error) {
        console.error('Error fetching complaints:', error);
      } else {
        setComplaints(data || []);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((complaint) => {
      const citizenName = complaint.citizen?.name?.toLowerCase() || '';
      const complaintId = complaint.complaint_id?.toLowerCase() || '';
      const description = complaint.description?.toLowerCase() || '';
      const hospitalName = complaint.hospital?.name?.toLowerCase() || '';
      
      const matchesSearch =
        citizenName.includes(searchQuery.toLowerCase()) ||
        complaintId.includes(searchQuery.toLowerCase()) ||
        description.includes(searchQuery.toLowerCase()) ||
        hospitalName.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchQuery, statusFilter]);

  const complaintSummary = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter((c) => c.status === 'pending' || c.status === 'submitted').length,
      inProgress: complaints.filter((c) => c.status === 'in_progress' || c.status === 'under_review').length,
      resolved: complaints.filter((c) => c.status === 'resolved').length,
      escalated: complaints.filter((c) => c.status === 'escalated').length,
    };
  }, [complaints]);

  const handleRespond = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setResponseText(complaint.remarks_by_officers || '');
    setSelectedStatus(complaint.status || 'pending');
    setShowResponseDialog(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedComplaint) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await complaintService.update(selectedComplaint.complaint_id, {
        status: selectedStatus,
        remarks_by_officers: responseText,
      });
      
      if (error) {
        console.error('Error updating complaint:', error);
      } else {
        // Refresh complaints list
        fetchComplaints();
        setShowResponseDialog(false);
        setSelectedComplaint(null);
        setResponseText('');
        setSelectedStatus('');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe function to get status config
  const getStatusConfig = (status: string | null) => {
    if (!status) return {
      color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
      icon: <Clock className="h-3 w-3" />,
    };
    return statusConfig[status] || {
      color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
      icon: <Clock className="h-3 w-3" />,
    };
  };

  // Format status for display
  const formatStatus = (status: string | null) => {
    if (!status) return 'N/A';
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Complaint Resolution</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage and resolve citizen complaints
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-slate-500 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{complaintSummary.total}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{complaintSummary.pending}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-600 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">In Progress</p>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{complaintSummary.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{complaintSummary.resolved}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Escalated</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{complaintSummary.escalated}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by complaint ID, citizen name, description, or hospital..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px] dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-700">
                <SelectItem value="all" className="dark:text-white dark:focus:bg-slate-600">All Status</SelectItem>
                <SelectItem value="submitted" className="dark:text-white dark:focus:bg-slate-600">Submitted</SelectItem>
                <SelectItem value="pending" className="dark:text-white dark:focus:bg-slate-600">Pending</SelectItem>
                <SelectItem value="under_review" className="dark:text-white dark:focus:bg-slate-600">Under Review</SelectItem>
                <SelectItem value="in_progress" className="dark:text-white dark:focus:bg-slate-600">In Progress</SelectItem>
                <SelectItem value="resolved" className="dark:text-white dark:focus:bg-slate-600">Resolved</SelectItem>
                <SelectItem value="escalated" className="dark:text-white dark:focus:bg-slate-600">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <SearchX className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No complaints found matching your search.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <TableHead className="font-semibold dark:text-slate-300">Complaint ID</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Citizen</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Issue</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Category</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Priority</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Hospital</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Submitted</TableHead>
                  <TableHead className="font-semibold dark:text-slate-300">Status</TableHead>
                  <TableHead className="font-semibold text-center dark:text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComplaints.map((complaint) => {
                  const status = getStatusConfig(complaint.status);
                  return (
                    <TableRow key={complaint.complaint_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <TableCell className="font-mono text-sm dark:text-slate-300">{complaint.complaint_id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">{complaint.citizen?.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{complaint.citizen?.phone || 'N/A'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 max-w-[200px]">
                          {complaint.description || 'N/A'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="dark:bg-slate-700 dark:text-slate-300 capitalize">
                          {complaint.category?.replace(/_/g, ' ') || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('capitalize', priorityConfig[complaint.priority?.toLowerCase() || ''] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300')}
                        >
                          {complaint.priority || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {complaint.hospital?.name || 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm dark:text-slate-300">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {complaint.created_at ? format(new Date(complaint.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'flex items-center gap-1 w-fit capitalize',
                            status.color
                          )}
                        >
                          {status.icon}
                          {formatStatus(complaint.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                            onClick={() => handleRespond(complaint)}
                            title="Respond to complaint"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Respond
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-lg dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Respond to Complaint</DialogTitle>
            <DialogDescription className="dark:text-slate-400">
              {selectedComplaint?.complaint_id} - {selectedComplaint?.citizen?.name || 'Unknown Citizen'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Complaint Details */}
            {selectedComplaint && (
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-medium dark:text-white">{selectedComplaint.citizen?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">{selectedComplaint.citizen?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {selectedComplaint.citizen?.address || 'N/A'}
                    {selectedComplaint.citizen?.ward_number && ` (Ward ${selectedComplaint.citizen.ward_number})`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">{selectedComplaint.hospital?.name || 'N/A'}</span>
                </div>
                <div className="pt-2 border-t dark:border-slate-600 mt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Description:</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{selectedComplaint.description || 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="dark:text-white">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-700">
                  <SelectItem value="submitted" className="dark:text-white dark:focus:bg-slate-600">Submitted</SelectItem>
                  <SelectItem value="pending" className="dark:text-white dark:focus:bg-slate-600">Pending</SelectItem>
                  <SelectItem value="under_review" className="dark:text-white dark:focus:bg-slate-600">Under Review</SelectItem>
                  <SelectItem value="in_progress" className="dark:text-white dark:focus:bg-slate-600">In Progress</SelectItem>
                  <SelectItem value="resolved" className="dark:text-white dark:focus:bg-slate-600">Resolved</SelectItem>
                  <SelectItem value="escalated" className="dark:text-white dark:focus:bg-slate-600">Escalated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-white">Remarks / Response</Label>
              <Textarea
                placeholder="Enter your response or remarks..."
                rows={4}
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                className="dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowResponseDialog(false);
                setSelectedComplaint(null);
              }} 
              className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Response'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
