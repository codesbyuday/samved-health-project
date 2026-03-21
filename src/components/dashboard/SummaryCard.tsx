'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

const variantStyles = {
  default: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    iconBg: 'bg-slate-200 dark:bg-slate-700',
    iconColor: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    titleColor: 'text-slate-600 dark:text-slate-400',
    valueColor: 'text-slate-800 dark:text-white',
  },
  primary: {
    bg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40',
    iconBg: 'bg-blue-200 dark:bg-blue-700/50',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-700',
    titleColor: 'text-blue-700 dark:text-blue-300',
    valueColor: 'text-blue-800 dark:text-white',
  },
  success: {
    bg: 'bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40',
    iconBg: 'bg-green-200 dark:bg-green-700/50',
    iconColor: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-700',
    titleColor: 'text-green-700 dark:text-green-300',
    valueColor: 'text-green-800 dark:text-white',
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40',
    iconBg: 'bg-amber-200 dark:bg-amber-700/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-700',
    titleColor: 'text-amber-700 dark:text-amber-300',
    valueColor: 'text-amber-800 dark:text-white',
  },
  danger: {
    bg: 'bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/40',
    iconBg: 'bg-red-200 dark:bg-red-700/50',
    iconColor: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-700',
    titleColor: 'text-red-700 dark:text-red-300',
    valueColor: 'text-red-800 dark:text-white',
  },
};

export default function SummaryCard({
  title,
  value,
  icon,
  trend,
  description,
  variant = 'default',
  onClick,
}: SummaryCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg cursor-pointer group overflow-hidden',
        styles.border,
        styles.bg,
        onClick && 'hover:scale-[1.02]'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn('text-sm font-medium mb-1', styles.titleColor)}>{title}</p>
            <p className={cn('text-2xl font-bold', styles.valueColor)}>{value}</p>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <span className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">vs last week</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
              styles.iconBg
            )}
          >
            <div className={styles.iconColor}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
