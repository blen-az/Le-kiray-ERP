import React from 'react';
import { cn } from '@/lib/utils';

// 1. Machinery Status Badge
export function MachineryStatusBadge({ status, className }: { status: string; className?: string }) {
  const getColors = (val: string) => {
    const clean = val.trim().toLowerCase();
    switch (clean) {
      case 'available':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'assigned':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'active':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'idle':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'under maintenance':
      case 'under_maintenance':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'returned':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'out of service':
      case 'out_of_service':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize',
        getColors(status),
        className
      )}
    >
      {status}
    </span>
  );
}

// 2. Ownership Badge
export function OwnershipBadge({ type, className }: { type: string; className?: string }) {
  const getColors = (val: string) => {
    const clean = val.trim().toLowerCase();
    if (clean.includes('owned')) {
      return 'bg-slate-50 text-slate-700 border-slate-200';
    } else if (clean.includes('marketplace')) {
      return 'bg-sky-50 text-[#0284c7] border-sky-200';
    } else {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wide',
        getColors(type),
        className
      )}
    >
      {type}
    </span>
  );
}

// 3. Machine Type Badge
export function MachineTypeBadge({ type, className }: { type: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-semibold font-mono uppercase border border-slate-200',
        className
      )}
    >
      {type}
    </span>
  );
}
