'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  UserPlus,
  FileText,
  Activity,
  FlaskConical,
  CalendarDays,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/services/database';

interface Activity {
  id: string;
  type: 'patient' | 'record' | 'disease' | 'appointment' | 'lab';
  message: string;
  timestamp: string;
  timeAgo: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'patient':
      return <UserPlus className="h-4 w-4 text-emerald-600" />;
    case 'record':
      return <FileText className="h-4 w-4 text-green-500" />;
    case 'disease':
      return <Activity className="h-4 w-4 text-red-500" />;
    case 'appointment':
      return <CalendarDays className="h-4 w-4 text-purple-500" />;
    case 'lab':
      return <FlaskConical className="h-4 w-4 text-amber-500" />;
    default:
      return <FileText className="h-4 w-4 text-slate-500" />;
  }
};

const getActivityBadge = (type: string) => {
  switch (type) {
    case 'patient':
      return <Badge variant="outline" className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">New Patient</Badge>;
    case 'record':
      return <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">Health Record</Badge>;
    case 'disease':
      return <Badge variant="outline" className="text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800">Disease Case</Badge>;
    case 'appointment':
      return <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">Appointment</Badge>;
    case 'lab':
      return <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">Lab Report</Badge>;
    default:
      return null;
  }
};

export default function RecentActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadActivities() {
    setLoading(true);
    const { data } = await dashboardService.getRecentActivities();
    if (data) {
      setActivities(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadActivities();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Card className="bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Recent Activity</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Last 10 events
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Real-time feed of hospital activities
        </p>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {activities.length > 0 ? (
          <ScrollArea className="h-[220px] pr-2">
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-shrink-0 p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getActivityBadge(activity.type)}
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                      {activity.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {activity.timeAgo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <Activity className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm">No recent activity</p>
              <p className="text-xs mt-1">Activity will appear here as events occur</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
