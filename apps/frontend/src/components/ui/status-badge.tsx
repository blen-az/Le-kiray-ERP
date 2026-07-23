import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getColors = (val: string) => {
    const clean = val.trim().toLowerCase();
    switch (clean) {
      case 'on track':
      case 'on_track':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'active':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'planning':
        return 'bg-slate-50 text-slate-600 border-slate-200';
      case 'at risk':
      case 'at_risk':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'delayed':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'completed':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'suspended':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'cancelled':
      case 'inactive':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border',
        getColors(status),
        className
      )}
    >
      {status}
    </span>
  );
}
