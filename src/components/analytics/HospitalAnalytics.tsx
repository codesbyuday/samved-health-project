'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analyticsData } from '@/data/dummyData';
import {
  TrendingUp,
  Users,
  BedDouble,
  Activity,
  Download,
  Calendar,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#047857', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function HospitalAnalytics() {
  const [timeRange, setTimeRange] = useState('week');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Hospital Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">
            Comprehensive analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Patients</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">2,847</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50">
                <Users className="h-5 w-5 text-emerald-700" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowUp className="h-3 w-3" />
              <span>12% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Bed Utilization</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">87%</p>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <BedDouble className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-amber-600">
              <ArrowUp className="h-3 w-3" />
              <span>3% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Emergency Cases</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">345</p>
              </div>
              <div className="p-2 rounded-lg bg-red-50">
                <Activity className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
              <ArrowDown className="h-3 w-3" />
              <span>8% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Avg Wait Time</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">38 min</p>
              </div>
              <div className="p-2 rounded-lg bg-purple-50">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600">
              <ArrowDown className="h-3 w-3" />
              <span>5 min improvement</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Patient Load Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient Load Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.patientLoadTrends}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEmergencies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="patients"
                  name="OPD Patients"
                  stroke="#047857"
                  fillOpacity={1}
                  fill="url(#colorPatients)"
                />
                <Area
                  type="monotone"
                  dataKey="emergencies"
                  name="Emergency"
                  stroke="#EF4444"
                  fillOpacity={1}
                  fill="url(#colorEmergencies)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bed Utilization by Ward */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bed Utilization by Ward</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.bedUtilization} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#6B7280" fontSize={12} domain={[0, 100]} />
                <YAxis
                  type="category"
                  dataKey="ward"
                  stroke="#6B7280"
                  fontSize={10}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, 'Utilization']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="percentage" name="Utilization %" radius={[0, 4, 4, 0]}>
                  {analyticsData.bedUtilization.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.percentage > 90 ? '#EF4444' : entry.percentage > 75 ? '#F59E0B' : '#10B981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Common Diseases */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Common Diseases</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.commonDiseases}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="cases"
                  nameKey="disease"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {analyticsData.commonDiseases.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Emergency Cases Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Emergency Cases (6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.emergencyCases}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cases"
                  name="Emergency Cases"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Department Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analyticsData.departmentStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="department" stroke="#6B7280" fontSize={11} angle={-45} textAnchor="end" height={80} />
              <YAxis yAxisId="left" stroke="#6B7280" fontSize={12} />
              <YAxis yAxisId="right" orientation="right" stroke="#6B7280" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="patients" name="Patients" fill="#047857" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="avgWaitTime" name="Avg Wait (min)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
