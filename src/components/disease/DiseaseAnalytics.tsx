'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  RefreshCw,
  Calendar,
  MapPin,
  TrendingUp,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  User,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { supabase } from '@/lib/supabase';

// Types
interface DiseaseCase {
  case_id: string;
  hospital_id: string | null;
  citizen_id: string | null;
  disease_id: string | null;
  report_date: string | null;
  severity: string | null;
  status: string | null;
  reported_by: string | null;
  diseases: {
    disease_id: string;
    disease_name: string;
    disease_category: string;
  } | null;
  citizens: {
    citizen_id: string;
    name: string;
  } | null;
  hospitals: {
    hospital_id: string;
    name: string;
    ward_id: number;
    wards: {
      ward_id: number;
      ward_name: string;
    } | null;
  } | null;
  hospital_staff: {
    name: string;
    designation: string;
    department: string;
  } | null;
}

interface Disease {
  disease_id: string;
  disease_name: string | null;
  disease_category: string | null;
}

interface Ward {
  ward_id: number;
  ward_name: string | null;
}

interface Hospital {
  hospital_id: string;
  name: string | null;
}

const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#6366F1'];

const severityColors: Record<string, string> = {
  mild: 'bg-green-100 text-green-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  severe: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const statusColors: Record<string, string> = {
  under_treatment: 'bg-blue-100 text-blue-700',
  recovered: 'bg-green-100 text-green-700',
  referred: 'bg-purple-100 text-purple-700',
  deceased: 'bg-slate-100 text-slate-700',
};

export default function DiseaseAnalytics() {
  // Data states
  const [cases, setCases] = useState<DiseaseCase[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedDisease, setSelectedDisease] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(true);

  // Dialog states
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<DiseaseCase | null>(null);

  // Chart view states
  const [diseaseChartType, setDiseaseChartType] = useState<'bar' | 'pie'>('bar');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Fetch all data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch disease cases with all joins
      const { data: casesData, error: casesError } = await supabase
        .from('disease_cases')
        .select(`
          case_id,
          hospital_id,
          citizen_id,
          disease_id,
          report_date,
          severity,
          status,
          reported_by,
          diseases (disease_id, disease_name, disease_category),
          citizens (name),
          hospitals (hospital_id, name, ward_id, wards (ward_id, ward_name)),
          hospital_staff!reported_by (name, designation, department)
        `)
        .order('report_date', { ascending: false });

      if (casesError) throw casesError;
      setCases(casesData || []);

      // Fetch diseases
      const { data: diseasesData } = await supabase
        .from('diseases')
        .select('disease_id, disease_name, disease_category')
        .order('disease_name');
      setDiseases(diseasesData || []);

      // Fetch wards
      const { data: wardsData } = await supabase
        .from('wards')
        .select('ward_id, ward_name')
        .order('ward_id');
      setWards(wardsData || []);

      // Fetch hospitals
      const { data: hospitalsData } = await supabase
        .from('hospitals')
        .select('hospital_id, name')
        .order('name');
      setHospitals(hospitalsData || []);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter cases
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Date filter
      if (dateFrom && c.report_date) {
        const reportDate = new Date(c.report_date);
        const from = startOfDay(new Date(dateFrom));
        if (reportDate < from) return false;
      }
      if (dateTo && c.report_date) {
        const reportDate = new Date(c.report_date);
        const to = endOfDay(new Date(dateTo));
        if (reportDate > to) return false;
      }

      // Disease filter
      if (selectedDisease !== 'all' && c.disease_id !== selectedDisease) return false;

      // Ward filter
      if (selectedWard !== 'all' && c.hospitals?.ward_id?.toString() !== selectedWard) return false;

      // Hospital filter
      if (selectedHospital !== 'all' && c.hospital_id !== selectedHospital) return false;

      // Status filter
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;

      // Severity filter
      if (selectedSeverity !== 'all' && c.severity !== selectedSeverity) return false;

      return true;
    });
  }, [cases, dateFrom, dateTo, selectedDisease, selectedWard, selectedHospital, selectedStatus, selectedSeverity]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCases.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCases, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, selectedDisease, selectedWard, selectedHospital, selectedStatus, selectedSeverity]);

  // Disease Distribution Data
  const diseaseDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredCases.forEach((c) => {
      const name = c.diseases?.disease_name || 'Unknown';
      distribution[name] = (distribution[name] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredCases]);

  // Ward-wise Distribution Data
  const wardDistributionData = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredCases.forEach((c) => {
      const name = c.hospitals?.wards?.ward_name || `Ward ${c.hospitals?.ward_id}` || 'Unknown';
      distribution[name] = (distribution[name] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredCases]);

  // Trend Analysis Data (Line Chart) - MOST IMPORTANT
  const trendData = useMemo(() => {
    const dailyCases: Record<string, { date: string; total: number; mild: number; moderate: number; severe: number; critical: number }> = {};

    filteredCases.forEach((c) => {
      if (c.report_date) {
        const dateKey = format(new Date(c.report_date), 'yyyy-MM-dd');
        if (!dailyCases[dateKey]) {
          dailyCases[dateKey] = { date: dateKey, total: 0, mild: 0, moderate: 0, severe: 0, critical: 0 };
        }
        dailyCases[dateKey].total++;
        const severity = c.severity || 'mild';
        if (severity === 'mild') dailyCases[dateKey].mild++;
        else if (severity === 'moderate') dailyCases[dateKey].moderate++;
        else if (severity === 'severe') dailyCases[dateKey].severe++;
        else if (severity === 'critical') dailyCases[dateKey].critical++;
      }
    });

    return Object.values(dailyCases)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-60); // Last 60 days
  }, [filteredCases]);

  // Severity Distribution for drill-down
  const severityDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredCases.forEach((c) => {
      const severity = c.severity || 'unknown';
      distribution[severity] = (distribution[severity] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredCases]);

  // Status Distribution for drill-down
  const statusDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredCases.forEach((c) => {
      const status = c.status || 'unknown';
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredCases]);

  // Disease-specific trend for drill-down
  const diseaseTrendData = useMemo(() => {
    if (!selectedCase?.disease_id) return [];

    const diseaseCases = cases.filter(c => c.disease_id === selectedCase.disease_id);
    const dailyCases: Record<string, { date: string; count: number }> = {};

    diseaseCases.forEach((c) => {
      if (c.report_date) {
        const dateKey = format(new Date(c.report_date), 'yyyy-MM-dd');
        dailyCases[dateKey] = { date: dateKey, count: (dailyCases[dateKey]?.count || 0) + 1 };
      }
    });

    return Object.values(dailyCases)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
  }, [cases, selectedCase]);

  // Disease trend by disease for drill-down
  const diseaseWardData = useMemo(() => {
    if (!selectedCase?.disease_id) return [];

    const diseaseCases = cases.filter(c => c.disease_id === selectedCase.disease_id);
    const wardDistribution: Record<string, number> = {};

    diseaseCases.forEach((c) => {
      const name = c.hospitals?.wards?.ward_name || `Ward ${c.hospitals?.ward_id}` || 'Unknown';
      wardDistribution[name] = (wardDistribution[name] || 0) + 1;
    });

    return Object.entries(wardDistribution)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [cases, selectedCase]);

  // Handle view details
  const handleViewDetails = (caseItem: DiseaseCase) => {
    setSelectedCase(caseItem);
    setShowDetailDialog(true);
  };

  // Clear all filters
  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedDisease('all');
    setSelectedWard('all');
    setSelectedHospital('all');
    setSelectedStatus('all');
    setSelectedSeverity('all');
  };

  const hasActiveFilters = dateFrom || dateTo || selectedDisease !== 'all' ||
    selectedWard !== 'all' || selectedHospital !== 'all' || selectedStatus !== 'all' || selectedSeverity !== 'all';

  // Calculate most affected ward
  const mostAffectedWard = wardDistributionData[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-2 text-slate-600">Loading disease data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-600" />
          <p className="mt-2 text-red-600">{error}</p>
          <Button onClick={fetchData} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Disease Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Deep analysis and investigation tool for disease surveillance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Active Filters Alert */}
      {hasActiveFilters && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
          <Filter className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-blue-800">Filters Applied</p>
            <p className="text-sm text-blue-700 mt-1">
              Showing {filteredCases.length} of {cases.length} records
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        </div>
      )}

      {/* Advanced Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Date From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Date To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Disease</Label>
                <Select value={selectedDisease} onValueChange={setSelectedDisease}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Diseases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Diseases</SelectItem>
                    {diseases.map((d) => (
                      <SelectItem key={d.disease_id} value={d.disease_id}>
                        {d.disease_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Ward</Label>
                <Select value={selectedWard} onValueChange={setSelectedWard}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Wards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {wards.map((w) => (
                      <SelectItem key={w.ward_id} value={w.ward_id.toString()}>
                        {w.ward_name || `Ward ${w.ward_id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Hospital</Label>
                <Select value={selectedHospital} onValueChange={setSelectedHospital}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Hospitals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hospitals</SelectItem>
                    {hospitals.map((h) => (
                      <SelectItem key={h.hospital_id} value={h.hospital_id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-500">Severity</Label>
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Trend Analysis - MOST IMPORTANT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Trend Analysis
            <Badge variant="outline" className="font-normal">Last 60 Days</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    stroke="#6B7280"
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#6B7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Total Cases"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="severe"
                    name="Severe"
                    stroke="#EF4444"
                    strokeWidth={1.5}
                    dot={{ r: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="critical"
                    name="Critical"
                    stroke="#7C3AED"
                    strokeWidth={1.5}
                    dot={{ r: 1 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No trend data available for the selected filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Disease Distribution */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                {diseaseChartType === 'bar' ? <BarChart3 className="h-5 w-5" /> : <PieChartIcon className="h-5 w-5" />}
                Disease Distribution
              </CardTitle>
              <div className="flex gap-1">
                <Button
                  variant={diseaseChartType === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDiseaseChartType('bar')}
                  className="h-8"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={diseaseChartType === 'pie' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDiseaseChartType('pie')}
                  className="h-8"
                >
                  <PieChartIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {diseaseDistributionData.length > 0 ? (
              diseaseChartType === 'bar' ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={diseaseDistributionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" stroke="#6B7280" fontSize={12} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#6B7280"
                        fontSize={12}
                        width={120}
                        tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" name="Cases" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={diseaseDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name.slice(0, 10)} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {diseaseDistributionData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500">
                No disease data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ward-wise Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Ward-wise Analysis
              {mostAffectedWard && (
                <Badge variant="destructive" className="ml-2">
                  Hotspot: {mostAffectedWard.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wardDistributionData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wardDistributionData.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      stroke="#6B7280"
                      fontSize={12}
                      tickFormatter={(value) => value.length > 8 ? `${value.slice(0, 8)}...` : value}
                    />
                    <YAxis stroke="#6B7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" name="Cases" radius={[4, 4, 0, 0]}>
                      {wardDistributionData.slice(0, 10).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? '#EF4444' : COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500">
                No ward data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Severity & Status Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {severityDistribution.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {severityDistribution.map((entry, index) => {
                        const color = 
                          entry.name === 'mild' ? '#22C55E' :
                          entry.name === 'moderate' ? '#EAB308' :
                          entry.name === 'severe' ? '#F97316' :
                          entry.name === 'critical' ? '#EF4444' : COLORS[index % COLORS.length];
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDistribution.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name?.replace('_', ' ')}: ${value}`}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => {
                        const color = 
                          entry.name === 'recovered' ? '#22C55E' :
                          entry.name === 'under_treatment' ? '#3B82F6' :
                          entry.name === 'referred' ? '#8B5CF6' :
                          entry.name === 'deceased' ? '#6B7280' : COLORS[index % COLORS.length];
                        return <Cell key={`cell-${index}`} fill={color} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500">No data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Disease Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Recent Disease Reports
            <Badge variant="secondary" className="ml-2">
              {filteredCases.length} records
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCases.length > 0 ? (
            <>
              {/* Horizontal Scrollable Table */}
              <div className="overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold whitespace-nowrap min-w-[180px]">Citizen Name</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap min-w-[150px]">Disease</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap min-w-[120px]">Ward</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap min-w-[180px]">Hospital</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap min-w-[150px]">Doctor</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap min-w-[100px]">Severity</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap min-w-[130px]">Status</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap min-w-[130px]">Report Date</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCases.map((caseItem) => (
                      <TableRow key={caseItem.case_id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                            {caseItem.citizens?.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 whitespace-nowrap">
                            {caseItem.diseases?.disease_name || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            {caseItem.hospitals?.wards?.ward_name || `Ward ${caseItem.hospitals?.ward_id}` || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Building className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            {caseItem.hospitals?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">
                            <p className="text-sm">{caseItem.hospital_staff?.name || 'N/A'}</p>
                            <p className="text-xs text-slate-500">{caseItem.hospital_staff?.department || ''}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('capitalize whitespace-nowrap', severityColors[caseItem.severity || 'mild'])}
                          >
                            {caseItem.severity || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn('capitalize whitespace-nowrap', statusColors[caseItem.status || 'unknown'])}
                          >
                            {(caseItem.status || 'N/A').replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            {caseItem.report_date ? format(new Date(caseItem.report_date), 'MMM dd, yyyy') : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(caseItem)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                <div className="text-sm text-slate-600">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredCases.length)}</span> of{' '}
                  <span className="font-medium">{filteredCases.length}</span> records
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="hidden sm:flex"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {/* Page Numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-9 h-9 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="hidden sm:flex"
                  >
                    Last
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">
              No disease reports found matching your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog (Drill-down) */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">Disease Case Analysis</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-6 overflow-y-auto">
            {selectedCase && (
              <div className="space-y-4 pb-4">
                {/* Patient & Disease Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-500">Patient Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Name:</span>
                        <span className="font-medium text-right truncate">{selectedCase.citizens?.name || 'N/A'}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-slate-500">Case Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Disease:</span>
                        <Badge className="bg-red-50 text-red-700 truncate max-w-[150px]">{selectedCase.diseases?.disease_name || 'N/A'}</Badge>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Category:</span>
                        <span className="font-medium capitalize">{selectedCase.diseases?.disease_category || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Severity:</span>
                        <Badge className={cn('capitalize', severityColors[selectedCase.severity || 'mild'])}>
                          {selectedCase.severity || 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Status:</span>
                        <Badge className={cn('capitalize', statusColors[selectedCase.status || 'unknown'])}>
                          {(selectedCase.status || 'N/A').replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Location & Hospital */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500">Location & Treatment</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Ward:</span>
                        <span className="font-medium text-right">{selectedCase.hospitals?.wards?.ward_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Hospital:</span>
                        <span className="font-medium text-right truncate max-w-[180px]">{selectedCase.hospitals?.name || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Doctor:</span>
                        <span className="font-medium text-right">{selectedCase.hospital_staff?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-500 flex-shrink-0">Department:</span>
                        <span className="font-medium text-right">{selectedCase.hospital_staff?.department || 'N/A'}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Disease Trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500">
                      {selectedCase.diseases?.disease_name} - Trend Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {diseaseTrendData.length > 0 ? (
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={diseaseTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                              dataKey="date"
                              stroke="#6B7280"
                              fontSize={11}
                              tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                            />
                            <YAxis stroke="#6B7280" fontSize={11} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                fontSize: '12px',
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="count"
                              name="Cases"
                              stroke="#EF4444"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                        No trend data available for this disease
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ward Distribution for this disease */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-500">Ward Distribution for this Disease</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {diseaseWardData.length > 0 ? (
                      <div className="h-[180px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={diseaseWardData.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis
                              dataKey="name"
                              stroke="#6B7280"
                              fontSize={10}
                              tickFormatter={(value) => value.length > 8 ? `${value.slice(0, 8)}...` : value}
                            />
                            <YAxis stroke="#6B7280" fontSize={10} />
                            <Tooltip 
                              contentStyle={{
                                fontSize: '12px',
                              }}
                            />
                            <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[180px] flex items-center justify-center text-slate-500 text-sm">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end border-t px-6 py-4 flex-shrink-0">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
