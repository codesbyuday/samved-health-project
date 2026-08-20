'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell,
  Info,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardService } from '@/services/database';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'alert' | 'warning' | 'info' | 'success';
  timeAgo: string;
  read: boolean;
}

interface NotificationsPanelProps {
  className?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'alert':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Info className="h-4 w-4 text-emerald-600" />;
  }
};

const getNotificationBg = (type: string) => {
  switch (type) {
    case 'alert':
      return 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900';
    case 'warning':
      return 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900';
    case 'success':
      return 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900';
    default:
      return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900';
  }
};

export default function NotificationsPanel({ className }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAlerts() {
    setLoading(true);
    const { data } = await dashboardService.getDynamicAlerts();
    if (data) {
      setNotifications(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAlerts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const unreadNotifications = notifications.filter((n) => !n.read);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <Card className={cn('h-full bg-white dark:bg-slate-900 dark:border-slate-700 transition-colors', className)}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-slate-800 dark:text-white">Hospital Notifications</CardTitle>
          {unreadNotifications.length > 0 && (
            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">
              {unreadNotifications.length} new
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-emerald-700 dark:text-emerald-300"
          onClick={markAllRead}
          disabled={unreadNotifications.length === 0}
        >
          Mark all read
        </Button>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {loading ? (
          <div className="h-[340px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <ScrollArea className="h-[340px] pr-2">
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'relative p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer',
                      getNotificationBg(notification.type),
                      !notification.read && 'ring-1 ring-emerald-500/25'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0 dark:hover:bg-slate-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3 dark:text-slate-400" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          {notification.timeAgo}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <span className="absolute top-3 right-10 h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                  <p className="text-sm font-medium">All Clear!</p>
                  <p className="text-xs mt-1">No active alerts at this time</p>
                </div>
              </div>
            )}
          </ScrollArea>
        )}

        <div className="mt-3 pt-3 border-t dark:border-slate-700">
          <Button 
            variant="outline" 
            className="w-full dark:border-slate-600 dark:text-white dark:hover:bg-slate-800" 
            size="sm"
            onClick={loadAlerts}
          >
            <Bell className="h-4 w-4 mr-2" />
            Refresh Alerts
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
