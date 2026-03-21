'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { dashboardService } from '@/services/database';
import { Loader2 } from 'lucide-react';

const COLORS = ['#1E88E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Custom tooltip component with proper styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-lg px-3 py-2">
        <p className="text-white font-medium text-sm mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="text-white font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PatientVisitsChart() {
  const [data, setData] = useState<{ date: string; patients: number; emergencies: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: result } = await dashboardService.getPatientVisitsData();
    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Patient Load Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Patient Load Trends</CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400">Last 7 days</p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1E88E5" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorEmergencies" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey="patients"
                name="OPD Patients"
                stroke="#1E88E5"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPatients)"
              />
              <Area
                type="monotone"
                dataKey="emergencies"
                name="Emergency"
                stroke="#EF4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEmergencies)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom tooltip for bar chart
const BarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-lg px-3 py-2">
        <p className="text-white font-medium text-sm">{label}</p>
        <p className="text-sm text-blue-400">
          Cases: <span className="text-white font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function DiseaseTrendsChart() {
  const [data, setData] = useState<{ name: string; cases: number; trend: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: result } = await dashboardService.getDiseaseTrends();
    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Disease Reporting Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Disease Reporting Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-slate-500">
            No disease data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Disease Reporting Trends</CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400">Top diseases by case count</p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis type="number" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value.length > 15 ? `${value.slice(0, 15)}...` : value}
              />
              <Tooltip content={<BarTooltip />} />
              <Bar dataKey="cases" name="Cases" radius={[0, 4, 4, 0]}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom tooltip for pie chart
const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-lg px-3 py-2">
        <p className="text-white font-medium text-sm">
          {payload[0].name}: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function BedOccupancyChart() {
  const [data, setData] = useState<{
    general: { total: number; occupied: number; available: number; percentage: number };
    icu: { total: number; occupied: number; available: number; percentage: number };
    emergency: { total: number; occupied: number; available: number; percentage: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: result } = await dashboardService.getBedOccupancyData();
    if (result) {
      setData(result);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Bed Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Bed Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] flex items-center justify-center text-slate-500">
            No bed data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const generalChartData = [
    { name: 'Occupied', value: data.general.occupied, color: '#EF4444' },
    { name: 'Available', value: data.general.available, color: '#10B981' },
  ];

  const icuChartData = [
    { name: 'Occupied', value: data.icu.occupied, color: '#F59E0B' },
    { name: 'Available', value: data.icu.available, color: '#10B981' },
  ];

  const emergencyChartData = [
    { name: 'Occupied', value: data.emergency.occupied, color: '#EF4444' },
    { name: 'Available', value: data.emergency.available, color: '#10B981' },
  ];

  return (
    <Card className="h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Bed Occupancy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {/* General Beds */}
          <div className="flex flex-col items-center">
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={generalChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {generalChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">General</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {data.general.percentage}% Occupied
            </p>
          </div>

          {/* ICU Beds */}
          <div className="flex flex-col items-center">
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={icuChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {icuChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">ICU</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {data.icu.percentage}% Occupied
            </p>
          </div>

          {/* Emergency Beds */}
          <div className="flex flex-col items-center">
            <div className="h-[120px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emergencyChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={45}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {emergencyChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-1">Emergency</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {data.emergency.percentage}% Occupied
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Available</span>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t dark:border-slate-700">
          <div className="text-center">
            <p className="text-lg font-bold text-slate-700 dark:text-white">{data.general.total}</p>
            <p className="text-[10px] text-slate-500">General Beds</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-amber-600">{data.icu.total}</p>
            <p className="text-[10px] text-slate-500">ICU Beds</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-red-600">{data.emergency.total}</p>
            <p className="text-[10px] text-slate-500">Emergency</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
